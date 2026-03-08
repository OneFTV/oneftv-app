import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id },
    })
    if (!tournament || tournament.organizerId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Delete all tournament players
    await prisma.tournamentPlayer.deleteMany({
      where: { tournamentId: params.id },
    })

    // Delete all team registrations
    await prisma.teamRegistration.deleteMany({
      where: {
        Category: { tournamentId: params.id },
      },
    })

    // Reset all games to initial state
    await prisma.game.updateMany({
      where: { tournamentId: params.id },
      data: {
        status: 'scheduled',
        scoreHome: null,
        scoreAway: null,
        set2Home: null,
        set2Away: null,
        set3Home: null,
        set3Away: null,
        winningSide: null,
        player1HomeId: null,
        player2HomeId: null,
        player1AwayId: null,
        player2AwayId: null,
      },
    })

    return NextResponse.json({ reset: true })
  } catch (error) {
    console.error('Reset simulation error:', error)
    const message = error instanceof Error ? error.message : 'Failed to reset simulation'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
