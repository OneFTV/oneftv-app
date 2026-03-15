/**
 * NFA Open Cascade Division System
 *
 * In NFA tournaments, the "Open" category uses a cascade elimination system:
 * - ALL teams start in Division 1 (double elimination)
 * - Teams eliminated EARLY from D1 losers bracket → fall to lower divisions
 * - Teams surviving D1 play through to D1 Finals
 *
 * Supports 1-4 division configurations:
 *
 * 4-division (32 teams): D1(32 DE) → D4(8 SE from L1) + D3(8 SE from L2) + D2(8 DE from L3+L4)
 * 3-division (32 teams): D1(32 DE) → D3(16 SE from L1+L2) + D2(8 DE from L3+L4) [default]
 * 2-division (32 teams): D1(32 DE) → D2(8 DE from L3+L4)
 * 1-division (32 teams): D1(32 DE) only — no cascade
 */

import { prisma } from '@/shared/database/prisma'

export interface CascadeConfig {
  tournamentId: string
  openCategoryId: string    // The main Open category (will become D1)
  teamCount: number         // Total teams in Open
  openDivisionCount?: number // Number of open divisions (1-4, default: 3)
}

export interface CascadeDivisionConfig {
  /** Min teams to create D3 */
  d3MinTeams: number
  /** Min teams to create D2 */
  d2MinTeams: number
  /** For a given team count, how many teams cascade to D3 (3-div mode) */
  d3TeamCount: (totalTeams: number) => number
  /** For a given team count, how many teams cascade to D2 */
  d2TeamCount: (totalTeams: number) => number
}

/** Default cascade thresholds based on NFA tournament data */
export const DEFAULT_CASCADE_CONFIG: CascadeDivisionConfig = {
  d3MinTeams: 8,   // Need at least 8 teams to create D3
  d2MinTeams: 16,  // Need at least 16 teams to create D2
  d3TeamCount: (total: number) => {
    if (total >= 32) return 16  // L1 (8 losers) + L2 (8 losers) = 16
    if (total >= 16) return 8   // L1 (4) + L2 (4) = 8
    if (total >= 8) return 4    // L1 (2) + L2 (2) = 4
    return 0
  },
  d2TeamCount: (total: number) => {
    if (total >= 32) return 8   // L3 (4 losers) + L4 (4 losers) = 8
    if (total >= 16) return 4   // L3 (2) + L4 (2) = 4
    return 0
  },
}

export interface CascadeResult {
  d1CategoryId: string
  d2CategoryId: string | null
  d3CategoryId: string | null
  d4CategoryId: string | null
  d1Games: number
  d2Games: number
  d3Games: number
  d4Games: number
  totalGames: number
  openDivisionCount: number
}

/**
 * Generate the NFA cascade division system for an Open category.
 *
 * This will:
 * 1. Rename the Open category to "Open Division 1" and set division metadata
 * 2. Optionally create "Open Division 4" category (4-div only, L1 losers)
 * 3. Create "Open Division 3" category (if applicable) for early losers
 * 4. Create "Open Division 2" category (if applicable) for later losers
 * 5. Wire up cross-division loser routing via seedTarget on D1 games
 *
 * Note: D2/D3/D4 brackets are created with placeholder (empty) team slots.
 * Teams get populated as D1 games complete and losers cascade down.
 */
