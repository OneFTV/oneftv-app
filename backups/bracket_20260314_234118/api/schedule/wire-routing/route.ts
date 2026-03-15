import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/shared/database/prisma'
import {
  generateD2Bracket,
  generateD3Bracket,
  generateD3Bracket8,
  generateD4Bracket,
} from '@/modules/scheduling/double-elimination'

/**
 * POST /api/tournaments/[id]/schedule/wire-routing
 *
 * Patches winnerNextGameId / loserNextGameId / winnerSlot / loserSlot on
 * existing D2/D3/D4 games WITHOUT clearing or regenerating them.
 *
 * Use this to fix brackets whose games were created but routing was never
 * (or incorrectly) wired — e.g. after a migration or a partial generation.
 *
 * Safe to call on tournaments with existing results: only routing FK fields
 * are touched, scores/status/players are not modified.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id },
      select: { organizerId: true, openDivisionCount: true },
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    if (tournament.organizerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the organizer can wire bracket routing' },
        { status: 403 }
      )
    }

    // Fetch all NFA division categories
    const categories = await prisma.category.findMany({
      where: { tournamentId: params.id, divisionLabel: { not: null } },
      select: { id: true, divisionLabel: true },
    })

    const catByDiv = new Map<string, string>()
    for (const cat of categories) {
      if (cat.divisionLabel) catByDiv.set(cat.divisionLabel, cat.id)
    }

    const divisionCount = tournament.openDivisionCount ?? 3

    // Build dummy team arrays (we only need the routing, not actual teams)
    const dummy8 = Array.from({ length: 8 }, (_, i) => `dummy-${i}`)
    const dummy16 = Array.from({ length: 16 }, (_, i) => `dummy-${i}`)

    const results: Record<string, { found: number; wired: number }> = {}

    // Wire D3 routing
    const d3CatId = catByDiv.get('D3')
    if (d3CatId) {
      // 4-div mode: D3 is 8-team (M63-M70); 3-div mode: D3 is 16-team (M63-M78)
      const templates =
        divisionCount >= 4
          ? generateD3Bracket8(dummy8)
          : generateD3Bracket(dummy16)

      results['D3'] = await wireTemplates(params.id, d3CatId, templates)
    }

    // Wire D4 routing (only in 4-div mode)
    const d4CatId = catByDiv.get('D4')
    if (d4CatId) {
      const templates = generateD4Bracket(dummy8)
      results['D4'] = await wireTemplates(params.id, d4CatId, templates)
    }

    // Wire D2 routing
    const d2CatId = catByDiv.get('D2')
    if (d2CatId) {
      const templates = generateD2Bracket(dummy8)
      results['D2'] = await wireTemplates(params.id, d2CatId, templates)
    }

    const totalWired = Object.values(results).reduce((sum, r) => sum + r.wired, 0)
    const totalFound = Object.values(results).reduce((sum, r) => sum + r.found, 0)

    return NextResponse.json({
      success: true,
      divisionCount,
      results,
      message: `Wired ${totalWired} routing links across ${totalFound} games in divisions: ${Object.keys(results).join(', ')}`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * For each template in the bracket generator output, find the existing game
 * by matchNumber in the DB and update only its routing FK fields.
 */
async function wireTemplates(
  tournamentId: string,
  categoryId: string,
  templates: ReturnType<typeof generateD3Bracket>
): Promise<{ found: number; wired: number }> {
  // Build matchNumber → gameId map from the actual DB games
  const games = await prisma.game.findMany({
    where: { tournamentId, categoryId },
    select: { id: true, matchNumber: true },
  })

  const matchToId = new Map<number, string>()
  for (const g of games) {
    if (g.matchNumber != null) matchToId.set(g.matchNumber, g.id)
  }

  let wired = 0

  for (const t of templates) {
    const gameId = matchToId.get(t.matchNumber)
    if (!gameId) continue

    const routingData: {
      winnerNextGameId?: string | null
      winnerSlot?: string | null
      loserNextGameId?: string | null
      loserSlot?: string | null
    } = {}

    if (t.winnerGoesTo != null) {
      const nextId = matchToId.get(t.winnerGoesTo)
      if (nextId) {
        routingData.winnerNextGameId = nextId
        routingData.winnerSlot = t.winnerSlot ?? null
      }
    } else {
      // Explicitly clear stale links on terminal games
      routingData.winnerNextGameId = null
    }

    if (t.loserGoesTo != null) {
      const nextId = matchToId.get(t.loserGoesTo)
      if (nextId) {
        routingData.loserNextGameId = nextId
        routingData.loserSlot = t.loserSlot ?? null
      }
    } else {
      routingData.loserNextGameId = null
    }

    await prisma.game.update({
      where: { id: gameId },
      data: routingData,
    })
    wired++
  }

  return { found: games.length, wired }
}
