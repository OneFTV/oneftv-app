import { prisma } from '@/shared/database/prisma'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ConflictGame {
  id: string
  categoryId: string | null
  categoryName: string
  courtNumber: number
  time: Date
  roundNumber: number | null
}

export interface Conflict {
  playerId: string
  playerName: string
  game1: ConflictGame
  game2: ConflictGame
}

export interface Swap {
  gameId: string
  fromSlot: Date
  toSlot: Date
  fromCourt: number
  toCourt: number
}

export interface ResolveResult {
  resolved: number
  unresolved: Conflict[]
  swaps: Swap[]
}

// ─── Detect Conflicts ────────────────────────────────────────────────────────

export async function detectConflicts(tournamentId: string): Promise<Conflict[]> {
  const tournament = await prisma.tournament.findUniqueOrThrow({
    where: { id: tournamentId },
    select: { avgGameMinutes: true },
  })

  const avgMs = tournament.avgGameMinutes * 60 * 1000

  // Find users registered in multiple categories for this tournament
  const multiCatPlayers = await prisma.$queryRaw<
    { userId: string; catCount: bigint }[]
  >`
    SELECT userId, COUNT(DISTINCT categoryId) as catCount
    FROM TournamentPlayer
    WHERE tournamentId = ${tournamentId} AND categoryId IS NOT NULL
    GROUP BY userId
    HAVING catCount > 1
  `

  if (multiCatPlayers.length === 0) return []

  const playerIds = multiCatPlayers.map((p) => p.userId)

  // Fetch all scheduled games for these players in this tournament
  const games = await prisma.game.findMany({
    where: {
      tournamentId,
      scheduledTime: { not: null },
      OR: [
        { player1HomeId: { in: playerIds } },
        { player2HomeId: { in: playerIds } },
        { player1AwayId: { in: playerIds } },
        { player2AwayId: { in: playerIds } },
      ],
    },
    include: {
      category: { select: { id: true, name: true } },
      round: { select: { roundNumber: true } },
      player1Home: { select: { id: true, name: true } },
      player2Home: { select: { id: true, name: true } },
      player1Away: { select: { id: true, name: true } },
      player2Away: { select: { id: true, name: true } },
    },
  })

  // Build a map: playerId -> list of games
  const playerGames = new Map<string, typeof games>()
  for (const game of games) {
    const involvedIds = [
      game.player1HomeId,
      game.player2HomeId,
      game.player1AwayId,
      game.player2AwayId,
    ].filter((id): id is string => id !== null && playerIds.includes(id))

    for (const pid of involvedIds) {
      const list = playerGames.get(pid) ?? []
      list.push(game)
      playerGames.set(pid, list)
    }
  }

  // Find overlapping games per player
  const conflicts: Conflict[] = []
  const seen = new Set<string>()

  for (const [playerId, pGames] of playerGames) {
    // Sort by scheduled time
    const sorted = pGames
      .filter((g) => g.scheduledTime !== null)
      .sort((a, b) => a.scheduledTime!.getTime() - b.scheduledTime!.getTime())

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const g1 = sorted[i]
        const g2 = sorted[j]
        // Same category games aren't multi-cat conflicts
        if (g1.categoryId === g2.categoryId) continue

        const diff = g2.scheduledTime!.getTime() - g1.scheduledTime!.getTime()
        if (diff < avgMs) {
          const key = [g1.id, g2.id].sort().join(':') + ':' + playerId
          if (seen.has(key)) continue
          seen.add(key)

          const playerName =
            [g1.player1Home, g1.player2Home, g1.player1Away, g1.player2Away].find(
              (p) => p?.id === playerId
            )?.name ?? 'Unknown'

          conflicts.push({
            playerId,
            playerName,
            game1: {
              id: g1.id,
              categoryId: g1.categoryId,
              categoryName: g1.category?.name ?? 'N/A',
              courtNumber: g1.courtNumber,
              time: g1.scheduledTime!,
              roundNumber: g1.round?.roundNumber ?? null,
            },
            game2: {
              id: g2.id,
              categoryId: g2.categoryId,
              categoryName: g2.category?.name ?? 'N/A',
              courtNumber: g2.courtNumber,
              time: g2.scheduledTime!,
              roundNumber: g2.round?.roundNumber ?? null,
            },
          })
        }
      }
    }
  }

  return conflicts
}

// ─── Resolve Conflicts ───────────────────────────────────────────────────────

