import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const coach = await prisma.coachProfile.findUnique({ where: { userId: session.user.id } })
    if (!coach) return NextResponse.json({ error: 'Not a coach' }, { status: 403 })

    const packages = await prisma.classPackage.findMany({
      where: { coachId: coach.id },
      include: { _count: { select: { purchases: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(packages)
  } catch (error) {
    console.error('List packages error:', error)
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const coach = await prisma.coachProfile.findUnique({ where: { userId: session.user.id } })
    if (!coach) return NextResponse.json({ error: 'Not a coach' }, { status: 403 })

    const body = await req.json()
    const pkg = await prisma.classPackage.create({
      data: {
        coachId: coach.id,
        name: body.name,
        description: body.description,
        type: body.type || 'fixed_count',
        classCount: body.classCount,
        price: body.price,
        currency: body.currency || 'USD',
        validDays: body.validDays,
      },
    })
    return NextResponse.json(pkg)
  } catch (error) {
    console.error('Create package error:', error)
    return NextResponse.json({ error: 'Failed to create package' }, { status: 500 })
  }
}
