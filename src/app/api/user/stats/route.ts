import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get tournament player records for aggregate stats
    const tournamentPlayers = await prisma.tournamentPlayer.findMany({
      where: { userId },
      include: {
        tournament: {
          select: { name: true, status: true },
        },
      },
    })

    let totalWins = 0
    let totalLosses = 0
    let totalPoints = 0
    let bestTournament = ""
    let bestTournamentPoints = 0

    for (const tp of tournamentPlayers) {
      totalWins += tp.wins || 0
      totalLosses += tp.losses || 0
      totalPoints += tp.points || 0

      if ((tp.points || 0) > bestTournamentPoints) {
        bestTournamentPoints = tp.points || 0
        bestTournament = tp.tournament.name
      }
    }

    const gamesPlayed = totalWins + totalLosses
    const winRate = gamesPlayed > 0
      ? Number(((totalWins / gamesPlayed) * 100).toFixed(1))
      : 0

    return NextResponse.json(
      {
        gamesPlayed,
        wins: totalWins,
        losses: totalLosses,
        totalPoints,
        winRate,
        bestTournament,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Get user stats error:", error)
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    )
  }
}