export async function resolveConflicts(tournamentId: string): Promise<ResolveResult> {
  const tournament = await prisma.tournament.findUniqueOrThrow({
    where: { id: tournamentId },
    select: {
      avgGameMinutes: true,
      numCourts: true,
      date: true,
      endDate: true,
      hoursPerDay: true,
      numDays: true,
    },
  })

  const avgMs = tournament.avgGameMinutes * 60 * 1000

  // Compute daily end time boundary (hours from tournament start)
  const dailyEndOffsetMs = tournament.hoursPerDay * 60 * 60 * 1000

  let conflicts = await detectConflicts(tournamentId)
  if (conflicts.length === 0) {
    return { resolved: 0, unresolved: [], swaps: [] }
  }

  // Get all scheduled games for the tournament to find empty slots
  const allGames = await prisma.game.findMany({
    where: { tournamentId, scheduledTime: { not: null } },
    select: {
      id: true,
      courtNumber: true,
      scheduledTime: true,
      categoryId: true,
      player1HomeId: true,
      player2HomeId: true,
      player1AwayId: true,
      player2AwayId: true,
    },
  })

  // Build occupied slots: Map<timeMs:court -> gameId>
  const occupiedSlots = new Map<string, string>()
  for (const g of allGames) {
    if (g.scheduledTime) {
      occupiedSlots.set(`${g.scheduledTime.getTime()}:${g.courtNumber}`, g.id)
    }
  }

  // Collect all used time slots across all courts
  const allTimeSlots = [...new Set(allGames.map((g) => g.scheduledTime!.getTime()))].sort(
    (a, b) => a - b
  )

  // Sort conflicts: easiest first (higher round number = fewer dependencies = easier to move)
  conflicts.sort((a, b) => {
    const aMax = Math.max(a.game1.roundNumber ?? 0, a.game2.roundNumber ?? 0)
    const bMax = Math.max(b.game1.roundNumber ?? 0, b.game2.roundNumber ?? 0)
    return bMax - aMax // higher round = easier
  })

  const swaps: Swap[] = []
  const unresolved: Conflict[] = []
  const movedGames = new Set<string>()

  // Helper: get all player IDs in a game
  function getGamePlayerIds(gameId: string): string[] {
    const g = allGames.find((x) => x.id === gameId)
    if (!g) return []
    return [g.player1HomeId, g.player2HomeId, g.player1AwayId, g.player2AwayId].filter(
      (id): id is string => id !== null
    )
  }

  // Helper: check if moving a game to a slot creates new conflicts
  function wouldCreateConflict(
    gameId: string,
    newTimeMs: number,
    _newCourt: number
  ): boolean {
    const playerIdsInGame = getGamePlayerIds(gameId)
    for (const pid of playerIdsInGame) {
      // Check all other games this player is in
      for (const otherGame of allGames) {
        if (otherGame.id === gameId) continue
        if (!otherGame.scheduledTime) continue
        const otherPlayers = [
          otherGame.player1HomeId,
          otherGame.player2HomeId,
          otherGame.player1AwayId,
          otherGame.player2AwayId,
        ]
        if (!otherPlayers.includes(pid)) continue

        // Check if the swap target already was moved
        const otherTimeMs = movedGames.has(otherGame.id)
          ? (swaps.find((s) => s.gameId === otherGame.id)?.toSlot.getTime() ??
            otherGame.scheduledTime.getTime())
          : otherGame.scheduledTime.getTime()

        if (Math.abs(otherTimeMs - newTimeMs) < avgMs) {
          return true
        }
      }
    }
    return false
  }

  // Helper: check if a time slot is within daily boundaries
  function isWithinDailyEnd(timeMs: number): boolean {
    const tournamentStart = tournament.date.getTime()
    const dayMs = 24 * 60 * 60 * 1000
    for (let d = 0; d < tournament.numDays; d++) {
      const dayStart = tournamentStart + d * dayMs
      const dayEnd = dayStart + dailyEndOffsetMs
      if (timeMs >= dayStart && timeMs + avgMs <= dayEnd) {
        return true
      }
    }
    return false
  }

  for (const conflict of conflicts) {
    // Skip if either game was already moved to resolve a prior conflict
    if (movedGames.has(conflict.game1.id) || movedGames.has(conflict.game2.id)) continue

    // Pick the game with fewer dependencies to move (higher round = later = fewer deps)
    const round1 = conflict.game1.roundNumber ?? 0
    const round2 = conflict.game2.roundNumber ?? 0
    const gameToMove = round2 >= round1 ? conflict.game2 : conflict.game1

    let resolved = false

    // Strategy 1: Find an empty slot on the SAME court at a different time
    for (const timeMs of allTimeSlots) {
      if (timeMs === gameToMove.time.getTime()) continue
      if (!isWithinDailyEnd(timeMs)) continue
      const slotKey = `${timeMs}:${gameToMove.courtNumber}`
      if (occupiedSlots.has(slotKey)) continue
      if (wouldCreateConflict(gameToMove.id, timeMs, gameToMove.courtNumber)) continue

      // Found a valid slot
      swaps.push({
        gameId: gameToMove.id,
        fromSlot: gameToMove.time,
        toSlot: new Date(timeMs),
        fromCourt: gameToMove.courtNumber,
        toCourt: gameToMove.courtNumber,
      })
      occupiedSlots.delete(`${gameToMove.time.getTime()}:${gameToMove.courtNumber}`)
      occupiedSlots.set(slotKey, gameToMove.id)
      movedGames.add(gameToMove.id)
      resolved = true
      break
    }

    if (resolved) continue

    // Strategy 2: Try any court at any time
    for (const timeMs of allTimeSlots) {
      if (timeMs === gameToMove.time.getTime()) continue
      if (!isWithinDailyEnd(timeMs)) continue
      for (let court = 1; court <= tournament.numCourts; court++) {
        if (court === gameToMove.courtNumber && timeMs === gameToMove.time.getTime())
          continue
        const slotKey = `${timeMs}:${court}`
        if (occupiedSlots.has(slotKey)) continue
        if (wouldCreateConflict(gameToMove.id, timeMs, court)) continue

        swaps.push({
          gameId: gameToMove.id,
          fromSlot: gameToMove.time,
          toSlot: new Date(timeMs),
          fromCourt: gameToMove.courtNumber,
          toCourt: court,
        })
        occupiedSlots.delete(`${gameToMove.time.getTime()}:${gameToMove.courtNumber}`)
        occupiedSlots.set(slotKey, gameToMove.id)
        movedGames.add(gameToMove.id)
        resolved = true
        break
      }
      if (resolved) break
    }

    if (!resolved) {
      unresolved.push(conflict)
    }
  }

  // Apply all swaps atomically via Prisma transaction
  if (swaps.length > 0) {
    await prisma.$transaction(
      swaps.map((swap) =>
        prisma.game.update({
          where: { id: swap.gameId },
          data: {
            scheduledTime: swap.toSlot,
            courtNumber: swap.toCourt,
          },
        })
      )
    )
  }

  return {
    resolved: swaps.length,
    unresolved,
    swaps,
  }
}
