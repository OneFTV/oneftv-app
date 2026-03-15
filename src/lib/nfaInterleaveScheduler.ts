/**
 * NFA Inter-Division Scheduling Algorithm
 *
 * Implements the interleaved scheduling order across NFA cascade divisions
 * (D1/D2/D3 for 3-division, D1/D2/D3/D4 for 4-division).
 *
 * The interleave order ensures:
 * - Dependency ordering: games that feed into later rounds are scheduled first
 * - Court utilization: games are assigned to the earliest available court
 * - BARRIERs: synchronize all courts before scheduling critical late-bracket games
 * - Finals order: division finals are scheduled last, lowest division first
 *   (D3 Final -> D2 Final -> D1 Final for 3-div;
 *    D4 Final -> D3 Final -> D2 Final -> D1 Final for 4-div)
 *
 * Ported from the reference HTML implementations:
 * - bracket-test.html (3-division variant)
 * - bracket-test4.html (4-division variant)
 */

import { prisma } from '@/shared/database/prisma'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface InterleaveConfig {
  tournamentId: string
  numCourts: number
  slotMinutes: number
  startHour: number // e.g., 9 for 9:00 AM
  divisionCount: 3 | 4
}

export interface ScheduledMatch {
  gameId: string
  courtNumber: number
  scheduledTime: Date
  displayMatchNumber: number
}

// ---------------------------------------------------------------------------
// Interleave step definitions
// ---------------------------------------------------------------------------

/**
 * A step is either an array of (division, roundLabel) pairs to schedule,
 * or the literal string 'BARRIER' which synchronizes all courts.
 */
type InterleaveStep = Array<{ division: string; roundLabel: string }> | 'BARRIER'

/**
 * 3-division interleave steps.
 * Ported from bracket-test.html, lines 604-632.
 *
 * Each step identifies a batch of games by their division + roundLabel.
 * The scheduler fetches all games for that (category, round) and schedules
 * them onto the earliest available courts.
 */
function get3DivInterleaveSteps(): InterleaveStep[] {
  return [
    /* 1  D1 W1          */ rr('D1', 'W1'),
    /* 2  D1 L1          */ rr('D1', 'L1'),
    /* 3  D1 W2          */ rr('D1', 'W2'),
    /* 4  D1 L2          */ rr('D1', 'L2'),
    /* 5  D1 W3          */ rr('D1', 'W3'),
    /* 6  D1 L3          */ rr('D1', 'L3'),
    /* 7  D1 L4          */ rr('D1', 'L4'),
    /* 8  D3 W1          */ rr('D3', 'D3 R1'),
    /* 9  D1 W4          */ rr('D1', 'W4'),
    /* 10 D3 W2          */ rr('D3', 'D3 R2'),
    /* 11 D1 L5          */ rr('D1', 'L5'),
    /* 12 D2 W1          */ rr('D2', 'D2 W1'),
    /* 13 D1 L6          */ rr('D1', 'L6'),
    /* 14 D3 SF          */ rr('D3', 'D3 Semi-Final'),
    /* 15 D2 W2 + D2 L1  */ [...rr('D2', 'D2 W2'), ...rr('D2', 'D2 L1')],
    /* 16 D2 L2          */ rr('D2', 'D2 L2'),
    'BARRIER',
    /* 17 D2 SF          */ [...rr('D2', 'D2 Semi-Final 1'), ...rr('D2', 'D2 Semi-Final 2')],
    'BARRIER',
    /* 18 D1 SF + D3 3rd */ [...rr('D1', 'Semi-Final 1'), ...rr('D1', 'Semi-Final 2'), ...rr('D3', 'D3 Bronze')],
    'BARRIER',
    /* 19 D2 3rd + D1 3rd*/ [...rr('D2', 'D2 Bronze'), ...rr('D1', 'Bronze')],
    /* 20 D3 Final       */ rr('D3', 'D3 Final'),
    'BARRIER',
    /* 21 D2 Final       */ rr('D2', 'D2 Final'),
    'BARRIER',
    /* 22 D1 Final       */ rr('D1', 'Final'),
  ]
}

