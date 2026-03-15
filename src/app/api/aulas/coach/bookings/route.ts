import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const coach = await prisma.coachProfile.findUnique({ where: { userId: session.user.id } })
    if (!coach) return NextResponse.json({ error: 'Não é coach' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: any = { class: { coachId: coach.id } }
    if (status) where.status = status

    const bookings = await prisma.classBooking.findMany({
      where,
      include: {
        student: { include: { user: { select: { name: true, email: true } } } },
        class: { select: { id: true, title: true, scheduledAt: true, locationName: true, level: true } },
      },
      orderBy: { requestedAt: 'desc' },
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Coach bookings error:', error)
    return NextResponse.json({ error: 'Erro ao buscar reservas' }, { status: 500 })
  }
}
