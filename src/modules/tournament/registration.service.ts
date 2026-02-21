import { prisma } from '@/shared/database/prisma'
import { NotFoundError, ConflictError, ValidationError } from '@/shared/api/errors'

export class RegistrationService {
  static async register(tournamentId: string, userId: string, categoryId?: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { players: { select: { userId: true, categoryId: true } } },
    })

    if (!tournament) throw new NotFoundError('Tournament', tournamentId)

    if (tournament.status !== 'registration') {
      throw new ValidationError('Tournament is not accepting registrations')
    }

    // If categoryId provided, validate it
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: { players: { select: { userId: true } } },
      })

      if (!category || category.tournamentId !== tournamentId) {
        throw new NotFoundError('Category', categoryId)
      }

      // Check if already registered in this category
      const alreadyInCategory = category.players.some((p) => p.userId === userId)
      if (alreadyInCategory) {
        throw new ConflictError('Already registered in this category')
      }

      // Check category capacity
      if (category.players.length >= category.maxTeams) {
        throw new ValidationError('Category is full')
      }

      // Check multi-category policy
      if (!tournament.allowMultiCategory) {
        const existingInOtherCategory = tournament.players.some(
          (p) => p.userId === userId && p.categoryId && p.categoryId !== categoryId
        )
        if (existingInOtherCategory) {
          throw new ValidationError('Tournament does not allow registration in multiple categories')
        }
      }
    } else {
      // Legacy: no category
      if (tournament.maxPlayers && tournament.players.length >= tournament.maxPlayers) {
        throw new ValidationError('Tournament is full')
      }

      const alreadyRegistered = tournament.players.some((p) => p.userId === userId)
      if (alreadyRegistered) {
        throw new ConflictError('Already registered for this tournament')
      }
    }

    return prisma.tournamentPlayer.create({
      data: {
        userId,
        tournamentId,
        categoryId: categoryId ?? null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })
  }

  static async listPlayers(tournamentId: string, categoryId?: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true },
    })

    if (!tournament) throw new NotFoundError('Tournament', tournamentId)

    const where: Record<string, unknown> = { tournamentId }
    if (categoryId) where.categoryId = categoryId

    const players = await prisma.tournamentPlayer.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, nationality: true, level: true },
        },
        group: { select: { name: true } },
        category: { select: { id: true, name: true } },
      },
      orderBy: { seed: 'asc' },
    })

    return players.map((tp) => ({
      id: tp.id,
      userId: tp.userId,
      name: tp.user.name,
      email: tp.user.email,
      nationality: tp.user.nationality,
      level: tp.user.level,
      seed: tp.seed,
      group: tp.group?.name || null,
      points: tp.points,
      wins: tp.wins,
      losses: tp.losses,
      pointDiff: tp.pointDiff,
      status: tp.status,
      categoryId: tp.categoryId,
      categoryName: tp.category?.name || null,
    }))
  }
}
