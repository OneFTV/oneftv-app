import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/shared/database/prisma'
import {
  generateNFACascade,
  getCascadeStatus,
  DEFAULT_CASCADE_CONFIG,
} from '@/lib/nfaCascadeGenerator'
import type { CascadeDivisionConfig } from '@/lib/nfaCascadeGenerator'

/**
 * POST /api/tournaments/[id]/schedule/generate-cascade
 *
 * Generate NFA cascade division system for an Open category.
 * Creates D2 and D3 divisions from D1 losers bracket exits.
 *
 * Body: {
 *   categoryId: string           // The Open category to cascade from
 *   teamCount?: number           // Override team count (default: actual registrations)
 *   config?: {                   // Optional custom cascade thresholds
 *     d3MinTeams?: number
 *     d2MinTeams?: number
 *   }
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id },
      select: { organizerId: true },
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    if (tournament.organizerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the organizer can generate cascade divisions' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { categoryId, teamCount, config } = body as {
      categoryId: string
      teamCount?: number
      config?: { d3MinTeams?: number; d2MinTeams?: number }
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: 'categoryId is required' },
        { status: 400 }
      )
    }

    // Verify category belongs to this tournament
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { tournamentId: true, name: true },
    })

    if (!category || category.tournamentId !== params.id) {
      return NextResponse.json(
        { error: 'Category not found in this tournament' },
        { status: 404 }
      )
    }

    // Build division config with optional overrides
    let divisionConfig: CascadeDivisionConfig = DEFAULT_CASCADE_CONFIG
    if (config) {
      divisionConfig = {
        ...DEFAULT_CASCADE_CONFIG,
        ...(config.d3MinTeams != null ? { d3MinTeams: config.d3MinTeams } : {}),
        ...(config.d2MinTeams != null ? { d2MinTeams: config.d2MinTeams } : {}),
      }
    }

    const result = await generateNFACascade(
      {
        tournamentId: params.id,
        openCategoryId: categoryId,
        teamCount: teamCount ?? 0,
      },
      divisionConfig
    )

    return NextResponse.json({
      success: true,
      cascade: result,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

/**
 * GET /api/tournaments/[id]/schedule/generate-cascade
 *
 * Get cascade division status for a tournament.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const divisions = await getCascadeStatus(params.id)

    return NextResponse.json({ divisions })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
