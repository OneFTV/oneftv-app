/**
 * NFA Multi-Division Double-Elimination Bracket Generator
 *
 * Source of truth: NFA_Tournament_Bracket_Visual_References.md
 * - D1: 32-team double elimination (M1-M62)
 * - D3: 16-team single elimination (M63-M78), seeded from D1 L1/L2 losers (3-div)
 *       OR 8-team single elimination (M63-M70), seeded from D1 L2 losers (4-div)
 * - D2: 8-team double elimination (M79-M92), seeded from D1 L3/L4 losers
 * - D4: 8-team single elimination (M93-M100), seeded from D1 L1 losers (4-div only)
 */

import type { DEGameTemplate } from './scheduling.types'

// NFA seeding order for 32 teams (1-indexed seed positions)
// S1vsS32, S16vsS17, S8vsS25, S9vsS24, S4vsS29, S13vsS20, S5vsS28, S12vsS21,
// S2vsS31, S15vsS18, S7vsS26, S10vsS23, S3vsS30, S14vsS19, S6vsS27, S11vsS22
const D1_SEEDING_PAIRS: [number, number][] = [
  [1, 32], [16, 17], [8, 25], [9, 24],
  [4, 29], [13, 20], [5, 28], [12, 21],
  [2, 31], [15, 18], [7, 26], [10, 23],
  [3, 30], [14, 19], [6, 27], [11, 22],
]

// D3 seeding (16 teams): S1vsS16, S8vsS9, S4vsS13, S5vsS12, S2vsS15, S7vsS10, S3vsS14, S6vsS11
const D3_SEEDING_PAIRS: [number, number][] = [
  [1, 16], [8, 9], [4, 13], [5, 12],
  [2, 15], [7, 10], [3, 14], [6, 11],
]

// D2 seeding (8 teams): S1vsS8, S4vsS5, S2vsS7, S3vsS6
const D2_SEEDING_PAIRS: [number, number][] = [
  [1, 8], [4, 5], [2, 7], [3, 6],
]

// Standard 8-team seeding (used for D4 and D3 8-team)
const SE8_SEEDING_PAIRS: [number, number][] = [
  [1, 8], [4, 5], [2, 7], [3, 6],
]

interface RoutingEntry {
  winnerGoesTo: number | null
  winnerSlot: 'home' | 'away'
  loserGoesTo: number | null
  loserSlot: 'home' | 'away'
  seedTarget?: string  // e.g. "D3-S1", "D2-S5"
}

/**
 * Build the full D1 routing table (M1-M62) from the visual references.
 * @param divisionCount Number of open divisions (1-4). Controls seedTarget labels:
 *   - 4 divisions: L1 losers -> D4, L2 losers -> D3, L3+L4 losers -> D2
 *   - 3 divisions (default): L1+L2 losers -> D3, L3+L4 losers -> D2
 *   - 2 divisions: L3+L4 losers -> D2 only (L1/L2 losers eliminated)
 *   - 1 division: no seedTargets (all losers eliminated)
 */
