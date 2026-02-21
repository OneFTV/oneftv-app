import { AthleteRepository } from './athlete.repository'
import { NotFoundError } from '@/shared/api/errors'
import { parsePagination } from '@/shared/api/pagination'

export class AthleteService {
  static async list(searchParams: URLSearchParams) {
    const { page, limit } = parsePagination(searchParams)
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {
      tournamentPlayers: { some: {} },
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ]
    }

    const { total, users } = await AthleteRepository.findMany(where, page, limit)

    const athletes = users.map((user) => {
      const allTPs = user.tournamentPlayers
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
          id: tp.tournament.id,
          name: tp.tournament.name,
          format: tp.tournament.format,
          date: tp.tournament.date,
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

    const totalWins = user.tournamentPlayers.reduce((sum, tp) => sum + (tp.wins || 0), 0)
    const totalLosses = user.tournamentPlayers.reduce((sum, tp) => sum + (tp.losses || 0), 0)
    const totalPoints = user.tournamentPlayers.reduce((sum, tp) => sum + (tp.points || 0), 0)
    const totalPointDiff = user.tournamentPlayers.reduce((sum, tp) => sum + (tp.pointDiff || 0), 0)
    const tournamentsPlayed = user.tournamentPlayers.length
    const tournamentsWon = user.tournamentPlayers.filter((tp) => {
      const winRate = tp.wins && tp.losses ? tp.wins / (tp.wins + tp.losses) : 0
      return winRate > 0.5
    }).length

    const gamesPlayed = totalWins + totalLosses
    const winRate = gamesPlayed > 0 ? (totalWins / gamesPlayed) * 100 : 0

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
      },
      tournamentHistory: user.tournamentPlayers.map((tp) => ({
        id: tp.id,
        tournament: {
          id: tp.tournament.id,
          name: tp.tournament.name,
          format: tp.tournament.format,
          startDate: tp.tournament.date,
          endDate: tp.tournament.endDate,
          location: tp.tournament.location,
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
