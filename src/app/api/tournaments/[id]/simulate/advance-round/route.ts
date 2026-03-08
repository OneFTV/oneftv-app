import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

function randomScore(): [number, number] {
  const winScore = 21
  const loseOptions = [12, 13, 14, 15, 16, 17, 18, 19]
  const loseScore = loseOptions[Math.floor(Math.random() * loseOptions.length)]
  return Math.random() > 0.5 ? [winScore, loseScore] : [loseScore, winScore]
}

export async function POST(
  req: NextRequest,
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
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    const body = await req.json().catch(() => ({}))
    const { roundId, advanceAll } = body as { roundId?: string; advanceAll?: boolean }

    // Find target rounds
    let targetRounds: { id: string; name: string; roundNumber: number }[]

    if (roundId) {
      const round = await prisma.round.findUnique({ where: { id: roundId } })
      if (!round) return NextResponse.json({ error: 'Round not found' }, { status: 404 })
      targetRounds = [round]
    } else {
      // Get all rounds with pending games, ordered by roundNumber
      const rounds = await prisma.round.findMany({
        where: { tournamentId: params.id },
        orderBy: { roundNumber: 'asc' },
        include: {
          Game: { where: { status: { not: 'completed' } }, select: { id: true } },
        },
      })
      const roundsWithPending = rounds.filter(r => r.Game.length > 0)

      if (advanceAll) {
        // All rounds except the last one
        targetRounds = roundsWithPending.slice(0, -1)
      } else {
        // Just the earliest incomplete round
        targetRounds = roundsWithPending.slice(0, 1)
      }
    }

    let totalGamesCompleted = 0

    for (const round of targetRounds) {
      // Get pending games in this round that have both teams assigned
      const pendingGames = await prisma.game.findMany({
        where: {
          roundId: round.id,
          status: { not: 'completed' },
          player1HomeId: { not: null },
          player1AwayId: { not: null },
        },
      })

      for (const game of pendingGames) {
        const [scoreHome, scoreAway] = randomScore()
        const winningSide = scoreHome > scoreAway ? 'home' : 'away'

        await prisma.game.update({
          where: { id: game.id },
          data: {
            scoreHome,
            scoreAway,
            status: 'completed',
            winningSide,
          },
        })

        // Advance winner to next game
        if (game.winnerNextGameId) {
          const winnerIds = winningSide === 'home'
            ? { p1: game.player1HomeId, p2: game.player2HomeId }
            : { p1: game.player1AwayId, p2: game.player2AwayId }

          const slot = game.winnerSlot || 'home'
          const updateData = slot === 'away'
            ? { player1AwayId: winnerIds.p1, player2AwayId: winnerIds.p2 }
            : { player1HomeId: winnerIds.p1, player2HomeId: winnerIds.p2 }

          await prisma.game.update({
            where: { id: game.winnerNextGameId },
            data: updateData,
          })
        }

        // Advance loser to loser bracket if applicable
        if (game.loserNextGameId) {
          const loserIds = winningSide === 'home'
            ? { p1: game.player1AwayId, p2: game.player2AwayId }
            : { p1: game.player1HomeId, p2: game.player2HomeId }

          const slot = game.loserSlot || 'home'
          const updateData = slot === 'away'
            ? { player1AwayId: loserIds.p1, player2AwayId: loserIds.p2 }
            : { player1HomeId: loserIds.p1, player2HomeId: loserIds.p2 }

          await prisma.game.update({
            where: { id: game.loserNextGameId },
            data: updateData,
          })
        }

        totalGamesCompleted++
      }
    }

    // Get remaining info
    const allRounds = await prisma.round.findMany({
      where: { tournamentId: params.id },
      orderBy: { roundNumber: 'asc' },
      include: {
        Game: { select: { id: true, status: true } },
      },
    })

    const roundStatus = allRounds.map(r => ({
      id: r.id,
      name: r.name,
      roundNumber: r.roundNumber,
      total: r.Game.length,
      completed: r.Game.filter(g => g.status === 'completed').length,
      pending: r.Game.filter(g => g.status !== 'completed').length,
    }))

    const nextRound = roundStatus.find(r => r.pending > 0) || null
    const remainingRounds = roundStatus.filter(r => r.pending > 0).length

    return NextResponse.json({
      gamesCompleted: totalGamesCompleted,
      nextRound,
      remainingRounds,
      rounds: roundStatus,
    })
  } catch (error) {
    console.error('Advance round error:', error)
    const message = error instanceof Error ? error.message : 'Failed to advance round'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