function buildD1RoutingTable(divisionCount: number = 3): Map<number, RoutingEntry> {
  const rt = new Map<number, RoutingEntry>()

  // W1 (M1-M16) -> winners go to W2 (M17-M24), losers go to L1 (M31-M38)
  // Pairs: M1+M2->M17, M3+M4->M18, ..., M15+M16->M24
  for (let i = 0; i < 16; i++) {
    const m = i + 1
    const w2Game = 17 + Math.floor(i / 2)
    const l1Game = 31 + Math.floor(i / 2)
    rt.set(m, {
      winnerGoesTo: w2Game,
      winnerSlot: i % 2 === 0 ? 'home' : 'away',
      loserGoesTo: l1Game,
      loserSlot: i % 2 === 0 ? 'home' : 'away',
    })
  }

  // W2 (M17-M24) -> winners go to W3 (M25-M28), losers go to L2 (M39-M46)
  for (let i = 0; i < 8; i++) {
    const m = 17 + i
    const w3Game = 25 + Math.floor(i / 2)
    const l2Game = 39 + i
    rt.set(m, {
      winnerGoesTo: w3Game,
      winnerSlot: i % 2 === 0 ? 'home' : 'away',
      loserGoesTo: l2Game,
      loserSlot: 'away', // L2 away slot gets W2 losers (home is L1 winner)
    })
  }

  // W3 (M25-M28) -> winners go to W4 (M29-M30), losers go to L4 (M51-M54)
  for (let i = 0; i < 4; i++) {
    const m = 25 + i
    const w4Game = 29 + Math.floor(i / 2)
    const l4Game = 51 + i
    rt.set(m, {
      winnerGoesTo: w4Game,
      winnerSlot: i % 2 === 0 ? 'home' : 'away',
      loserGoesTo: l4Game,
      loserSlot: 'away', // L4 away slot gets W3 losers (home is L3 winner)
    })
  }

  // W4 (M29-M30) -> winners go to SF (M59-M60), losers go to L6 (M57-M58)
  rt.set(29, { winnerGoesTo: 59, winnerSlot: 'home', loserGoesTo: 57, loserSlot: 'away' })
  rt.set(30, { winnerGoesTo: 60, winnerSlot: 'home', loserGoesTo: 58, loserSlot: 'away' })

  // L1 (M31-M38) -> winners go to L2 (M39-M46), losers seed lower division
  // divisionCount=4: L1 losers -> D4-S1..S8
  // divisionCount=3: L1 losers -> D3-S1..S8
  // divisionCount<=2: L1 losers eliminated (no seedTarget)
  const l1TargetDiv = divisionCount === 4 ? 'D4' : divisionCount === 3 ? 'D3' : null
  for (let i = 0; i < 8; i++) {
    const m = 31 + i
    const l2Game = 39 + i
    rt.set(m, {
      winnerGoesTo: l2Game,
      winnerSlot: 'home',
      loserGoesTo: null,
      loserSlot: 'home',
      ...(l1TargetDiv ? { seedTarget: `${l1TargetDiv}-S${i + 1}` } : {}),
    })
  }

  // L2 (M39-M46) -> winners go to L3 (M47-M50), losers seed lower division
  // divisionCount=4: L2 losers -> D3-S1..S8
  // divisionCount=3: L2 losers -> D3-S9..S16
  // divisionCount<=2: L2 losers eliminated (no seedTarget)
  const l2HasTarget = divisionCount >= 3
  const l2SeedStart = divisionCount === 4 ? 1 : 9
  for (let i = 0; i < 8; i++) {
    const m = 39 + i
    const l3Game = 47 + Math.floor(i / 2)
    rt.set(m, {
      winnerGoesTo: l3Game,
      winnerSlot: i % 2 === 0 ? 'home' : 'away',
      loserGoesTo: null,
      loserSlot: 'home',
      ...(l2HasTarget ? { seedTarget: `D3-S${l2SeedStart + i}` } : {}),
    })
  }

  // L3 (M47-M50) -> winners go to L4 (M51-M54), losers seed D2
  // divisionCount>=2: L3 losers -> D2-S1..S4
  // divisionCount=1: L3 losers eliminated
  const l3HasTarget = divisionCount >= 2
  const d2SeedFromL3 = ['D2-S1','D2-S2','D2-S3','D2-S4']
  for (let i = 0; i < 4; i++) {
    const m = 47 + i
    const l4Game = 51 + i
    rt.set(m, {
      winnerGoesTo: l4Game,
      winnerSlot: 'home',
      loserGoesTo: null,
      loserSlot: 'home',
      ...(l3HasTarget ? { seedTarget: d2SeedFromL3[i] } : {}),
    })
  }

  // L4 (M51-M54) -> winners go to L5 (M55-M56), losers seed D2
  // divisionCount>=2: L4 losers -> D2-S5..S8
  // divisionCount=1: L4 losers eliminated
  const d2SeedFromL4 = ['D2-S5','D2-S6','D2-S7','D2-S8']
  for (let i = 0; i < 4; i++) {
    const m = 51 + i
    const l5Game = 55 + Math.floor(i / 2)
    rt.set(m, {
      winnerGoesTo: l5Game,
      winnerSlot: i % 2 === 0 ? 'home' : 'away',
      loserGoesTo: null,
      loserSlot: 'home',
      ...(l3HasTarget ? { seedTarget: d2SeedFromL4[i] } : {}),
    })
  }

  // L5 (M55-M56) -> winners go to L6 (M57-M58), losers eliminated
  rt.set(55, { winnerGoesTo: 57, winnerSlot: 'home', loserGoesTo: null, loserSlot: 'home' })
  rt.set(56, { winnerGoesTo: 58, winnerSlot: 'home', loserGoesTo: null, loserSlot: 'home' })

  // L6 (M57-M58) -> winners go to SF (M59-M60), losers eliminated
  rt.set(57, { winnerGoesTo: 59, winnerSlot: 'away', loserGoesTo: null, loserSlot: 'home' })
  rt.set(58, { winnerGoesTo: 60, winnerSlot: 'away', loserGoesTo: null, loserSlot: 'home' })

  // SF (M59-M60) -> winners go to Final (M62), losers go to Bronze (M61)
  rt.set(59, { winnerGoesTo: 62, winnerSlot: 'home', loserGoesTo: 61, loserSlot: 'home' })
  rt.set(60, { winnerGoesTo: 62, winnerSlot: 'away', loserGoesTo: 61, loserSlot: 'away' })

  // Bronze (M61) -- terminal
  rt.set(61, { winnerGoesTo: null, winnerSlot: 'home', loserGoesTo: null, loserSlot: 'home' })

  // Final (M62) -- terminal
  rt.set(62, { winnerGoesTo: null, winnerSlot: 'home', loserGoesTo: null, loserSlot: 'home' })

  return rt
}

