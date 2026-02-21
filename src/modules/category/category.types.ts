import type { Category, PricingLot, TournamentPlayer, User } from '@prisma/client'

export type CategoryWithDetails = Category & {
  players: (TournamentPlayer & {
    user: Pick<User, 'id' | 'name' | 'email'>
  })[]
  pricingLots: PricingLot[]
  qualifyTarget: Pick<Category, 'id' | 'name'> | null
  _count: {
    players: number
    teamRegistrations: number
  }
}

export type CategoryListItem = {
  id: string
  name: string
  format: string
  gender: string | null
  skillLevel: string | null
  maxTeams: number
  pointsPerSet: number
  numSets: number
  groupSize: number
  proLeague: boolean
  sortOrder: number
  status: string
  registeredTeams: number
  qualifyTargetId: string | null
  qualifyTargetName: string | null
}

export interface CreateCategoryInput {
  name: string
  format: string
  gender?: string
  skillLevel?: string
  maxTeams?: number
  pointsPerSet?: number
  numSets?: number
  groupSize?: number
  proLeague?: boolean
  sortOrder?: number
  qualifyTargetId?: string
  requiresReview?: boolean
}

export interface UpdateCategoryInput {
  name?: string
  format?: string
  gender?: string | null
  skillLevel?: string | null
  maxTeams?: number
  pointsPerSet?: number
  numSets?: number
  groupSize?: number
  proLeague?: boolean
  sortOrder?: number
  status?: string
  qualifyTargetId?: string | null
  requiresReview?: boolean
}
