import { prisma } from '@/shared/database/prisma'

const tournamentSelect = {
  id: true,
  name: true,
  format: true,
  date: true,
} as const

const tournamentSelectFull = {
  ...tournamentSelect,
  endDate: true,
  location: true,
} as const

export class AthleteRepository {
  static async findMany(
    where: Record<string, unknown>,
    page: number,
    limit: number
  ) {
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        include: {
          TournamentPlayer: {
            include: {
              Tournament: { select: tournamentSelect },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return { total, users }
  }

  static async getTournamentPlayers(tournamentId: string, categoryId?: string) {
    const where: Record<string, unknown> = { tournamentId }
    if (categoryId) where.categoryId = categoryId
    return prisma.tournamentPlayer.findMany({
      where,
      select: { userId: true, wins: true, losses: true, points: true, pointDiff: true },
    })
  }

  static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        TournamentPlayer: {
          include: {
            Tournament: { select: tournamentSelectFull },
            Category: { select: { id: true, name: true, format: true } },
          },
          orderBy: { Tournament: { date: 'desc' } },
        },
      },
    })
  }
}
