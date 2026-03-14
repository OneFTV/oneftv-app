import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const coach = await prisma.coachProfile.findUnique({ where: { userId: session.user.id } })
    if (!coach) return NextResponse.json({ error: 'Not a coach' }, { status: 403 })

    const students = await prisma.coachStudent.findMany({
      where: { coachId: coach.id },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true, avatar: true } },
            evaluations: { orderBy: { evaluatedAt: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(students)
  } catch (error) {
    console.error('List students error:', error)
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
  }
}
