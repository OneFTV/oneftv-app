import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const student = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } })
    if (!student) return NextResponse.json({ error: 'Perfil de aluno não encontrado' }, { status: 400 })

    const body = await req.json()
    const { coachId, availabilityId, date } = body

    if (!coachId || !availabilityId || !date) {
      return NextResponse.json({ error: 'Campos obrigatórios: coachId, availabilityId, date' }, { status: 400 })
    }

    // Check enrollment
    const enrollment = await prisma.coachStudent.findFirst({
      where: { coachId, studentId: student.id, status: 'active' },
    })
    if (!enrollment) {
      return NextResponse.json({ error: 'Você precisa ser aluno aprovado deste coach' }, { status: 403 })
    }

    const availability = await prisma.coachAvailability.findUnique({ where: { id: availabilityId } })
    if (!availability || availability.coachId !== coachId || !availability.isActive) {
      return NextResponse.json({ error: 'Slot de disponibilidade não encontrado' }, { status: 404 })
    }

    // Build scheduled datetime
    const dateObj = new Date(date + 'T' + availability.startTime + ':00')
    if (dateObj.getDay() !== availability.dayOfWeek) {
      return NextResponse.json({ error: 'Data não corresponde ao dia da semana do slot' }, { status: 400 })
    }

    // Check capacity - count existing confirmed/pending bookings for this slot+date
    const dayStart = new Date(date + 'T00:00:00')
    const dayEnd = new Date(date + 'T23:59:59')
    const existingBookings = await prisma.classBooking.count({
      where: {
        availabilityId,
        status: { in: ['pending', 'confirmed'] },
        class: { scheduledAt: { gte: dayStart, lte: dayEnd } },
      },
    })

    if (existingBookings >= availability.maxStudents) {
      return NextResponse.json({ error: 'Este horário já está lotado' }, { status: 400 })
    }

    // Check if student already booked this slot+date
    const alreadyBooked = await prisma.classBooking.findFirst({
      where: {
        studentId: student.id,
        availabilityId,
        status: { in: ['pending', 'confirmed'] },
        class: { scheduledAt: { gte: dayStart, lte: dayEnd } },
      },
    })
    if (alreadyBooked) {
      return NextResponse.json({ error: 'Você já tem uma reserva para este horário' }, { status: 400 })
    }

    const coachSettings = await prisma.coachSettings.findUnique({ where: { coachId } })
    const autoApprove = coachSettings?.autoApproveBooking ?? false

    // Calculate duration in minutes from start/end time
    const [sh, sm] = availability.startTime.split(':').map(Number)
    const [eh, em] = availability.endTime.split(':').map(Number)
    const duration = (eh * 60 + em) - (sh * 60 + sm)

    // Find or create class for this date+slot
    let classRecord = await prisma.class.findFirst({
      where: {
        coachId,
        availabilityId,
        scheduledAt: { gte: dayStart, lte: dayEnd },
      },
    })

    if (!classRecord) {
      classRecord = await prisma.class.create({
        data: {
          coachId,
          title: `Aula ${availability.level !== 'all' ? availability.level : ''} - ${availability.startTime}`,
          type: 'group',
          maxStudents: availability.maxStudents,
          scheduledAt: dateObj,
          duration: duration > 0 ? duration : 60,
          locationName: availability.locationName,
          level: availability.level,
          availabilityId: availability.id,
          status: 'scheduled',
        },
      })
    }

    const booking = await prisma.classBooking.create({
      data: {
        studentId: student.id,
        classId: classRecord.id,
        availabilityId: availability.id,
        status: autoApprove ? 'confirmed' : 'pending',
        respondedAt: autoApprove ? new Date() : null,
      },
    })

    // Also create attendance if confirmed
    if (autoApprove) {
      await prisma.classAttendance.create({
        data: { classId: classRecord.id, studentId: student.id, status: 'registered' },
      }).catch(() => {}) // ignore duplicate
    }

    return NextResponse.json({
      success: true,
      status: booking.status,
      message: autoApprove ? 'Aula reservada e confirmada!' : 'Reserva enviada! Aguardando confirmação do coach.',
    })
  } catch (error) {
    console.error('Book error:', error)
    return NextResponse.json({ error: 'Erro ao reservar aula' }, { status: 500 })
  }
}
