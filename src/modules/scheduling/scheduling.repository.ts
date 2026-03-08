import { prisma } from '@/shared/database/prisma'

export class SchedulingRepository {
  static async getTournamentForGeneration(id: string) {
    return prisma.tournament.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        format: true,
        groupSize: true,
        proLeague: true,
        numCourts: true,
        primaryCourts: true,
        User: { select: { id: true } },
        TournamentPlayer: { select: { id: true, userId: true, categoryId: true } },
        Category: { select: { id: true, name: true, format: true, maxTeams: true, pointsPerSet: true, groupSize: true, proLeague: true } },
      },
    })
  }

  static async getCategoryForGeneration(categoryId: string) {
    return prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        Tournament: {
          select: { id: true, organizerId: true, numCourts: true },
        },
        TournamentPlayer: {
          where: { categoryId },
          select: { id: true, userId: true },
        },
      },
    })
  }

  static async clearSchedule(tournamentId: string, categoryId?: string) {
    const where = categoryId
      ? { tournamentId, categoryId }
      : { tournamentId }

    await prisma.game.deleteMany({ where })
    await prisma.round.deleteMany({ where })
    await prisma.group.deleteMany({ where })
  }

  static async createGroup(tournamentId: string, name: string, categoryId?: string) {
    return prisma.group.create({
      data: { tournamentId, name, categoryId: categoryId ?? null },
    })
  }

  static async assignPlayerToGroup(tournamentId: string, userId: string, groupId: string) {
    return prisma.tournamentPlayer.updateMany({
      where: { tournamentId, userId },
      data: { groupId },
    })
  }

  static async createRound(data: {
    name: string
    roundNumber: number
    tournamentId: string
    type: string
    bestOf3?: boolean
    categoryId?: string
    bracketSide?: string
  }) {
    return prisma.round.create({ data })
  }

  static async createGame(data: {
    tournamentId: string
    roundId: string
    groupId?: string
    courtNumber: number
    player1HomeId: string | null
    player2HomeId: string | null
    player1AwayId: string | null
    player2AwayId: string | null
    status: string
    categoryId?: string
    matchNumber?: number
  }) {
    return prisma.game.create({ data })
  }

  static async createGameDE(data: {
    tournamentId: string
    roundId: string
    courtNumber: number
    player1HomeId: string | null
    player2HomeId: string | null
    player1AwayId: string | null
    player2AwayId: string | null
    status: string
    categoryId?: string
    matchNumber: number
    bracketSide: string
    seedTarget?: string
  }) {
    return prisma.game.create({ data })
  }

  static async updateGameRouting(gameId: string, data: {
    winnerNextGameId?: string
    winnerSlot?: string
    loserNextGameId?: string
    loserSlot?: string
  }) {
    return prisma.game.update({
      where: { id: gameId },
      data,
    })
  }

  static async findGameByMatchNumber(tournamentId: string, categoryId: string, matchNumber: number) {
    return prisma.game.findFirst({
      where: { tournamentId, categoryId, matchNumber },
      select: { id: true, matchNumber: true },
    })
  }

  static async updateTournamentStatus(id: string, status: string) {
    return prisma.tournament.update({
      where: { id },
      data: { status },
    })
  }

  static async updateCategoryStatus(id: string, status: string) {
    return prisma.category.update({
      where: { id },
      data: { status },
    })
  }

  static async getTeamRegistrations(categoryId: string) {
    return prisma.teamRegistration.findMany({
      where: { categoryId, status: { in: ['confirmed', 'seeded'] } },
      orderBy: { seed: 'asc' },
      select: {
        id: true,
        player1Id: true,
        player2Id: true,
        seed: true,
        teamName: true,
        status: true,
      },
    })
  }

  static async getTournamentWithSchedule(id: string) {
    return prisma.tournament.findUnique({
      where: { id },
      include: {
        Group: true,
        Game: {
          include: {
            User_Game_player1HomeIdToUser: { select: { id: true, name: true } },
            User_Game_player2HomeIdToUser: { select: { id: true, name: true } },
            User_Game_player1AwayIdToUser: { select: { id: true, name: true } },
            User_Game_player2AwayIdToUser: { select: { id: true, name: true } },
          },
        },
        Round: {
          include: { Game: true },
        },
        Category: {
          orderBy: { sortOrder: 'asc' as const },
        },
      },
    })
  }
}
