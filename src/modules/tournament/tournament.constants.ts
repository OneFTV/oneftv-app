export const TOURNAMENT_STATUS = {
  DRAFT: 'draft',
  REGISTRATION: 'registration',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export type TournamentStatus = typeof TOURNAMENT_STATUS[keyof typeof TOURNAMENT_STATUS]

export const TOURNAMENT_FORMAT = {
  KING_OF_THE_BEACH: 'king_of_the_beach',
  BRACKET: 'bracket',
  GROUP_KNOCKOUT: 'group_knockout',
  ROUND_ROBIN: 'round_robin',
} as const

export type TournamentFormat = typeof TOURNAMENT_FORMAT[keyof typeof TOURNAMENT_FORMAT]

export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['registration', 'cancelled'],
  registration: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: [],
  cancelled: [],
}
