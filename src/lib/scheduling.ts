export interface Game {
  id?: string
  team1: string[]
  team2: string[]
  courtNumber?: number
  scheduledTime?: Date
  status?: 'scheduled' | 'in_progress' | 'completed'
  team1Score?: number
  team2Score?: number
}

export interface ScheduledGame extends Game {
  courtNumber: number
  scheduledTime: Date
}

export function calculateMaxGames(
  numCourts: number,
  numDays: number,
  hoursPerDay: number,
  avgGameMinutes: number
): number {
  const totalMinutesAvailable = numCourts * numDays * hoursPerDay * 60
  const maxGames = Math.floor(totalMinutesAvailable / avgGameMinutes)
  return maxGames
}

export function generateKotBGroups(
  players: string[],
  groupSize: number
): string[][] {
  if (players.length < groupSize) {
    return [players]
  }

  const groups: string[][] = []
  let playerIndex = 0

  while (playerIndex < players.length) {
    const group: string[] = []
    const remainingPlayers = players.length - playerIndex
    const playersForThisGroup = Math.min(groupSize, remainingPlayers)

    for (let i = 0; i < playersForThisGroup; i++) {
      group.push(players[playerIndex + i])
    }

    groups.push(group)
    playerIndex += playersForThisGroup
  }

  return groups
}

export function generateKotBGames(group: string[]): Game[] {
  const games: Game[] = []

  if (group.length < 4) {
    return games
  }

  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      const player1 = group[i]
      const player2 = group[j]

      const remainingPlayers = group.filter(
        (p) => p !== player1 && p !== player2
      )

      for (let k = 0; k < remainingPlayers.length; k++) {
        for (let l = k + 1; l < remainingPlayers.length; l++) {
          const player3 = remainingPlayers[k]
          const player4 = remainingPlayers[l]

          const game: Game = {
            team1: [player1, player2],
            team2: [player3, player4],
          }
          games.push(game)
        }
      }
    }
  }

  return games
}

export function generateBracketGames(players: string[]): Game[][] {
  const bracket: Game[][] = []

  if (players.length < 2) return bracket

  const validPlayerCount = Math.pow(2, Math.ceil(Math.log2(players.length)))
  const seeded: (string | null)[] = [...players]

  // Pad with null byes to reach next power of 2
  while (seeded.length < validPlayerCount) {
    seeded.push(null)
  }

  // First round: pair players, skip bye-vs-bye, auto-advance bye matchups
  const roundGames: Game[] = []
  const nextRoundAdvancers: (string | null)[] = []

  for (let i = 0; i < seeded.length; i += 2) {
    const p1 = seeded[i]
    const p2 = seeded[i + 1]

    if (p1 && p2) {
      // Real matchup
      roundGames.push({
        team1: [p1],
        team2: [p2],
      })
      nextRoundAdvancers.push(null) // winner TBD
    } else if (p1) {
      // p1 gets a bye (auto-advance, no game needed)
      nextRoundAdvancers.push(p1)
    } else if (p2) {
      // p2 gets a bye
      nextRoundAdvancers.push(p2)
    }
    // both null = skip entirely
  }

  if (roundGames.length > 0) {
    bracket.push(roundGames)
  }

  return bracket
}

export function generateGroupKnockoutGames(groups: string[][]): Game[] {
  const games: Game[] = []

  const groupGames: Game[] = []
  for (const group of groups) {
    const kotbGames = generateKotBGames(group)
    groupGames.push(...kotbGames)
  }

  const topFinishers: string[] = []
  for (const group of groups) {
    if (group.length > 0) {
      topFinishers.push(group[0])
    }
  }

  for (let i = 0; i < topFinishers.length; i += 2) {
    if (i + 1 < topFinishers.length) {
      games.push({
        team1: [topFinishers[i]],
        team2: [topFinishers[i + 1]],
      })
    }
  }

  return games
}

export function generateRoundRobinGames(players: string[]): Game[] {
  const games: Game[] = []

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      games.push({
        team1: [players[i]],
        team2: [players[j]],
      })
    }
  }

  return games
}

export function scheduleGames(
  games: Game[],
  numCourts: number,
  startTime: Date,
  avgGameMinutes: number
): ScheduledGame[] {
  const scheduledGames: ScheduledGame[] = []
  const courtAvailability: { [courtNumber: number]: Date } = {}

  for (let i = 1; i <= numCourts; i++) {
    courtAvailability[i] = new Date(startTime)
  }

  for (const game of games) {
    let earliestAvailableCourt = 1
    let earliestTime = courtAvailability[1]

    for (let court = 2; court <= numCourts; court++) {
      if (courtAvailability[court] < earliestTime) {
        earliestTime = courtAvailability[court]
        earliestAvailableCourt = court
      }
    }

    const scheduledTime = new Date(earliestTime)
    const nextAvailableTime = new Date(
      scheduledTime.getTime() + avgGameMinutes * 60 * 1000
    )

    courtAvailability[earliestAvailableCourt] = nextAvailableTime

    scheduledGames.push({
      ...game,
      courtNumber: earliestAvailableCourt,
      scheduledTime,
      status: 'scheduled',
    })
  }

  return scheduledGames
}
