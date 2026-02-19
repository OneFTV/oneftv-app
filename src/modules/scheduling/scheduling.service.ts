import { SchedulingRepository } from './scheduling.repository'
import {
  generateKotBGroups,
  generateKotBGames,
  generateBracketGames,
  generateRoundRobinGames,
} from './generators'
import {
  generateD1Bracket,
  generateD2Bracket,
  generateD3Bracket,
  resolveTeamAssignments,
  collectRounds,
} from './double-elimination'
import type { DEGameTemplate } from './scheduling.types'
import { NotFoundError, ForbiddenError, ValidationError } from '@/shared/api/errors'

export class SchedulingService {
  /**
   * Generate schedule for the entire tournament or a single category.
   * If categoryId is provided, only that category is generated.
   * If no categoryId, generates for all categories (or legacy single-format).
   */
  static async generateSchedule(tournamentId: string, userId: string, categoryId?: string) {
    const tournament = await SchedulingRepository.getTournamentForGeneration(tournamentId)

    if (!tournament) throw new NotFoundError('Tournament', tournamentId)

    if (tournament.organizer.id !== userId) {
      throw new ForbiddenError('Only the organizer can generate schedule')
    }

    // If categoryId specified, generate for that category only
    if (categoryId) {
      return this.generateForCategory(categoryId, userId)
    }

    // If tournament has categories, generate for each
    if (tournament.categories.length > 0) {
      for (const cat of tournament.categories) {
        await this.generateForCategoryInternal(
          tournamentId,
          cat.id,
          cat.format,
          cat.groupSize,
          cat.proLeague
        )
      }
    } else {
      // Legacy: single-format tournament without categories
      if (tournament.players.length < 2) {
        throw new ValidationError('Minimum 2 players required')
      }

      const playerIds = tournament.players.map((p) => p.userId)
      await SchedulingRepository.clearSchedule(tournamentId)

      const format = tournament.format
      if (format === 'king_of_the_beach') {
        await this.generateKotB(tournamentId, playerIds, tournament.groupSize || 4)
      } else if (format === 'bracket') {
        await this.generateBracket(tournamentId, playerIds, tournament.proLeague)
      } else if (format === 'round_robin') {
        await this.generateRoundRobin(tournamentId, playerIds)
      }
    }

    // Update tournament status
    await SchedulingRepository.updateTournamentStatus(tournamentId, 'in_progress')

    return SchedulingRepository.getTournamentWithSchedule(tournamentId)
  }

  /**
   * Generate schedule for a single category (public entry point).
   */
  static async generateForCategory(categoryId: string, userId: string) {
    const category = await SchedulingRepository.getCategoryForGeneration(categoryId)
    if (!category) throw new NotFoundError('Category', categoryId)

    if (category.tournament.organizerId !== userId) {
      throw new ForbiddenError('Only the organizer can generate schedule')
    }

    if (category.players.length < 2) {
      throw new ValidationError(`Category "${categoryId}" needs at least 2 players`)
    }

    await this.generateForCategoryInternal(
      category.tournament.id,
      categoryId,
      category.format,
      category.groupSize,
      category.proLeague
    )

    // Update category status
    await SchedulingRepository.updateCategoryStatus(categoryId, 'in_progress')

    return SchedulingRepository.getTournamentWithSchedule(category.tournament.id)
  }

  /**
   * Internal: generates schedule for a category within a tournament.
   */
  private static async generateForCategoryInternal(
    tournamentId: string,
    categoryId: string,
    format: string,
    groupSize: number,
    proLeague: boolean
  ) {
    // Get players for this category
    const category = await SchedulingRepository.getCategoryForGeneration(categoryId)
    if (!category || category.players.length < 2) return

    const playerIds = category.players.map((p) => p.userId)

    // Clear existing schedule for this category only
    await SchedulingRepository.clearSchedule(tournamentId, categoryId)

    if (format === 'king_of_the_beach') {
      await this.generateKotB(tournamentId, playerIds, groupSize, categoryId)
    } else if (format === 'bracket') {
      await this.generateBracket(tournamentId, playerIds, proLeague, categoryId)
    } else if (format === 'round_robin') {
      await this.generateRoundRobin(tournamentId, playerIds, categoryId)
    } else if (format === 'group_knockout') {
      // Group+Knockout: group stage then bracket knockout
      await this.generateKotB(tournamentId, playerIds, groupSize, categoryId)
    } else if (format === 'double_elimination') {
      await this.generateDoubleElimination(tournamentId, categoryId, category)
    }
  }