/**
 * 4-division interleave steps.
 * Ported from bracket-test4.html, lines 528-559.
 *
 * In 4-div mode:
 * - D4 (8 teams from D1 L1 losers): single elim, rounds = D4 QF, D4 Semi-Final, D4 Bronze, D4 Final
 * - D3 (8 teams from D1 L2 losers): single elim, rounds = D3 QF, D3 Semi-Final, D3 Bronze, D3 Final
 * - D2 (8 teams from D1 L3/L4 losers): double elim, rounds = D2 W1, D2 W2, D2 L1, D2 L2, D2 Semi-Final 1/2, D2 Bronze, D2 Final
 * - D1 (32 teams): double elim, rounds = W1-W4, L1-L6, Semi-Final 1/2, Bronze, Final
 */
function get4DivInterleaveSteps(): InterleaveStep[] {
  return [
    /* 1  D1 W1          */ rr('D1', 'W1'),
    /* 2  D1 L1          */ rr('D1', 'L1'),
    /* 3  D1 W2          */ rr('D1', 'W2'),
    /* 4  D1 L2          */ rr('D1', 'L2'),
    /* 5  D1 W3          */ rr('D1', 'W3'),
    /* 6  D1 L3          */ rr('D1', 'L3'),
    /* 7  D1 L4          */ rr('D1', 'L4'),
    /* 8  D4 QF          */ rr('D4', 'D4 QF'),
    /* 9  D1 W4          */ rr('D1', 'W4'),
    /* 10 D3 QF          */ rr('D3', 'D3 QF'),
    /* 11 D4 SF          */ rr('D4', 'D4 Semi-Final'),
    /* 12 D1 L5          */ rr('D1', 'L5'),
    /* 13 D2 W1          */ rr('D2', 'D2 W1'),
    /* 14 D3 SF          */ rr('D3', 'D3 Semi-Final'),
    /* 15 D1 L6          */ rr('D1', 'L6'),
    /* 16 D2 W2 + D2 L1  */ [...rr('D2', 'D2 W2'), ...rr('D2', 'D2 L1')],
    /* 17 D2 L2          */ rr('D2', 'D2 L2'),
    'BARRIER',
    /* 18 D2 SF          */ [...rr('D2', 'D2 Semi-Final 1'), ...rr('D2', 'D2 Semi-Final 2')],
    'BARRIER',
    /* 19 D1 SF + D4 3rd */ [...rr('D1', 'Semi-Final 1'), ...rr('D1', 'Semi-Final 2'), ...rr('D4', 'D4 Bronze')],
    'BARRIER',
    /* 20 3rd place games */ [...rr('D3', 'D3 Bronze'), ...rr('D2', 'D2 Bronze'), ...rr('D1', 'Bronze')],
    /* 21 D4 Final       */ rr('D4', 'D4 Final'),
    'BARRIER',
    /* 22 D3 Final       */ rr('D3', 'D3 Final'),
    'BARRIER',
    /* 23 D2 Final       */ rr('D2', 'D2 Final'),
    'BARRIER',
    /* 24 D1 Final       */ rr('D1', 'Final'),
  ]
}

/** Helper: create a single-entry step array for one (division, roundLabel) */
function rr(division: string, roundLabel: string): Array<{ division: string; roundLabel: string }> {
  return [{ division, roundLabel }]
}

// ---------------------------------------------------------------------------
// Main scheduling function
// ---------------------------------------------------------------------------

/**
 * Schedule all NFA division games in interleaved order.
 *
 * 1. Fetch all games across all NFA division categories (categories with divisionLabel D1/D2/D3/D4)
 * 2. Build the interleave step array based on divisionCount
 * 3. For each step, assign games to the earliest available court
 * 4. Handle BARRIERs (sync all courts to the maximum time of all courts)
 * 5. After scheduling, sort all games by (time, courtNumber) and assign unified displayMatchNumber (M1, M2, ... M92)
 * 6. Update the database: set scheduledTime, courtNumber, and displayMatchNumber on each game
 * 7. Return the scheduled matches
 */
