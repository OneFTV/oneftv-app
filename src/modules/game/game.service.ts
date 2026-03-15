import { GameRepository } from './game.repository'
import { validateGameScores } from './score.validator'
import { NotFoundError, ForbiddenError, ValidationError } from '@/shared/api/errors'
import { prisma } from '@/shared/database/prisma'
import type { UpdateGameScoreInput, GameListItem } from './game.types'
import type { BatchUpdateScoresData } from './game.schemas'

// NFA seeding pairs for bracket placement (must match double-elimination.ts)
const SEEDING_PAIRS_16: [number, number][] = [
  [1, 16], [8, 9], [4, 13], [5, 12],
  [2, 15], [7, 10], [3, 14], [6, 11],
]

const SEEDING_PAIRS_8: [number, number][] = [
  [1, 8], [4, 5], [2, 7], [3, 6],
]

export class GameService {
  static async getById(id: string) {
    const game = await GameRepository.findById(id)
    if (!game) throw new NotFoundError('Game', id)
    return game
  }

  static async listByTournament(tournamentId: string, categoryId?: string): Promise<GameListItem[]> {
    const games = await GameRepository.findByTournament(tournamentId, categoryId)

    // Build reverse routing map: gameId → { homeSource, awaySource }
    // For each game, find which other games feed into its home/away slots
    const sourceMap = new Map<string, { homeSource: string | null; awaySource: string | null }>()
    for (const g of games) {
      if (g.winnerNextGameId) {
        const entry = sourceMap.get(g.winnerNextGameId) || { homeSource: null, awaySource: null }
        const label = g.matchNumber != null ? `WM${g.matchNumber}` : null
        if (g.winnerSlot === 'home') entry.homeSource = label
        else if (g.winnerSlot === 'away') entry.awaySource = label
        sourceMap.set(g.winnerNextGameId, entry)
      }
      if (g.loserNextGameId) {
        const entry = sourceMap.get(g.loserNextGameId) || { homeSource: null, awaySource: null }
        const label = g.matchNumber != null ? `LM${g.matchNumber}` : null
        if (g.loserSlot === 'home') entry.homeSource = label
        else if (g.loserSlot === 'away') entry.awaySource = label
        sourceMap.set(g.loserNextGameId, entry)
      }
    }

    // Cross-category routing: find games from OTHER categories that feed into
    // this category's games (e.g. D1 losers → D2 first round)
    if (categoryId) {
      const gameIds = new Set(games.map((g) => g.id))
      const crossCategoryFeeders = await prisma.game.findMany({
        where: {
          tournamentId,
          categoryId: { not: categoryId },
          OR: [
            { winnerNextGameId: { in: [...gameIds] } },
            { loserNextGameId: { in: [...gameIds] } },
          ],
        },
        select: {
          matchNumber: true,
          winnerNextGameId: true,
          winnerSlot: true,
          loserNextGameId: true,
          loserSlot: true,
          Round: { select: { name: true } },
        },
      })
      for (const f of crossCategoryFeeders) {
        if (f.winnerNextGameId && gameIds.has(f.winnerNextGameId)) {
          const entry = sourceMap.get(f.winnerNextGameId) || { homeSource: null, awaySource: null }
          const label = f.matchNumber != null ? `WM${f.matchNumber}` : null
          if (f.winnerSlot === 'home') entry.homeSource = label
          else if (f.winnerSlot === 'away') entry.awaySource = label
          sourceMap.set(f.winnerNextGameId, entry)
        }
        if (f.loserNextGameId && gameIds.has(f.loserNextGameId)) {
          const entry = sourceMap.get(f.loserNextGameId) || { homeSource: null, awaySource: null }
          const label = f.matchNumber != null ? `LM${f.matchNumber}` : null
          if (f.loserSlot === 'home') entry.homeSource = label
          else if (f.loserSlot === 'away') entry.awaySource = label
          sourceMap.set(f.loserNextGameId, entry)
        }
      }
    }

    return games.map((game) => {
      const homePlayers = [game.User_Game_player1HomeIdToUser?.name, game.User_Game_player2HomeIdToUser?.name]
        .filter(Boolean)
        .join(' & ')
      const awayPlayers = [game.User_Game_player1AwayIdToUser?.name, game.User_Game_player2AwayIdToUser?.name]
        .filter(Boolean)
        .join(' & ')

      // Show source game reference instead of TBD (e.g. "WM17" = winner of M17)
      const sources = sourceMap.get(game.id)
      const homeLabel = homePlayers || sources?.homeSource || 'TBD'
      const awayLabel = awayPlayers || sources?.awaySource || 'TBD'

      return {
        id: game.id,
        roundName: game.Round?.name || 'Unassigned',
        roundNumber: game.Round?.roundNumber ?? null,
        roundType: game.Round?.type ?? null,
        court: game.courtNumber,
        scheduledTime: game.scheduledTime?.toISOString() || null,
        player1: homeLabel,
        player2: awayLabel,
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
        bestOf3: game.Round?.bestOf3 ?? false,
        status: game.status,
        winningSide: game.winningSide ?? null,
        groupName: game.Group?.name || null,
        categoryId: game.categoryId ?? null,
        matchNumber: game.matchNumber ?? null,
        bracketSide: game.bracketSide ?? game.Round?.bracketSide ?? null,
        winnerNextGameId: game.winnerNextGameId ?? null,
        loserNextGameId: game.loserNextGameId ?? null,
        seedTarget: game.seedTarget ?? null,
      }
    })
  }

