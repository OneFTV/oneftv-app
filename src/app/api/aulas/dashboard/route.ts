import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const coach = await prisma.coachProfile.findUnique({ where: { userId: session.user.id } })
    if (!coach) return NextResponse.json({ error: 'Not a coach' }, { status: 403 })

    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const [totalStudents, classesThisWeek, upcomingClasses, totalReviews, reviews] = await Promise.all([
      prisma.coachStudent.count({ where: { coachId: coach.id, status: 'active' } }),
      prisma.class.count({ where: { coachId: coach.id, scheduledAt: { gte: weekStart, lt: weekEnd } } }),
      prisma.class.findMany({
        where: { coachId: coach.id, scheduledAt: { gte: now }, status: 'scheduled' },
        include: { attendances: { include: { student: { include: { user: { select: { name: true } } } } } } },
        orderBy: { scheduledAt: 'asc' },
        take: 10,
      }),
      prisma.coachReview.count({ where: { coachId: coach.id } }),
      prisma.coachReview.findMany({ where: { coachId: coach.id }, select: { rating: true } }),
    ])

    const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0

    return NextResponse.json({
      stats: { totalStudents, classesThisWeek, avgRating: Math.round(avgRating * 10) / 10, totalReviews },
      upcomingClasses,
      coachId: coach.id,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 })
  }
}