export async function scheduleNFAInterleave(config: InterleaveConfig): Promise<ScheduledMatch[]> {
  const { tournamentId, numCourts, slotMinutes, startHour, divisionCount } = config

  // ── Step 0: Fetch tournament date for scheduling base ──
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { date: true },
  })
  const tournamentDate = tournament?.date ?? undefined

  // ── Step 1: Fetch all division categories for this tournament ──
  const divisionLabels = divisionCount === 4
    ? ['D1', 'D2', 'D3', 'D4']
    : ['D1', 'D2', 'D3']

  const categories = await prisma.category.findMany({
    where: {
      tournamentId,
      divisionLabel: { in: divisionLabels },
    },
    select: {
      id: true,
      divisionLabel: true,
    },
  })

  if (categories.length === 0) {
    throw new Error(`No NFA division categories found for tournament ${tournamentId}`)
  }

  // Map divisionLabel → categoryId
  const divisionToCategoryId = new Map<string, string>()
  for (const cat of categories) {
    if (cat.divisionLabel) {
      divisionToCategoryId.set(cat.divisionLabel, cat.id)
    }
  }

  // ── Step 2: Fetch all games with their rounds and player IDs ──
  const categoryIds = categories.map((c) => c.id)

  const allGames = await prisma.game.findMany({
    where: {
      tournamentId,
      categoryId: { in: categoryIds },
    },
    select: {
      id: true,
      matchNumber: true,
      categoryId: true,
      roundId: true,
      player1HomeId: true,
      player2HomeId: true,
      player1AwayId: true,
      player2AwayId: true,
      Round: {
        select: {
          id: true,
          name: true,
          bracketSide: true,
        },
      },
    },
  })

  // Fetch team registrations for seed lookups
  const teamRegs = await prisma.teamRegistration.findMany({
    where: { categoryId: { in: categoryIds } },
    select: { id: true, seed: true, player1Id: true, player2Id: true, categoryId: true },
  })

  // Map player1Id → seed (within category) for seed lookups
  const playerSeedMap = new Map<string, number>()
  for (const reg of teamRegs) {
    if (reg.seed != null) {
      playerSeedMap.set(`${reg.categoryId}::${reg.player1Id}`, reg.seed)
      if (reg.player2Id) playerSeedMap.set(`${reg.categoryId}::${reg.player2Id}`, reg.seed)
    }
  }

  if (allGames.length === 0) {
    throw new Error('No games found across division categories')
  }

  // Build lookup: (divisionLabel, roundLabel) → game refs (sorted by matchNumber)
  type GameRef = {
    gameId: string
    matchNumber: number | null
    division: string
    roundLabel: string
    bestSeed: number  // lowest (best) seed among the teams in this game
  }

  // Helper: get all player IDs for a game (for rest time checks)
  function getGamePlayers(gameId: string): string[] {
    const game = allGames.find(g => g.id === gameId)
    if (!game) return []
    const players: string[] = []
    if (game.player1HomeId) players.push(game.player1HomeId)
    if (game.player2HomeId) players.push(game.player2HomeId)
    if (game.player1AwayId) players.push(game.player1AwayId)
    if (game.player2AwayId) players.push(game.player2AwayId)
    return players
  }

  // Helper: get best (lowest) seed for a game
  function getGameBestSeed(game: typeof allGames[0]): number {
    let best = 999
    const catId = game.categoryId
    if (!catId) return best
    for (const pid of [game.player1HomeId, game.player1AwayId]) {
      if (!pid) continue
      const seed = playerSeedMap.get(`${catId}::${pid}`)
      if (seed != null && seed < best) best = seed
    }
    return best
  }

  const gamesByDivisionRound = new Map<string, GameRef[]>()

  for (const game of allGames) {
    if (!game.Round || !game.categoryId) continue
    const cat = categories.find((c) => c.id === game.categoryId)
    if (!cat || !cat.divisionLabel) continue

    const key = `${cat.divisionLabel}::${game.Round.name}`
    if (!gamesByDivisionRound.has(key)) {
      gamesByDivisionRound.set(key, [])
    }
    gamesByDivisionRound.get(key)!.push({
      gameId: game.id,
      matchNumber: game.matchNumber,
      division: cat.divisionLabel,
      roundLabel: game.Round.name,
      bestSeed: getGameBestSeed(game),
    })
  }

  // Sort each round's games by matchNumber for consistent ordering
  for (const [, games] of gamesByDivisionRound) {
    games.sort((a, b) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0))
  }

  // ── Req 2: For D1 W1, re-sort so worst seeds (highest seed numbers) play first ──
  const d1W1Key = 'D1::W1'
  const d1W1Games = gamesByDivisionRound.get(d1W1Key)
  if (d1W1Games) {
    // Sort descending by bestSeed: worst seeds first, top seeds last
    d1W1Games.sort((a, b) => b.bestSeed - a.bestSeed)
  }

  // ── Step 3: Build the interleave step array ──
  const steps = divisionCount === 4
    ? get4DivInterleaveSteps()
    : get3DivInterleaveSteps()

  // ── Step 4: Schedule games following the interleave order ──
  // Court availability tracker: minutes from midnight for each court
  const courtNext = new Array(numCourts).fill(startHour * 60)

  // Req 1: Track when each player last played (minutes from midnight)
  const playerLastTime = new Map<string, number>()

  // Track scheduled games with their time and court assignment
  interface ScheduleEntry {
    gameId: string
    courtNumber: number
    timeMinutes: number
  }

  const scheduled: ScheduleEntry[] = []

  for (const step of steps) {
    if (step === 'BARRIER') {
      // Synchronize all courts to the latest time
      const maxTime = Math.max(...courtNext)
      courtNext.fill(maxTime)
      continue
    }

    // Collect all game refs for this step in order
    const stepGames: GameRef[] = []

    for (const { division, roundLabel } of step) {
      const key = `${division}::${roundLabel}`
      const games = gamesByDivisionRound.get(key)
      if (games) {
        for (const g of games) {
          stepGames.push(g)
        }
      }
    }

    // Req 6: Within each step, prioritize games whose players have been waiting longest
    // (max 2 slots / 40min idle). Sort so "coldest" players go first.
    const maxWaitSlots = 2
    const currentMinTime = Math.min(...courtNext)
    stepGames.sort((a, b) => {
      const aPlayers = getGamePlayers(a.gameId)
      const bPlayers = getGamePlayers(b.gameId)
      // Get the oldest (smallest) lastTime among each game's players
      const aLastTime = aPlayers.reduce((min, p) => {
        const t = playerLastTime.get(p)
        return t != null && t < min ? t : min
      }, Infinity)
      const bLastTime = bPlayers.reduce((min, p) => {
        const t = playerLastTime.get(p)
        return t != null && t < min ? t : min
      }, Infinity)
      // Games with players who haven't played yet (Infinity) keep original order
      if (aLastTime === Infinity && bLastTime === Infinity) return 0
      if (aLastTime === Infinity) return 1  // b has been waiting, prioritize b
      if (bLastTime === Infinity) return -1 // a has been waiting, prioritize a
      // Prioritize the game whose players have been waiting longer (lower lastTime = longer wait)
      // But only reorder if someone is at risk of exceeding maxWaitSlots
      const aWait = currentMinTime - aLastTime
      const bWait = currentMinTime - bLastTime
      const aUrgent = aWait >= maxWaitSlots * slotMinutes
      const bUrgent = bWait >= maxWaitSlots * slotMinutes
      if (aUrgent && !bUrgent) return -1
      if (!aUrgent && bUrgent) return 1
      if (aUrgent && bUrgent) return aLastTime - bLastTime // longest wait first
      return 0 // preserve original order if neither is urgent
    })

    // Assign each game to the earliest available court, respecting rest and court preferences
    for (const gameRef of stepGames) {
      const gamePlayers = getGamePlayers(gameRef.gameId)

      // Find the latest time any of this game's players last played
      let playerEarliestStart = 0
      for (const playerId of gamePlayers) {
        const lastTime = playerLastTime.get(playerId)
        if (lastTime != null) {
          // Need at least 1 slot (slotMinutes) rest after their last game
          const earliest = lastTime + slotMinutes
          if (earliest > playerEarliestStart) playerEarliestStart = earliest
        }
      }

      // Req 3: D1 top seeds (seed 1-8) prefer court 1 (index 0)
      const isD1TopSeed = gameRef.division === 'D1' && gameRef.bestSeed <= 8

      // Find the best court considering rest time and court preference
      let bestCourt = -1
      let bestTime = Infinity

      for (let c = 0; c < numCourts; c++) {
        const courtTime = Math.max(courtNext[c], playerEarliestStart)
        // Prefer court 0 (court 1) for D1 top seeds when times are equal
        if (courtTime < bestTime || (courtTime === bestTime && isD1TopSeed && c === 0)) {
          bestTime = courtTime
          bestCourt = c
        }
      }

      // If rest time pushes beyond what a non-rest slot would be, check if it's reasonable
      // Don't enforce rest if it would delay the tournament excessively (>2 extra slots)
      const noRestBestTime = Math.min(...courtNext)
      if (bestTime > noRestBestTime + slotMinutes * 2) {
        // Fallback: skip rest enforcement, use earliest court
        bestCourt = 0
        for (let c = 1; c < numCourts; c++) {
          if (courtNext[c] < courtNext[bestCourt]) bestCourt = c
        }
        bestTime = courtNext[bestCourt]
      }

      const timeMinutes = bestTime
      const courtNumber = bestCourt + 1 // 1-indexed

      scheduled.push({
        gameId: gameRef.gameId,
        courtNumber,
        timeMinutes,
      })

      // Update court availability
      courtNext[bestCourt] = timeMinutes + slotMinutes

      // Update player last play times
      for (const playerId of gamePlayers) {
        playerLastTime.set(playerId, timeMinutes)
      }
    }
  }

  // ── Step 5: Sort by (time, courtNumber) and assign display match numbers ──
  scheduled.sort((a, b) => {
    if (a.timeMinutes !== b.timeMinutes) return a.timeMinutes - b.timeMinutes
    return a.courtNumber - b.courtNumber
  })

  const results: ScheduledMatch[] = scheduled.map((entry, index) => ({
    gameId: entry.gameId,
    courtNumber: entry.courtNumber,
    scheduledTime: minutesToDate(entry.timeMinutes, tournamentDate),
    displayMatchNumber: index + 1, // M1, M2, ... Mn
  }))

  // ── Step 6: Update database ──
  // Use a transaction to update all games atomically
  await prisma.$transaction(
    results.map((r) =>
      prisma.game.update({
        where: { id: r.gameId },
        data: {
          scheduledTime: r.scheduledTime,
          courtNumber: r.courtNumber,
          displayMatchNumber: r.displayMatchNumber,
        },
      })
    )
  )

  return results
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/**
 * Convert minutes from midnight into a Date object.
 * Uses the provided base date (tournament date) or today as fallback.
 */
