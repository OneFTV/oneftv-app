import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const search = searchParams.get("search")

    // Build filter
    const where: Record<string, unknown> = {
      tournamentPlayers: {
        some: {},
      },
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ]
    }

    // Get total count
    const total = await prisma.user.count({ where })

    // Get paginated users
    const users = await prisma.user.findMany({
      where,
      include: {
        tournamentPlayers: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                format: true,
                date: true,
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
      const allTPs = user.tournamentPlayers
      const totalWins = allTPs.reduce((sum, tp) => sum + (tp.wins || 0), 0)
      const totalLosses = allTPs.reduce((sum, tp) => sum + (tp.losses || 0), 0)
      const totalPoints = allTPs.reduce((sum, tp) => sum + (tp.points || 0), 0)
      const totalPointDiff = allTPs.reduce(
        (sum, tp) => sum + (tp.pointDiff || 0),
        0
      )
      const tournamentsPlayed = allTPs.length
      const tournamentsWon = allTPs.filter(
        (tp) => tp.wins && tp.losses === 0
      ).length

      const gamesPlayed = totalWins + totalLosses

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        nationality: user.nationality,
        country: user.country,
        level: user.level,
        flagEmoji: "",
        totalPoints,
        gamesWon: totalWins,
        gamesPlayed,
        winRate: gamesPlayed > 0 ? totalWins / gamesPlayed : 0,
        stats: {
          totalWins,
          totalLosses,
          totalPoints,
          totalPointDiff,
          tournamentsPlayed,
          tournamentsWon,
          winRate: gamesPlayed > 0 ? (totalWins / gamesPlayed) * 100 : 0,
        },
        tournaments: allTPs.map((tp) => ({
          id: tp.tournament.id,
          name: tp.tournament.name,
          format: tp.tournament.format,
          date: tp.tournament.date,
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
