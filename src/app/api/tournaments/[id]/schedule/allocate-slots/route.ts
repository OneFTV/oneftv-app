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
      const numCourts = body.numCourts ?? tournament.numCourts ?? 4
      const slotMinutes = body.slotMinutes ?? 30
      const startHour = body.startHour ?? 9

      const results = await scheduleNFAInterleave({
        tournamentId: params.id,
        numCourts,
        slotMinutes,
        startHour,
        divisionCount,
      })

      // ── Schedule non-division categories (Women's, Master, Beginners, etc.) ──
      // These categories don't have divisionLabel and are not handled by the interleave scheduler.
      const divisionCategoryIds = divisionCategories.map(c => c.id)
      const nonDivisionGames = await prisma.game.findMany({
        where: {
          tournamentId: params.id,
          categoryId: { notIn: divisionCategoryIds },
        },
        select: {
          id: true,
          matchNumber: true,
          categoryId: true,
          Round: { select: { name: true, roundNumber: true } },
        },
        orderBy: [
          { categoryId: 'asc' },
          { Round: { roundNumber: 'asc' } },
          { matchNumber: 'asc' },
        ],
      })

      let nonDivResults: Array<{ gameId: string; courtNumber: number; scheduledTime: Date; displayMatchNumber: number }> = []

      if (nonDivisionGames.length > 0) {
        // Find the latest scheduled time from interleave results to continue from there
        let maxTimeMinutes = startHour * 60
        if (results.length > 0) {
          const latestTime = Math.max(...results.map(r => {
            const d = r.scheduledTime
            return d.getHours() * 60 + d.getMinutes()
          }))
          maxTimeMinutes = latestTime + slotMinutes
        }

        // Simple court-round-robin scheduling for remaining games
        const courtNext = new Array(numCourts).fill(maxTimeMinutes)
        let displayNum = results.length + 1

        // Fetch tournament date for base
        const t = await prisma.tournament.findUnique({
          where: { id: params.id },
          select: { date: true },
        })
        const baseDate = t?.date ?? new Date()

        for (const game of nonDivisionGames) {
          // Find earliest available court
          let bestCourt = 0
          for (let c = 1; c < numCourts; c++) {
            if (courtNext[c] < courtNext[bestCourt]) bestCourt = c
          }

          const timeMinutes = courtNext[bestCourt]
          const scheduledTime = new Date(baseDate)
          scheduledTime.setHours(Math.floor(timeMinutes / 60), timeMinutes % 60, 0, 0)

          nonDivResults.push({
            gameId: game.id,
            courtNumber: bestCourt + 1,
            scheduledTime,
            displayMatchNumber: displayNum++,
          })

          courtNext[bestCourt] = timeMinutes + slotMinutes
        }

        // Write to database
        await prisma.$transaction(
          nonDivResults.map(r =>
            prisma.game.update({
              where: { id: r.gameId },
              data: {
                scheduledTime: r.scheduledTime,
                courtNumber: r.courtNumber,
                displayMatchNumber: r.displayMatchNumber,
              },
            })
          )
        )
      }

      const allResults = [...results, ...nonDivResults]

      return NextResponse.json({
        slots: allResults,
        mode: 'nfa_interleave',
        totalGames: allResults.length,
        divisionCount,
        nonDivisionGamesScheduled: nonDivResults.length,
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