  private static async generateKotB(
    tournamentId: string,
    playerIds: string[],
    groupSize: number,
    categoryId?: string
  ) {
    const groups = generateKotBGroups(playerIds, groupSize)

    for (let i = 0; i < groups.length; i++) {
      const group = await SchedulingRepository.createGroup(
        tournamentId,
        `Group ${String.fromCharCode(65 + i)}`,
        categoryId
      )

      // Assign players to group
      for (const userId of groups[i]) {
        await SchedulingRepository.assignPlayerToGroup(tournamentId, userId, group.id)
      }

      // Generate games for this group
      const groupGames = generateKotBGames(groups[i])

      const round = await SchedulingRepository.createRound({
        name: `Group ${String.fromCharCode(65 + i)} - Round`,
        roundNumber: i + 1,
        tournamentId,
        type: 'group',
        categoryId,
      })

      for (const game of groupGames) {
        await SchedulingRepository.createGame({
          tournamentId,
          groupId: group.id,
          roundId: round.id,
          courtNumber: 1,
          player1HomeId: game.team1[0] || null,
          player2HomeId: game.team1[1] || null,
          player1AwayId: game.team2[0] || null,
          player2AwayId: game.team2[1] || null,
          status: 'scheduled',
          categoryId,
        })
      }
    }
  }

  private static async generateBracket(
    tournamentId: string,
    playerIds: string[],
    proLeague: boolean,
    categoryId?: string
  ) {
    const rounds = generateBracketGames(playerIds)
    const totalBracketRounds = Math.ceil(Math.log2(playerIds.length))

    for (let r = 0; r < rounds.length; r++) {
      const roundsFromEnd = totalBracketRounds - r
      let roundName = `Round ${r + 1}`
      let isBestOf3 = false

      if (roundsFromEnd === 1) {
        roundName = 'Final'
        isBestOf3 = proLeague
      } else if (roundsFromEnd === 2) {
        roundName = 'Semifinals'
        isBestOf3 = proLeague
      } else if (roundsFromEnd === 3) {
        roundName = 'Quarterfinals'
      } else if (roundsFromEnd === 4) {
        roundName = 'Round of 16'
      } else if (roundsFromEnd === 5) {
        roundName = 'Round of 32'
      }

      const round = await SchedulingRepository.createRound({
        name: roundName,
        roundNumber: r + 1,
        tournamentId,
        type: 'knockout',
        bestOf3: isBestOf3,
        categoryId,
      })

      for (const game of rounds[r]) {
        await SchedulingRepository.createGame({
          tournamentId,
          roundId: round.id,
          courtNumber: 1,
          player1HomeId: game.team1[0] || null,
          player2HomeId: game.team1[1] || null,
          player1AwayId: game.team2[0] || null,
          player2AwayId: game.team2[1] || null,
          status: 'scheduled',
          categoryId,
        })
      }
    }
  }

  private static async generateRoundRobin(
    tournamentId: string,
    playerIds: string[],
    categoryId?: string
  ) {
    const games = generateRoundRobinGames(playerIds)

    const round = await SchedulingRepository.createRound({
      name: 'Round Robin',
      roundNumber: 1,
      tournamentId,
      type: 'group',
      categoryId,
    })

    for (const game of games) {
      await SchedulingRepository.createGame({
        tournamentId,
        roundId: round.id,
        courtNumber: 1,
        player1HomeId: game.team1[0] || null,
        player2HomeId: game.team1[1] || null,
        player1AwayId: game.team2[0] || null,
        player2AwayId: game.team2[1] || null,
        status: 'scheduled',
        categoryId,
      })
    }
  }

