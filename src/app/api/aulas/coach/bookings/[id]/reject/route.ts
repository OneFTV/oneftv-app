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

    const body = await req.json().catch(() => ({}))

    await prisma.classBooking.update({
      where: { id: params.id },
      data: {
        status: 'rejected',
        respondedAt: new Date(),
        coachNotes: body.reason || null,
      },
    })

    return NextResponse.json({ success: true, message: 'Reserva rejeitada' })
  } catch (error) {
    console.error('Reject booking error:', error)
    return NextResponse.json({ error: 'Erro ao rejeitar' }, { status: 500 })
  }
}
