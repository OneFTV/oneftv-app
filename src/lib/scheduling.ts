// Re-export from scheduling module for backward compatibility
export type { GameTemplate as Game, ScheduledGameTemplate as ScheduledGame } from '@/modules/scheduling/scheduling.types'
export {
  calculateMaxGames,
  generateKotBGroups,
  generateKotBGames,
  generateBracketGames,
  generateGroupKnockoutGames,
  generateRoundRobinGames,
  scheduleGames,
} from '@/modules/scheduling/generators'
