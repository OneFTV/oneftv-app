/**
 * NFA Inter-Division & Multi-Category Scheduling Algorithm
 *
 * Implements interleaved scheduling across NFA cascade divisions
 * (D1/D2/D3 for 3-division, D1/D2/D3/D4 for 4-division) plus
 * non-division categories (Women, Master, Beginner, COED, etc.)
 *
 * Key features:
 * - Reverse scheduling: games are placed forward then time-shifted so D1 Final
 *   ends at the day's end time. This ensures finals are the last games of the day.
 * - Multi-category interleaving: non-division categories are interleaved with
 *   division rounds so all categories run in parallel from the start.
 * - Cross-category player conflict handling: rest time is enforced globally
 *   across all categories, so a player in both Open and COED gets proper rest.
 * - Court priority: D1 games and top seeds prefer main courts (court 1, 2).
 * - Finals ordering: other category finals → D3 Final → D2 Final → D1 Final (last)
 * - BARRIERs: synchronize all courts before critical late-bracket games
 * - displayMatchNumber: sequential M1..MN across all categories by scheduledTime
 */

import { prisma } from '@/shared/database/prisma'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface InterleaveConfig {
  tournamentId: string
  numCourts: number
  slotMinutes: number
  startHour: number    // e.g., 9 for 9:00 AM
  startMinute?: number // e.g., 0
  endHour: number      // e.g., 18 for 6:00 PM
  endMinute?: number   // e.g., 0
  divisionCount: 3 | 4
  dayDate: Date        // the actual calendar date for this scheduling day
  scheduledDay: number // 1 or 2
}

export interface ScheduledMatch {
  gameId: string
  courtNumber: number
  scheduledTime: Date
  displayMatchNumber: number
}

export interface ScheduleOverflow {
  overflow: true
  totalMinutesNeeded: number
  availableMinutes: number
  totalGames: number
}

// ---------------------------------------------------------------------------
// Interleave step definitions
// ---------------------------------------------------------------------------

type StepEntry = { division: string; roundLabel: string; categoryId?: string }
type InterleaveStep = StepEntry[] | 'BARRIER'

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
    // ── NON_DIV_FINALS placeholder is inserted here by buildUnifiedSteps ──
    /* 20 D3 Final       */ rr('D3', 'D3 Final'),
    'BARRIER',
    /* 21 D2 Final       */ rr('D2', 'D2 Final'),
    'BARRIER',
    /* 22 D1 Final       */ rr('D1', 'Final'),
  ]
}

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
    // ── NON_DIV_FINALS placeholder is inserted here by buildUnifiedSteps ──
    /* 21 D4 Final       */ rr('D4', 'D4 Final'),
    'BARRIER',
    /* 22 D3 Final       */ rr('D3', 'D3 Final'),
    'BARRIER',
    /* 23 D2 Final       */ rr('D2', 'D2 Final'),
    'BARRIER',
    /* 24 D1 Final       */ rr('D1', 'Final'),
  ]
}

function rr(division: string, roundLabel: string): StepEntry[] {
  return [{ division, roundLabel }]
}

// ---------------------------------------------------------------------------
// Non-division category round batch builder
// ---------------------------------------------------------------------------

interface NonDivRoundBatch {
  categoryId: string
  categoryName: string
  roundName: string
  roundNumber: number
  totalRounds: number
  isFinal: boolean   // true for the last 1-2 rounds (semi/final/bronze)
  games: StepEntry[]
}

