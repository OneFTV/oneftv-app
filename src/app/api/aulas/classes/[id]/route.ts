import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cls = await prisma.class.findUnique({
      where: { id: params.id },
      include: {
        coach: { include: { user: { select: { name: true } } } },
        attendances: { include: { student: { include: { user: { select: { name: true, avatar: true } } } } } },
      },
    })
    if (!cls) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(cls)
  } catch (error) {
    console.error('Get class error:', error)
    return NextResponse.json({ error: 'Failed to fetch class' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const cls = await prisma.class.update({
      where: { id: params.id },
      data: {
        title: body.title,
        description: body.description,
        type: body.type,
        maxStudents: body.maxStudents,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        duration: body.duration,
        locationName: body.locationName,
        price: body.price,
        status: body.status,
        notes: body.notes,
      },
    })
    return NextResponse.json(cls)
  } catch (error) {
    console.error('Update class error:', error)
    return NextResponse.json({ error: 'Failed to update class' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.class.update({ where: { id: params.id }, data: { status: 'cancelled' } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cancel class error:', error)
    return NextResponse.json({ error: 'Failed to cancel class' }, { status: 500 })
  }
}
