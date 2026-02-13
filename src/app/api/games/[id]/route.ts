import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

const setScoreSchema = z.object({
  home: z.number().int().nonnegative(),
  away: z.number().int().nonnegative(),
})

const updateGameSchema = z.object({
  scoreHome: z.number().int().nonnegative(),
  scoreAway: z.number().int().nonnegative(),
  set2Home: z.number().int().nonnegative().optional(),
  set2Away: z.number().int().nonnegative().optional(),
  set3Home: z.number().int().nonnegative().optional(),
  set3Away: z.number().int().nonnegative().optional(),
})

function validateSetScore(
  home: number,
  away: number,
  targetPoints: number
): string | null {
  const winner = Math.max(home, away)
  const loser = Math.min(home, away)

  if (winner < targetPoints) {
    return `Winning score must be at least ${targetPoints}`
  }

  if (winner - loser < 2) {
    return "Winner must lead by at least 2 points"
  }

  // If winner scored more than targetPoints, the loser must be at winner-2
  // (deuce scenario: e.g. 20-18, 21-19, etc.)
  if (winner > targetPoints && loser !== winner - 2) {
    return `In extended play, scores must differ by exactly 2 (e.g. ${winner}-${winner - 2})`
  }

  return null
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const game = await prisma.game.findUnique({
      where: { id: params.id },
      include: {
        player1Home: {
          select: { id: true, name: true, email: true },
        },
        player2Home: {
          select: { id: true, name: true, email: true },
        },
        player1Away: {
          select: { id: true, name: true, email: true },
        },
        player2Away: {
          select: { id: true, name: true, email: true },
        },
        round: true,
        tournament: {
          select: {
            id: true,
            name: true,
            pointsPerSet: true,
            proLeague: true,
          },
        },
      },
    })

    if (!game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: game }, { status: 200 })
  } catch (error) {
    console.error("Get game error:", error)
    return NextResponse.json(
      { error: "Failed to fetch game" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const game = await prisma.game.findUnique({
      where: { id: params.id },
      include: {
        tournament: {
          select: { organizerId: true, pointsPerSet: true, proLeague: true },
        },
        round: {
          select: { bestOf3: true },
        },
      },
    })

    if (!game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      )
    }

    if (game.tournament.organizerId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: Only tournament organizer can update game scores" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const result = updateGameSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { scoreHome, scoreAway, set2Home, set2Away, set3Home, set3Away } = result.data
    const isBestOf3 = game.round?.bestOf3 ?? false
    const pointsPerSet = game.tournament.pointsPerSet || 18
    const decidingSetPoints = 15

    // Validate Set 1 score
    const set1Error = validateSetScore(scoreHome, scoreAway, pointsPerSet)
    if (set1Error) {
      return NextResponse.json(
        { error: `Set 1: ${set1Error}` },
        { status: 400 }
      )
    }

    let winningSide: string | null = null

    if (isBestOf3) {
      // Best of 3 logic
      let homeSetsWon = scoreHome > scoreAway ? 1 : 0
      let awaySetsWon = scoreAway > scoreHome ? 1 : 0

      // Validate Set 2 (required for best-of-3)
      if (set2Home == null || set2Away == null) {
        return NextResponse.json(
          { error: "Set 2 scores are required for best-of-3 matches" },
          { status: 400 }
        )
      }

      const set2Error = validateSetScore(set2Home, set2Away, pointsPerSet)
      if (set2Error) {
        return NextResponse.json(
          { error: `Set 2: ${set2Error}` },
          { status: 400 }
        )
      }

      homeSetsWon += set2Home > set2Away ? 1 : 0
      awaySetsWon += set2Away > set2Home ? 1 : 0

      // If sets tied 1-1, need set 3
      if (homeSetsWon === 1 && awaySetsWon === 1) {
        if (set3Home == null || set3Away == null) {
          return NextResponse.json(
            { error: "Set 3 scores are required when sets are tied 1-1" },
            { status: 400 }
          )
        }

        const set3Error = validateSetScore(set3Home, set3Away, decidingSetPoints)
        if (set3Error) {
          return NextResponse.json(
            { error: `Set 3 (deciding set to ${decidingSetPoints}): ${set3Error}` },
            { status: 400 }
          )
        }

        homeSetsWon += set3Home > set3Away ? 1 : 0
        awaySetsWon += set3Away > set3Home ? 1 : 0
      } else if (set3Home != null || set3Away != null) {
        // Set 3 provided but not needed
        return NextResponse.json(
          { error: "Set 3 is not needed — a team already won 2 sets" },
          { status: 400 }
        )
      }

      winningSide = homeSetsWon > awaySetsWon ? "home" : "away"
    } else {
      // Single set: simple comparison
      winningSide = scoreHome > scoreAway ? "home" : scoreAway > scoreHome ? "away" : null
    }

    // Update game
    const updatedGame = await prisma.game.update({
      where: { id: params.id },
      data: {
        scoreHome,
        scoreAway,
        set2Home: isBestOf3 ? (set2Home ?? null) : null,
        set2Away: isBestOf3 ? (set2Away ?? null) : null,
        set3Home: isBestOf3 ? (set3Home ?? null) : null,
        set3Away: isBestOf3 ? (set3Away ?? null) : null,
        winningSide,
        status: "completed",
      },
      include: {
        player1Home: {
          select: { id: true, name: true },
        },
        player2Home: {
          select: { id: true, name: true },
        },
        player1Away: {
          select: { id: true, name: true },
        },
        player2Away: {
          select: { id: true, name: true },
        },
        round: {
          select: { bestOf3: true, name: true },
        },
      },
    })

    return NextResponse.json(
      {
        message: "Game updated successfully",
        data: updatedGame,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Update game error:", error)
    return NextResponse.json(
      { error: "Failed to update game" },
      { status: 500 }
    )
  }
}
