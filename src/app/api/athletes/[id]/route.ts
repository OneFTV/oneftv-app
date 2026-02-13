import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        tournamentPlayers: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                format: true,
                date: true,
                endDate: true,
                location: true,
              },
            },
          },
          orderBy: {
            tournament: {
              date: "desc",
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Athlete not found" },
        { status: 404 }
      )
    }

    // Calculate overall stats
    const totalWins = user.tournamentPlayers.reduce((sum, tp) => sum + (tp.wins || 0), 0)
    const totalLosses = user.tournamentPlayers.reduce(
      (sum, tp) => sum + (tp.losses || 0),
      0
    )
    const totalPoints = user.tournamentPlayers.reduce(
      (sum, tp) => sum + (tp.points || 0),
      0
    )
    const totalPointDiff = user.tournamentPlayers.reduce(
      (sum, tp) => sum + (tp.pointDiff || 0),
      0
    )
    const tournamentsPlayed = user.tournamentPlayers.length

    const tournamentsWon = user.tournamentPlayers.filter((tp) => {
      const winRate =
        tp.wins && tp.losses
          ? tp.wins / (tp.wins + tp.losses)
          : 0
      return winRate > 0.5
    }).length

    const gamesPlayed = totalWins + totalLosses
    const winRate = gamesPlayed > 0 ? (totalWins / gamesPlayed) * 100 : 0

    const athleteProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      nationality: user.nationality,
      country: user.country,
      level: user.level,
      createdAt: user.createdAt,
      overallStats: {
        gamesPlayed,
        wins: totalWins,
        losses: totalLosses,
        points: totalPoints,
        pointDiff: totalPointDiff,
        winRate: Number(winRate.toFixed(2)),
        tournamentsPlayed,
        tournamentsWon,
      },
      tournamentHistory: user.tournamentPlayers.map((tp) => ({
        id: tp.id,
        tournament: {
          id: tp.tournament.id,
          name: tp.tournament.name,
          format: tp.tournament.format,
          startDate: tp.tournament.date,
          endDate: tp.tournament.endDate,
          location: tp.tournament.location,
        },
        stats: {
          wins: tp.wins,
          losses: tp.losses,
          points: tp.points,
          pointDiff: tp.pointDiff,
        },
      })),
    }

    return NextResponse.json({ data: athleteProfile }, { status: 200 })
  } catch (error) {
    console.error("Get athlete error:", error)
    return NextResponse.json(
      { error: "Failed to fetch athlete profile" },
      { status: 500 }
    )
  }
}
