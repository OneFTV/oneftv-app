import { z } from 'zod'

const categoryInlineSchema = z.object({
  name: z.string().min(2).max(100),
  format: z.enum(['king_of_the_beach', 'bracket', 'group_knockout', 'round_robin', 'double_elimination']),
  gender: z.enum(['male', 'female', 'mixed']).optional(),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced', 'pro']).optional(),
  maxTeams: z.number().int().min(2).max(256).optional().default(16),
  pointsPerSet: z.number().int().min(1).max(50).optional().default(18),
  numSets: z.number().int().min(1).max(5).optional().default(1),
  groupSize: z.number().int().min(2).max(16).optional().default(4),
  proLeague: z.boolean().optional().default(false),
  sortOrder: z.number().int().optional(),
  qualifyTargetId: z.string().optional(),
  requiresReview: z.boolean().optional(),
})

export const createTournamentSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z.string().max(500).optional(),
  format: z.string().optional(), // nullable for multi-category
  maxPlayers: z.number().int().min(2, 'Minimum 2 players').max(256).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().max(200).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  courts: z.number().int().optional(),
  days: z.number().int().optional(),
  hoursPerDay: z.number().optional(),
  avgGameDuration: z.number().int().optional(),
  pointsPerSet: z.number().int().optional(),
  sets: z.number().int().optional(),
  groupSize: z.number().int().optional(),
  proLeague: z.boolean().optional(),
  // Multi-category policy fields
  allowMultiCategory: z.boolean().optional(),
  refundPolicy: z.string().optional(),
  bannerUrl: z.string().optional(),
  contactEmail: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().email().optional(),
  ),
  contactPhone: z.string().optional(),
  registrationDeadline: z.string().optional(),
  registrationFee: z.number().min(0, 'Registration fee must be >= 0').optional(),
  acceptedPaymentMethods: z.array(z.string()).optional(),
  numReferees: z.number().int().min(1).max(50).optional(),
  primaryCourts: z.string().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  // Inline categories (created with tournament)
  categories: z.array(categoryInlineSchema).optional(),
})

export const updateTournamentSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  maxPlayers: z.number().int().min(4).optional(),
  date: z.string().datetime().optional(),
  location: z.string().max(200).optional(),
  status: z.enum(['draft', 'registration', 'in_progress', 'completed']).optional(),
  allowMultiCategory: z.boolean().optional(),
  refundPolicy: z.string().optional(),
  bannerUrl: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  registrationDeadline: z.string().datetime().optional(),
  registrationFee: z.number().min(0).optional(),
  acceptedPaymentMethods: z.array(z.string()).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
})

export type CreateTournamentData = z.infer<typeof createTournamentSchema>
export type UpdateTournamentData = z.infer<typeof updateTournamentSchema>
