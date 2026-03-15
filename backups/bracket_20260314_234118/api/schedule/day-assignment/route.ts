import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface DayAssignment {
  categoryId: string
  day: number
  startTime?: string
  endTime?: string
}

interface Conflict {
  playerId: string
  playerName: string
  categories: { id: string; name: string; day: number }[]
  severity: 'yellow' | 'red'
}

async function detectDayConflicts(tournamentId: string): Promise<Conflict[]> {
  // Find players registered in multiple categories
  const players = await prisma.tournamentPlayer.findMany({
    where: { tournamentId },
    include: {
      User: { select: { id: true, name: true } },
      Category: { select: { id: true, name: true, scheduledDay: true, dayStartTime: true, dayEndTime: true } },
    },
  })

  // Group by player
  const playerCategories: Record<string, { name: string; cats: { id: string; name: string; day: number; start?: string | null; end?: string | null }[] }> = {}
  for (const p of players) {
    if (!p.Category) continue
    if (!playerCategories[p.userId]) {
      playerCategories[p.userId] = { name: p.User.name || 'Unknown', cats: [] }
    }
    playerCategories[p.userId].cats.push({
      id: p.Category.id,
      name: p.Category.name,
      day: p.Category.scheduledDay || 1,
      start: p.Category.dayStartTime,
      end: p.Category.dayEndTime,
    })
  }

  const conflicts: Conflict[] = []
  for (const [playerId, data] of Object.entries(playerCategories)) {
    if (data.cats.length < 2) continue

    // Group cats by day
    const byDay: Record<number, typeof data.cats> = {}
    for (const c of data.cats) {
      if (!byDay[c.day]) byDay[c.day] = []
      byDay[c.day].push(c)
    }

    for (const [, dayCats] of Object.entries(byDay)) {
      if (dayCats.length >= 2) {
        // Check if times overlap
        const hasTimeOverlap = dayCats.some((a, i) =>
          dayCats.some((b, j) => {
            if (i >= j) return false
            if (!a.start || !a.end || !b.start || !b.end) return false
            return a.start < b.end && b.start < a.end
          })
        )

        conflicts.push({
          playerId,
          playerName: data.name,
          categories: dayCats.map(c => ({ id: c.id, name: c.name, day: c.day })),
          severity: hasTimeOverlap ? 'red' : 'yellow',
        })
      }
    }
  }

  return conflicts
}

export async function GET(
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
      include: {
        Category: {
          select: {
            id: true, name: true, scheduledDay: true, dayStartTime: true, dayEndTime: true,
            maxTeams: true, format: true, gender: true, skillLevel: true,
            _count: { select: { TournamentPlayer: true, Game: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    const numDays = tournament.numDays || 1

    // Build suggestion: find players in multiple categories and try to balance
    const multiCatPlayers = await prisma.tournamentPlayer.groupBy({
      by: ['userId'],
      where: { tournamentId: params.id },
      _count: { categoryId: true },
      having: { categoryId: { _count: { gt: 1 } } },
    })

    const multiCatDetails = await prisma.tournamentPlayer.findMany({
      where: {
        tournamentId: params.id,
        userId: { in: multiCatPlayers.map(p => p.userId) },
      },
      select: { userId: true, categoryId: true },
    })

    // Build conflict graph: categories sharing players
    const catConflicts: Record<string, Set<string>> = {}
    const playerByCat: Record<string, string[]> = {}
    for (const d of multiCatDetails) {
      if (!d.categoryId) continue
      if (!playerByCat[d.userId]) playerByCat[d.userId] = []
      playerByCat[d.userId].push(d.categoryId)
    }
    for (const cats of Object.values(playerByCat)) {
      for (let i = 0; i < cats.length; i++) {
        for (let j = i + 1; j < cats.length; j++) {
          if (!catConflicts[cats[i]]) catConflicts[cats[i]] = new Set()
          if (!catConflicts[cats[j]]) catConflicts[cats[j]] = new Set()
          catConflicts[cats[i]].add(cats[j])
          catConflicts[cats[j]].add(cats[i])
        }
      }
    }

    // Simple greedy assignment: spread conflicting categories across days, balance game count
    const suggestion: Record<string, string[]> = {}
    const dayGameCount: Record<number, number> = {}
    for (let d = 1; d <= numDays; d++) {
      suggestion[`day${d}`] = []
      dayGameCount[d] = 0
    }

    const assigned: Record<string, number> = {}
    const sortedCats = [...tournament.Category].sort((a, b) => (b._count.Game || 0) - (a._count.Game || 0))

    for (const cat of sortedCats) {
      // Find best day: avoid conflicts, then balance games
      let bestDay = 1
      let bestScore = -Infinity

      for (let d = 1; d <= numDays; d++) {
        const conflictsOnDay = (catConflicts[cat.id] || new Set())
        const conflictCount = suggestion[`day${d}`].filter(cid => conflictsOnDay.has(cid)).length
        // Prefer fewer conflicts, then fewer games for balance
        const score = -conflictCount * 1000 - dayGameCount[d]
        if (score > bestScore) {
          bestScore = score
          bestDay = d
        }
      }

      suggestion[`day${bestDay}`].push(cat.id)
      dayGameCount[bestDay] += cat._count.Game || 0
      assigned[cat.id] = bestDay
    }

    const conflicts = await detectDayConflicts(params.id)

    return NextResponse.json({
      categories: tournament.Category.map(c => ({
        id: c.id,
        name: c.name,
        scheduledDay: c.scheduledDay || 1,
        dayStartTime: c.dayStartTime || tournament.startTime || '09:00',
        dayEndTime: c.dayEndTime || tournament.endTime || '18:00',
        maxTeams: c.maxTeams,
        format: c.format,
        gender: c.gender,
        skillLevel: c.skillLevel,
        gameCount: c._count.Game,
        playerCount: c._count.TournamentPlayer,
      })),
      suggestion,
      conflicts,
      numDays,
      tournamentDate: tournament.date,
      tournamentEndDate: tournament.endDate,
      defaultStartTime: tournament.startTime || '09:00',
      defaultEndTime: tournament.endTime || '18:00',
    })
  } catch (error) {
    console.error('Day assignment GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch day assignments' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { assignments } = body as { assignments: DayAssignment[] }

    if (!assignments || !Array.isArray(assignments)) {
      return NextResponse.json({ error: 'Invalid assignments' }, { status: 400 })
    }

    // Update each category
    for (const a of assignments) {
      await prisma.category.update({
        where: { id: a.categoryId },
        data: {
          scheduledDay: a.day,
          dayStartTime: a.startTime || undefined,
          dayEndTime: a.endTime || undefined,
        },
      })
    }

    const conflicts = await detectDayConflicts(params.id)

    return NextResponse.json({ success: true, conflicts })
  } catch (error) {
    console.error('Day assignment POST error:', error)
    return NextResponse.json({ error: 'Failed to save day assignments' }, { status: 500 })
  }
}