function getRoundInfo(matchNumber: number): { roundLabel: string; roundNumber: number; bracketSide: 'winners' | 'losers' | 'finals' } {
  if (matchNumber >= 1 && matchNumber <= 16) return { roundLabel: 'W1', roundNumber: 1, bracketSide: 'winners' }
  if (matchNumber >= 17 && matchNumber <= 24) return { roundLabel: 'W2', roundNumber: 2, bracketSide: 'winners' }
  if (matchNumber >= 25 && matchNumber <= 28) return { roundLabel: 'W3', roundNumber: 3, bracketSide: 'winners' }
  if (matchNumber >= 29 && matchNumber <= 30) return { roundLabel: 'W4', roundNumber: 4, bracketSide: 'winners' }
  if (matchNumber >= 31 && matchNumber <= 38) return { roundLabel: 'L1', roundNumber: 1, bracketSide: 'losers' }
  if (matchNumber >= 39 && matchNumber <= 46) return { roundLabel: 'L2', roundNumber: 2, bracketSide: 'losers' }
  if (matchNumber >= 47 && matchNumber <= 50) return { roundLabel: 'L3', roundNumber: 3, bracketSide: 'losers' }
  if (matchNumber >= 51 && matchNumber <= 54) return { roundLabel: 'L4', roundNumber: 4, bracketSide: 'losers' }
  if (matchNumber >= 55 && matchNumber <= 56) return { roundLabel: 'L5', roundNumber: 5, bracketSide: 'losers' }
  if (matchNumber >= 57 && matchNumber <= 58) return { roundLabel: 'L6', roundNumber: 6, bracketSide: 'losers' }
  if (matchNumber === 59) return { roundLabel: 'Semi-Final 1', roundNumber: 7, bracketSide: 'finals' }
  if (matchNumber === 60) return { roundLabel: 'Semi-Final 2', roundNumber: 7, bracketSide: 'finals' }
  if (matchNumber === 61) return { roundLabel: 'Bronze', roundNumber: 8, bracketSide: 'finals' }
  if (matchNumber === 62) return { roundLabel: 'Final', roundNumber: 9, bracketSide: 'finals' }
  return { roundLabel: `M${matchNumber}`, roundNumber: 0, bracketSide: 'winners' }
}

/**
 * Generate D1 bracket templates (M1-M62) for 32 teams.
 * teamIds: array of 32 team registration IDs (already seeded 1-32).
 * @param divisionCount 1-4 (default 3). Controls which seedTargets are set on loser exits.
 */
