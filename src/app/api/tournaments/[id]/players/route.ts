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

    const players = await prisma.tournamentPlayer.findMany({
      where: { tournamentId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            nationality: true,
            level: true,
          },
        },
        group: {
          select: { name: true },
        },
      },
      orderBy: { seed: "asc" },
    })

    const mappedPlayers = players.map((tp) => ({
      id: tp.id,
      userId: tp.userId,
      name: tp.user.name,
      email: tp.user.email,
      nationality: tp.user.nationality,
      level: tp.user.level,
      seed: tp.seed,
      group: tp.group?.name || null,
      points: tp.points,
      wins: tp.wins,
      losses: tp.losses,
      pointDiff: tp.pointDiff,
      status: tp.status,
    }))

    return NextResponse.json(mappedPlayers, { status: 200 })
  } catch (error) {
    console.error("Get tournament players error:", error)
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 }
    )
  }
}
