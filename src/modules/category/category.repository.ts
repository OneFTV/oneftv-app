import { prisma } from '@/shared/database/prisma'
import type { CategoryListItem } from './category.types'

const playerInclude = {
  include: {
    user: { select: { id: true, name: true, email: true } },
  },
} as const

export class CategoryRepository {
  static async findById(id: string) {
    return prisma.category.findUnique({
      where: { id },
      include: {
        players: playerInclude,
        pricingLots: { orderBy: { sortOrder: 'asc' as const } },
        qualifyTarget: { select: { id: true, name: true } },
        _count: {
          select: { players: true, teamRegistrations: true },
        },
      },
    })
  }

  static async findByTournament(tournamentId: string): Promise<CategoryListItem[]> {
    const categories = await prisma.category.findMany({
      where: { tournamentId },
      include: {
        qualifyTarget: { select: { id: true, name: true } },
        _count: {
          select: { players: true, teamRegistrations: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      format: c.format,
      gender: c.gender,
      skillLevel: c.skillLevel,
      maxTeams: c.maxTeams,
      pointsPerSet: c.pointsPerSet,
      numSets: c.numSets,
      groupSize: c.groupSize,
      proLeague: c.proLeague,
      sortOrder: c.sortOrder,
      status: c.status,
      registeredTeams: c._count.teamRegistrations || c._count.players,
      qualifyTargetId: c.qualifyTargetId,
      qualifyTargetName: c.qualifyTarget?.name || null,
    }))
  }

  static async create(tournamentId: string, data: Record<string, unknown>) {
    return prisma.category.create({
      data: {
        ...data,
        tournamentId,
      } as Parameters<typeof prisma.category.create>[0]['data'],
      include: {
        qualifyTarget: { select: { id: true, name: true } },
        _count: {
          select: { players: true, teamRegistrations: true },
        },
      },
    })
  }

  static async update(id: string, data: Record<string, unknown>) {
    return prisma.category.update({
      where: { id },
      data: data as Parameters<typeof prisma.category.update>[0]['data'],
      include: {
        qualifyTarget: { select: { id: true, name: true } },
        _count: {
          select: { players: true, teamRegistrations: true },
        },
      },
    })
  }

  static async delete(id: string) {
    return prisma.category.delete({ where: { id } })
  }

  static async findTournamentId(categoryId: string) {
    return prisma.category.findUnique({
      where: { id: categoryId },
      select: { tournamentId: true },
    })
  }

  static async countByTournament(tournamentId: string) {
    return prisma.category.count({ where: { tournamentId } })
  }
}
