import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const student = await prisma.studentProfile.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { name: true, avatar: true } },
        evaluations: {
          include: { coach: { include: { user: { select: { name: true } } } } },
          orderBy: { evaluatedAt: 'desc' },
        },
        coaches: {
          include: { coach: { include: { user: { select: { name: true } } } } },
        },
        classAttendances: { where: { status: 'attended' } },
      },
    })
    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(student)
  } catch (error) {
    console.error('Get passport error:', error)
    return NextResponse.json({ error: 'Failed to fetch passport' }, { status: 500 })
  }
}