export function generateD1Bracket(teamIds: string[], divisionCount: number = 3): DEGameTemplate[] {
  if (teamIds.length !== 32) {
    throw new Error(`D1 bracket requires exactly 32 teams, got ${teamIds.length}`)
  }

  const routing = buildD1RoutingTable(divisionCount)
  const games: DEGameTemplate[] = []

  // W1: 16 seeded games (M1-M16)
  for (let i = 0; i < 16; i++) {
    const m = i + 1
    const [seedA, seedB] = D1_SEEDING_PAIRS[i]
    const r = routing.get(m)!
    const ri = getRoundInfo(m)

    games.push({
      matchNumber: m,
      bracketSide: ri.bracketSide,
      roundLabel: ri.roundLabel,
      roundNumber: ri.roundNumber,
      homeTeamIndex: seedA - 1, // 0-indexed
      awayTeamIndex: seedB - 1,
      winnerGoesTo: r.winnerGoesTo ?? undefined,
      winnerSlot: r.winnerSlot,
      loserGoesTo: r.loserGoesTo ?? undefined,
      loserSlot: r.loserSlot,
      seedTarget: r.seedTarget,
    })
  }

  // Remaining games (M17-M62): no seeded teams, all TBD
  for (let m = 17; m <= 62; m++) {
    const r = routing.get(m)!
    const ri = getRoundInfo(m)

    games.push({
      matchNumber: m,
      bracketSide: ri.bracketSide,
      roundLabel: ri.roundLabel,
      roundNumber: ri.roundNumber,
      winnerGoesTo: r.winnerGoesTo ?? undefined,
      winnerSlot: r.winnerSlot,
      loserGoesTo: r.loserGoesTo ?? undefined,
      loserSlot: r.loserSlot,
      seedTarget: r.seedTarget,
    })
  }

  return games
}

// ==================== D3 (16-team) ====================

function getD3RoundInfo(matchNumber: number): { roundLabel: string; roundNumber: number; bracketSide: 'winners' | 'finals' } {
  const m = matchNumber
  if (m >= 63 && m <= 70) return { roundLabel: 'D3 R1', roundNumber: 1, bracketSide: 'winners' }
  if (m >= 71 && m <= 74) return { roundLabel: 'D3 R2', roundNumber: 2, bracketSide: 'winners' }
  if (m >= 75 && m <= 76) return { roundLabel: 'D3 Semi-Final', roundNumber: 3, bracketSide: 'finals' }
  if (m === 77) return { roundLabel: 'D3 Bronze', roundNumber: 4, bracketSide: 'finals' }
  if (m === 78) return { roundLabel: 'D3 Final', roundNumber: 5, bracketSide: 'finals' }
  return { roundLabel: `M${m}`, roundNumber: 0, bracketSide: 'winners' }
}

/**
 * Build D3 routing table (M63-M78) for 16-team single elimination
 */
function buildD3RoutingTable(): Map<number, RoutingEntry> {
  const rt = new Map<number, RoutingEntry>()

  // R1 (M63-M70) -> winners to R2 (M71-M74), losers ELIM
  for (let i = 0; i < 8; i++) {
    const m = 63 + i
    const r2Game = 71 + Math.floor(i / 2)
    rt.set(m, {
      winnerGoesTo: r2Game,
      winnerSlot: i % 2 === 0 ? 'home' : 'away',
      loserGoesTo: null,
      loserSlot: 'home',
    })
  }

  // R2 (M71-M74) -> winners to SF (M75-M76), losers ELIM
  for (let i = 0; i < 4; i++) {
    const m = 71 + i
    const sfGame = 75 + Math.floor(i / 2)
    rt.set(m, {
      winnerGoesTo: sfGame,
      winnerSlot: i % 2 === 0 ? 'home' : 'away',
      loserGoesTo: null,
      loserSlot: 'home',
    })
  }

  // SF (M75-M76) -> winners to Final (M78), losers to Bronze (M77)
  rt.set(75, { winnerGoesTo: 78, winnerSlot: 'home', loserGoesTo: 77, loserSlot: 'home' })
  rt.set(76, { winnerGoesTo: 78, winnerSlot: 'away', loserGoesTo: 77, loserSlot: 'away' })

  // Bronze (M77) -- terminal
  rt.set(77, { winnerGoesTo: null, winnerSlot: 'home', loserGoesTo: null, loserSlot: 'home' })
  // Final (M78) -- terminal
  rt.set(78, { winnerGoesTo: null, winnerSlot: 'home', loserGoesTo: null, loserSlot: 'home' })

  return rt
}

/**
 * Generate D3 bracket templates (M63-M78) for 16 teams.
 * teamIds: 16 team registration IDs seeded 1-16.
 * If teams aren't available yet (cross-division seeding), pass empty strings.
 */
