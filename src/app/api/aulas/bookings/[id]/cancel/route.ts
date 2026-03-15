import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const student = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } })
    if (!student) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 400 })

    const booking = await prisma.classBooking.findUnique({
      where: { id: params.id },
      include: { class: { include: { coach: { include: { settings: true } } } } },
    })

    if (!booking || booking.studentId !== student.id) {
      return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 })
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Reserva já cancelada' }, { status: 400 })
    }

    // Check cancellation policy
    const policyHours = booking.class.coach.settings?.cancellationPolicyHours ?? 24
    const classTime = new Date(booking.class.scheduledAt).getTime()
    const now = Date.now()
    const hoursUntilClass = (classTime - now) / (1000 * 60 * 60)

    if (hoursUntilClass < policyHours && booking.status === 'confirmed') {
      return NextResponse.json({
        error: `Cancelamento deve ser feito com pelo menos ${policyHours}h de antecedência`,
      }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))

    await prisma.classBooking.update({
      where: { id: params.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: body.reason || null,
      },
    })

    // Remove attendance if exists
    await prisma.classAttendance.deleteMany({
      where: { classId: booking.classId, studentId: student.id },
    }).catch(() => {})

    return NextResponse.json({ success: true, message: 'Reserva cancelada' })
  } catch (error) {
    console.error('Cancel booking error:', error)
    return NextResponse.json({ error: 'Erro ao cancelar' }, { status: 500 })
  }
}
