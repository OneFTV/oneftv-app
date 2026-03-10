import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/shared/database/prisma'
import { SchedulingService } from '@/modules/scheduling/scheduling.service'

/**
 * POST /api/tournaments/[id]/schedule/generate-divisions
 *
 * Generate empty bracket structures for D4/D3/D2 divisions and wire
 * D1 game seedTargets to loserNextGameId in those brackets.
 *
 * Call this after:
 *   1. NFA cascade categories have been created (generate-cascade)
 *   2. D1 bracket has been generated (schedule generate)
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
      select: { organizerId: true },
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    if (tournament.organizerId !== session.user.id) {
      return NextResponse.json({ error: 'Only the organizer can generate division brackets' }, { status: 403 })
    }

    const result = await SchedulingService.generateAllDivisionBrackets(params.id)

    return NextResponse.json({
      success: true,
      brackets: result.brackets,
      wiredGames: result.wired,
      backfilledGames: result.backfilled,
      message: `Generated brackets for ${result.brackets.join(', ')}, wired ${result.wired} D1 seed targets, backfilled ${result.backfilled} completed games`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
