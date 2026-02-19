import { prisma } from '@/shared/database/prisma'

const playerSelect = { id: true, name: true } as const
const playerSelectFull = { id: true, name: true, email: true } as const

export class GameRepository {
  static async findById(id: string) {
    return prisma.game.findUnique({
      where: { id },
      include: {
        player1Home: { select: playerSelectFull },
        player2Home: { select: playerSelectFull },
        player1Away: { select: playerSelectFull },
        player2Away: { select: playerSelectFull },
        round: true,
        tournament: {
          select: { id: true, name: true, pointsPerSet: true, proLeague: true },
        },
      },
    })
  }

  static async findByIdForUpdate(id: string) {
    return prisma.game.findUnique({
      where: { id },
      include: {
        tournament: {
          select: { organizerId: true, pointsPerSet: true, proLeague: true },
        },
        round: {
          select: { bestOf3: true },
        },
      },
    })
  }

  static async findByIdWithRouting(id: string) {
    return prisma.game.findUnique({
      where: { id },
      select: {
        id: true,
        matchNumber: true,
        bracketSide: true,
        winnerNextGameId: true,
        winnerSlot: true,
        loserNextGameId: true,
        loserSlot: true,
        seedTarget: true,
        categoryId: true,
        tournamentId: true,
        player1HomeId: true,
        player2HomeId: true,
        player1AwayId: true,
        player2AwayId: true,
        winningSide: true,
      },
    })
  }

  static async findByTournament(tournamentId: string, categoryId?: string) {
    const where: Record<string, unknown> = { tournamentId }
    if (categoryId) where.categoryId = categoryId

    return prisma.game.findMany({
      where,
      include: {
        player1Home: { select: playerSelect },
        player2Home: { select: playerSelect },
        player1Away: { select: playerSelect },
        player2Away: { select: playerSelect },
        round: { select: { name: true, roundNumber: true, type: true, bestOf3: true, bracketSide: true } },
        group: { select: { name: true } },
      },
      orderBy: [
        { round: { roundNumber: 'asc' } },
        { matchNumber: 'asc' },
        { courtNumber: 'asc' },
      ],
    })
  }

  static async updateScore(id: string, data: {
    scoreHome: number
    scoreAway: number
    set2Home: number | null
    set2Away: number | null
    set3Home: number | null
    set3Away: number | null
    winningSide: string | null
    status: string
  }) {
    return prisma.game.update({
      where: { id },
      data,
      include: {
        player1Home: { select: playerSelect },
        player2Home: { select: playerSelect },
        player1Away: { select: playerSelect },
        player2Away: { select: playerSelect },
        round: { select: { bestOf3: true, name: true } },
      },
    })
  }
}