  /**
   * Generate a double-elimination bracket for a category.
   * Determines which generator to use based on category's divisionLabel/bracketType.
   */
  private static async generateDoubleElimination(
    tournamentId: string,
    categoryId: string,
    category: NonNullable<Awaited<ReturnType<typeof SchedulingRepository.getCategoryForGeneration>>>
  ) {
    // Get team registrations for this category, ordered by seed
    const teamRegs = await SchedulingRepository.getTeamRegistrations(categoryId)
    const teamIds = teamRegs.map((t) => t.id)

    let templates: DEGameTemplate[]

    // Determine bracket type based on team count and category metadata
    if (teamIds.length === 32) {
      templates = generateD1Bracket(teamIds)
    } else if (teamIds.length === 16) {
      templates = generateD3Bracket(teamIds)
    } else if (teamIds.length === 8) {
      templates = generateD2Bracket(teamIds)
    } else {
      throw new ValidationError(
        `Double elimination requires 8, 16, or 32 teams. Got ${teamIds.length}.`
      )
    }

    // Resolve team assignments
    const assignments = resolveTeamAssignments(templates, teamIds)

    // Collect unique rounds and create them
    const roundDefs = collectRounds(templates)
    const roundIdMap = new Map<string, string>() // roundLabel → roundId

    for (const rd of roundDefs) {
      const round = await SchedulingRepository.createRound({
        name: rd.roundLabel,
        roundNumber: rd.roundNumber,
        tournamentId,
        type: 'knockout',
        categoryId,
        bracketSide: rd.bracketSide,
      })
      roundIdMap.set(rd.roundLabel, round.id)
    }

    // Create all games (first pass — no routing yet)
    const matchToGameId = new Map<number, string>() // matchNumber → gameId

    for (const t of templates) {
      const roundId = roundIdMap.get(t.roundLabel)!
      const a = assignments.get(t.matchNumber)

      // For seeded games, look up the team's player IDs from the registration
      let p1HomeId: string | null = null
      let p2HomeId: string | null = null
      let p1AwayId: string | null = null
      let p2AwayId: string | null = null

      if (a?.homeTeamRegId) {
        const reg = teamRegs.find((r) => r.id === a.homeTeamRegId)
        if (reg) {
          p1HomeId = reg.player1Id
          p2HomeId = reg.player2Id
        }
      }
      if (a?.awayTeamRegId) {
        const reg = teamRegs.find((r) => r.id === a.awayTeamRegId)
        if (reg) {
          p1AwayId = reg.player1Id
          p2AwayId = reg.player2Id
        }
      }

      const game = await SchedulingRepository.createGameDE({
        tournamentId,
        roundId,
        courtNumber: 1,
        player1HomeId: p1HomeId,
        player2HomeId: p2HomeId,
        player1AwayId: p1AwayId,
        player2AwayId: p2AwayId,
        status: 'scheduled',
        categoryId,
        matchNumber: t.matchNumber,
        bracketSide: t.bracketSide,
        seedTarget: t.seedTarget,
      })

      matchToGameId.set(t.matchNumber, game.id)
    }

    // Second pass: wire up routing (winnerNextGameId, loserNextGameId)
    for (const t of templates) {
      const gameId = matchToGameId.get(t.matchNumber)!
      const routingData: {
        winnerNextGameId?: string
        winnerSlot?: string
        loserNextGameId?: string
        loserSlot?: string
      } = {}

      if (t.winnerGoesTo) {
        const nextId = matchToGameId.get(t.winnerGoesTo)
        if (nextId) {
          routingData.winnerNextGameId = nextId
          routingData.winnerSlot = t.winnerSlot
        }
      }

      if (t.loserGoesTo) {
        const nextId = matchToGameId.get(t.loserGoesTo)
        if (nextId) {
          routingData.loserNextGameId = nextId
          routingData.loserSlot = t.loserSlot
        }
      }

      if (Object.keys(routingData).length > 0) {
        await SchedulingRepository.updateGameRouting(gameId, routingData)
      }
    }
  }
}
