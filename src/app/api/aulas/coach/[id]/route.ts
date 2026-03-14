import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const profile = await prisma.coachProfile.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { name: true, avatar: true } },
        reviews: { where: { isPublic: true }, include: { student: { include: { user: { select: { name: true } } } } }, orderBy: { createdAt: 'desc' }, take: 10 },
        packages: { where: { isActive: true } },
        _count: { select: { students: true, classes: true, reviews: true } },
      },
    })
    if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(profile)
  } catch (error) {
    console.error('Get coach error:', error)
    return NextResponse.json({ error: 'Failed to fetch coach' }, { status: 500 })
  }
}
