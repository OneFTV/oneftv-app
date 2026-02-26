import { TournamentRepository } from './tournament.repository'
import { VALID_STATUS_TRANSITIONS } from './tournament.constants'
import { NotFoundError, ForbiddenError, PolicyViolationError } from '@/shared/api/errors'
import type { TournamentFilters, CreateTournamentInput } from './tournament.types'
import { prisma } from '@/shared/database/prisma'

export class TournamentService {
  static async getById(id: string) {
    const tournament = await TournamentRepository.findById(id)
    if (!tournament) throw new NotFoundError('Tournament', id)
    return tournament
  }

  static async list(filters: TournamentFilters, page: number, limit: number) {
    return TournamentRepository.findMany(filters, page, limit)
  }

  static async create(input: CreateTournamentInput, organizerId: string) {
    const data: Record<string, unknown> = {
      name: input.name,
      description: input.description,
      format: input.format || null,
      maxPlayers: input.maxPlayers ?? (input.categories ? null : 16),
      date: input.startDate ? new Date(input.startDate + 'T12:00:00') : new Date(),
      endDate: input.endDate ? new Date(input.endDate + 'T12:00:00') : undefined,
      location: input.location ?? '',
      city: input.city,
      state: input.state,
      country: input.country,
      numCourts: input.courts ?? 1,
      numDays: input.days ?? 1,
      hoursPerDay: input.hoursPerDay ?? 8,
      avgGameMinutes: input.avgGameDuration ?? 20,
      pointsPerSet: input.pointsPerSet ?? (input.categories ? null : 18),
      numSets: input.sets ?? 1,
      groupSize: input.groupSize ?? 4,
      proLeague: input.proLeague ?? false,
      organizerId,
      status: 'registration',
      // Multi-category fields
      allowMultiCategory: input.allowMultiCategory ?? (input.categories && input.categories.length > 1),
      refundPolicy: input.refundPolicy,
      bannerUrl: input.bannerUrl,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
    }

    const tournament = await TournamentRepository.create(data)

    // Create inline categories if provided
    if (input.categories && input.categories.length > 0) {
      for (let i = 0; i < input.categories.length; i++) {
        const cat = input.categories[i]
        await prisma.category.create({
          data: {
            tournamentId: tournament.id,
            name: cat.name,
            format: cat.format,
            gender: cat.gender ?? null,
            skillLevel: cat.skillLevel ?? null,
            maxTeams: cat.maxTeams ?? 16,
            pointsPerSet: cat.pointsPerSet ?? 18,
            numSets: cat.numSets ?? 1,
            groupSize: cat.groupSize ?? 4,
            proLeague: cat.proLeague ?? false,
            sortOrder: cat.sortOrder ?? i,
            requiresReview: cat.requiresReview ?? false,
            status: 'draft',
          },
        })
      }
    }

    // Re-fetch with categories included
    const result = await TournamentRepository.findById(tournament.id)
    return result!
  }

  static async update(id: string, input: Record<string, unknown>, userId: string) {
    await this.verifyOwnership(id, userId)

    const updateData = { ...input }
    if (updateData.date && typeof updateData.date === 'string') {
      updateData.date = new Date(updateData.date as string)
    }

    // If status is being changed, validate the transition
    if (updateData.status && typeof updateData.status === 'string') {
      const tournament = await this.getById(id)
      const allowed = VALID_STATUS_TRANSITIONS[tournament.status] || []
      if (!allowed.includes(updateData.status as string)) {
        throw new PolicyViolationError(
          `Cannot transition from '${tournament.status}' to '${updateData.status}'`
        )
      }
    }

    return TournamentRepository.update(id, updateData)
  }

  static async updateStatus(id: string, newStatus: string, userId: string) {
    const tournament = await this.getById(id)
    await this.verifyOwnership(id, userId)

    const allowed = VALID_STATUS_TRANSITIONS[tournament.status] || []
    if (!allowed.includes(newStatus)) {
      throw new PolicyViolationError(
        `Cannot transition from '${tournament.status}' to '${newStatus}'`
      )
    }

    return TournamentRepository.updateStatus(id, newStatus)
  }

  static async delete(id: string, userId: string) {
    await this.verifyOwnership(id, userId)
    return TournamentRepository.delete(id)
  }

  private static async verifyOwnership(tournamentId: string, userId: string) {
    const tournament = await TournamentRepository.findOwner(tournamentId)
    if (!tournament) throw new NotFoundError('Tournament', tournamentId)
    if (tournament.organizerId !== userId) {
      throw new ForbiddenError('Only the organizer can modify this tournament')
    }
  }
}
