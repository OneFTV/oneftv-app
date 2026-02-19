import { GameRepository } from './game.repository'
import { validateGameScores } from './score.validator'
import { NotFoundError, ForbiddenError } from '@/shared/api/errors'
import { prisma } from '@/shared/database/prisma'
import type { UpdateGameScoreInput, GameListItem } from './game.types'

export class GameService {
  static async getById(id: string) {
    const game = await GameRepository.findById(id)
    if (!game) throw new NotFoundError('Game', id)
    return game
  }

  static async listByTournament(tournamentId: string, categoryId?: string): Promise<GameListItem[]> {
    const games = await GameRepository.findByTournament(tournamentId, categoryId)

    return games.map((game) => {
      const homePlayers = [game.player1Home?.name, game.player2Home?.name]
        .filter(Boolean)
        .join(' & ')
      const awayPlayers = [game.player1Away?.name, game.player2Away?.name]
        .filter(Boolean)
        .join(' & ')

      return {
        id: game.id,
        roundName: game.round?.name || 'Unassigned',
        roundNumber: game.round?.roundNumber ?? null,
        roundType: game.round?.type ?? null,
        court: game.courtNumber,
        scheduledTime: game.scheduledTime?.toISOString() || null,
        player1: homePlayers || 'TBD',
        player2: awayPlayers || 'TBD',
        player1HomeId: game.player1HomeId,
        player2HomeId: game.player2HomeId,
        player1AwayId: game.player1AwayId,
        player2AwayId: game.player2AwayId,
        score1: game.scoreHome,
        score2: game.scoreAway,
        set2Home: game.set2Home,
        set2Away: game.set2Away,
        set3Home: game.set3Home,
        set3Away: game.set3Away,
        bestOf3: game.round?.bestOf3 ?? false,
        status: game.status,
        winningSide: game.winningSide ?? null,
        groupName: game.group?.name || null,
        categoryId: game.categoryId ?? null,
        matchNumber: game.matchNumber ?? null,
        bracketSide: game.bracketSide ?? game.round?.bracketSide ?? null,
        winnerNextGameId: game.winnerNextGameId ?? null,
        loserNextGameId: game.loserNextGameId ?? null,
        seedTarget: game.seedTarget ?? null,
      }
    })
  }

  static async updateScore(id: string, input: UpdateGameScoreInput, userId: string) {
    const game = await GameRepository.findByIdForUpdate(id)
    if (!game) throw new NotFoundError('Game', id)

    if (game.tournament.organizerId !== userId) {
      throw new ForbiddenError('Only the tournament organizer can update game scores')
    }

    const isBestOf3 = game.round?.bestOf3 ?? false
    const pointsPerSet = game.tournament.pointsPerSet || 18

    const { winningSide } = validateGameScores(input, isBestOf3, pointsPerSet)

    const result = await GameRepository.updateScore(id, {
      scoreHome: input.scoreHome,
      scoreAway: input.scoreAway,
      set2Home: isBestOf3 ? (input.set2Home ?? null) : null,
      set2Away: isBestOf3 ? (input.set2Away ?? null) : null,
      set3Home: isBestOf3 ? (input.set3Home ?? null) : null,
      set3Away: isBestOf3 ? (input.set3Away ?? null) : null,
      winningSide,
      status: 'completed',
    })

    // Auto-advance bracket routing (fire-and-forget, don't block response)
    if (winningSide) {
      this.advanceBracket(id, winningSide).catch((err) => {
        console.error(`[advanceBracket] Error routing game ${id}:`, err)
      })
    }

    return result
  }

  /**
   * After a game completes, route winner/loser to their next games
   * and handle cross-division seeding.
   */
  private static async advanceBracket(gameId: string, winningSide: string) {
    const game = await GameRepository.findByIdWithRouting(gameId)
    if (!game || !game.matchNumber) return // Not a DE game

    // Determine winning and losing team player IDs
    const winnerPlayers =
      winningSide === 'home'
        ? { p1: game.player1HomeId, p2: game.player2HomeId }
        : { p1: game.player1AwayId, p2: game.player2AwayId }
    const loserPlayers =
      winningSide === 'home'
        ? { p1: game.player1AwayId, p2: game.player2AwayId }
        : { p1: game.player1HomeId, p2: game.player2HomeId }

    // Advance winner to next game
    if (game.winnerNextGameId && game.winnerSlot) {
      const updateData: Record<string, string | null> = {}
      if (game.winnerSlot === 'home') {
        updateData.player1HomeId = winnerPlayers.p1
        updateData.player2HomeId = winnerPlayers.p2
      } else {
        updateData.player1AwayId = winnerPlayers.p1
        updateData.player2AwayId = winnerPlayers.p2
      }
      await prisma.game.update({
        where: { id: game.winnerNextGameId },
        data: updateData,
      })
    }

    // Drop loser to losers bracket / bronze game
    if (game.loserNextGameId && game.loserSlot) {
      const updateData: Record<string, string | null> = {}
      if (game.loserSlot === 'home') {
        updateData.player1HomeId = loserPlayers.p1
        updateData.player2HomeId = loserPlayers.p2
      } else {
        updateData.player1AwayId = loserPlayers.p1
        updateData.player2AwayId = loserPlayers.p2
      }
      await prisma.game.update({
        where: { id: game.loserNextGameId },
        data: updateData,
      })
    }

    // Cross-division seeding: if this game has a seedTarget, create a
    // TeamRegistration in the target division category
    if (game.seedTarget && game.categoryId && game.tournamentId) {
      await this.handleCrossDivisionSeed(
        game.tournamentId,
        game.categoryId,
        game.seedTarget,
        loserPlayers.p1,
        loserPlayers.p2
      )
    }
  }

  /**
   * Seed a losing team into another division (D2 or D3).
   * Creates a TeamRegistration with status='seeded' in the target category.
   */
  private static async handleCrossDivisionSeed(
    tournamentId: string,
    sourceCategoryId: string,
    seedTarget: string,
    player1Id: string | null,
    player2Id: string | null
  ) {
    if (!player1Id || !player2Id) return

    // Parse seed target: "D2-S3" or "D3-S15"
    const match = seedTarget.match(/^(D\d)-S(\d+)$/)
    if (!match) return

    const divisionLabel = match[1]  // "D2" or "D3"
    const seedNumber = parseInt(match[2])

    // Find the target category by divisionLabel in the same tournament
    const targetCategory = await prisma.category.findFirst({
      where: { tournamentId, divisionLabel },
      select: { id: true },
    })

    if (!targetCategory) return

    // Upsert team registration with seed
    await prisma.teamRegistration.upsert({
      where: {
        categoryId_player1Id_player2Id: {
          categoryId: targetCategory.id,
          player1Id,
          player2Id,
        },
      },
      update: { seed: seedNumber, status: 'seeded' },
      create: {
        categoryId: targetCategory.id,
        player1Id,
        player2Id,
        seed: seedNumber,
        status: 'seeded',
      },
    })

    // Also create TournamentPlayer entries if not already present
    for (const userId of [player1Id, player2Id]) {
      const existing = await prisma.tournamentPlayer.findFirst({
        where: { tournamentId, userId, categoryId: targetCategory.id },
      })
      if (!existing) {
        await prisma.tournamentPlayer.create({
          data: {
            tournamentId,
            userId,
            categoryId: targetCategory.id,
            status: 'seeded',
          },
        })
      }
    }
  }
}
