import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const coach = await prisma.coachProfile.findUnique({ where: { userId: session.user.id } })
    if (!coach) return NextResponse.json({ error: 'Não é coach' }, { status: 403 })

    const slots = await prisma.coachAvailability.findMany({
      where: { coachId: coach.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })

    return NextResponse.json(slots)
  } catch (error) {
    console.error('Availability GET error:', error)
    return NextResponse.json({ error: 'Erro ao buscar disponibilidade' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const coach = await prisma.coachProfile.findUnique({ where: { userId: session.user.id } })
    if (!coach) return NextResponse.json({ error: 'Não é coach' }, { status: 403 })

    const body = await req.json()
    const { dayOfWeek, startTime, endTime, level, maxStudents, locationName } = body

    if (dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json({ error: 'Campos obrigatórios: dayOfWeek, startTime, endTime' }, { status: 400 })
    }

    const slot = await prisma.coachAvailability.create({
      data: {
        coachId: coach.id,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        level: level || 'all',
        maxStudents: maxStudents ? Number(maxStudents) : 4,
        locationName: locationName || null,
      },
    })

    return NextResponse.json(slot)
  } catch (error) {
    console.error('Availability POST error:', error)
    return NextResponse.json({ error: 'Erro ao criar slot' }, { status: 500 })
  }
}
