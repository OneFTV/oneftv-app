// Re-export from scheduling module for backward compatibility
export type { KotBGame, PlayerStanding, GroupStanding } from '@/modules/scheduling/scheduling.types'
export {
  generateKotBRoundRobin,
  calculateKotBStandings,
  getKotBAdvancingPlayers,
  generateKotBKnockout,
} from '@/modules/scheduling/kotb'
