import { AthleteRepository } from './athlete.repository'
import { NotFoundError } from '@/shared/api/errors'
import { parsePagination } from '@/shared/api/pagination'

export class AthleteService {
  static async list(searchParams: URLSearchParams) {
    const { page, limit } = parsePagination(searchParams)
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {
      TournamentPlayer: { some: {} },
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ]
    }

    const { total, users } = await AthleteRepository.findMany(where, page, limit)

    const athletes = users.map((user) => {
      const allTPs = user.TournamentPlayer
      const totalWins = allTPs.reduce((sum, tp) => sum + (tp.wins || 0), 0)
      const totalLosses = allTPs.reduce((sum, tp) => sum + (tp.losses || 0), 0)
      const totalPoints = allTPs.reduce((sum, tp) => sum + (tp.points || 0), 0)
      const totalPointDiff = allTPs.reduce((sum, tp) => sum + (tp.pointDiff || 0), 0)
      const tournamentsPlayed = allTPs.length
      const tournamentsWon = allTPs.filter((tp) => tp.wins && tp.losses === 0).length
      const gamesPlayed = totalWins + totalLosses

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        nationality: user.nationality,
        country: user.country,
        level: user.level,
        flagEmoji: '',
        totalPoints,
        gamesWon: totalWins,
        gamesPlayed,
        winRate: gamesPlayed > 0 ? totalWins / gamesPlayed : 0,
        stats: {
          totalWins,
          totalLosses,
          totalPoints,
          totalPointDiff,
          tournamentsPlayed,
          tournamentsWon,
          winRate: gamesPlayed > 0 ? (totalWins / gamesPlayed) * 100 : 0,
        },
        tournaments: allTPs.map((tp) => ({
          id: tp.Tournament.id,
          name: tp.Tournament.name,
          format: tp.Tournament.format,
          date: tp.Tournament.date,
          wins: tp.wins,
          losses: tp.losses,
          points: tp.points,
        })),
      }
    })

    return {
      data: athletes,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    }
  }

  static async getById(id: string) {
    const user = await AthleteRepository.findById(id)
    if (!user) throw new NotFoundError('Athlete', id)

    const totalWins = user.TournamentPlayer.reduce((sum, tp) => sum + (tp.wins || 0), 0)
    const totalLosses = user.TournamentPlayer.reduce((sum, tp) => sum + (tp.losses || 0), 0)
    const totalPoints = user.TournamentPlayer.reduce((sum, tp) => sum + (tp.points || 0), 0)
    const totalPointDiff = user.TournamentPlayer.reduce((sum, tp) => sum + (tp.pointDiff || 0), 0)
    const tournamentsPlayed = user.TournamentPlayer.length
    const tournamentsWon = user.TournamentPlayer.filter((tp) => {
      const winRate = tp.wins && tp.losses ? tp.wins / (tp.wins + tp.losses) : 0
      return winRate > 0.5
    }).length

    const gamesPlayed = totalWins + totalLosses
    const winRate = gamesPlayed > 0 ? (totalWins / gamesPlayed) * 100 : 0

    // Compute placement per tournament: rank this player among all participants
    const placements = await Promise.all(
      user.TournamentPlayer.map(async (tp) => {
        const allPlayers = await AthleteRepository.getTournamentPlayers(tp.tournamentId, tp.categoryId ?? undefined)
        // Sort by wins desc, then pointDiff desc, then points desc
        const sorted = allPlayers.sort((a, b) => {
          if (b.wins !== a.wins) return b.wins - a.wins
          if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff
          return b.points - a.points
        })
        const rank = sorted.findIndex((p) => p.userId === user.id) + 1
        return rank > 0 ? rank : sorted.length
      })
    )

    const bestFinish = placements.length > 0 ? Math.min(...placements) : 0

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      nationality: user.nationality,
      country: user.country,
      level: user.level,
      createdAt: user.createdAt,
      overallStats: {
        gamesPlayed,
        wins: totalWins,
        losses: totalLosses,
        points: totalPoints,
        pointDiff: totalPointDiff,
        winRate: Number(winRate.toFixed(2)),
        tournamentsPlayed,
        tournamentsWon,
        bestFinish,
      },
      tournamentHistory: user.TournamentPlayer.map((tp, idx) => ({
        id: tp.id,
        placement: placements[idx] || null,
        tournament: {
          id: tp.Tournament.id,
          name: tp.Tournament.name,
          format: tp.Tournament.format || (tp.Category ? tp.Category.format : null) || 'N/A',
          startDate: tp.Tournament.date,
          endDate: tp.Tournament.endDate,
          location: tp.Tournament.location,
        },
        stats: {
          wins: tp.wins,
          losses: tp.losses,
          points: tp.points,
          pointDiff: tp.pointDiff,
        },
      })),
    }
  }
}
