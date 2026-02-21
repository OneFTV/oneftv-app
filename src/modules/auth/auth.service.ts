import bcryptjs from 'bcryptjs'
import { AuthRepository } from './auth.repository'
import { ConflictError, NotFoundError } from '@/shared/api/errors'
import { UpdateProfileData } from './auth.schemas'

export class AuthService {
  static async register(email: string, name: string, password: string) {
    const existingUser = await AuthRepository.findUserByEmail(email)
    if (existingUser) {
      throw new ConflictError('Email already registered')
    }

    const hashedPassword = await bcryptjs.hash(password, 12)
    return AuthRepository.createUser({ email, name, password: hashedPassword })
  }

  static async getProfile(userId: string) {
    const user = await AuthRepository.getUserProfile(userId)
    if (!user) throw new NotFoundError('User', userId)

    return {
      name: user.name,
      email: user.email,
      nationality: user.nationality || '',
      phone: user.phone || '',
      street: user.street || '',
      number: user.number || '',
      complement: user.complement || '',
      state: user.state || '',
      country: user.country || '',
      level: user.level || 'Beginner',
      preferredLanguage: user.preferredLanguage || '',
    }
  }

  static async updateProfile(userId: string, data: UpdateProfileData) {
    return AuthRepository.updateUserProfile(userId, {
      name: data.name,
      nationality: data.nationality || null,
      phone: data.phone || null,
      street: data.street || null,
      number: data.number || null,
      complement: data.complement || null,
      state: data.state || null,
      country: data.country || null,
      level: data.level || null,
      preferredLanguage: data.preferredLanguage !== undefined ? (data.preferredLanguage || null) : undefined,
    })
  }

  static async getStats(userId: string) {
    const tournamentPlayers = await AuthRepository.getUserStats(userId)

    let totalWins = 0
    let totalLosses = 0
    let totalPoints = 0
    let bestTournament = ''
    let bestTournamentPoints = 0

    for (const tp of tournamentPlayers) {
      totalWins += tp.wins || 0
      totalLosses += tp.losses || 0
      totalPoints += tp.points || 0

      if ((tp.points || 0) > bestTournamentPoints) {
        bestTournamentPoints = tp.points || 0
        bestTournament = tp.tournament.name
      }
    }

    const gamesPlayed = totalWins + totalLosses
    const winRate = gamesPlayed > 0 ? Number(((totalWins / gamesPlayed) * 100).toFixed(1)) : 0

    return { gamesPlayed, wins: totalWins, losses: totalLosses, totalPoints, winRate, bestTournament }
  }

  static async getOrganizerStats(userId: string) {
    const tournaments = await AuthRepository.getOrganizerTournaments(userId)

    const totalPlayers = tournaments.reduce(
      (sum, t) => sum + (t._count?.players || 0),
      0
    )

    return {
      tournamentCount: tournaments.length,
      totalPlayers,
      tournaments: tournaments.map(t => ({
        id: t.id,
        name: t.name,
        status: t.status,
        date: t.date.toISOString(),
        playerCount: t._count?.players || 0,
      })),
    }
  }
}
