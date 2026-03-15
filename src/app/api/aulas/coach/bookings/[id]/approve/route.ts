import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const coach = await prisma.coachProfile.findUnique({ where: { userId: session.user.id } })
    if (!coach) return NextResponse.json({ error: 'Não é coach' }, { status: 403 })

    const booking = await prisma.classBooking.findUnique({
      where: { id: params.id },
      include: { class: true },
    })
    if (!booking || booking.class.coachId !== coach.id) {
      return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 })
    }
    if (booking.status !== 'pending') {
      return NextResponse.json({ error: 'Reserva não está pendente' }, { status: 400 })
    }

    await prisma.classBooking.update({
      where: { id: params.id },
      data: { status: 'confirmed', respondedAt: new Date() },
    })

    // Create attendance
    await prisma.classAttendance.create({
      data: { classId: booking.classId, studentId: booking.studentId, status: 'registered' },
    }).catch(() => {})

    return NextResponse.json({ success: true, message: 'Reserva confirmada!' })
  } catch (error) {
    console.error('Approve booking error:', error)
    return NextResponse.json({ error: 'Erro ao aprovar' }, { status: 500 })
  }
}
