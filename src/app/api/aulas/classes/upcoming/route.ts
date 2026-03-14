import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const student = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } })
    if (!student) return NextResponse.json([])

    const classes = await prisma.classAttendance.findMany({
      where: { studentId: student.id, class: { scheduledAt: { gte: new Date() }, status: 'scheduled' } },
      include: {
        class: { include: { coach: { include: { user: { select: { name: true } } } } } },
      },
      orderBy: { class: { scheduledAt: 'asc' } },
    })

    return NextResponse.json(classes)
  } catch (error) {
    console.error('Upcoming classes error:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