async function buildNonDivisionBatches(
  tournamentId: string,
  scheduledDay: number
): Promise<NonDivRoundBatch[]> {
  // Fetch non-division categories scheduled for this day
  const categories = await prisma.category.findMany({
    where: {
      tournamentId,
      scheduledDay,
      OR: [
        { divisionLabel: null },
        { divisionLabel: '' },
      ],
    },
    select: { id: true, name: true, sortOrder: true },
    orderBy: { sortOrder: 'asc' },
  })

  if (categories.length === 0) return []

  const categoryIds = categories.map(c => c.id)

  // Fetch rounds for these categories
  const rounds = await prisma.round.findMany({
    where: { categoryId: { in: categoryIds } },
    select: { id: true, name: true, categoryId: true, roundNumber: true, type: true },
    orderBy: [{ categoryId: 'asc' }, { roundNumber: 'asc' }],
  })

  // Max round per category
  const maxRoundPerCat = new Map<string, number>()
  for (const r of rounds) {
    const catId = r.categoryId ?? ''
    const cur = maxRoundPerCat.get(catId) ?? 0
    if (r.roundNumber > cur) maxRoundPerCat.set(catId, r.roundNumber)
  }

  // Fetch games for these categories
  const games = await prisma.game.findMany({
    where: {
      tournamentId,
      categoryId: { in: categoryIds },
    },
    select: {
      id: true,
      matchNumber: true,
      categoryId: true,
      roundId: true,
    },
    orderBy: { matchNumber: 'asc' },
  })

  // Build round batches
  const batches: NonDivRoundBatch[] = []
  const roundMap = new Map(rounds.map(r => [r.id, r]))

  // Group games by round
  const gamesByRound = new Map<string, typeof games>()
  for (const g of games) {
    if (!g.roundId) continue
    const list = gamesByRound.get(g.roundId) ?? []
    list.push(g)
    gamesByRound.set(g.roundId, list)
  }

  for (const round of rounds) {
    const catId = round.categoryId ?? ''
    const cat = categories.find(c => c.id === catId)
    if (!cat) continue

    const roundGames = gamesByRound.get(round.id) ?? []
    if (roundGames.length === 0) continue

    const maxRound = maxRoundPerCat.get(catId) ?? 1
    const isFinal = round.roundNumber >= maxRound - 1 // last 2 rounds = semi/final territory

    batches.push({
      categoryId: catId,
      categoryName: cat.name,
      roundName: round.name,
      roundNumber: round.roundNumber,
      totalRounds: maxRound,
      isFinal,
      // One entry per (category, round) — the scheduler looks up all games for this key
      games: [{
        division: `NDC:${catId}`,
        roundLabel: round.name,
        categoryId: catId,
      }],
    })
  }

  return batches
}

/**
 * Build unified step array: interleaves non-division round batches into the division steps.
 *
 * Strategy:
 * - Non-final batches are distributed evenly across early division steps (before the BARRIER region)
 * - Non-division finals go right before D3 Final (after Bronze matches)
 */
