import { prisma } from '@/shared/database/prisma'

export class RankingRepository {
  static async getAllTournamentPlayers() {
    return prisma.tournamentPlayer.findMany({
      include: {
        User: { select: { id: true, name: true } },
        Tournament: { select: { format: true } },
      },
    })
  }
}