export function generateD3Bracket(teamIds: string[]): DEGameTemplate[] {
  if (teamIds.length !== 16) {
    throw new Error(`D3 bracket requires exactly 16 teams, got ${teamIds.length}`)
  }

  const routing = buildD3RoutingTable()
  const games: DEGameTemplate[] = []

  // R1: 8 seeded matches (M63-M70)
  for (let i = 0; i < 8; i++) {
    const m = 63 + i
    const [seedA, seedB] = D3_SEEDING_PAIRS[i]
    const r = routing.get(m)!
    const ri = getD3RoundInfo(m)

    games.push({
      matchNumber: m,
      bracketSide: ri.bracketSide,
      roundLabel: ri.roundLabel,
      roundNumber: ri.roundNumber,
      homeTeamIndex: seedA - 1,
      awayTeamIndex: seedB - 1,
      winnerGoesTo: r.winnerGoesTo ?? undefined,
      winnerSlot: r.winnerSlot,
      loserGoesTo: r.loserGoesTo ?? undefined,
      loserSlot: r.loserSlot,
    })
  }

  // Remaining (M71-M78): TBD
  for (let m = 71; m <= 78; m++) {
    const r = routing.get(m)!
    const ri = getD3RoundInfo(m)

    games.push({
      matchNumber: m,
      bracketSide: ri.bracketSide,
      roundLabel: ri.roundLabel,
      roundNumber: ri.roundNumber,
      winnerGoesTo: r.winnerGoesTo ?? undefined,
      winnerSlot: r.winnerSlot,
      loserGoesTo: r.loserGoesTo ?? undefined,
      loserSlot: r.loserSlot,
    })
  }

  return games
}

// ==================== D3 (8-team, for 4-division mode) ====================

function getD3SmallRoundInfo(matchNumber: number): { roundLabel: string; roundNumber: number; bracketSide: 'winners' | 'finals' } {
  const m = matchNumber
  if (m >= 63 && m <= 66) return { roundLabel: 'D3 QF', roundNumber: 1, bracketSide: 'winners' }
  if (m >= 67 && m <= 68) return { roundLabel: 'D3 Semi-Final', roundNumber: 2, bracketSide: 'finals' }
  if (m === 69) return { roundLabel: 'D3 Bronze', roundNumber: 3, bracketSide: 'finals' }
  if (m === 70) return { roundLabel: 'D3 Final', roundNumber: 4, bracketSide: 'finals' }
  return { roundLabel: `M${m}`, roundNumber: 0, bracketSide: 'winners' }
}

/**
 * Build D3 small routing table for 8 teams (M63-M70)
 */
function buildD3SmallRoutingTable(): Map<number, RoutingEntry> {
  const rt = new Map<number, RoutingEntry>()

  // QF (M63-M66) -> winners to SF (M67-M68), losers ELIM
  for (let i = 0; i < 4; i++) {
    const m = 63 + i
    const sfGame = 67 + Math.floor(i / 2)
    rt.set(m, {
      winnerGoesTo: sfGame,
      winnerSlot: i % 2 === 0 ? 'home' : 'away',
      loserGoesTo: null,
      loserSlot: 'home',
    })
  }

  // SF (M67-M68) -> winners to Final (M70), losers to Bronze (M69)
  rt.set(67, { winnerGoesTo: 70, winnerSlot: 'home', loserGoesTo: 69, loserSlot: 'home' })
  rt.set(68, { winnerGoesTo: 70, winnerSlot: 'away', loserGoesTo: 69, loserSlot: 'away' })

  // Bronze (M69) -- terminal
  rt.set(69, { winnerGoesTo: null, winnerSlot: 'home', loserGoesTo: null, loserSlot: 'home' })
  // Final (M70) -- terminal
  rt.set(70, { winnerGoesTo: null, winnerSlot: 'home', loserGoesTo: null, loserSlot: 'home' })

  return rt
}

/**
 * Generate D3 bracket templates for 8 teams (M63-M70).
 * Used in 4-division mode where D3 only gets L2 losers (8 teams).
 * D3-small is an 8-team single elimination bracket (QF -> SF -> Final + Bronze).
 */
