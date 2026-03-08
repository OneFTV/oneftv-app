import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/database/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Validate referee link
    const link = await prisma.refereeLink.findUnique({
      where: { token: params.token },
    })

    if (!link || !link.isActive) {
      return NextResponse.json({ error: 'Invalid or revoked referee link' }, { status: 404 })
    }

    const body = await req.json()
    const { gameId, scoreHome, scoreAway, set2Home, set2Away, set3Home, set3Away, status, winningSide } = body

    if (!gameId) {
      return NextResponse.json({ error: 'gameId is required' }, { status: 400 })
    }

    // Verify the game belongs to this tournament and court
    const game = await prisma.game.findFirst({
      where: {
        id: gameId,
        tournamentId: link.tournamentId,
        courtNumber: link.courtNumber,
      },
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found on this court' }, { status: 404 })
    }

    // Build update data — only include fields that are provided
    const updateData: Record<string, unknown> = {}
    if (scoreHome !== undefined) updateData.scoreHome = scoreHome
    if (scoreAway !== undefined) updateData.scoreAway = scoreAway
    if (set2Home !== undefined) updateData.set2Home = set2Home
    if (set2Away !== undefined) updateData.set2Away = set2Away
    if (set3Home !== undefined) updateData.set3Home = set3Home
    if (set3Away !== undefined) updateData.set3Away = set3Away
    if (status !== undefined) updateData.status = status
    if (winningSide !== undefined) updateData.winningSide = winningSide

    // If starting to score, mark game as in_progress
    if (!status && game.status === 'scheduled' && (scoreHome !== undefined || scoreAway !== undefined)) {
      updateData.status = 'in_progress'
    }

    const updated = await prisma.game.update({
      where: { id: gameId },
      data: updateData,
      include: {
        player1Home: { select: { id: true, name: true } },
        player2Home: { select: { id: true, name: true } },
        player1Away: { select: { id: true, name: true } },
        player2Away: { select: { id: true, name: true } },
        category: { select: { name: true } },
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Referee score update error:', error)
    return NextResponse.json({ error: 'Failed to update score' }, { status: 500 })
  }
}
