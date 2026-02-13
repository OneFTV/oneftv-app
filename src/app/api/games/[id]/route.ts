import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

const updateGameSchema = z.object({
  scoreHome: z.number().int().nonnegative(),
  scoreAway: z.number().int().nonnegative(),
})

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

    const { scoreHome, scoreAway } = result.data

    // Determine winning side
    let winningSide: string | null = null
    if (scoreHome > scoreAway) {
      winningSide = "home"
    } else if (scoreAway > scoreHome) {
      winningSide = "away"
    }

    // Update game
    const updatedGame = await prisma.game.update({
      where: { id: params.id },
      data: {
        scoreHome,
        scoreAway,
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
