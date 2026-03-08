import { prisma } from '@/shared/database/prisma'

const playerSelect = { id: true, name: true } as const
const playerSelectFull = { id: true, name: true, email: true } as const

export class GameRepository {
  static async findById(id: string) {
    return prisma.game.findUnique({
      where: { id },
      include: {
        User_Game_player1HomeIdToUser: { select: playerSelectFull },
        User_Game_player2HomeIdToUser: { select: playerSelectFull },
        User_Game_player1AwayIdToUser: { select: playerSelectFull },
        User_Game_player2AwayIdToUser: { select: playerSelectFull },
        Round: true,
        Tournament: {
          select: { id: true, name: true, pointsPerSet: true, proLeague: true },
        },
      },
    })
  }

  static async findByIdForUpdate(id: string) {
    return prisma.game.findUnique({
      where: { id },
      include: {
        Tournament: {
          select: { organizerId: true, pointsPerSet: true, proLeague: true },
        },
        Round: {
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
        User_Game_player1HomeIdToUser: { select: playerSelect },
        User_Game_player2HomeIdToUser: { select: playerSelect },
        User_Game_player1AwayIdToUser: { select: playerSelect },
        User_Game_player2AwayIdToUser: { select: playerSelect },
        Round: { select: { name: true, roundNumber: true, type: true, bestOf3: true, bracketSide: true } },
        Group: { select: { name: true } },
      },
      orderBy: [
        { Round: { roundNumber: 'asc' } },
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
        User_Game_player1HomeIdToUser: { select: playerSelect },
        User_Game_player2HomeIdToUser: { select: playerSelect },
        User_Game_player1AwayIdToUser: { select: playerSelect },
        User_Game_player2AwayIdToUser: { select: playerSelect },
        Round: { select: { bestOf3: true, name: true } },
      },
    })
  }
}
