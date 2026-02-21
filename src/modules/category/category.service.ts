import { CategoryRepository } from './category.repository'
import { NotFoundError, ForbiddenError, ValidationError } from '@/shared/api/errors'
import { prisma } from '@/shared/database/prisma'
import type { CreateCategoryInput, UpdateCategoryInput } from './category.types'

export class CategoryService {
  static async getById(id: string) {
    const category = await CategoryRepository.findById(id)
    if (!category) throw new NotFoundError('Category', id)
    return category
  }

  static async listByTournament(tournamentId: string) {
    return CategoryRepository.findByTournament(tournamentId)
  }

  static async create(tournamentId: string, input: CreateCategoryInput, userId: string) {
    await this.verifyTournamentOwnership(tournamentId, userId)

    const data: Record<string, unknown> = {
      name: input.name,
      format: input.format,
      gender: input.gender ?? null,
      skillLevel: input.skillLevel ?? null,
      maxTeams: input.maxTeams ?? 16,
      pointsPerSet: input.pointsPerSet ?? 18,
      numSets: input.numSets ?? 1,
      groupSize: input.groupSize ?? 4,
      proLeague: input.proLeague ?? false,
      sortOrder: input.sortOrder ?? 0,
      qualifyTargetId: input.qualifyTargetId ?? null,
      requiresReview: input.requiresReview ?? false,
      status: 'draft',
    }

    // Validate qualifyTargetId belongs to same tournament
    if (input.qualifyTargetId) {
      const target = await CategoryRepository.findTournamentId(input.qualifyTargetId)
      if (!target || target.tournamentId !== tournamentId) {
        throw new ValidationError('Qualify target category must belong to the same tournament')
      }
    }

    return CategoryRepository.create(tournamentId, data)
  }

  static async update(categoryId: string, input: UpdateCategoryInput, userId: string) {
    const category = await this.getById(categoryId)
    await this.verifyTournamentOwnership(category.tournamentId, userId)

    const data: Record<string, unknown> = {}
    if (input.name !== undefined) data.name = input.name
    if (input.format !== undefined) data.format = input.format
    if (input.gender !== undefined) data.gender = input.gender
    if (input.skillLevel !== undefined) data.skillLevel = input.skillLevel
    if (input.maxTeams !== undefined) data.maxTeams = input.maxTeams
    if (input.pointsPerSet !== undefined) data.pointsPerSet = input.pointsPerSet
    if (input.numSets !== undefined) data.numSets = input.numSets
    if (input.groupSize !== undefined) data.groupSize = input.groupSize
    if (input.proLeague !== undefined) data.proLeague = input.proLeague
    if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder
    if (input.status !== undefined) data.status = input.status
    if (input.qualifyTargetId !== undefined) data.qualifyTargetId = input.qualifyTargetId
    if (input.requiresReview !== undefined) data.requiresReview = input.requiresReview

    // Validate qualifyTargetId
    if (input.qualifyTargetId) {
      const target = await CategoryRepository.findTournamentId(input.qualifyTargetId)
      if (!target || target.tournamentId !== category.tournamentId) {
        throw new ValidationError('Qualify target category must belong to the same tournament')
      }
      if (input.qualifyTargetId === categoryId) {
        throw new ValidationError('Category cannot qualify to itself')
      }
    }

    return CategoryRepository.update(categoryId, data)
  }

  static async delete(categoryId: string, userId: string) {
    const category = await this.getById(categoryId)
    await this.verifyTournamentOwnership(category.tournamentId, userId)

    // Check if category has active games
    const gamesCount = await prisma.game.count({
      where: { categoryId, status: { not: 'scheduled' } },
    })
    if (gamesCount > 0) {
      throw new ValidationError('Cannot delete category with active games')
    }

    return CategoryRepository.delete(categoryId)
  }

  private static async verifyTournamentOwnership(tournamentId: string, userId: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { organizerId: true },
    })
    if (!tournament) throw new NotFoundError('Tournament', tournamentId)
    if (tournament.organizerId !== userId) {
      throw new ForbiddenError('Only the organizer can manage categories')
    }
  }
}
