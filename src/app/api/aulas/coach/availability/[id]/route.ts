import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const coach = await prisma.coachProfile.findUnique({ where: { userId: session.user.id } })
    if (!coach) return NextResponse.json({ error: 'Não é coach' }, { status: 403 })

    const slot = await prisma.coachAvailability.findUnique({ where: { id: params.id } })
    if (!slot || slot.coachId !== coach.id) {
      return NextResponse.json({ error: 'Slot não encontrado' }, { status: 404 })
    }

    const body = await req.json()
    const updated = await prisma.coachAvailability.update({
      where: { id: params.id },
      data: {
        dayOfWeek: body.dayOfWeek !== undefined ? Number(body.dayOfWeek) : undefined,
        startTime: body.startTime || undefined,
        endTime: body.endTime || undefined,
        level: body.level || undefined,
        maxStudents: body.maxStudents !== undefined ? Number(body.maxStudents) : undefined,
        locationName: body.locationName !== undefined ? body.locationName : undefined,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Availability PUT error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const coach = await prisma.coachProfile.findUnique({ where: { userId: session.user.id } })
    if (!coach) return NextResponse.json({ error: 'Não é coach' }, { status: 403 })

    const slot = await prisma.coachAvailability.findUnique({ where: { id: params.id } })
    if (!slot || slot.coachId !== coach.id) {
      return NextResponse.json({ error: 'Slot não encontrado' }, { status: 404 })
    }

    await prisma.coachAvailability.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Availability DELETE error:', error)
    return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 })
  }
}
