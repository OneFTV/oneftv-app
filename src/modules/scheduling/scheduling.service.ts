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
import { prisma } from '@/shared/database/prisma'
import { generateNFACascade } from '@/lib/nfaCascadeGenerator'

export class SchedulingService {
  /**
   * Generate schedule for the entire tournament or a single category.
   * If categoryId is provided, only that category is generated.
   * If no categoryId, generates for all categories (or legacy single-format).
   */
  static async generateSchedule(tournamentId: string, userId: string, categoryId?: string) {
    const tournament = await SchedulingRepository.getTournamentForGeneration(tournamentId)

    if (!tournament) throw new NotFoundError('Tournament', tournamentId)

    if (tournament.User.id !== userId) {
      throw new ForbiddenError('Only the organizer can generate schedule')
    }

    // If categoryId specified, generate for that category only
    if (categoryId) {
      return this.generateForCategory(categoryId, userId)
    }

    // If tournament has categories, generate for each
    if (tournament.Category.length > 0) {
      for (const cat of tournament.Category) {
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
      if (tournament.TournamentPlayer.length < 2) {
        throw new ValidationError('Minimum 2 players required')
      }

      const playerIds = tournament.TournamentPlayer.map((p) => p.userId)
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

    // Assign courts based on primary court preferences
    await this.assignCourts(tournamentId, tournament.numCourts, tournament.primaryCourts)

    // Only advance to in_progress if currently in registration or draft
    // (don't downgrade if already completed, etc.)
    if (tournament.status === 'registration' || tournament.status === 'draft') {
      await SchedulingRepository.updateTournamentStatus(tournamentId, 'in_progress')
    }

    return SchedulingRepository.getTournamentWithSchedule(tournamentId)
  }

  /**
   * Generate schedule for a single category (public entry point).
   */
  static async generateForCategory(categoryId: string, userId: string) {
    const category = await SchedulingRepository.getCategoryForGeneration(categoryId)
    if (!category) throw new NotFoundError('Category', categoryId)

    if (category.Tournament.organizerId !== userId) {
      throw new ForbiddenError('Only the organizer can generate schedule')
    }

    if (category.TournamentPlayer.length < 2) {
      throw new ValidationError(`Category "${categoryId}" needs at least 2 players`)
    }

    await this.generateForCategoryInternal(
      category.Tournament.id,
      categoryId,
      category.format,
      category.groupSize,
      category.proLeague
    )

    // Assign courts for this category's games
    await this.assignCourts(
      category.Tournament.id,
      category.Tournament.numCourts,
      null, // primaryCourts not on category query; fetch from tournament
      categoryId
    )

    // Update category status
    await SchedulingRepository.updateCategoryStatus(categoryId, 'in_progress')

    return SchedulingRepository.getTournamentWithSchedule(category.Tournament.id)
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
    if (!category || category.TournamentPlayer.length < 2) return

    const playerIds = category.TournamentPlayer.map((p) => p.userId)

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

    // First pass: create all rounds and games, collecting IDs
    const createdGames: { id: string; roundIndex: number; gameIndex: number }[][] = []
    let matchCounter = 1

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

      const roundGames: { id: string; roundIndex: number; gameIndex: number }[] = []

      for (let g = 0; g < rounds[r].length; g++) {
        const game = rounds[r][g]
        const created = await SchedulingRepository.createGame({
          tournamentId,
          roundId: round.id,
          courtNumber: 1,
          player1HomeId: game.team1[0] || null,
          player2HomeId: game.team1[1] || null,
          player1AwayId: game.team2[0] || null,
          player2AwayId: game.team2[1] || null,
          status: 'scheduled',
          categoryId,
          matchNumber: matchCounter++,
        })
        roundGames.push({ id: created.id, roundIndex: r, gameIndex: g })
      }

      createdGames.push(roundGames)
    }

    // Second pass: wire up winnerNextGameId and winnerSlot
    // Game i in round r feeds into game floor(i/2) in round r+1
    // If i is even → home slot; if i is odd → away slot
    for (let r = 0; r < createdGames.length - 1; r++) {
      for (let g = 0; g < createdGames[r].length; g++) {
        const nextGameIndex = Math.floor(g / 2)
        const nextRound = createdGames[r + 1]
        if (nextRound && nextRound[nextGameIndex]) {
          const winnerSlot = g % 2 === 0 ? 'home' : 'away'
          await SchedulingRepository.updateGameRouting(createdGames[r][g].id, {
            winnerNextGameId: nextRound[nextGameIndex].id,
            winnerSlot,
          })
        }
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

  /**
   * Assign court numbers to games based on importance.
   * - Finals and semifinals get primary (center) courts
   * - Higher-seeded/ranked player games get center court preference for pool play
   * - Remaining games are distributed round-robin across other courts
   */
  private static async assignCourts(
    tournamentId: string,
    numCourts: number,
    primaryCourtsJson?: string | null,
    categoryId?: string
  ) {
    // Parse primary courts; default to [1] if not set
    let primaryCourts: number[] = [1]
    if (primaryCourtsJson) {
      try {
        const parsed = JSON.parse(primaryCourtsJson)
        if (Array.isArray(parsed) && parsed.length > 0) {
          primaryCourts = parsed.map(Number).filter((n) => n >= 1 && n <= numCourts)
          if (primaryCourts.length === 0) primaryCourts = [1]
        }
      } catch {
        // ignore parse errors, use default
      }
    } else if (!primaryCourtsJson && primaryCourtsJson !== '') {
      // Fetch from tournament if not provided (e.g. single-category generation)
      const t = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        select: { primaryCourts: true },
      })
      if (t?.primaryCourts) {
        try {
          const parsed = JSON.parse(t.primaryCourts)
          if (Array.isArray(parsed) && parsed.length > 0) {
            primaryCourts = parsed.map(Number).filter((n) => n >= 1 && n <= numCourts)
            if (primaryCourts.length === 0) primaryCourts = [1]
          }
        } catch {
          // ignore
        }
      }
    }

    if (numCourts <= 1) return // Only one court, nothing to distribute

    // Build list of all non-primary courts
    const secondaryCourts: number[] = []
    for (let c = 1; c <= numCourts; c++) {
      if (!primaryCourts.includes(c)) secondaryCourts.push(c)
    }

    // Fetch all games for this tournament (or category)
    const whereClause: { tournamentId: string; categoryId?: string } = { tournamentId }
    if (categoryId) whereClause.categoryId = categoryId

    const games = await prisma.game.findMany({
      where: whereClause,
      include: {
        Round: { select: { name: true, type: true, roundNumber: true } },
      },
      orderBy: [
        { Round: { roundNumber: 'asc' } },
        { matchNumber: 'asc' },
      ],
    })

    if (games.length === 0) return

    // Classify games by importance
    const FINAL_NAMES = ['final', 'finals', 'grand final', 'grand finals', 'championship']
    const SEMI_NAMES = ['semifinal', 'semifinals', 'semi-final', 'semi-finals']

    type GamePriority = { id: string; priority: number }
    const gamePriorities: GamePriority[] = games.map((game) => {
      const roundName = (game.Round?.name ?? '').toLowerCase()
      const roundType = game.Round?.type ?? 'group'

      // Priority: lower = more important = center court
      let priority = 100

      if (FINAL_NAMES.some((n) => roundName.includes(n))) {
        priority = 1 // Finals → highest priority
      } else if (SEMI_NAMES.some((n) => roundName.includes(n))) {
        priority = 2 // Semifinals
      } else if (roundName.includes('quarterfinal')) {
        priority = 3
      } else if (roundType === 'knockout') {
        // Later knockout rounds = higher priority (higher roundNumber = later)
        priority = 10 - Math.min(game.Round?.roundNumber ?? 0, 9)
      } else {
        // Pool/group play — use matchNumber as tiebreaker (lower match = higher seed games)
        priority = 50 + (game.matchNumber ?? 999)
      }

      return { id: game.id, priority }
    })

    // Sort by priority (most important first)
    gamePriorities.sort((a, b) => a.priority - b.priority)

    // Assign courts: primary courts for top-priority games, round-robin secondary for rest
    const allCourts = [...primaryCourts, ...secondaryCourts]
    let primaryIdx = 0
    let secondaryIdx = 0

    const updates: { id: string; courtNumber: number }[] = []

    for (const gp of gamePriorities) {
      let court: number

      if (gp.priority <= 10 && primaryIdx < primaryCourts.length) {
        // Important games get primary courts (cycle through primary courts)
        court = primaryCourts[primaryIdx % primaryCourts.length]
        primaryIdx++
      } else {
        // Distribute across all courts round-robin
        court = allCourts[secondaryIdx % allCourts.length]
        secondaryIdx++
      }

      updates.push({ id: gp.id, courtNumber: court })
    }

    // Batch update
    if (updates.length > 0) {
      await prisma.$transaction(
        updates.map((u) =>
          prisma.game.update({
            where: { id: u.id },
            data: { courtNumber: u.courtNumber },
          })
        )
      )
    }
  }

  /**
   * Generate NFA cascade divisions for an Open category.
   * Creates D2/D3 division categories and sets up cross-division routing.
   * After calling this, generate brackets for each division separately.
   */
  static async generateCascade(tournamentId: string, categoryId: string, userId: string) {
    const tournament = await SchedulingRepository.getTournamentForGeneration(tournamentId)
    if (!tournament) throw new NotFoundError('Tournament', tournamentId)
    if (tournament.User.id !== userId) {
      throw new ForbiddenError('Only the organizer can generate cascade divisions')
    }

    const category = await SchedulingRepository.getCategoryForGeneration(categoryId)
    if (!category) throw new NotFoundError('Category', categoryId)

    const teamRegs = await SchedulingRepository.getTeamRegistrations(categoryId)

    return generateNFACascade({
      tournamentId,
      openCategoryId: categoryId,
      teamCount: teamRegs.length,
    })
  }

  /**
   * Check if a category should use cascade divisions.
   * Returns true if it's an "Open" format category with enough teams.
   */
  static isCascadeEligible(categoryName: string, format: string, teamCount: number): boolean {
    const isOpen = categoryName.toLowerCase().includes('open')
    const isDE = format === 'double_elimination'
    return isOpen && isDE && teamCount >= 8
  }
}