function buildUnifiedSteps(
  divisionSteps: InterleaveStep[],
  nonDivBatches: NonDivRoundBatch[]
): InterleaveStep[] {
  if (nonDivBatches.length === 0) return divisionSteps

  const earlyBatches = nonDivBatches.filter(b => !b.isFinal)
  const finalBatches = nonDivBatches.filter(b => b.isFinal)

  // Find the early region: all steps before the first BARRIER
  // These are the "main" scheduling steps where we can interleave
  let firstBarrierIdx = divisionSteps.findIndex(s => s === 'BARRIER')
  if (firstBarrierIdx === -1) firstBarrierIdx = divisionSteps.length

  // Distribute early batches evenly across the early division steps
  const result: InterleaveStep[] = []
  let earlyIdx = 0
  const stride = earlyBatches.length > 0
    ? Math.max(1, Math.floor(firstBarrierIdx / earlyBatches.length))
    : Infinity

  for (let i = 0; i < divisionSteps.length; i++) {
    const step = divisionSteps[i]

    // Insert early non-div batch before this step if it's time
    if (i < firstBarrierIdx && earlyIdx < earlyBatches.length && i > 0 && i % stride === 0) {
      result.push(earlyBatches[earlyIdx].games)
      earlyIdx++
    }

    // Check if this is the position right before division finals
    // (after Bronze matches, before D3/D4 Final)
    const nextStep = divisionSteps[i + 1]
    const isBeforeDivisionFinals = step !== 'BARRIER' && Array.isArray(step) &&
      step.some(s => s.roundLabel.includes('Bronze')) &&
      nextStep !== undefined && nextStep !== 'BARRIER' &&
      Array.isArray(nextStep) && nextStep.some(s =>
        s.roundLabel.includes('Final') && (s.division === 'D3' || s.division === 'D4')
      )

    result.push(step)

    // Insert remaining early batches if we haven't placed them all
    if (i === firstBarrierIdx - 1) {
      while (earlyIdx < earlyBatches.length) {
        result.push(earlyBatches[earlyIdx].games)
        earlyIdx++
      }
    }

    // Insert non-division finals before division finals
    if (isBeforeDivisionFinals && finalBatches.length > 0) {
      result.push('BARRIER')
      for (const batch of finalBatches) {
        result.push(batch.games)
      }
      result.push('BARRIER')
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Core scheduling engine (shared by schedule and preview)
// ---------------------------------------------------------------------------

interface ScheduleEntry {
  gameId: string
  courtNumber: number
  timeMinutes: number
}

interface GameData {
  id: string
  matchNumber: number | null
  categoryId: string | null
  roundId: string | null
  player1HomeId: string | null
  player2HomeId: string | null
  player1AwayId: string | null
  player2AwayId: string | null
  Round: { id: string; name: string; bracketSide: string | null } | null
}

interface GameRef {
  gameId: string
  matchNumber: number | null
  division: string
  roundLabel: string
  bestSeed: number
  categoryId?: string  // for non-division games
}

async function computeSchedule(config: InterleaveConfig): Promise<{
  scheduled: ScheduleEntry[]
  overflow: ScheduleOverflow | null
}> {
  const { tournamentId, numCourts, slotMinutes, startHour, divisionCount, endHour, scheduledDay } = config
  const startMinute = config.startMinute ?? 0
  const endMinute = config.endMinute ?? 0

  // ── Fetch division categories ──
  const divisionLabels = divisionCount === 4
    ? ['D1', 'D2', 'D3', 'D4']
    : ['D1', 'D2', 'D3']

  const divisionCategories = await prisma.category.findMany({
    where: {
      tournamentId,
      divisionLabel: { in: divisionLabels },
      scheduledDay,
    },
    select: { id: true, divisionLabel: true },
  })

  // Also accept division categories without scheduledDay set (default to day 1)
  if (divisionCategories.length === 0 && scheduledDay === 1) {
    const fallbackCats = await prisma.category.findMany({
      where: {
        tournamentId,
        divisionLabel: { in: divisionLabels },
      },
      select: { id: true, divisionLabel: true },
    })
    divisionCategories.push(...fallbackCats)
  }

  const hasDivisions = divisionCategories.length > 0
  const divisionCategoryIds = divisionCategories.map(c => c.id)

  // ── Fetch non-division batches for this day ──
  const nonDivBatches = await buildNonDivisionBatches(tournamentId, scheduledDay)

  // ── Fetch ALL games (division + non-division for this day) ──
  const nonDivCategoryIds = [...new Set(nonDivBatches.map(b => b.categoryId))]
  const allCategoryIds = [...divisionCategoryIds, ...nonDivCategoryIds]

  if (allCategoryIds.length === 0) {
    return { scheduled: [], overflow: null }
  }

  const allGames: GameData[] = await prisma.game.findMany({
    where: {
      tournamentId,
      categoryId: { in: allCategoryIds },
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
        select: { id: true, name: true, bracketSide: true },
      },
    },
  })

  if (allGames.length === 0) {
    return { scheduled: [], overflow: null }
  }

  // ── Build game lookup for quick player access ──
  const gameMap = new Map(allGames.map(g => [g.id, g]))

  function getGamePlayers(gameId: string): string[] {
    const game = gameMap.get(gameId)
    if (!game) return []
    return [game.player1HomeId, game.player2HomeId, game.player1AwayId, game.player2AwayId]
      .filter((id): id is string => id !== null)
  }

  // ── Fetch seed info for division games ──
  const teamRegs = divisionCategoryIds.length > 0
    ? await prisma.teamRegistration.findMany({
        where: { categoryId: { in: divisionCategoryIds } },
        select: { seed: true, player1Id: true, player2Id: true, categoryId: true },
      })
    : []

  const playerSeedMap = new Map<string, number>()
  for (const reg of teamRegs) {
    if (reg.seed != null) {
      playerSeedMap.set(`${reg.categoryId}::${reg.player1Id}`, reg.seed)
      if (reg.player2Id) playerSeedMap.set(`${reg.categoryId}::${reg.player2Id}`, reg.seed)
    }
  }

  function getGameBestSeed(game: GameData): number {
    let best = 999
    if (!game.categoryId) return best
    for (const pid of [game.player1HomeId, game.player1AwayId]) {
      if (!pid) continue
      const seed = playerSeedMap.get(`${game.categoryId}::${pid}`)
      if (seed != null && seed < best) best = seed
    }
    return best
  }

  // ── Build division game lookup: (divisionLabel, roundLabel) → GameRef[] ──
  const gamesByKey = new Map<string, GameRef[]>()

  for (const game of allGames) {
    if (!game.Round || !game.categoryId) continue

    // Division game
    const divCat = divisionCategories.find(c => c.id === game.categoryId)
    if (divCat?.divisionLabel) {
      const key = `${divCat.divisionLabel}::${game.Round.name}`
      if (!gamesByKey.has(key)) gamesByKey.set(key, [])
      gamesByKey.get(key)!.push({
        gameId: game.id,
        matchNumber: game.matchNumber,
        division: divCat.divisionLabel,
        roundLabel: game.Round.name,
        bestSeed: getGameBestSeed(game),
      })
      continue
    }

    // Non-division game
    if (nonDivCategoryIds.includes(game.categoryId)) {
      const key = `NDC:${game.categoryId}::${game.Round.name}`
      if (!gamesByKey.has(key)) gamesByKey.set(key, [])
      gamesByKey.get(key)!.push({
        gameId: game.id,
        matchNumber: game.matchNumber,
        division: `NDC:${game.categoryId}`,
        roundLabel: game.Round.name,
        bestSeed: 999,
        categoryId: game.categoryId,
      })
    }
  }

  // Sort each round's games by matchNumber
  for (const [, games] of gamesByKey) {
    games.sort((a, b) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0))
  }

  // D1 W1: worst seeds first so top seeds play last (feature match)
  const d1W1Games = gamesByKey.get('D1::W1')
  if (d1W1Games) {
    d1W1Games.sort((a, b) => b.bestSeed - a.bestSeed)
  }

  // ── Build unified step array ──
  const divisionSteps = hasDivisions
    ? (divisionCount === 4 ? get4DivInterleaveSteps() : get3DivInterleaveSteps())
    : []

  const steps = buildUnifiedSteps(divisionSteps, nonDivBatches)

  // If no division steps and we have non-div batches, build steps from batches only
  if (!hasDivisions && nonDivBatches.length > 0) {
    // Simple forward ordering: early rounds first, finals last
    const earlyBatches = nonDivBatches.filter(b => !b.isFinal)
    const finalBatches = nonDivBatches.filter(b => b.isFinal)
    steps.length = 0
    for (const b of earlyBatches) steps.push(b.games)
    if (finalBatches.length > 0) {
      steps.push('BARRIER')
      for (const b of finalBatches) steps.push(b.games)
    }
  }

  // ── Forward scheduling pass ──
  const courtNext = new Array(numCourts).fill(startHour * 60 + startMinute)
  const playerLastTime = new Map<string, number>()
  const scheduled: ScheduleEntry[] = []

  for (const step of steps) {
    if (step === 'BARRIER') {
      const maxTime = Math.max(...courtNext)
      courtNext.fill(maxTime)
      continue
    }

    // Collect all game refs for this step
    const stepGames: GameRef[] = []
    for (const entry of step) {
      const key = entry.categoryId
        ? `NDC:${entry.categoryId}::${entry.roundLabel}`
        : `${entry.division}::${entry.roundLabel}`
      const games = gamesByKey.get(key)
      if (games) {
        for (const g of games) stepGames.push(g)
      }
    }

    if (stepGames.length === 0) continue

    // Prioritize games whose players have been waiting longest
    const maxWaitSlots = 2
    const currentMinTime = Math.min(...courtNext)
    stepGames.sort((a, b) => {
      const aPlayers = getGamePlayers(a.gameId)
      const bPlayers = getGamePlayers(b.gameId)
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
      const aWait = currentMinTime - aLastTime
      const bWait = currentMinTime - bLastTime
      const aUrgent = aWait >= maxWaitSlots * slotMinutes
      const bUrgent = bWait >= maxWaitSlots * slotMinutes
      if (aUrgent && !bUrgent) return -1
      if (!aUrgent && bUrgent) return 1
      if (aUrgent && bUrgent) return aLastTime - bLastTime
      return 0
    })

    // Assign each game to earliest available court
    for (const gameRef of stepGames) {
      const gamePlayers = getGamePlayers(gameRef.gameId)

      // Player rest time enforcement
      let playerEarliestStart = 0
      for (const playerId of gamePlayers) {
        const lastTime = playerLastTime.get(playerId)
        if (lastTime != null) {
          const earliest = lastTime + slotMinutes
          if (earliest > playerEarliestStart) playerEarliestStart = earliest
        }
      }

      // Court preference: D1 games and top seeds prefer courts 1-2
      const isD1Game = gameRef.division === 'D1'
      const isD1TopSeed = isD1Game && gameRef.bestSeed <= 8

      let bestCourt = -1
      let bestTime = Infinity

      for (let c = 0; c < numCourts; c++) {
        const courtTime = Math.max(courtNext[c], playerEarliestStart)
        if (courtTime < bestTime || (courtTime === bestTime && isD1TopSeed && c === 0)) {
          bestTime = courtTime
          bestCourt = c
        }
      }

      // Don't let rest time delay the tournament excessively
      const noRestBestTime = Math.min(...courtNext)
      if (bestTime > noRestBestTime + slotMinutes * 2) {
        bestCourt = 0
        for (let c = 1; c < numCourts; c++) {
          if (courtNext[c] < courtNext[bestCourt]) bestCourt = c
        }
        bestTime = courtNext[bestCourt]
      }

      scheduled.push({
        gameId: gameRef.gameId,
        courtNumber: bestCourt + 1,
        timeMinutes: bestTime,
      })

      courtNext[bestCourt] = bestTime + slotMinutes
      for (const playerId of gamePlayers) {
        playerLastTime.set(playerId, bestTime)
      }
    }
  }

  if (scheduled.length === 0) {
    return { scheduled: [], overflow: null }
  }

  // ── Reverse time-shift: anchor last game at end of day ──
  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute
  const availableMinutes = endMinutes - startMinutes

  const lastGameEnd = Math.max(...scheduled.map(e => e.timeMinutes)) + slotMinutes
  const firstGameStart = Math.min(...scheduled.map(e => e.timeMinutes))
  const totalMinutesNeeded = lastGameEnd - firstGameStart

  // Check for overflow
  if (totalMinutesNeeded > availableMinutes) {
    return {
      scheduled,
      overflow: {
        overflow: true,
        totalMinutesNeeded,
        availableMinutes,
        totalGames: scheduled.length,
      },
    }
  }

  // Shift all games so the last game ends at endMinutes
  const shift = endMinutes - lastGameEnd
  for (const entry of scheduled) {
    entry.timeMinutes += shift
  }

  return { scheduled, overflow: null }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Schedule all games for a given day and write to database.
 * Returns scheduled matches sorted by time with sequential displayMatchNumber.
 */
export async function scheduleNFAInterleave(config: InterleaveConfig): Promise<ScheduledMatch[]> {
  const { scheduled, overflow } = await computeSchedule(config)

  if (overflow) {
    throw new Error(
      `Schedule overflow: needs ${overflow.totalMinutesNeeded} minutes but only ${overflow.availableMinutes} available ` +
      `(${overflow.totalGames} games). Move some categories to another day or extend the day's hours.`
    )
  }

  if (scheduled.length === 0) return []

  // Sort by time, then court for display numbering
  scheduled.sort((a, b) => {
    if (a.timeMinutes !== b.timeMinutes) return a.timeMinutes - b.timeMinutes
    return a.courtNumber - b.courtNumber
  })

  const results: ScheduledMatch[] = scheduled.map((entry, index) => ({
    gameId: entry.gameId,
    courtNumber: entry.courtNumber,
    scheduledTime: minutesToDate(entry.timeMinutes, config.dayDate),
    displayMatchNumber: index + 1,
  }))

  // Write to database atomically
  await prisma.$transaction(
    results.map(r =>
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

/**
 * Preview the schedule without writing to the database.
 */
export async function previewNFAInterleave(config: InterleaveConfig): Promise<ScheduledMatch[] | ScheduleOverflow> {
  const { scheduled, overflow } = await computeSchedule(config)

  if (overflow) return overflow
  if (scheduled.length === 0) return []

  scheduled.sort((a, b) => {
    if (a.timeMinutes !== b.timeMinutes) return a.timeMinutes - b.timeMinutes
    return a.courtNumber - b.courtNumber
  })

  return scheduled.map((entry, index) => ({
    gameId: entry.gameId,
    courtNumber: entry.courtNumber,
    scheduledTime: minutesToDate(entry.timeMinutes, config.dayDate),
    displayMatchNumber: index + 1,
  }))
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function minutesToDate(minutes: number, baseDate: Date): Date {
  const date = new Date(baseDate)
  date.setHours(0, 0, 0, 0)
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return date
}

export function formatMatchNumber(num: number): string {
  return `M${num}`
}

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

  const courtsUsed = [...new Set(matches.map(m => m.courtNumber))].sort((a, b) => a - b)

  return {
    totalGames: matches.length,
    firstGameTime: sorted[0].scheduledTime,
    lastGameTime: sorted[sorted.length - 1].scheduledTime,
    courtsUsed,
  }
}
