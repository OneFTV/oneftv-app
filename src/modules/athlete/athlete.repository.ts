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
          tournamentPlayers: {
            include: {
              tournament: { select: tournamentSelect },
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

  static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        tournamentPlayers: {
          include: {
            tournament: { select: tournamentSelectFull },
          },
          orderBy: { tournament: { date: 'desc' } },
        },
      },
    })
  }
}
