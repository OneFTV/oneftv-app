import { NextRequest, NextResponse } from "next/server"
import prisma from "A/lib/db"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        tournaments: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                format: true,
                startDate: true,
                endDate: true,
                location: true,
              },
            },
          },
          orderBy: {
            tournament: {
              startDate: "desc",
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
    const totalWins = user.tournaments.reduce((sum, tp) => sum + (tp.wins || 0), 0)
    const totalLosses = user.tournaments.reduce(
      (sum, tp) => sum + (tp.losses || 0),
      0
    )
    const totalPoints = user.tournaments.reduce(
      (sum, tp) => sum + (tp.points || 0),
      0
    )
    const totalPointDiff = user.tournaments.reduce(
      (sum, tp) => sum + (tp.pointDiff || 0),
      0
    )
    const tournamentsPlayed = user.tournaments.length

    // Count tournaments won (where player has wins but no losses)
    const tournamentsWon = user.tournaments.filter((tp) => {
      const winRate =
        tp.wins && tp.losses
          ? tp.wins / (tp.wins + tp.losses)
          : 0
      return winRate > 0.5 // Player won more games than lost in that tournament
    }).length

    const gamesPlayed = totalWins + totalLosses
    const winRate = gamesPlayed > 0 ? (totalWins / gamesPlayed) * 100 : 0

    // Calculate by tournament format
    const kotbStats = user.tournaments
      .filter((tp) => tp.tournament.format === "KOTB")
      .reduce(
        (acc, tp) => ({
          gamesPlayed: acc.gamesPlayed + (tp.wins || 0) + (tp.losses || 0),
          wins: acc.wins + (tp.wins || 0),
          losses: acc.losses + (tp.losses || 0),
          points: acc.points + (tp.points || 0),
        }),
        { gamesPlayed: 0, wins: 0, losses: 0, points: 0 }
      )

    const bracketStats = user.tournaments
      .filter((tp) => tp.tournament.format === "BRACKET")
      .reduce(
        (acc, tp) => ({
          gamesPlayed: acc.gamesPlayed + (tp.wins || 0) + (tp.losses || 0),
          wins: acc.wins + (tp.wins || 0),
          losses: acc.losses + (tp.losses || 0),
          points: acc.points + (tp.points || 0),
        }),
        { gamesPlayed: 0, wins: 0, losses: 0, points: 0 }
      )

    const athleteProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
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
      statsByFormat: {
        KOTB: {
          gamesPlayed: kotbStats.gamesPlayed,
          wins: kotbStats.wins,
          losses: kotbStats.losses,
          points: kotbStats.points,
          winRate:
            kotbStats.gamesPlayed > 0
              ? Number(
                  ((kotbStats.wins / kotbStats.gamesPlayed) * 100).toFixed(2)
                )
              : 0,
        },
        BRACKET: {
          gamesPlayed: bracketStats.gamesPlayed,
          wins: bracketStats.wins,
          losses: bracketStats.losses,
          points: bracketStats.points,
          winRate:
            bracketStats.gamesPlayed > 0
              ? Number(
                  ((bracketStats.wins / bracketStats.gamesPlayed) * 100).toFixed(2)
                )
              : 0,
        },
      },
      tournamentHistory: user.tournaments.map((tp) => ({
        id: tp.id,
        tournament: {
          id: tp.tournament.id,
          name: tp.tournament.name,
          format: tp.tournament.format,
          startDate: tp.tournament.startDate,
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
