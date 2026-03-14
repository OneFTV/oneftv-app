import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { coachId: string } }) {
  try {
    const coach = await prisma.coachProfile.findUnique({
      where: { id: params.coachId, isActive: true },
      include: {
        user: { select: { name: true, avatar: true } },
        reviews: { where: { isPublic: true }, include: { student: { include: { user: { select: { name: true } } } } }, orderBy: { createdAt: 'desc' } },
        packages: { where: { isActive: true } },
        _count: { select: { students: true, classes: true, reviews: true } },
      },
    })
    if (!coach) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const avgRating = coach.reviews.length ? coach.reviews.reduce((sum, r) => sum + r.rating, 0) / coach.reviews.length : 0

    return NextResponse.json({ ...coach, avgRating: Math.round(avgRating * 10) / 10 })
  } catch (error) {
    console.error('Get coach public error:', error)
    return NextResponse.json({ error: 'Failed to fetch coach' }, { status: 500 })
  }
}