function minutesToDate(minutes: number, baseDate?: Date): Date {
  const date = baseDate ? new Date(baseDate) : new Date()
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return date
}

/**
 * Format a display match number for user-facing labels.
 * e.g., 1 → "M1", 42 → "M42"
 */
export function formatMatchNumber(num: number): string {
  return `M${num}`
}

/**
 * Get a summary of the schedule: total games, time range, courts used.
 */
export function getScheduleSummary(matches: ScheduledMatch[]): {
  totalGames: number
  firstGameTime: Date | null
  lastGameTime: Date | null
  courtsUsed: number[]
} {
  if (matches.length === 0) {
    return { totalGames: 0, firstGameTime: null, lastGameTime: null, courtsUsed: [] }
  }

  const sorted = [...matches].sort(
    (a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime()
  )

  const courtsUsed = [...new Set(matches.map((m) => m.courtNumber))].sort((a, b) => a - b)

  return {
    totalGames: matches.length,
    firstGameTime: sorted[0].scheduledTime,
    lastGameTime: sorted[sorted.length - 1].scheduledTime,
    courtsUsed,
  }
}

// ---------------------------------------------------------------------------
// Dry-run variant (no database writes)
// ---------------------------------------------------------------------------

/**
 * Preview the schedule without writing to the database.
 * Useful for displaying a schedule preview before committing.
 */
export async function previewNFAInterleave(config: InterleaveConfig): Promise<ScheduledMatch[]> {
  const { tournamentId, numCourts, slotMinutes, startHour, divisionCount } = config

  // Fetch tournament date for scheduling base
  const previewTournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { date: true },
  })
  const previewTournamentDate = previewTournament?.date ?? undefined

  // Fetch categories
  const divisionLabels = divisionCount === 4
    ? ['D1', 'D2', 'D3', 'D4']
    : ['D1', 'D2', 'D3']

  const categories = await prisma.category.findMany({
    where: {
      tournamentId,
      divisionLabel: { in: divisionLabels },
    },
    select: {
      id: true,
      divisionLabel: true,
    },
  })

  if (categories.length === 0) {
    throw new Error(`No NFA division categories found for tournament ${tournamentId}`)
  }

  const categoryIds = categories.map((c) => c.id)

  const allGames = await prisma.game.findMany({
    where: {
      tournamentId,
      categoryId: { in: categoryIds },
    },
    select: {
      id: true,
      matchNumber: true,
      categoryId: true,
      roundId: true,
      player1HomeId: true,
      player2HomeId: true,
      player1AwayId: true,
      player2AwayId: true,
      Round: {
        select: {
          id: true,
          name: true,
          bracketSide: true,
        },
      },
    },
  })

  if (allGames.length === 0) {
    throw new Error('No games found across division categories')
  }

  // Fetch team registrations for seed lookups
  const pTeamRegs = await prisma.teamRegistration.findMany({
    where: { categoryId: { in: categoryIds } },
    select: { id: true, seed: true, player1Id: true, player2Id: true, categoryId: true },
  })
  const pPlayerSeedMap = new Map<string, number>()
  for (const reg of pTeamRegs) {
    if (reg.seed != null) {
      pPlayerSeedMap.set(`${reg.categoryId}::${reg.player1Id}`, reg.seed)
      if (reg.player2Id) pPlayerSeedMap.set(`${reg.categoryId}::${reg.player2Id}`, reg.seed)
    }
  }

  function getPreviewGamePlayers(gameId: string): string[] {
    const game = allGames.find(g => g.id === gameId)
    if (!game) return []
    const players: string[] = []
    if (game.player1HomeId) players.push(game.player1HomeId)
    if (game.player2HomeId) players.push(game.player2HomeId)
    if (game.player1AwayId) players.push(game.player1AwayId)
    if (game.player2AwayId) players.push(game.player2AwayId)
    return players
  }

  function getPreviewBestSeed(game: typeof allGames[0]): number {
    let best = 999
    const catId = game.categoryId
    if (!catId) return best
    for (const pid of [game.player1HomeId, game.player1AwayId]) {
      if (!pid) continue
      const seed = pPlayerSeedMap.get(`${catId}::${pid}`)
      if (seed != null && seed < best) best = seed
    }
    return best
  }

  // Build lookup
  type PreviewGameRef = { gameId: string; matchNumber: number | null; division: string; roundLabel: string; bestSeed: number }
  const gamesByDivisionRound = new Map<string, PreviewGameRef[]>()

  for (const game of allGames) {
    if (!game.Round || !game.categoryId) continue
    const cat = categories.find((c) => c.id === game.categoryId)
    if (!cat || !cat.divisionLabel) continue

    const key = `${cat.divisionLabel}::${game.Round.name}`
    if (!gamesByDivisionRound.has(key)) {
      gamesByDivisionRound.set(key, [])
    }
    gamesByDivisionRound.get(key)!.push({
      gameId: game.id,
      matchNumber: game.matchNumber,
      division: cat.divisionLabel,
      roundLabel: game.Round.name,
      bestSeed: getPreviewBestSeed(game),
    })
  }

  for (const [, games] of gamesByDivisionRound) {
    games.sort((a, b) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0))
  }

  // Req 2: D1 W1 worst seeds first
  const d1W1Key = 'D1::W1'
  const d1W1Games = gamesByDivisionRound.get(d1W1Key)
  if (d1W1Games) {
    d1W1Games.sort((a, b) => b.bestSeed - a.bestSeed)
  }

  // Schedule
  const steps = divisionCount === 4
    ? get4DivInterleaveSteps()
    : get3DivInterleaveSteps()

  const courtNext = new Array(numCourts).fill(startHour * 60)
  const playerLastTime = new Map<string, number>()

  interface ScheduleEntry {
    gameId: string
    courtNumber: number
    timeMinutes: number
  }

  const scheduled: ScheduleEntry[] = []

  for (const step of steps) {
    if (step === 'BARRIER') {
      const maxTime = Math.max(...courtNext)
      courtNext.fill(maxTime)
      continue
    }

    const stepGames: PreviewGameRef[] = []
    for (const { division, roundLabel } of step) {
      const key = `${division}::${roundLabel}`
      const games = gamesByDivisionRound.get(key)
      if (games) {
        for (const g of games) {
          stepGames.push(g)
        }
      }
    }

    // Req 6: Prioritize games whose players have been waiting longest
    const pCurrentMinTime = Math.min(...courtNext)
    const pMaxWaitSlots = 2
    stepGames.sort((a, b) => {
      const aPlayers = getPreviewGamePlayers(a.gameId)
      const bPlayers = getPreviewGamePlayers(b.gameId)
      const aLastTime = aPlayers.reduce((min, p) => {
        const t = playerLastTime.get(p)
        return t != null && t < min ? t : min
      }, Infinity)
      const bLastTime = bPlayers.reduce((min, p) => {
        const t = playerLastTime.get(p)
        return t != null && t < min ? t : min
      }, Infinity)
      if (aLastTime === Infinity && bLastTime === Infinity) return 0
      if (aLastTime === Infinity) return 1
      if (bLastTime === Infinity) return -1
      const aWait = pCurrentMinTime - aLastTime
      const bWait = pCurrentMinTime - bLastTime
      const aUrgent = aWait >= pMaxWaitSlots * slotMinutes
      const bUrgent = bWait >= pMaxWaitSlots * slotMinutes
      if (aUrgent && !bUrgent) return -1
      if (!aUrgent && bUrgent) return 1
      if (aUrgent && bUrgent) return aLastTime - bLastTime
      return 0
    })

    for (const gameRef of stepGames) {
      const gamePlayers = getPreviewGamePlayers(gameRef.gameId)

      let playerEarliestStart = 0
      for (const playerId of gamePlayers) {
        const lastTime = playerLastTime.get(playerId)
        if (lastTime != null) {
          const earliest = lastTime + slotMinutes
          if (earliest > playerEarliestStart) playerEarliestStart = earliest
        }
      }

      const isD1TopSeed = gameRef.division === 'D1' && gameRef.bestSeed <= 8
      let bestCourt = -1
      let bestTime = Infinity

      for (let c = 0; c < numCourts; c++) {
        const courtTime = Math.max(courtNext[c], playerEarliestStart)
        if (courtTime < bestTime || (courtTime === bestTime && isD1TopSeed && c === 0)) {
          bestTime = courtTime
          bestCourt = c
        }
      }

      const noRestBestTime = Math.min(...courtNext)
      if (bestTime > noRestBestTime + slotMinutes * 2) {
        bestCourt = 0
        for (let c = 1; c < numCourts; c++) {
          if (courtNext[c] < courtNext[bestCourt]) bestCourt = c
        }
        bestTime = courtNext[bestCourt]
      }

      const timeMinutes = bestTime
      const courtNumber = bestCourt + 1

      scheduled.push({ gameId: gameRef.gameId, courtNumber, timeMinutes })
      courtNext[bestCourt] = timeMinutes + slotMinutes

      for (const playerId of gamePlayers) {
        playerLastTime.set(playerId, timeMinutes)
      }
    }
  }

  // Sort and assign display numbers
  scheduled.sort((a, b) => {
    if (a.timeMinutes !== b.timeMinutes) return a.timeMinutes - b.timeMinutes
    return a.courtNumber - b.courtNumber
  })

  return scheduled.map((entry, index) => ({
    gameId: entry.gameId,
    courtNumber: entry.courtNumber,
    scheduledTime: minutesToDate(entry.timeMinutes, previewTournamentDate),
    displayMatchNumber: index + 1,
  }))
}
