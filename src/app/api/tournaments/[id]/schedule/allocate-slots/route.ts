import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/shared/database/prisma'
import { allocateTimeSlots } from '@/lib/timeSlotAllocator'
import { scheduleNFAInterleave, ScheduledMatch } from '@/lib/nfaInterleaveScheduler'

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(':').map(Number)
  return { hours: h, minutes: m ?? 0 }
}

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
      select: {
        organizerId: true,
        numCourts: true,
        numDays: true,
        openDivisionCount: true,
        date: true,
        endDate: true,
        startTime: true,
        endTime: true,
      },
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    if (tournament.organizerId !== session.user.id) {
      return NextResponse.json({ error: 'Only the organizer can allocate time slots' }, { status: 403 })
    }

    // Auto-detect NFA cascade: check if tournament has division categories
    const divisionCategories = await prisma.category.findMany({
      where: {
        tournamentId: params.id,
        divisionLabel: { not: null },
      },
      select: { id: true, divisionLabel: true, scheduledDay: true },
    })

    if (divisionCategories.length >= 2) {
      // NFA cascade tournament — use unified interleave scheduler per day
      const body = await req.json().catch(() => ({})) as {
        slotMinutes?: number
        numCourts?: number
      }

      const divisionCount = (tournament.openDivisionCount === 4 ? 4 : 3) as 3 | 4
      const numCourts = body.numCourts ?? tournament.numCourts ?? 4
      const slotMinutes = body.slotMinutes ?? 30
      const numDays = tournament.numDays || 1

      const defaultStart = tournament.startTime ? parseTime(tournament.startTime) : { hours: 9, minutes: 0 }
      const defaultEnd = tournament.endTime ? parseTime(tournament.endTime) : { hours: 18, minutes: 0 }

      // Get per-day time overrides from categories
      const allCategories = await prisma.category.findMany({
        where: { tournamentId: params.id },
        select: { id: true, scheduledDay: true, dayStartTime: true, dayEndTime: true },
      })

      // Compute per-day start/end times (use category overrides if available)
      function getDayTimes(day: number) {
        const dayCats = allCategories.filter(c => (c.scheduledDay ?? 1) === day)
        let start = defaultStart
        let end = defaultEnd

        // Use the earliest start and latest end from category overrides
        for (const cat of dayCats) {
          if (cat.dayStartTime) {
            const parsed = parseTime(cat.dayStartTime)
            if (parsed.hours * 60 + parsed.minutes < start.hours * 60 + start.minutes) {
              start = parsed
            }
          }
          if (cat.dayEndTime) {
            const parsed = parseTime(cat.dayEndTime)
            if (parsed.hours * 60 + parsed.minutes > end.hours * 60 + end.minutes) {
              end = parsed
            }
          }
        }
        return { start, end }
      }

      function getDayDate(day: number): Date {
        const date = new Date(tournament!.date)
        date.setDate(date.getDate() + (day - 1))
        return date
      }

      // Schedule each day
      const allResults: ScheduledMatch[] = []
      let globalDisplayOffset = 0

      for (let day = 1; day <= numDays; day++) {
        const { start, end } = getDayTimes(day)

        const dayResults = await scheduleNFAInterleave({
          tournamentId: params.id,
          numCourts,
          slotMinutes,
          startHour: start.hours,
          startMinute: start.minutes,
          endHour: end.hours,
          endMinute: end.minutes,
          divisionCount,
          dayDate: getDayDate(day),
          scheduledDay: day,
        })

        // Re-number displayMatchNumber with global offset
        for (const r of dayResults) {
          r.displayMatchNumber += globalDisplayOffset
        }
        globalDisplayOffset += dayResults.length

        // Update the re-numbered displayMatchNumbers in DB
        if (dayResults.length > 0) {
          await prisma.$transaction(
            dayResults.map(r =>
              prisma.game.update({
                where: { id: r.gameId },
                data: { displayMatchNumber: r.displayMatchNumber },
              })
            )
          )
        }

        allResults.push(...dayResults)
      }

      return NextResponse.json({
        slots: allResults,
        mode: 'nfa_interleave',
        totalGames: allResults.length,
        divisionCount,
        numDays,
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
