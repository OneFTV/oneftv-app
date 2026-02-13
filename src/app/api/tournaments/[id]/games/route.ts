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
        round: { select: { name: true, roundNumber: true, type: true, bestOf3: true } },
        group: { select: { name: true } },
      },
      orderBy: [
        { round: { roundNumber: "asc" } },
        { courtNumber: "asc" },
      ],
    })

    // Map to shape expected by manage page and bracket view
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
        roundNumber: game.round?.roundNumber ?? null,
        roundType: game.round?.type ?? null,
        court: game.courtNumber,
        scheduledTime: game.scheduledTime?.toISOString() || null,
        player1: homePlayers || "TBD",
        player2: awayPlayers || "TBD",
        player1HomeId: game.player1HomeId,
        player2HomeId: game.player2HomeId,
        player1AwayId: game.player1AwayId,
        player2AwayId: game.player2AwayId,
        score1: game.scoreHome,
        score2: game.scoreAway,
        set2Home: game.set2Home,
        set2Away: game.set2Away,
        set3Home: game.set3Home,
        set3Away: game.set3Away,
        bestOf3: game.round?.bestOf3 ?? false,
        status: game.status,
        winningSide: game.winningSide ?? null,
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
