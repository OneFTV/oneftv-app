import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/database/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const link = await prisma.refereeLink.findUnique({
      where: { token: params.token },
      include: {
        Tournament: {
          select: { id: true, name: true, location: true, status: true },
        },
      },
    })

    if (!link || !link.isActive) {
      return NextResponse.json({ error: 'Invalid or revoked referee link' }, { status: 404 })
    }

    // Find the current active game on this court
    const currentGame = await prisma.game.findFirst({
      where: {
        tournamentId: link.tournamentId,
        courtNumber: link.courtNumber,
        status: { in: ['scheduled', 'in_progress'] },
      },
      orderBy: [
        { status: 'desc' }, // in_progress first
        { scheduledTime: 'asc' },
        { matchNumber: 'asc' },
      ],
      include: {
        User_Game_player1HomeIdToUser: { select: { id: true, name: true } },
        User_Game_player2HomeIdToUser: { select: { id: true, name: true } },
        User_Game_player1AwayIdToUser: { select: { id: true, name: true } },
        User_Game_player2AwayIdToUser: { select: { id: true, name: true } },
        Round: { select: { name: true, roundNumber: true } },
        Category: { select: { id: true, name: true } },
      },
    })

    // Get upcoming games on this court
    const upcomingGames = await prisma.game.findMany({
      where: {
        tournamentId: link.tournamentId,
        courtNumber: link.courtNumber,
        status: 'scheduled',
        id: currentGame ? { not: currentGame.id } : undefined,
      },
      orderBy: [
        { scheduledTime: 'asc' },
        { matchNumber: 'asc' },
      ],
      take: 5,
      include: {
        User_Game_player1HomeIdToUser: { select: { id: true, name: true } },
        User_Game_player2HomeIdToUser: { select: { id: true, name: true } },
        User_Game_player1AwayIdToUser: { select: { id: true, name: true } },
        User_Game_player2AwayIdToUser: { select: { id: true, name: true } },
        Category: { select: { name: true } },
      },
    })

    return NextResponse.json({
      data: {
        tournament: link.Tournament,
        courtNumber: link.courtNumber,
        currentGame,
        upcomingGames,
      },
    })
  } catch (error) {
    console.error('Referee GET error:', error)
    return NextResponse.json({ error: 'Failed to load referee data' }, { status: 500 })
  }
}
