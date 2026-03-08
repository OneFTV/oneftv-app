import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/database/prisma'
import { advanceWinner } from '@/lib/advanceWinner'

export const dynamic = 'force-dynamic'

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

    // Determine winner if completing the game
    let determinedWinner = winningSide as string | undefined
    if (status === 'completed' && !determinedWinner) {
      const finalScoreHome = scoreHome ?? game.scoreHome ?? 0
      const finalScoreAway = scoreAway ?? game.scoreAway ?? 0
      if (finalScoreHome > finalScoreAway) {
        determinedWinner = 'home'
      } else if (finalScoreAway > finalScoreHome) {
        determinedWinner = 'away'
      }
      if (determinedWinner) {
        updateData.winningSide = determinedWinner
      }
    }

    const updated = await prisma.game.update({
      where: { id: gameId },
      data: updateData,
      include: {
        User_Game_player1HomeIdToUser: { select: { id: true, name: true } },
        User_Game_player2HomeIdToUser: { select: { id: true, name: true } },
        User_Game_player1AwayIdToUser: { select: { id: true, name: true } },
        User_Game_player2AwayIdToUser: { select: { id: true, name: true } },
        Category: { select: { name: true } },
      },
    })

    // Advance winner to next bracket game
    if (updateData.status === 'completed' && determinedWinner) {
      advanceWinner(gameId, determinedWinner).catch((err) => {
        console.error(`[advanceWinner] Referee route error for game ${gameId}:`, err)
      })
    }

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Referee score update error:', error)
    return NextResponse.json({ error: 'Failed to update score' }, { status: 500 })
  }
}
