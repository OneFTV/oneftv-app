import { prisma } from '@/shared/database/prisma'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TimeSlot {
  courtNumber: number
  day: number // 1-indexed
  startTime: Date
  endTime: Date
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(':').map(Number)
  return { hours: h, minutes: m }
}

/**
 * Round type ordering: group/pool games first, then knockout rounds in order,
 * finals/semis last.
 */
function roundTypePriority(type: string | null, roundNumber: number, totalRounds: number): number {
  if (type === 'group') return 0
  // Knockout rounds: lower round numbers first, semis/finals last
  // Higher roundNumber in knockout = later stage
  if (type === 'knockout') {
    // If it's the last 1-2 rounds, treat as finals/semis
    if (roundNumber >= totalRounds - 1) return 2
    return 1
  }
  return 1
}

// ─── Main Allocator ──────────────────────────────────────────────────────────

export async function allocateTimeSlots(tournamentId: string): Promise<number> {
  const tournament = await prisma.tournament.findUniqueOrThrow({
    where: { id: tournamentId },
    select: {
      id: true,
      numCourts: true,
      numDays: true,
      startTime: true,
      endTime: true,
      avgGameMinutes: true,
      date: true, // startDate
    },
  })

  const numCourts = tournament.numCourts
  const numDays = tournament.numDays
  const avgMinutes = tournament.avgGameMinutes
  const dailyStart = tournament.startTime ? parseTime(tournament.startTime) : { hours: 9, minutes: 0 }
  const dailyEnd = tournament.endTime ? parseTime(tournament.endTime) : { hours: 18, minutes: 0 }

  // Get all categories ordered by sortOrder (priority)
  const categories = await prisma.category.findMany({
    where: { tournamentId },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, sortOrder: true },
  })

  const categoryPriorityMap = new Map<string, number>()
  categories.forEach((c, i) => categoryPriorityMap.set(c.id, i))

  // Get all rounds for this tournament to determine max round per category
  const rounds = await prisma.round.findMany({
    where: { tournamentId },
    select: { id: true, categoryId: true, roundNumber: true, type: true, bracketSide: true },
  })

  // Max round number per category (to identify finals/semis)
  const maxRoundPerCategory = new Map<string, number>()
  for (const r of rounds) {
    const catId = r.categoryId ?? ''
    const cur = maxRoundPerCategory.get(catId) ?? 0
    if (r.roundNumber > cur) maxRoundPerCategory.set(catId, r.roundNumber)
  }

  const roundMap = new Map(rounds.map(r => [r.id, r]))

  // Fetch all games
  const games = await prisma.game.findMany({
    where: { tournamentId },
    select: {
      id: true,
      categoryId: true,
      roundId: true,
      matchNumber: true,
      bracketSide: true,
    },
  })

  if (games.length === 0) return 0

  // Sort games: category priority → round type priority → round number → match number
  const sortedGames = games.sort((a, b) => {
    // Category priority
    const catA = categoryPriorityMap.get(a.categoryId ?? '') ?? 999
    const catB = categoryPriorityMap.get(b.categoryId ?? '') ?? 999

    const roundA = a.roundId ? roundMap.get(a.roundId) : null
    const roundB = b.roundId ? roundMap.get(b.roundId) : null

    const roundNumA = roundA?.roundNumber ?? 0
    const roundNumB = roundB?.roundNumber ?? 0
    const maxA = maxRoundPerCategory.get(a.categoryId ?? '') ?? 1
    const maxB = maxRoundPerCategory.get(b.categoryId ?? '') ?? 1

    const typePrioA = roundTypePriority(roundA?.type ?? null, roundNumA, maxA)
    const typePrioB = roundTypePriority(roundB?.type ?? null, roundNumB, maxB)

    // Group all group-stage games first across all categories, then knockout, then finals
    if (typePrioA !== typePrioB) return typePrioA - typePrioB

    // Within same type priority, sort by category
    if (catA !== catB) return catA - catB

    // Within same category, sort by round number
    if (roundNumA !== roundNumB) return roundNumA - roundNumB

    // Within same round, sort by match number
    return (a.matchNumber ?? 0) - (b.matchNumber ?? 0)
  })

  // Build time slot grid: for each day × court, generate available start times
  const baseDate = new Date(tournament.date)
  baseDate.setHours(0, 0, 0, 0)

  // courtTimelines[day-1][court-1] = next available time in ms
  const courtTimelines: number[][] = []

  for (let d = 0; d < numDays; d++) {
    const dayStart = new Date(baseDate)
    dayStart.setDate(dayStart.getDate() + d)
    dayStart.setHours(dailyStart.hours, dailyStart.minutes, 0, 0)

    const courts: number[] = []
    for (let c = 0; c < numCourts; c++) {
      courts.push(dayStart.getTime())
    }
    courtTimelines.push(courts)
  }

  function getDayEndMs(day: number): number {
    const dayEnd = new Date(baseDate)
    dayEnd.setDate(dayEnd.getDate() + day)
    dayEnd.setHours(dailyEnd.hours, dailyEnd.minutes, 0, 0)
    return dayEnd.getTime()
  }

  const avgMs = avgMinutes * 60 * 1000

  // Track which round's games have been assigned and their latest end time
  // Key: roundId, Value: latest endTime across all games in that round
  const roundEndTimes = new Map<string, number>()

  // Assign games round-robin across courts
  const updates: { id: string; scheduledTime: Date; courtNumber: number }[] = []

  // Group games by their scheduling dependency (round)
  // Games in the same round can be simultaneous, but next round must wait
  let currentRoundKey = ''

  for (const game of sortedGames) {
    const roundId = game.roundId ?? 'no-round'
    const round = game.roundId ? roundMap.get(game.roundId) : null

    // If this game's round depends on a previous round in the same category,
    // ensure it starts after all games in the previous round
    let minStartTime = 0
    if (round && round.roundNumber > 1 && game.categoryId) {
      // Find the previous round in same category
      const prevRound = rounds.find(
        r => r.categoryId === game.categoryId &&
             r.roundNumber === round.roundNumber - 1 &&
             r.type === round.type &&
             (r.bracketSide ?? '') === (game.bracketSide ?? '')
      )
      if (prevRound) {
        const prevEndTime = roundEndTimes.get(prevRound.id)
        if (prevEndTime) {
          minStartTime = prevEndTime
        }
      }
    }

    // Find the earliest available slot across all days and courts
    let bestDay = -1
    let bestCourt = -1
    let bestTime = Infinity

    for (let d = 0; d < numDays; d++) {
      const dayEndMs = getDayEndMs(d)
      for (let c = 0; c < numCourts; c++) {
        const available = Math.max(courtTimelines[d][c], minStartTime)
        if (available + avgMs <= dayEndMs && available < bestTime) {
          bestTime = available
          bestDay = d
          bestCourt = c
        }
      }
    }

    if (bestDay === -1) {
      // No slot fits — just use the earliest court overflow
      bestDay = numDays - 1
      let minCourtTime = Infinity
      for (let c = 0; c < numCourts; c++) {
        const available = Math.max(courtTimelines[bestDay][c], minStartTime)
        if (available < minCourtTime) {
          minCourtTime = available
          bestCourt = c
        }
      }
      bestTime = Math.max(courtTimelines[bestDay][bestCourt], minStartTime)
    }

    // Advance the court timeline
    courtTimelines[bestDay][bestCourt] = bestTime + avgMs

    // Track round end time
    const gameEndTime = bestTime + avgMs
    const currentEnd = roundEndTimes.get(roundId) ?? 0
    if (gameEndTime > currentEnd) {
      roundEndTimes.set(roundId, gameEndTime)
    }

    updates.push({
      id: game.id,
      scheduledTime: new Date(bestTime),
      courtNumber: bestCourt + 1, // 1-indexed
    })
  }

  // Write all updates in a transaction
  if (updates.length > 0) {
    await prisma.$transaction(
      updates.map(u =>
        prisma.game.update({
          where: { id: u.id },
          data: {
            scheduledTime: u.scheduledTime,
            courtNumber: u.courtNumber,
          },
        })
      )
    )
  }

  return updates.length
}
