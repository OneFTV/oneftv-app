import { prisma } from '@/shared/database/prisma'

/**
 * Advance the winner (and loser) of a completed game to their next bracket games.
 * Call this after setting winningSide and marking the game as completed.
 */
export async function advanceWinner(gameId: string, winningSide: string): Promise<void> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: {
      id: true,
      matchNumber: true,
      player1HomeId: true,
      player2HomeId: true,
      player1AwayId: true,
      player2AwayId: true,
      winnerNextGameId: true,
      winnerSlot: true,
      loserNextGameId: true,
      loserSlot: true,
    },
  })

  if (!game) return

  const winnerPlayers =
    winningSide === 'home'
      ? { p1: game.player1HomeId, p2: game.player2HomeId }
      : { p1: game.player1AwayId, p2: game.player2AwayId }
  const loserPlayers =
    winningSide === 'home'
      ? { p1: game.player1AwayId, p2: game.player2AwayId }
      : { p1: game.player1HomeId, p2: game.player2HomeId }

  // Advance winner
  if (game.winnerNextGameId && game.winnerSlot) {
    const updateData: Record<string, string | null> = {}
    if (game.winnerSlot === 'home') {
      updateData.player1HomeId = winnerPlayers.p1
      updateData.player2HomeId = winnerPlayers.p2
    } else {
      updateData.player1AwayId = winnerPlayers.p1
      updateData.player2AwayId = winnerPlayers.p2
    }
    await prisma.game.update({
      where: { id: game.winnerNextGameId },
      data: updateData,
    })
  }

  // Drop loser
  if (game.loserNextGameId && game.loserSlot) {
    const updateData: Record<string, string | null> = {}
    if (game.loserSlot === 'home') {
      updateData.player1HomeId = loserPlayers.p1
      updateData.player2HomeId = loserPlayers.p2
    } else {
      updateData.player1AwayId = loserPlayers.p1
      updateData.player2AwayId = loserPlayers.p2
    }
    await prisma.game.update({
      where: { id: game.loserNextGameId },
      data: updateData,
    })
  }
}
