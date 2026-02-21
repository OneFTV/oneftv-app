import { RankingRepository } from './ranking.repository'

export class RankingService {
  static async getRankings(format: string | null, page: number, limit: number) {
    const tournamentPlayers = await RankingRepository.getAllTournamentPlayers()

    let filtered = tournamentPlayers
    if (format === 'KOTB' || format === 'BRACKET') {
      filtered = tournamentPlayers.filter((tp) => tp.tournament.format === format)
    }

    const userStats = new Map<
      string,
      {
        userId: string
        userName: string
        totalWins: number
        totalLosses: number
        totalPoints: number
        totalPointDiff: number
        tournamentsPlayed: number
        tournamentsWon: number
      }
    >()

    filtered.forEach((tp) => {
      const key = tp.userId
      const existing = userStats.get(key) || {
        userId: tp.userId,
        userName: tp.user.name,
        totalWins: 0,
        totalLosses: 0,
        totalPoints: 0,
        totalPointDiff: 0,
        tournamentsPlayed: 0,
        tournamentsWon: 0,
      }

      existing.totalWins += tp.wins || 0
      existing.totalLosses += tp.losses || 0
      existing.totalPoints += tp.points || 0
      existing.totalPointDiff += tp.pointDiff || 0
      existing.tournamentsPlayed += 1

      if (tp.wins && tp.losses && tp.wins > tp.losses) {
        existing.tournamentsWon += 1
      }

      userStats.set(key, existing)
    })

    const rankings = Array.from(userStats.values())
      .map((stats, index) => {
        const gamesPlayed = stats.totalWins + stats.totalLosses
        const winRate = gamesPlayed > 0 ? (stats.totalWins / gamesPlayed) * 100 : 0

        return {
          rank: index + 1,
          userId: stats.userId,
          name: stats.userName,
          stats: {
            totalPoints: stats.totalPoints,
            totalWins: stats.totalWins,
            totalLosses: stats.totalLosses,
            totalPointDiff: stats.totalPointDiff,
            gamesPlayed,
            winRate: Number(winRate.toFixed(2)),
            tournamentsPlayed: stats.tournamentsPlayed,
            tournamentsWon: stats.tournamentsWon,
          },
        }
      })
      .sort((a, b) => {
        if (b.stats.totalPoints !== a.stats.totalPoints) {
          return b.stats.totalPoints - a.stats.totalPoints
        }
        if (b.stats.winRate !== a.stats.winRate) {
          return b.stats.winRate - a.stats.winRate
        }
        return b.stats.totalPointDiff - a.stats.totalPointDiff
      })
      .map((rank, index) => ({ ...rank, rank: index + 1 }))

    const total = rankings.length
    const paginatedRankings = rankings.slice((page - 1) * limit, page * limit)

    return {
      data: paginatedRankings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      filter: { format: format || 'ALL' },
    }
  }
}
