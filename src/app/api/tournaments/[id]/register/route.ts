import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

export async function POST(
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

    // Get tournament
    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id },
      include: {
        players: {
          select: { userId: true },
        },
      },
    })

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      )
    }

    // Check tournament status
    if (tournament.status !== "REGISTRATION") {
      return NextResponse.json(
        { error: "Tournament is not accepting registrations" },
        { status: 400 }
      )
    }

    // Check player count
    if (tournament.players.length >= tournament.maxPlayers) {
      return NextResponse.json(
        { error: "Tournament is full" },
        { status: 400 }
      )
    }

    // Check if already registered
    const alreadyRegistered = tournament.players.some(
      (p) => p.userId === session.user.id
    )

    if (alreadyRegistered) {
      return NextResponse.json(
        { error: "Already registered for this tournament" },
        { status: 409 }
      )
    }

    // Register player
    const tournamentPlayer = await prisma.tournamentPlayer.create({
      data: {
        userId: session.user.id,
        tournamentId: params.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        message: "Successfully registered for tournament",
        data: tournamentPlayer,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Tournament registration error:", error)
    return NextResponse.json(
      { error: "Failed to register for tournament" },
      { status: 500 }
    )
  }
}
