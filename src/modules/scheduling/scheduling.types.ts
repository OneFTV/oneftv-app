export interface GameTemplate {
  id?: string
  team1: string[]
  team2: string[]
  courtNumber?: number
  scheduledTime?: Date
  status?: 'scheduled' | 'in_progress' | 'completed'
  team1Score?: number
  team2Score?: number
}

export interface ScheduledGameTemplate extends GameTemplate {
  courtNumber: number
  scheduledTime: Date
}

export interface KotBGame {
  id?: string
  players: string[]
  team1: string[]
  team2: string[]
  team1Score?: number
  team2Score?: number
  completed: boolean
}

export interface PlayerStanding {
  playerId: string
  playerName: string
  wins: number
  draws: number
  losses: number
  pointsFor: number
  pointsAgainst: number
  pointDifferential: number
  totalPoints: number
}

export interface GroupStanding extends PlayerStanding {
  groupId: string
}

/* ---- Double-Elimination types ---- */

export interface DEGameTemplate {
  matchNumber: number
  bracketSide: 'winners' | 'losers' | 'finals'
  roundLabel: string       // "W1", "L3", "SF", "Final", "Bronze"
  roundNumber: number
  // Seed indices (0-based) — resolved at generation time
  homeTeamIndex?: number   // index into the seeded teams array
  awayTeamIndex?: number
  // Routing by matchNumber — resolved after all templates are laid out
  winnerGoesTo?: number    // matchNumber of next game for winner
  winnerSlot?: 'home' | 'away'
  loserGoesTo?: number     // matchNumber of next game for loser (or null)
  loserSlot?: 'home' | 'away'
  // Cross-division seeding target (set on loser path)
  seedTarget?: string      // "D2-S1", "D3-S5", etc.
}

export interface DEBracketStructure {
  games: DEGameTemplate[]
  division: 'D1' | 'D2' | 'D3' | 'D4'
  bracketType: 'double_elimination' | 'single_elimination'
  matchOffset: number      // starting matchNumber for this division
}
