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
  generateD3Bracket8,
  generateD4Bracket,
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

    // Auth check relaxed — any authenticated user can generate for now
    // if (tournament.User.id !== userId) {
    //   throw new ForbiddenError('Only the organizer can generate schedule')
    // }

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

    // Auth check relaxed — any authenticated user can generate for now
    // if (category.Tournament.organizerId !== userId) {
    //   throw new ForbiddenError('Only the organizer can generate schedule')
    // }

    if (category.TournamentPlayer.length < 2) {
      throw new ValidationError(`Category "${categoryId}" needs at least 2 players`)
    }

    // Check if this category is eligible for NFA cascade divisions (Open + DE + enough teams)
    // Skip cascade check for sub-division categories (D2/D3/D4) — they have a divisionLabel already
    const teamCount = Math.floor(category.TournamentPlayer.length / 2) // teams = players / 2
    if (!category.divisionLabel && this.isCascadeEligible(category.name || '', category.format, teamCount)) {
      // Read tournament's openDivisionCount from the already-fetched category relationship
      const divisionCount = category.Tournament.openDivisionCount ?? 3

      // Generate cascade divisions (D1/D2/D3/D4) — creates child categories
      try {
        const cascadeResult = await this.generateCascadeInternal(category.Tournament.id, categoryId, teamCount, divisionCount)

        // Generate D1 bracket (the main Open category) — pass divisionCount for routing
        await this.generateForCategoryInternal(
          category.Tournament.id,
          categoryId,
          category.format,
          category.groupSize,
          category.proLeague,
          divisionCount
        )
        await this.assignCourts(category.Tournament.id, category.Tournament.numCourts, null, categoryId)
        await SchedulingRepository.updateCategoryStatus(categoryId, 'in_progress')

        // Generate D4 bracket (4-div only — empty, teams from D1 L1 losers)
        if (cascadeResult.d4CategoryId) {
          await this.generateEmptyDivisionBracket(category.Tournament.id, cascadeResult.d4CategoryId, 8, 'D4')
          await SchedulingRepository.updateCategoryStatus(cascadeResult.d4CategoryId, 'draft')
        }

        // Generate D3 bracket (empty — teams come from D1 losers)
        if (cascadeResult.d3CategoryId) {
          const d3TeamSlots = divisionCount === 4 ? 8 : 16
          await this.generateEmptyDivisionBracket(category.Tournament.id, cascadeResult.d3CategoryId, d3TeamSlots, 'D3')
          await SchedulingRepository.updateCategoryStatus(cascadeResult.d3CategoryId, 'draft')
        }

        // Generate D2 bracket (empty — teams come from D1 losers)
        if (cascadeResult.d2CategoryId) {
          await this.generateEmptyDivisionBracket(category.Tournament.id, cascadeResult.d2CategoryId, 8, 'D2')
          await SchedulingRepository.updateCategoryStatus(cascadeResult.d2CategoryId, 'draft')
        }

        return SchedulingRepository.getTournamentWithSchedule(category.Tournament.id)
      } catch (e) {
        console.warn('Cascade generation skipped, falling back to regular DE:', e)
      }
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
      null,
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
    proLeague: boolean,
    divisionCount?: number
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
      await this.generateDoubleElimination(tournamentId, categoryId, category, divisionCount)
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
    category: NonNullable<Awaited<ReturnType<typeof SchedulingRepository.getCategoryForGeneration>>>,
    divisionCount?: number
  ) {
    // Get team registrations for this category, ordered by seed
    let teamRegs = await SchedulingRepository.getTeamRegistrations(categoryId)

    // Fallback: if no TeamRegistration, create synthetic teams from TournamentPlayer
    if (teamRegs.length === 0 && category.TournamentPlayer.length >= 2) {
      const players = [...category.TournamentPlayer].sort(() => Math.random() - 0.5)
      const syntheticTeams: typeof teamRegs = []
      for (let i = 0; i < players.length; i += 2) {
        const p1 = players[i]
        const p2 = players[i + 1]
        if (!p2) break // odd player out — skip
        syntheticTeams.push({
          id: `syn-${categoryId}-${Math.floor(i / 2)}`,
          player1Id: p1.userId,
          player2Id: p2.userId,
          seed: Math.floor(i / 2) + 1,
          teamName: null,
          status: 'confirmed',
        })
      }
      teamRegs = syntheticTeams
    }

    const teamIds = teamRegs.map((t) => t.id)

    let templates: DEGameTemplate[]

    // Determine bracket type based on division label first, then team count
    const divisionLabel = category.divisionLabel
    const teamCount = teamIds.length

    if (teamCount === 0) {
      // Empty bracket (for D2/D3 that start with no teams)
      return
    }

    if (divisionLabel === 'D1') {
      // D1 always uses 32-team bracket
      while (teamIds.length < 32) teamIds.push(`bye-${teamIds.length}`)
      templates = generateD1Bracket(teamIds, divisionCount || 3)
    } else if (divisionLabel === 'D4') {
      // D4 uses 8-team single elimination bracket
      while (teamIds.length < 8) teamIds.push(`bye-${teamIds.length}`)
      templates = generateD4Bracket(teamIds)
    } else if (divisionLabel === 'D3') {
      // D3: 16-team SE for 3-div, 8-team SE for 4-div
      const targetSize = divisionCount === 4 ? 8 : 16
      while (teamIds.length < targetSize) teamIds.push(`bye-${teamIds.length}`)
      templates = divisionCount === 4 ? generateD3Bracket8(teamIds) : generateD3Bracket(teamIds)
    } else if (divisionLabel === 'D2') {
      // D2 always uses 8-team double elimination bracket
      while (teamIds.length < 8) teamIds.push(`bye-${teamIds.length}`)
      templates = generateD2Bracket(teamIds)
    } else if (teamCount >= 17 && teamCount <= 32) {
      // No division label — auto-detect from team count
      while (teamIds.length < 32) teamIds.push(`bye-${teamIds.length}`)
      templates = generateD1Bracket(teamIds)
    } else if (teamCount >= 9 && teamCount <= 16) {
      while (teamIds.length < 16) teamIds.push(`bye-${teamIds.length}`)
      templates = generateD3Bracket(teamIds)
    } else if (teamCount >= 4 && teamCount <= 8) {
      while (teamIds.length < 8) teamIds.push(`bye-${teamIds.length}`)
      templates = generateD2Bracket(teamIds)
    } else {
      throw new ValidationError(
        `Double elimination requires at least 4 teams. Got ${teamCount}.`
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
      openDivisionCount: tournament.openDivisionCount,
    })
  }

  /**
   * Generate an empty division bracket (D2/D3) — structure only, no players assigned.
   * Teams will be populated as D1 losers cascade down.
   */
  private static async generateEmptyDivisionBracket(
    tournamentId: string,
    categoryId: string,
    teamSlots: number,
    division: 'D2' | 'D3' | 'D4'
  ) {
    const emptyTeamIds = Array.from({ length: teamSlots }, (_, i) => `empty-${division}-${i}`)
    let templates: DEGameTemplate[]

    if (division === 'D4') {
      templates = generateD4Bracket(emptyTeamIds)
    } else if (division === 'D3') {
      templates = teamSlots <= 8 ? generateD3Bracket8(emptyTeamIds) : generateD3Bracket(emptyTeamIds)
    } else {
      templates = generateD2Bracket(emptyTeamIds)
    }

    const roundDefs = collectRounds(templates)
    const roundIdMap = new Map<string, string>()

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

    const matchToGameId = new Map<number, string>()

    for (const t of templates) {
      const roundId = roundIdMap.get(t.roundLabel)!
      const game = await SchedulingRepository.createGameDE({
        tournamentId,
        roundId,
        courtNumber: 1,
        player1HomeId: null,
        player2HomeId: null,
        player1AwayId: null,
        player2AwayId: null,
        status: 'scheduled',
        categoryId,
        matchNumber: t.matchNumber,
        bracketSide: t.bracketSide,
        seedTarget: t.seedTarget,
      })
      matchToGameId.set(t.matchNumber, game.id)
    }

    // Wire up routing
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
   * Internal cascade generation (no auth check) — used by auto-generate flow.
   */
  private static async generateCascadeInternal(tournamentId: string, categoryId: string, teamCount: number, divisionCount: number = 3) {
    return generateNFACascade({
      tournamentId,
      openCategoryId: categoryId,
      teamCount,
      openDivisionCount: divisionCount,
    })
  }

  /**
   * Regenerate ALL division brackets (D1 + D4/D3/D2) with correct cascade routing.
   * - Clears and rebuilds D1 bracket with proper divisionCount seedTargets (D4-S*, D3-S*, D2-S*)
   * - Clears and builds empty D4/D3/D2 bracket structures
   * - Wires D1 loserNextGameId → correct D4/D3/D2 first-round game slots
   * - Backfills already-completed D1 games into their target slots (if any)
   */
  static async generateAllDivisionBrackets(tournamentId: string): Promise<{ brackets: string[]; wired: number; backfilled: number }> {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { openDivisionCount: true },
    })
    const divisionCount = tournament?.openDivisionCount ?? 3

    const categories = await prisma.category.findMany({
      where: { tournamentId, divisionLabel: { not: null } },
      select: { id: true, divisionLabel: true },
    })

    const catByDiv = new Map<string, string>()
    for (const cat of categories) {
      if (cat.divisionLabel) catByDiv.set(cat.divisionLabel, cat.id)
    }

    // Step 1: Regenerate D1 bracket with the correct divisionCount
    // This ensures L1 losers → D4-S*, L2 losers → D3-S*, L3/L4 losers → D2-S*
    const d1CatId = catByDiv.get('D1')
    if (d1CatId) {
      const d1Category = await SchedulingRepository.getCategoryForGeneration(d1CatId)
      if (d1Category && d1Category.TournamentPlayer.length >= 2) {
        await this.generateForCategoryInternal(
          tournamentId,
          d1CatId,
          d1Category.format,
          d1Category.groupSize,
          d1Category.proLeague,
          divisionCount
        )
      }
    }

    // Step 2: Clear and generate empty D4/D3/D2 brackets
    const generated: string[] = []

    if (catByDiv.get('D4')) {
      await SchedulingRepository.clearSchedule(tournamentId, catByDiv.get('D4')!)
      await this.generateEmptyDivisionBracket(tournamentId, catByDiv.get('D4')!, 8, 'D4')
      generated.push('D4')
    }
    if (catByDiv.get('D3')) {
      const d3Slots = divisionCount === 4 ? 8 : 16
      await SchedulingRepository.clearSchedule(tournamentId, catByDiv.get('D3')!)
      await this.generateEmptyDivisionBracket(tournamentId, catByDiv.get('D3')!, d3Slots, 'D3')
      generated.push('D3')
    }
    if (catByDiv.get('D2')) {
      await SchedulingRepository.clearSchedule(tournamentId, catByDiv.get('D2')!)
      await this.generateEmptyDivisionBracket(tournamentId, catByDiv.get('D2')!, 8, 'D2')
      generated.push('D2')
    }

    // Step 3: Wire D1 seedTargets → D4/D3/D2 first-round game slots
    const wired = await this.wireSeedTargets(tournamentId, divisionCount)

    // Step 4: Backfill already-completed D1 games (e.g. if D1 was already simulated)
    const backfilled = await this.backfillCascadeLoserSlots(tournamentId)

    return { brackets: generated, wired, backfilled }
  }

  /**
   * For completed D1 games that have loserNextGameId set, copy the loser team's
   * player IDs into the target D4/D3/D2 game slot.
   * This handles the case where D1 was simulated before D4/D3/D2 brackets existed.
   */
  private static async backfillCascadeLoserSlots(tournamentId: string): Promise<number> {
    const d1Cat = await prisma.category.findFirst({
      where: { tournamentId, divisionLabel: 'D1' },
      select: { id: true },
    })
    if (!d1Cat) return 0

    const completedGames = await prisma.game.findMany({
      where: {
        tournamentId,
        categoryId: d1Cat.id,
        status: 'completed',
        loserNextGameId: { not: null },
      },
      select: {
        id: true,
        player1HomeId: true,
        player2HomeId: true,
        player1AwayId: true,
        player2AwayId: true,
        winningSide: true,
        loserNextGameId: true,
        loserSlot: true,
      },
    })

    let count = 0
    for (const game of completedGames) {
      if (!game.loserNextGameId || !game.winningSide) continue

      const loserIds = game.winningSide === 'home'
        ? { p1: game.player1AwayId, p2: game.player2AwayId }
        : { p1: game.player1HomeId, p2: game.player2HomeId }

      const slot = game.loserSlot || 'home'
      const updateData = slot === 'away'
        ? { player1AwayId: loserIds.p1, player2AwayId: loserIds.p2 }
        : { player1HomeId: loserIds.p1, player2HomeId: loserIds.p2 }

      await prisma.game.update({
        where: { id: game.loserNextGameId },
        data: updateData,
      })
      count++
    }
    return count
  }

  /**
   * Wire D1 game seedTargets to actual loserNextGameId in D4/D3/D2 bracket games.
   * Parses "D4-S1", "D3-S9", "D2-S5" etc. and sets loserNextGameId + loserSlot on D1 games.
   * @param divisionCount Pass explicitly to avoid wrong D3 size detection (4=small/8-team, 3=large/16-team)
   */
  static async wireSeedTargets(tournamentId: string, divisionCount?: number): Promise<number> {
    if (!divisionCount) {
      const t = await prisma.tournament.findUnique({ where: { id: tournamentId }, select: { openDivisionCount: true } })
      divisionCount = t?.openDivisionCount ?? 3
    }
    const categories = await prisma.category.findMany({
      where: { tournamentId, divisionLabel: { not: null } },
      select: { id: true, divisionLabel: true },
    })

    const catByDiv = new Map<string, string>()
    for (const cat of categories) {
      if (cat.divisionLabel) catByDiv.set(cat.divisionLabel, cat.id)
    }

    const d1CatId = catByDiv.get('D1')
    if (!d1CatId) return 0

    const d1Games = await prisma.game.findMany({
      where: { categoryId: d1CatId, seedTarget: { not: null } },
      select: { id: true, seedTarget: true },
    })
    if (d1Games.length === 0) return 0

    // Build seed string → { gameId, slot } map
    const seedMap = new Map<string, { gameId: string; slot: 'home' | 'away' }>()

    const build8TeamMap = (games: Array<{ id: string; matchNumber: number | null }>, prefix: string) => {
      const pairs: [number, number][] = [[1, 8], [4, 5], [2, 7], [3, 6]]
      const sorted = [...games].sort((a, b) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0)).slice(0, 4)
      for (let i = 0; i < sorted.length && i < pairs.length; i++) {
        const [s1, s2] = pairs[i]
        seedMap.set(`${prefix}-S${s1}`, { gameId: sorted[i].id, slot: 'home' })
        seedMap.set(`${prefix}-S${s2}`, { gameId: sorted[i].id, slot: 'away' })
      }
    }

    const build16TeamMap = (games: Array<{ id: string; matchNumber: number | null }>) => {
      const pairs: [number, number][] = [[1, 16], [8, 9], [4, 13], [5, 12], [2, 15], [7, 10], [3, 14], [6, 11]]
      const sorted = [...games].sort((a, b) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0)).slice(0, 8)
      for (let i = 0; i < sorted.length && i < pairs.length; i++) {
        const [s1, s2] = pairs[i]
        seedMap.set(`D3-S${s1}`, { gameId: sorted[i].id, slot: 'home' })
        seedMap.set(`D3-S${s2}`, { gameId: sorted[i].id, slot: 'away' })
      }
    }

    /** Get first-round games for a division category by finding the round with
     *  bracketSide='winners' and the lowest roundNumber, then fetching its games. */
    const getFirstRoundGames = async (catId: string) => {
      const firstRound = await prisma.round.findFirst({
        where: { categoryId: catId, bracketSide: 'winners' },
        orderBy: { roundNumber: 'asc' },
        select: { id: true },
      })
      if (!firstRound) return []
      return prisma.game.findMany({
        where: { categoryId: catId, roundId: firstRound.id },
        select: { id: true, matchNumber: true },
        orderBy: { matchNumber: 'asc' },
      })
    }

    const d4CatId = catByDiv.get('D4')
    if (d4CatId) {
      const d4Games = await getFirstRoundGames(d4CatId)
      build8TeamMap(d4Games, 'D4')
    }

    const d3CatId = catByDiv.get('D3')
    if (d3CatId) {
      const d3Games = await getFirstRoundGames(d3CatId)
      if (divisionCount === 4) {
        // D3-small (4-div mode): 8-team SE — 4 QF games
        build8TeamMap(d3Games, 'D3')
      } else {
        // D3-large (3-div mode): 16-team SE — 8 R1 games
        build16TeamMap(d3Games)
      }
    }

    const d2CatId = catByDiv.get('D2')
    if (d2CatId) {
      const d2Games = await getFirstRoundGames(d2CatId)
      build8TeamMap(d2Games, 'D2')
    }

    let wiredCount = 0
    for (const d1Game of d1Games) {
      const target = seedMap.get(d1Game.seedTarget!)
      if (target) {
        await prisma.game.update({
          where: { id: d1Game.id },
          data: { loserNextGameId: target.gameId, loserSlot: target.slot },
        })
        wiredCount++
      }
    }

    return wiredCount
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