export function generateD3Bracket8(teamIds: string[]): DEGameTemplate[] {
  if (teamIds.length !== 8) {
    throw new Error(`D3 8-team bracket requires exactly 8 teams, got ${teamIds.length}`)
  }

  const routing = buildD3SmallRoutingTable()
  const games: DEGameTemplate[] = []

  // QF: 4 seeded matches (M63-M66)
  for (let i = 0; i < 4; i++) {
    const m = 63 + i
    const [seedA, seedB] = SE8_SEEDING_PAIRS[i]
    const r = routing.get(m)!
    const ri = getD3SmallRoundInfo(m)

    games.push({
      matchNumber: m,
      bracketSide: ri.bracketSide,
      roundLabel: ri.roundLabel,
      roundNumber: ri.roundNumber,
      homeTeamIndex: seedA - 1,
      awayTeamIndex: seedB - 1,
      winnerGoesTo: r.winnerGoesTo ?? undefined,
      winnerSlot: r.winnerSlot,
      loserGoesTo: r.loserGoesTo ?? undefined,
      loserSlot: r.loserSlot,
    })
  }

  // Remaining (M67-M70): TBD
  for (let m = 67; m <= 70; m++) {
    const r = routing.get(m)!
    const ri = getD3SmallRoundInfo(m)

    games.push({
      matchNumber: m,
      bracketSide: ri.bracketSide,
      roundLabel: ri.roundLabel,
      roundNumber: ri.roundNumber,
      winnerGoesTo: r.winnerGoesTo ?? undefined,
      winnerSlot: r.winnerSlot,
      loserGoesTo: r.loserGoesTo ?? undefined,
      loserSlot: r.loserSlot,
    })
  }

  return games
}

// ==================== D2 ====================

function getD2RoundInfo(matchNumber: number): { roundLabel: string; roundNumber: number; bracketSide: 'winners' | 'losers' | 'finals' } {
  const m = matchNumber
  if (m >= 79 && m <= 82) return { roundLabel: 'D2 W1', roundNumber: 1, bracketSide: 'winners' }
  if (m >= 83 && m <= 84) return { roundLabel: 'D2 W2', roundNumber: 2, bracketSide: 'winners' }
  if (m >= 85 && m <= 86) return { roundLabel: 'D2 L1', roundNumber: 1, bracketSide: 'losers' }
  if (m >= 87 && m <= 88) return { roundLabel: 'D2 L2', roundNumber: 2, bracketSide: 'losers' }
  if (m === 89) return { roundLabel: 'D2 Semi-Final 1', roundNumber: 1, bracketSide: 'finals' }
  if (m === 90) return { roundLabel: 'D2 Semi-Final 2', roundNumber: 1, bracketSide: 'finals' }
  if (m === 91) return { roundLabel: 'D2 Bronze', roundNumber: 2, bracketSide: 'finals' }
  if (m === 92) return { roundLabel: 'D2 Final', roundNumber: 3, bracketSide: 'finals' }
  return { roundLabel: `M${m}`, roundNumber: 0, bracketSide: 'winners' }
}

/**
 * Build D2 routing table (M79-M92)
 */
function buildD2RoutingTable(): Map<number, RoutingEntry> {
  const rt = new Map<number, RoutingEntry>()

  // W1 (M79-M82) -> winners to W2 (M83-M84), losers to L1 (M85-M86)
  for (let i = 0; i < 4; i++) {
    const m = 79 + i
    const w2Game = 83 + Math.floor(i / 2)
    const l1Game = 85 + Math.floor(i / 2)
    rt.set(m, {
      winnerGoesTo: w2Game,
      winnerSlot: i % 2 === 0 ? 'home' : 'away',
      loserGoesTo: l1Game,
      loserSlot: i % 2 === 0 ? 'home' : 'away',
    })
  }

  // W2 (M83-M84) -> winners to SF (M89-M90), losers to L2 (M87-M88)
  rt.set(83, { winnerGoesTo: 89, winnerSlot: 'home', loserGoesTo: 87, loserSlot: 'away' })
  rt.set(84, { winnerGoesTo: 90, winnerSlot: 'home', loserGoesTo: 88, loserSlot: 'away' })

  // L1 (M85-M86) -> winners to L2 (M87-M88), losers ELIM
  rt.set(85, { winnerGoesTo: 87, winnerSlot: 'home', loserGoesTo: null, loserSlot: 'home' })
  rt.set(86, { winnerGoesTo: 88, winnerSlot: 'home', loserGoesTo: null, loserSlot: 'home' })

  // L2 (M87-M88) -> winners to SF (M89-M90), losers ELIM
  rt.set(87, { winnerGoesTo: 89, winnerSlot: 'away', loserGoesTo: null, loserSlot: 'home' })
  rt.set(88, { winnerGoesTo: 90, winnerSlot: 'away', loserGoesTo: null, loserSlot: 'home' })

  // SF (M89-M90) -> winners to Final (M92), losers to Bronze (M91)
  rt.set(89, { winnerGoesTo: 92, winnerSlot: 'home', loserGoesTo: 91, loserSlot: 'home' })
  rt.set(90, { winnerGoesTo: 92, winnerSlot: 'away', loserGoesTo: 91, loserSlot: 'away' })

  // Bronze (M91) -- terminal
  rt.set(91, { winnerGoesTo: null, winnerSlot: 'home', loserGoesTo: null, loserSlot: 'home' })
  // Final (M92) -- terminal
  rt.set(92, { winnerGoesTo: null, winnerSlot: 'home', loserGoesTo: null, loserSlot: 'home' })

  return rt
}

