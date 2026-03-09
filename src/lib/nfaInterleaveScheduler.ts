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

  // ── Step 2: Fetch all games with their rounds ──
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

  // Build lookup: (divisionLabel, roundLabel) → game IDs (sorted by matchNumber)
  // roundLabel comes from Round.name in the database
  type GameRef = {
    gameId: string
    matchNumber: number | null
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
    })
  }

  // Sort each round's games by matchNumber for consistent ordering
  for (const [, games] of gamesByDivisionRound) {
    games.sort((a, b) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0))
  }

  // ── Step 3: Build the interleave step array ──
  const steps = divisionCount === 4
    ? get4DivInterleaveSteps()
    : get3DivInterleaveSteps()

  // ── Step 4: Schedule games following the interleave order ──
  // Court availability tracker: minutes from midnight for each court
  const courtNext = new Array(numCourts).fill(startHour * 60)

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

    // Collect all game IDs for this step in order
    const stepGameIds: string[] = []

    for (const { division, roundLabel } of step) {
      const key = `${division}::${roundLabel}`
      const games = gamesByDivisionRound.get(key)
      if (games) {
        for (const g of games) {
          stepGameIds.push(g.gameId)
        }
      }
    }

    // Assign each game to the earliest available court
    for (const gameId of stepGameIds) {
      // Find the court with the earliest available time
      let bestCourt = 0
      for (let c = 1; c < numCourts; c++) {
        if (courtNext[c] < courtNext[bestCourt]) {
          bestCourt = c
        }
      }

      const timeMinutes = courtNext[bestCourt]
      const courtNumber = bestCourt + 1 // 1-indexed

      scheduled.push({
        gameId,
        courtNumber,
        timeMinutes,
      })

      // Advance this court's availability
      courtNext[bestCourt] = timeMinutes + slotMinutes
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
    scheduledTime: minutesToDate(entry.timeMinutes),
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
 * Uses today's date as the base.
 */
function minutesToDate(minutes: number): Date {
  const date = new Date()
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

  // Build lookup
  type GameRef = { gameId: string; matchNumber: number | null }
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
    })
  }

  for (const [, games] of gamesByDivisionRound) {
    games.sort((a, b) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0))
  }

  // Schedule
  const steps = divisionCount === 4
    ? get4DivInterleaveSteps()
    : get3DivInterleaveSteps()

  const courtNext = new Array(numCourts).fill(startHour * 60)

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

    const stepGameIds: string[] = []
    for (const { division, roundLabel } of step) {
      const key = `${division}::${roundLabel}`
      const games = gamesByDivisionRound.get(key)
      if (games) {
        for (const g of games) {
          stepGameIds.push(g.gameId)
        }
      }
    }

    for (const gameId of stepGameIds) {
      let bestCourt = 0
      for (let c = 1; c < numCourts; c++) {
        if (courtNext[c] < courtNext[bestCourt]) {
          bestCourt = c
        }
      }

      const timeMinutes = courtNext[bestCourt]
      const courtNumber = bestCourt + 1

      scheduled.push({ gameId, courtNumber, timeMinutes })
      courtNext[bestCourt] = timeMinutes + slotMinutes
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
    scheduledTime: minutesToDate(entry.timeMinutes),
    displayMatchNumber: index + 1,
  }))
}