export async function generateNFACascade(
  config: CascadeConfig,
  divisionConfig: CascadeDivisionConfig = DEFAULT_CASCADE_CONFIG
): Promise<CascadeResult> {
  const { tournamentId, openCategoryId, teamCount } = config
  // Clamp openDivisionCount to valid range 1-4
  const divisionCount = Math.max(1, Math.min(4, config.openDivisionCount ?? 3))

  // Validate the source category exists
  const openCategory = await prisma.category.findUnique({
    where: { id: openCategoryId },
    include: {
      Tournament: { select: { id: true, organizerId: true, numCourts: true } },
      TeamRegistration: {
        where: { status: { in: ['confirmed', 'seeded'] } },
        orderBy: { seed: 'asc' },
        select: { id: true, seed: true },
      },
    },
  })

  if (!openCategory) {
    throw new Error(`Category ${openCategoryId} not found`)
  }

  if (openCategory.Tournament.id !== tournamentId) {
    throw new Error('Category does not belong to this tournament')
  }

  const actualTeamCount = teamCount || openCategory.TeamRegistration.length

  if (actualTeamCount < 4) {
    throw new Error('Need at least 4 teams for double elimination. No cascade needed.')
  }

  // Determine what divisions to create based on divisionCount
  let d2Teams = 0
  let d3Teams = 0
  let d4Teams = 0

  if (divisionCount === 4) {
    // 4-div: L1→D4(8 SE), L2→D3(8 SE), L3+L4→D2(8 DE)
    d4Teams = 8
    d3Teams = 8
    d2Teams = divisionConfig.d2TeamCount(actualTeamCount)
  } else if (divisionCount === 3) {
    // 3-div: L1+L2→D3(16 SE), L3+L4→D2(8 DE)
    d3Teams = divisionConfig.d3TeamCount(actualTeamCount)
    d2Teams = divisionConfig.d2TeamCount(actualTeamCount)
  } else if (divisionCount === 2) {
    // 2-div: L3+L4→D2(8 DE) only
    d2Teams = divisionConfig.d2TeamCount(actualTeamCount)
  }
  // divisionCount === 1: no cascade divisions

  const createD4 = divisionCount === 4 && d4Teams > 0
  const createD3 = divisionCount >= 3 && d3Teams > 0 && actualTeamCount >= divisionConfig.d3MinTeams
  const createD2 = divisionCount >= 2 && d2Teams > 0 && actualTeamCount >= divisionConfig.d2MinTeams

  // For divisionCount === 1: just set D1 metadata, no cascade
  if (divisionCount === 1) {
    await prisma.category.update({
      where: { id: openCategoryId },
      data: {
        name: `${openCategory.name} - Division 1`,
        format: 'double_elimination',
        bracketType: 'double_elimination',
        divisionLabel: 'D1',
        seedingSource: 'main_entry',
      },
    })
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { openDivisionCount: divisionCount },
    })
    const d1Games = calculateDEGames(actualTeamCount)
    return {
      d1CategoryId: openCategoryId,
      d2CategoryId: null,
      d3CategoryId: null,
      d4CategoryId: null,
      d1Games,
      d2Games: 0,
      d3Games: 0,
      d4Games: 0,
      totalGames: d1Games,
      openDivisionCount: divisionCount,
    }
  }

  // For divisionCount >= 2, we need at least D2
  if (!createD2 && !createD3 && !createD4) {
    throw new Error(
      `Team count (${actualTeamCount}) too small for ${divisionCount}-division cascade. Use regular double elimination.`
    )
  }

  // Step 1: Update the Open category to be D1
  await prisma.category.update({
    where: { id: openCategoryId },
    data: {
      name: `${openCategory.name} - Division 1`,
      format: 'double_elimination',
      bracketType: 'double_elimination',
      divisionLabel: 'D1',
      seedingSource: 'main_entry',
    },
  })

  // Update tournament openDivisionCount
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { openDivisionCount: divisionCount },
  })

  // Step 2: Get the max sortOrder for categories in this tournament
  const maxSort = await prisma.category.aggregate({
    where: { tournamentId },
    _max: { sortOrder: true },
  })
  let nextSort = (maxSort._max.sortOrder ?? 0) + 1

  // Step 3: Create D4 category (4-div only — L1 losers, 8-team single elimination)
  let d4CategoryId: string | null = null
  if (createD4) {
    const d4 = await prisma.category.create({
      data: {
        tournamentId,
        name: `${openCategory.name} - Division 4`,
        format: 'double_elimination',
        gender: openCategory.gender,
        skillLevel: openCategory.skillLevel,
        maxTeams: d4Teams,
        pointsPerSet: openCategory.pointsPerSet,
        numSets: openCategory.numSets,
        sortOrder: nextSort++,
        status: 'draft',
        bracketType: 'single_elimination',
        divisionLabel: 'D4',
        seedingSource: 'D1_L1',
        seedingFromCategoryId: openCategoryId,
      },
    })
    d4CategoryId = d4.id
  }

  // Step 4: Create D3 category (early losers — single elimination)
  let d3CategoryId: string | null = null
  if (createD3) {
    const seedingSource = divisionCount === 4 ? 'D1_L2' : 'D1_L1_L2'
    const d3 = await prisma.category.create({
      data: {
        tournamentId,
        name: `${openCategory.name} - Division 3`,
        format: 'double_elimination',
        gender: openCategory.gender,
        skillLevel: openCategory.skillLevel,
        maxTeams: d3Teams,
        pointsPerSet: openCategory.pointsPerSet,
        numSets: openCategory.numSets,
        sortOrder: nextSort++,
        status: 'draft',
        bracketType: 'single_elimination',
        divisionLabel: 'D3',
        seedingSource,
        seedingFromCategoryId: openCategoryId,
      },
    })
    d3CategoryId = d3.id
  }

  // Step 5: Create D2 category (later losers — double elimination)
  let d2CategoryId: string | null = null
  if (createD2) {
    const d2 = await prisma.category.create({
      data: {
        tournamentId,
        name: `${openCategory.name} - Division 2`,
        format: 'double_elimination',
        gender: openCategory.gender,
        skillLevel: openCategory.skillLevel,
        maxTeams: d2Teams,
        pointsPerSet: openCategory.pointsPerSet,
        numSets: openCategory.numSets,
        sortOrder: nextSort++,
        status: 'draft',
        bracketType: 'double_elimination',
        divisionLabel: 'D2',
        seedingSource: 'D1_L3_L4',
        seedingFromCategoryId: openCategoryId,
      },
    })
    d2CategoryId = d2.id
  }

  // Calculate expected game counts
  const d1Games = calculateDEGames(actualTeamCount)
  const d4Games = createD4 ? calculateSEGames(d4Teams) : 0
  const d3Games = createD3 ? calculateSEGames(d3Teams) : 0
  const d2Games = createD2 ? calculateDEGames(d2Teams) : 0

  return {
    d1CategoryId: openCategoryId,
    d2CategoryId,
    d3CategoryId,
    d4CategoryId,
    d1Games,
    d2Games,
    d3Games,
    d4Games,
    totalGames: d1Games + d2Games + d3Games + d4Games,
    openDivisionCount: divisionCount,
  }
}

