import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const coach = await prisma.coachProfile.findUnique({ where: { userId: session.user.id } })
    if (!coach) return NextResponse.json({ error: 'Not a coach' }, { status: 403 })

    const { searchParams } = req.nextUrl
    const status = searchParams.get('status')
    const where: Record<string, unknown> = { coachId: coach.id }
    if (status) where.status = status

    const classes = await prisma.class.findMany({
      where: where as any,
      include: {
        attendances: { include: { student: { include: { user: { select: { name: true, avatar: true } } } } } },
        _count: { select: { attendances: true } },
      },
      orderBy: { scheduledAt: 'desc' },
    })

    return NextResponse.json(classes)
  } catch (error) {
    console.error('List classes error:', error)
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const coach = await prisma.coachProfile.findUnique({ where: { userId: session.user.id } })
    if (!coach) return NextResponse.json({ error: 'Not a coach' }, { status: 403 })

    const body = await req.json()
    const cls = await prisma.class.create({
      data: {
        coachId: coach.id,
        title: body.title,
        description: body.description,
        type: body.type || 'individual',
        maxStudents: body.maxStudents || 1,
        scheduledAt: new Date(body.scheduledAt),
        duration: body.duration || 60,
        timezone: body.timezone || 'America/New_York',
        locationName: body.locationName,
        latitude: body.latitude,
        longitude: body.longitude,
        price: body.price,
        currency: body.currency || 'USD',
      },
    })

    // Add students if provided
    if (body.studentIds?.length) {
      await prisma.classAttendance.createMany({
        data: body.studentIds.map((sid: string) => ({ classId: cls.id, studentId: sid })),
      })
    }

    return NextResponse.json(cls)
  } catch (error) {
    console.error('Create class error:', error)
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 })
  }
}
