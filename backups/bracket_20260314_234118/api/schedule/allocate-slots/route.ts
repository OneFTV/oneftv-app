import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/shared/database/prisma'
import { allocateTimeSlots } from '@/lib/timeSlotAllocator'
import { scheduleNFAInterleave } from '@/lib/nfaInterleaveScheduler'

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
      select: { organizerId: true, numCourts: true, openDivisionCount: true },
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    if (tournament.organizerId !== session.user.id) {
      return NextResponse.json({ error: 'Only the organizer can allocate time slots' }, { status: 403 })
    }

    // Auto-detect NFA cascade: check if tournament has multiple division categories
    const divisionCategories = await prisma.category.findMany({
      where: {
        tournamentId: params.id,
        divisionLabel: { not: null },
      },
      select: { id: true, divisionLabel: true },
    })

    if (divisionCategories.length >= 2) {
      // NFA cascade tournament — use interleave scheduler
      const body = await req.json().catch(() => ({})) as {
        slotMinutes?: number
        startHour?: number
        numCourts?: number
      }

      const divisionCount = (tournament.openDivisionCount === 4 ? 4 : 3) as 3 | 4
      const results = await scheduleNFAInterleave({
        tournamentId: params.id,
        numCourts: body.numCourts ?? tournament.numCourts ?? 4,
        slotMinutes: body.slotMinutes ?? 30,
        startHour: body.startHour ?? 9,
        divisionCount,
      })

      return NextResponse.json({
        slots: results,
        mode: 'nfa_interleave',
        totalGames: results.length,
        divisionCount,
      })
    }

    // Standard tournament — use generic allocator
    const slots = await allocateTimeSlots(params.id)
    return NextResponse.json({ slots, mode: 'standard' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to allocate time slots'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
