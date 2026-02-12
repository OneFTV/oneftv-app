import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

const updateGameSchema = z.object({
  team1Score: z.number().int().nonnegative(),
  team2Score: z.number().int().nonnegative(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const game = await prisma.game.findUnique({
      where: { id: params.id },
      include: {
        team1: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        team2: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        round: true,
        tournament: {
          select: {
            id: true,
            name: true,
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
          select: { organizerId: true },
        },
      },
    })

    if (!game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      )
    }

    // Check authorization - only organizer can update game scores
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

    const { team1Score, team2Score } = result.data

    // Determine winner
    let winnerId: string | null = null
    if (team1Score > team2Score) {
      winnerId = game.team1Id
    } else if (team2Score > team1Score) {
      winnerId = game.team2Id
    }

    // Update game
    const updatedGame = await prisma.game.update({
      where: { id: params.id },
      data: {
        team1Score,
        team2Score,
        winnerId,
        status: "COMPLETED",
      },
      include: {
        team1: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        team2: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    // Update player stats
    if (winnerId === game.team1Id) {
      // Team 1 wins
      await prisma.tournamentPlayer.update({
        where: { id: game.team1Id },
        data: {
          wins: { increment: 1 },
          points: { increment: team1Score },
          pointDiff: { increment: team1Score - team2Score },
        },
      })

      // Team 2 loses
      await prisma.tournamentPlayer.update({
        where: { id: game.team2Id },
        data: {
          losses: { increment: 1 },
          points: { increment: team2Score },
          pointDiff: { increment: team2Score - team1Score },
        },
      })
    } else if (winnerId === game.team2Id) {
      // Team 2 wins
      await prisma.tournamentPlayer.update({
        where: { id: game.team2Id },
        data: {
          wins: { increment: 1 },
          points: { increment: team2Score },
          pointDiff: { increment: team2Score - team1Score },
        },
      })

      // Team 1 loses
      await prisma.tournamentPlayer.update({
        where: { id: game.team1Id },
        data: {
          losses: { increment: 1 },
          points: { increment: team1Score },
          pointDiff: { increment: team1Score - team2Score },
        },
      })
    } else {
      // Tie - split points
      const avgScore = (team1Score + team2Score) / 2
      await prisma.tournamentPlayer.update({
        where: { id: game.team1Id },
        data: {
          points: { increment: team1Score },
          pointDiff: { increment: team1Score - team2Score },
        },
      })

      await prisma.tournamentPlayer.update({
        where: { id: game.team2Id },
        data: {
          points: { increment: team2Score },
          pointDiff: { increment: team2Score - team1Score },
        },
      })
    }

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