/**
 * Calculate number of games in a double elimination bracket.
 * For NFA we use the fixed structure from the visual references.
 */
function calculateDEGames(teamCount: number): number {
  if (teamCount === 32) return 62
  if (teamCount === 16) return 30
  if (teamCount === 8) return 14
  if (teamCount === 4) return 6
  return teamCount * 2 - 1
}

/**
 * Calculate number of games in a single elimination bracket (with bronze match).
 * Formula: N - 1 games + 1 bronze = N
 */
function calculateSEGames(teamCount: number): number {
  return teamCount
}

/**
 * Get cascade status for a tournament — returns all divisions and their relationships.
 */
export async function getCascadeStatus(tournamentId: string) {
  const categories = await prisma.category.findMany({
    where: {
      tournamentId,
      divisionLabel: { not: null },
    },
    select: {
      id: true,
      name: true,
      divisionLabel: true,
      bracketType: true,
      seedingSource: true,
      seedingFromCategoryId: true,
      status: true,
      maxTeams: true,
      _count: {
        select: {
          Game: true,
          TeamRegistration: true,
        },
      },
    },
    orderBy: { divisionLabel: 'asc' },
  })

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    division: cat.divisionLabel,
    bracketType: cat.bracketType,
    seedingSource: cat.seedingSource,
    seedingFromCategoryId: cat.seedingFromCategoryId,
    status: cat.status,
    maxTeams: cat.maxTeams,
    gamesCount: cat._count.Game,
    teamsCount: cat._count.TeamRegistration,
  }))
}
