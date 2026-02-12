export interface KotBGame {
  id?: string
  players: string[]
  team1: string[]
  team2: string[]
  team1Score?: number
  team2Score?: number
  completed: boolean
}

export interface PlayerStanding {
  playerId: string
  playerName: string
  wins: number
  draws: number
  losses: number
  pointsFor: number
  pointsAgainst: number
  pointDifferential: number
  totalPoints: number
}

export interface GroupStanding extends PlayerStanding {
  groupId: string
}

export function generateKotBRoundRobin(groupPlayers: string[]): KotBGame[] {
  const games: KotBGame[] = []

  if (groupPlayers.length < 4) {
    return games
  }

  for (let i = 0; i < groupPlayers.length; i++) {
    for (let j = i + 1; j < groupPlayers.length; j++) {
      const player1 = groupPlayers[i]
      const player2 = groupPlayers[j]

      const remainingPlayers = groupPlayers.filter(
        (p) => p !== player1 && p !== player2
      )

      for (let k = 0; k < remainingPlayers.length; k++) {
        for (let l = k + 1; l < remainingPlayers.length; l++) {
          const player3 = remainingPlayers[k]
          const player4 = remainingPlayers[l]

          const game: KotBGame = {
            players: [player1, player2, player3, player4],
            team1: [player1, player2],
            team2: [player3, player4],
            completed: false,
          }
          games.push(game)
        }
      }
    }
  }

  return games
}

export function calculateKotBStandings(
  games: KotBGame[],
  players: string[]
): PlayerStanding[] {
  const standings: { [key: string]: PlayerStanding } = {}

  for (const player of players) {
    standings[player] = {
      playerId: player,
      playerName: player,
      wins: 0,
      draws: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDifferential: 0,
      totalPoints: 0,
    }
  }

  for (const game of games) {
    if (!game.completed) {
      continue
    }

    const team1Score = game.team1Score ?? 0
    const team2Score = game.team2Score ?? 0

    for (const player of game.team1) {
      if (!standings[player]) {
        standings[player] = {
          playerId: player,
          playerName: player,
          wins: 0,
          draws: 0,
          losses: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          pointDifferential: 0,
          totalPoints: 0,
        }
      }

      standings[player].pointsFor += team1Score
      standings[player].pointsAgainst += team2Score

      if (team1Score > team2Score) {
        standings[player].wins += 1
        standings[player].totalPoints += 3
      } else if (team1Score === team2Score) {
        standings[player].draws += 1
        standings[player].totalPoints += 1
      } else {
        standings[player].losses += 1
      }
    }

    for (const player of game.team2) {
      if (!standings[player]) {
        standings[player] = {
          playerId: player,
          playerName: player,
          wins: 0,
          draws: 0,
          losses: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          pointDifferential: 0,
          totalPoints: 0,
        }
      }

      standings[player].pointsFor += team2Score
      standings[player].pointsAgainst += team1Score

      if (team2Score > team1Score) {
        standings[player].wins += 1
        standings[player].totalPoints += 3
      } else if (team2Score === team1Score) {
        standings[player].draws += 1
        standings[player].totalPoints += 1
      } else {
        standings[player].losses += 1
      }
    }
  }

  for (const player of players) {
    standings[player].pointDifferential =
      standings[player].pointsFor - standings[player].pointsAgainst
  }

  const standingsList = Object.values(standings)
  standingsList.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints
    }

    if (b.pointDifferential !== a.pointDifferential) {
      return b.pointDifferential - a.pointDifferential
    }

    return b.pointsFor - a.pointsFor
  })

  return standingsList
}

export function getKotBAdvancingPlayers(
  groups: { groupId: string; players: string[] }[],
  advanceCount: number,
  wildcardCount: number
): string[] {
  const advancedPlayers: string[] = []
  const wildcardCandidates: { player: string; points: number }[] = []

  for (const group of groups) {
    const standings = calculateKotBStandings([], group.players)

    for (let i = 0; i < Math.min(advanceCount, standings.length); i++) {
      advancedPlayers.push(standings[i].playerId)
    }

    for (let i = advanceCount; i < standings.length; i++) {
      wildcardCandidates.push({
        player: standings[i].playerId,
        points: standings[i].totalPoints,
      })
    }
  }

  wildcardCandidates.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points
    }
    return 0
  })

  for (let i = 0; i < Math.min(wildcardCount, wildcardCandidates.length); i++) {
    if (!advancedPlayers.includes(wildcardCandidates[i].player)) {
      advancedPlayers.push(wildcardCandidates[i].player)
    }
  }

  return advancedPlayers
}

export function generateKotBKnockout(advancedPlayers: string[]): KotBGame[] {
  const games: KotBGame[] = []

  if (advancedPlayers.length < 2) {
    return games
  }

  const players = [...advancedPlayers]
  let round = 1

  while (players.length > 1) {
    const roundGames: KotBGame[] = []

    const topSeedIndex = 0
    const bottomSeedIndex = players.length - 1

    let pairings: [string, string][] = []

    if (players.length % 2 === 1) {
      const byePlayer = players[Math.floor(players.length / 2)]
      pairings = []

      for (let i = 0; i < Math.floor(players.length / 2); i++) {
        const topSeed = players[i]
        const bottomSeed = players[players.length - 1 - i]

        if (topSeed !== byePlayer && bottomSeed !== byePlayer) {
          pairings.push([topSeed, bottomSeed])
        }
      }

      pairings.push([byePlayer, ''])
    } else {
      for (let i = 0; i < players.length / 2; i++) {
        const topSeed = players[i]
        const bottomSeed = players[players.length - 1 - i]
        pairings.push([topSeed, bottomSeed])
      }
    }

    for (const [player1, player2] of pairings) {
      if (player2 === '') {
        games.push({
          players: [player1],
          team1: [player1],
          team2: [],
          completed: false,
        })
      } else {
        games.push({
          players: [player1, player2],
          team1: [player1],
          team2: [player2],
          completed: false,
        })
      }
    }

    players.length = Math.ceil(players.length / 2)
    round += 1
  }

  return games
}