/**
 * Generate D2 bracket templates (M79-M92) for 8 teams.
 * teamIds: 8 team registration IDs seeded 1-8.
 */
export function generateD2Bracket(teamIds: string[]): DEGameTemplate[] {
  if (teamIds.length !== 8) {
    throw new Error(`D2 bracket requires exactly 8 teams, got ${teamIds.length}`)
  }

  const routing = buildD2RoutingTable()
  const games: DEGameTemplate[] = []

  // W1: 4 seeded matches (M79-M82)
  for (let i = 0; i < 4; i++) {
    const m = 79 + i
    const [seedA, seedB] = D2_SEEDING_PAIRS[i]
    const r = routing.get(m)!
    const ri = getD2RoundInfo(m)

    games.push({
      matchNumber: m,
      bracketSide: ri.bracketSide,
      roundLabel: ri.roundLabel,
      roundNumber: ri.roundNumber,
      homeTeamIndex: seedA - 1,
      awayTeamIndex: seedB - 1,
      winnerGoesTo: r.winnerGoesTo ?? undefined,
      winnerSlot: r.winnerSlot,
      loserGoesTo: r.loserGoesTo ?? undefined,
      loserSlot: r.loserSlot,
    })
  }

  // Remaining (M83-M92): TBD
  for (let m = 83; m <= 92; m++) {
    const r = routing.get(m)!
    const ri = getD2RoundInfo(m)

    games.push({
      matchNumber: m,
      bracketSide: ri.bracketSide,
      roundLabel: ri.roundLabel,
      roundNumber: ri.roundNumber,
      winnerGoesTo: r.winnerGoesTo ?? undefined,
      winnerSlot: r.winnerSlot,
      loserGoesTo: r.loserGoesTo ?? undefined,
      loserSlot: r.loserSlot,
    })
  }

  return games
}

// ==================== D4 ====================

function getD4RoundInfo(matchNumber: number): { roundLabel: string; roundNumber: number; bracketSide: 'winners' | 'finals' } {
  const m = matchNumber
  if (m >= 93 && m <= 96) return { roundLabel: 'D4 QF', roundNumber: 1, bracketSide: 'winners' }
  if (m >= 97 && m <= 98) return { roundLabel: 'D4 Semi-Final', roundNumber: 2, bracketSide: 'finals' }
  if (m === 99) return { roundLabel: 'D4 Bronze', roundNumber: 3, bracketSide: 'finals' }
  if (m === 100) return { roundLabel: 'D4 Final', roundNumber: 4, bracketSide: 'finals' }
  return { roundLabel: `M${m}`, roundNumber: 0, bracketSide: 'winners' }
}

/**
 * Build D4 routing table (M93-M100) for 8-team single elimination
 */
function buildD4RoutingTable(): Map<number, RoutingEntry> {
  const rt = new Map<number, RoutingEntry>()

  // QF (M93-M96) -> winners to SF (M97-M98), losers ELIM
  for (let i = 0; i < 4; i++) {
    const m = 93 + i
    const sfGame = 97 + Math.floor(i / 2)
    rt.set(m, {
      winnerGoesTo: sfGame,
      winnerSlot: i % 2 === 0 ? 'home' : 'away',
      loserGoesTo: null,
      loserSlot: 'home',
    })
  }

  // SF (M97-M98) -> winners to Final (M100), losers to Bronze (M99)
  rt.set(97, { winnerGoesTo: 100, winnerSlot: 'home', loserGoesTo: 99, loserSlot: 'home' })
  rt.set(98, { winnerGoesTo: 100, winnerSlot: 'away', loserGoesTo: 99, loserSlot: 'away' })

  // Bronze (M99) -- terminal
  rt.set(99, { winnerGoesTo: null, winnerSlot: 'home', loserGoesTo: null, loserSlot: 'home' })
  // Final (M100) -- terminal
  rt.set(100, { winnerGoesTo: null, winnerSlot: 'home', loserGoesTo: null, loserSlot: 'home' })

  return rt
}

