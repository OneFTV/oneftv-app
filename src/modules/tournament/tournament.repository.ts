import { prisma } from '@/shared/database/prisma'
import type { TournamentListItem, TournamentFilters } from './tournament.types'

const organizerSelect = {
  id: true,
  name: true,
  email: true,
} as const

const playersInclude = {
  include: {
    user: { select: { id: true, name: true, email: true } },
  },
} as const

export class TournamentRepository {
  static async findById(id: string) {
    return prisma.tournament.findUnique({
      where: { id },
      include: {
        organizer: { select: organizerSelect },
        players: playersInclude,
        groups: { include: { players: true } },
        games: {
          include: {
            player1Home: { select: { id: true, name: true } },
            player2Home: { select: { id: true, name: true } },
            player1Away: { select: { id: true, name: true } },
            player2Away: { select: { id: true, name: true } },
          },
        },
        rounds: { include: { games: true } },
        categories: {
          orderBy: { sortOrder: 'asc' as const },
          include: {
            _count: { select: { players: true, teamRegistrations: true } },
          },
        },
      },
    })
  }

  static async findMany(
    filters: TournamentFilters,
    page: number,
    limit: number
  ): Promise<{ data: TournamentListItem[]; total: number }> {
    const where: Record<string, unknown> = {}
    if (filters.status) where.status = filters.status
    if (filters.format) where.format = filters.format
    if (filters.organizerId) where.organizerId = filters.organizerId
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { location: { contains: filters.search } },
      ]
    }

    const [total, tournaments] = await Promise.all([
      prisma.tournament.count({ where }),
      prisma.tournament.findMany({
        where,
        include: {
          organizer: { select: organizerSelect },
          players: { select: { id: true } },
          _count: { select: { categories: true } },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    const data: TournamentListItem[] = tournaments.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      location: t.location,
      city: t.city,
      state: t.state,
      country: t.country,
      startDate: t.date,
      endDate: t.endDate,
      format: t.format,
      status: t.status,
      maxPlayers: t.maxPlayers,
      registeredPlayers: t.players.length,
      courts: t.numCourts,
      organizerId: t.organizerId,
      organizerName: t.organizer.name,
      categoryCount: t._count.categories,
    }))

    return { data, total }
  }

  static async create(data: Record<string, unknown>) {
    return prisma.tournament.create({
      data: data as Parameters<typeof prisma.tournament.create>[0]['data'],
      include: {
        organizer: { select: organizerSelect },
      },
    })
  }

  static async update(id: string, data: Record<string, unknown>) {
    return prisma.tournament.update({
      where: { id },
      data: data as Parameters<typeof prisma.tournament.update>[0]['data'],
      include: {
        organizer: { select: organizerSelect },
        players: playersInclude,
        categories: {
          orderBy: { sortOrder: 'asc' as const },
        },
      },
    })
  }

  static async updateStatus(id: string, status: string) {
    return prisma.tournament.update({
      where: { id },
      data: { status },
    })
  }

  static async delete(id: string) {
    return prisma.tournament.delete({ where: { id } })
  }

  static async findOwner(id: string) {
    return prisma.tournament.findUnique({
      where: { id },
      select: { organizerId: true },
    })
  }
}
