import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id },
      select: { id: true },
    })

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      )
    }

    const games = await prisma.game.findMany({
      where: { tournamentId: params.id },
      include: {
        player1Home: { select: { id: true, name: true } },
        player2Home: { select: { id: true, name: true } },
        player1Away: { select: { id: true, name: true } },
        player2Away: { select: { id: true, name: true } },
        round: { select: { name: true, roundNumber: true } },
        group: { select: { name: true } },
      },
      orderBy: [
        { round: { roundNumber: "asc" } },
        { courtNumber: "asc" },
      ],
    })

    // Map to shape expected by manage page
    const mappedGames = games.map((game) => {
      const homePlayers = [game.player1Home?.name, game.player2Home?.name]
        .filter(Boolean)
        .join(" & ")
      const awayPlayers = [game.player1Away?.name, game.player2Away?.name]
        .filter(Boolean)
        .join(" & ")

      return {
        id: game.id,
        roundName: game.round?.name || "Unassigned",
        court: game.courtNumber,
        scheduledTime: game.scheduledTime?.toISOString() || null,
        player1: homePlayers || "TBD",
        player2: awayPlayers || "TBD",
        score1: game.scoreHome,
        score2: game.scoreAway,
        status: game.status,
        groupName: game.group?.name || null,
      }
    })

    return NextResponse.json(mappedGames, { status: 200 })
  } catch (error) {
    console.error("Get tournament games error:", error)
    return NextResponse.json(
      { error: "Failed to fetch games" },
      { status: 500 }
    )
  }
}
