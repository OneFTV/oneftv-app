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

    const bookings = await prisma.classBooking.findMany({
      where: { studentId: student.id },
      include: {
        class: {
          include: {
            coach: { include: { user: { select: { name: true } } } },
          },
        },
      },
      orderBy: { class: { scheduledAt: 'desc' } },
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('My bookings error:', error)
    return NextResponse.json({ error: 'Erro ao buscar reservas' }, { status: 500 })
  }
}
