import { z } from 'zod'

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  format: z.enum(['king_of_the_beach', 'bracket', 'group_knockout', 'round_robin', 'double_elimination']),
  gender: z.enum(['male', 'female', 'mixed']).optional(),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced', 'pro']).optional(),
  maxTeams: z.number().int().min(2).max(256).optional().default(16),
  pointsPerSet: z.number().int().min(1).max(50).optional().default(18),
  numSets: z.number().int().min(1).max(5).optional().default(1),
  groupSize: z.number().int().min(2).max(16).optional().default(4),
  proLeague: z.boolean().optional().default(false),
  sortOrder: z.number().int().optional().default(0),
  qualifyTargetId: z.string().optional(),
  requiresReview: z.boolean().optional().default(false),
  bracketType: z.enum(['double_elimination', 'single_elimination']).optional(),
  divisionLabel: z.string().max(10).optional(),
  seedingSource: z.string().max(30).optional(),
  seedingFromCategoryId: z.string().optional(),
})

export const updateCategorySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  format: z.enum(['king_of_the_beach', 'bracket', 'group_knockout', 'round_robin', 'double_elimination']).optional(),
  gender: z.enum(['male', 'female', 'mixed']).nullable().optional(),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced', 'pro']).nullable().optional(),
  maxTeams: z.number().int().min(2).max(256).optional(),
  pointsPerSet: z.number().int().min(1).max(50).optional(),
  numSets: z.number().int().min(1).max(5).optional(),
  groupSize: z.number().int().min(2).max(16).optional(),
  proLeague: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  status: z.enum(['draft', 'registration', 'in_progress', 'completed']).optional(),
  qualifyTargetId: z.string().nullable().optional(),
  requiresReview: z.boolean().optional(),
  bracketType: z.enum(['double_elimination', 'single_elimination']).nullable().optional(),
  divisionLabel: z.string().max(10).nullable().optional(),
  seedingSource: z.string().max(30).nullable().optional(),
  seedingFromCategoryId: z.string().nullable().optional(),
})

export type CreateCategoryData = z.infer<typeof createCategorySchema>
export type UpdateCategoryData = z.infer<typeof updateCategorySchema>