  static async updateScore(id: string, input: UpdateGameScoreInput, userId: string) {
    const game = await GameRepository.findByIdForUpdate(id)
    if (!game) throw new NotFoundError('Game', id)

    if (game.Tournament.organizerId !== userId) {
      throw new ForbiddenError('Only the tournament organizer can update game scores')
    }

    const isBestOf3 = game.Round?.bestOf3 ?? false
    const pointsPerSet = game.Tournament.pointsPerSet || 18

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

  static async batchUpdateScores(input: BatchUpdateScoresData, userId: string) {
    const results: Array<{ gameId: string; success: boolean; error?: string }> = []

    for (const entry of input.scores) {
      try {
        const game = await GameRepository.findByIdForUpdate(entry.gameId)
        if (!game) {
          results.push({ gameId: entry.gameId, success: false, error: 'Game not found' })
          continue
        }

        if (game.Tournament.organizerId !== userId) {
          results.push({ gameId: entry.gameId, success: false, error: 'Not authorized' })
          continue
        }

        const isBestOf3 = game.Round?.bestOf3 ?? false
        const pointsPerSet = game.Tournament.pointsPerSet || 18

        const { winningSide } = validateGameScores(entry, isBestOf3, pointsPerSet)

        await GameRepository.updateScore(entry.gameId, {
          scoreHome: entry.scoreHome,
          scoreAway: entry.scoreAway,
          set2Home: isBestOf3 ? (entry.set2Home ?? null) : null,
          set2Away: isBestOf3 ? (entry.set2Away ?? null) : null,
          set3Home: isBestOf3 ? (entry.set3Home ?? null) : null,
          set3Away: isBestOf3 ? (entry.set3Away ?? null) : null,
          winningSide,
          status: 'completed',
        })

        if (winningSide) {
          this.advanceBracket(entry.gameId, winningSide).catch((err) => {
            console.error(`[advanceBracket] Error routing game ${entry.gameId}:`, err)
          })
        }

        results.push({ gameId: entry.gameId, success: true })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        results.push({ gameId: entry.gameId, success: false, error: message })
      }
    }

    return results
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
   * Creates a TeamRegistration with status='seeded' in the target category,
   * then places the players into the correct first-round bracket game slot.
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

    // --- Place the team into the actual bracket game slot ---
    await this.placeSeedInBracketGame(
      targetCategory.id,
      seedNumber,
      player1Id,
      player2Id
    )
  }

  /**
   * Given a seed number and target category, find the correct first-round
   * bracket game and slot (home/away) using NFA seeding pairs, then update
   * the game with the player IDs.
   */
  private static async placeSeedInBracketGame(
    categoryId: string,
    seedNumber: number,
    player1Id: string,
    player2Id: string
  ) {
    // Find all first-round winners-bracket games for the target category,
    // ordered by matchNumber so index aligns with seeding pair index.
    const firstRoundGames = await prisma.game.findMany({
      where: {
        categoryId,
        bracketSide: 'winners',
        Round: { roundNumber: 1 },
      },
      orderBy: { matchNumber: 'asc' },
      select: { id: true, matchNumber: true },
    })

    if (firstRoundGames.length === 0) return

    // Determine which seeding pair array to use based on bracket size
    const bracketSize = firstRoundGames.length // number of first-round games
    let seedingPairs: [number, number][]
    if (bracketSize === 8) {
      seedingPairs = SEEDING_PAIRS_16  // 16-team bracket has 8 first-round games
    } else if (bracketSize === 4) {
      seedingPairs = SEEDING_PAIRS_8   // 8-team bracket has 4 first-round games
    } else {
      console.warn(`[placeSeedInBracketGame] Unexpected bracket size: ${bracketSize} first-round games`)
      return
    }

    // Find which game index and slot this seed maps to
    let targetGameIndex: number | null = null
    let targetSlot: 'home' | 'away' | null = null

    for (let i = 0; i < seedingPairs.length; i++) {
      const [homeSeed, awaySeed] = seedingPairs[i]
      if (seedNumber === homeSeed) {
        targetGameIndex = i
        targetSlot = 'home'
        break
      }
      if (seedNumber === awaySeed) {
        targetGameIndex = i
        targetSlot = 'away'
        break
      }
    }

    if (targetGameIndex === null || targetSlot === null) {
      console.warn(`[placeSeedInBracketGame] Seed ${seedNumber} not found in seeding pairs`)
      return
    }

    if (targetGameIndex >= firstRoundGames.length) {
      console.warn(`[placeSeedInBracketGame] Game index ${targetGameIndex} exceeds available games (${firstRoundGames.length})`)
      return
    }

    const targetGame = firstRoundGames[targetGameIndex]

    // Update the target game with the player IDs in the correct slot
    const updateData: Record<string, string> = {}
    if (targetSlot === 'home') {
      updateData.player1HomeId = player1Id
      updateData.player2HomeId = player2Id
    } else {
      updateData.player1AwayId = player1Id
      updateData.player2AwayId = player2Id
    }

    await prisma.game.update({
      where: { id: targetGame.id },
      data: updateData,
    })

    console.log(
      `[placeSeedInBracketGame] Placed seed ${seedNumber} into game ${targetGame.matchNumber} (${targetSlot} slot)`
    )
  }
}
