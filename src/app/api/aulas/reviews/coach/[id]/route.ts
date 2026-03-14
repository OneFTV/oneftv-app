import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reviews = await prisma.coachReview.findMany({
      where: { coachId: params.id, isPublic: true },
      include: { student: { include: { user: { select: { name: true, avatar: true } } } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Get reviews error:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}
