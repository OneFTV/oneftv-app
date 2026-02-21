import { ValidationError } from '@/shared/api/errors'
import { DEFAULT_DECIDING_SET_POINTS } from '@/shared/config/constants'

export function validateSetScore(
  home: number,
  away: number,
  targetPoints: number
): string | null {
  const winner = Math.max(home, away)
  const loser = Math.min(home, away)

  if (winner < targetPoints) {
    return `Winning score must be at least ${targetPoints}`
  }

  if (winner - loser < 2) {
    return 'Winner must lead by at least 2 points'
  }

  // If winner scored more than targetPoints, the loser must be at winner-2
  // (deuce scenario: e.g. 20-18, 21-19, etc.)
  if (winner > targetPoints && loser !== winner - 2) {
    return `In extended play, scores must differ by exactly 2 (e.g. ${winner}-${winner - 2})`
  }

  return null
}

export function validateGameScores(
  scores: {
    scoreHome: number
    scoreAway: number
    set2Home?: number
    set2Away?: number
    set3Home?: number
    set3Away?: number
  },
  isBestOf3: boolean,
  pointsPerSet: number
): { winningSide: string } {
  const { scoreHome, scoreAway, set2Home, set2Away, set3Home, set3Away } = scores
  const decidingSetPoints = DEFAULT_DECIDING_SET_POINTS

  // Validate Set 1
  const set1Error = validateSetScore(scoreHome, scoreAway, pointsPerSet)
  if (set1Error) {
    throw new ValidationError(`Set 1: ${set1Error}`)
  }

  if (!isBestOf3) {
    // Single set: simple comparison
    const side = scoreHome > scoreAway ? 'home' : 'away'
    return { winningSide: side }
  }

  // Best of 3 logic
  let homeSetsWon = scoreHome > scoreAway ? 1 : 0
  let awaySetsWon = scoreAway > scoreHome ? 1 : 0

  // Validate Set 2 (required for best-of-3)
  if (set2Home == null || set2Away == null) {
    throw new ValidationError('Set 2 scores are required for best-of-3 matches')
  }

  const set2Error = validateSetScore(set2Home, set2Away, pointsPerSet)
  if (set2Error) {
    throw new ValidationError(`Set 2: ${set2Error}`)
  }

  homeSetsWon += set2Home > set2Away ? 1 : 0
  awaySetsWon += set2Away > set2Home ? 1 : 0

  // If sets tied 1-1, need set 3
  if (homeSetsWon === 1 && awaySetsWon === 1) {
    if (set3Home == null || set3Away == null) {
      throw new ValidationError('Set 3 scores are required when sets are tied 1-1')
    }

    const set3Error = validateSetScore(set3Home, set3Away, decidingSetPoints)
    if (set3Error) {
      throw new ValidationError(`Set 3 (deciding set to ${decidingSetPoints}): ${set3Error}`)
    }

    homeSetsWon += set3Home > set3Away ? 1 : 0
    awaySetsWon += set3Away > set3Home ? 1 : 0
  } else if (set3Home != null || set3Away != null) {
    throw new ValidationError('Set 3 is not needed — a team already won 2 sets')
  }

  return { winningSide: homeSetsWon > awaySetsWon ? 'home' : 'away' }
}
