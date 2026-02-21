import { prisma } from '@/shared/database/prisma'

export class RankingRepository {
  static async getAllTournamentPlayers() {
    return prisma.tournamentPlayer.findMany({
      include: {
        user: { select: { id: true, name: true } },
        tournament: { select: { format: true } },
      },
    })
  }
}
