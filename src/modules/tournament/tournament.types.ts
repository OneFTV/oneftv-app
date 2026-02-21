import type { Tournament, User, TournamentPlayer } from '@prisma/client'

export type TournamentWithOrganizer = Tournament & {
  organizer: Pick<User, 'id' | 'name' | 'email'>
}

export type TournamentWithDetails = Tournament & {
  organizer: Pick<User, 'id' | 'name' | 'email'>
  players: (TournamentPlayer & {
    user: Pick<User, 'id' | 'name' | 'email'>
  })[]
}

export interface TournamentListItem {
  id: string
  name: string
  description: string | null
  location: string
  city: string | null
  state: string | null
  country: string | null
  startDate: Date
  endDate: Date | null
  format: string | null
  status: string
  maxPlayers: number | null
  registeredPlayers: number
  courts: number
  organizerId: string
  organizerName: string
  categoryCount: number
}

export interface TournamentFilters {
  status?: string
  format?: string
  search?: string
  organizerId?: string
}

export interface CreateTournamentInput {
  name: string
  description?: string
  format?: string
  maxPlayers?: number
  startDate?: string
  endDate?: string
  location?: string
  city?: string
  state?: string
  country?: string
  courts?: number
  days?: number
  hoursPerDay?: number
  avgGameDuration?: number
  pointsPerSet?: number
  sets?: number
  groupSize?: number
  proLeague?: boolean
  // Multi-category policy
  allowMultiCategory?: boolean
  refundPolicy?: string
  bannerUrl?: string
  contactEmail?: string
  contactPhone?: string
  // Inline categories
  categories?: {
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
  }[]
}

export interface UpdateTournamentInput {
  name?: string
  description?: string
  maxPlayers?: number
  date?: string
  location?: string
  status?: string
  allowMultiCategory?: boolean
  refundPolicy?: string
  bannerUrl?: string
  contactEmail?: string
  contactPhone?: string
}
