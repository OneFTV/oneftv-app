import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/shared/database/prisma'
import { allocateTimeSlots } from '@/lib/timeSlotAllocator'
import { detectConflicts, resolveConflicts } from '@/lib/multiCategoryScheduler'

export async function POST(
  _req: NextRequest,
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
      return NextResponse.json({ error: 'Only the organizer can optimize the schedule' }, { status: 403 })
    }

    // 1. Allocate time slots
    const slots = await allocateTimeSlots(params.id)

    // 2. Detect conflicts
    const conflicts = await detectConflicts(params.id)

    // 3. Resolve conflicts
    const result = await resolveConflicts(params.id)

    return NextResponse.json({
      slots,
      conflicts,
      resolved: result.resolved,
      unresolved: result.unresolved.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to optimize schedule'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