/**
 * Generate D4 bracket templates (M93-M100) for 8 teams.
 * teamIds: 8 team registration IDs seeded 1-8.
 * D4 is an 8-team single elimination bracket (QF -> SF -> Final + Bronze).
 * If teams aren't available yet (cross-division seeding), pass empty strings.
 */
export function generateD4Bracket(teamIds: string[]): DEGameTemplate[] {
  if (teamIds.length !== 8) {
    throw new Error(`D4 bracket requires exactly 8 teams, got ${teamIds.length}`)
  }

  const routing = buildD4RoutingTable()
  const games: DEGameTemplate[] = []

  // QF: 4 seeded matches (M93-M96)
  for (let i = 0; i < 4; i++) {
    const m = 93 + i
    const [seedA, seedB] = SE8_SEEDING_PAIRS[i]
    const r = routing.get(m)!
    const ri = getD4RoundInfo(m)

    games.push({
      matchNumber: m,
      bracketSide: ri.bracketSide,
      roundLabel: ri.roundLabel,
      roundNumber: ri.roundNumber,
      homeTeamIndex: seedA - 1,
      awayTeamIndex: seedB - 1,
      winnerGoesTo: r.winnerGoesTo ?? undefined,
      winnerSlot: r.winnerSlot,
      loserGoesTo: r.loserGoesTo ?? undefined,
      loserSlot: r.loserSlot,
    })
  }

  // Remaining (M97-M100): TBD
  for (let m = 97; m <= 100; m++) {
    const r = routing.get(m)!
    const ri = getD4RoundInfo(m)

    games.push({
      matchNumber: m,
      bracketSide: ri.bracketSide,
      roundLabel: ri.roundLabel,
      roundNumber: ri.roundNumber,
      winnerGoesTo: r.winnerGoesTo ?? undefined,
      winnerSlot: r.winnerSlot,
      loserGoesTo: r.loserGoesTo ?? undefined,
      loserSlot: r.loserSlot,
    })
  }

  return games
}

// ==================== Shared Utilities ====================

/**
 * Given a list of DEGameTemplates and an array of teamIds (in seed order),
 * resolve the team registration IDs for each seeded game.
 * Returns a map of matchNumber -> { homeTeamRegId, awayTeamRegId }.
 */
export function resolveTeamAssignments(
  templates: DEGameTemplate[],
  teamIds: string[]
): Map<number, { homeTeamRegId: string | null; awayTeamRegId: string | null }> {
  const result = new Map<number, { homeTeamRegId: string | null; awayTeamRegId: string | null }>()

  for (const t of templates) {
    const home = t.homeTeamIndex != null ? (teamIds[t.homeTeamIndex] || null) : null
    const away = t.awayTeamIndex != null ? (teamIds[t.awayTeamIndex] || null) : null
    result.set(t.matchNumber, { homeTeamRegId: home, awayTeamRegId: away })
  }

  return result
}

/**
 * Collect unique round labels from templates, maintaining bracket order.
 * Returns array of { roundLabel, roundNumber, bracketSide }.
 */
export function collectRounds(templates: DEGameTemplate[]): Array<{
  roundLabel: string
  roundNumber: number
  bracketSide: 'winners' | 'losers' | 'finals'
}> {
  const seen = new Set<string>()
  const rounds: Array<{ roundLabel: string; roundNumber: number; bracketSide: 'winners' | 'losers' | 'finals' }> = []

  for (const t of templates) {
    const key = `${t.bracketSide}:${t.roundLabel}`
    if (!seen.has(key)) {
      seen.add(key)
      rounds.push({
        roundLabel: t.roundLabel,
        roundNumber: t.roundNumber,
        bracketSide: t.bracketSide,
      })
    }
  }

  return rounds
}
