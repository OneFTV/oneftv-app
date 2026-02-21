import { z } from 'zod'

export const updateGameSchema = z.object({
  scoreHome: z.number().int().nonnegative(),
  scoreAway: z.number().int().nonnegative(),
  set2Home: z.number().int().nonnegative().optional(),
  set2Away: z.number().int().nonnegative().optional(),
  set3Home: z.number().int().nonnegative().optional(),
  set3Away: z.number().int().nonnegative().optional(),
})

export type UpdateGameData = z.infer<typeof updateGameSchema>

export const batchUpdateScoresSchema = z.object({
  scores: z.array(
    z.object({
      gameId: z.string().min(1),
      scoreHome: z.number().int().nonnegative(),
      scoreAway: z.number().int().nonnegative(),
      set2Home: z.number().int().nonnegative().optional(),
      set2Away: z.number().int().nonnegative().optional(),
      set3Home: z.number().int().nonnegative().optional(),
      set3Away: z.number().int().nonnegative().optional(),
    })
  ).min(1).max(200),
})

export type BatchUpdateScoresData = z.infer<typeof batchUpdateScoresSchema>
