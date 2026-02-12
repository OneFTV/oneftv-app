import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const search = searchParams.get("search")
    const level = searchParams.get("level")
    const country = searchParams.get("country")

    // Build filter
    const where: any = {
      tournaments: {
        some: {}, // Only users who participated in tournaments
      },
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    // Get total count
    const total = await prisma.user.count({ where })

    // Get paginated users
    const users = await prisma.user.findMany({
      where,
      include: {
        tournaments: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                format: true,
                startDate: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Calculate aggregated stats for each athlete
    const athletes = users.map((user) => {
      const allGames = user.tournaments
      const totalWins = allGames.reduce((sum, tp) => sum + (tp.wins || 0), 0)
      const totalLosses = allGames.reduce((sum, tp) => sum + (tp.losses || 0), 0)
      const totalPoints = allGames.reduce((sum, tp) => sum + (tp.points || 0), 0)
      const totalPointDiff = allGames.reduce(
        (sum, tp) => sum + (tp.pointDiff || 0),
        0
      )
      const tournamentsPlayed = user.tournaments.length
      const tournamentsWon = user.tournaments.filter(
        (tp) => tp.tournament && tp.wins && tp.losses !== undefined && tp.losses === 0
      ).length

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        stats: {
          totalWins,
          totalLosses,
          totalPoints,
          totalPointDiff,
          tournamentsPlayed,
          tournamentsWon,
          winRate: tournamentsPlayed > 0 ? (totalWins / (totalWins + totalLosses)) * 100 : 0,
        },
        tournaments: user.tournaments.map((tp) => ({
          id: tp.tournament.id,
          name: tp.tournament.name,
          format: tp.tournament.format,
          startDate: tp.tournament.startDate,
          wins: tp.wins,
          losses: tp.losses,
          points: tp.points,
        })),
      }
    })

    return NextResponse.json(
      {
        data: athletes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Get athletes error:", error)
    return NextResponse.json(
      { error: "Failed to fetch athletes" },
      { status: 500 }
    )
  }
}
