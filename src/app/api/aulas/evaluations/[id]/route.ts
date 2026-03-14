import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const evaluation = await prisma.studentEvaluation.findUnique({
      where: { id: params.id },
      include: {
        coach: { include: { user: { select: { name: true } } } },
        student: { include: { user: { select: { name: true } } } },
      },
    })
    if (!evaluation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(evaluation)
  } catch (error) {
    console.error('Get evaluation error:', error)
    return NextResponse.json({ error: 'Failed to fetch evaluation' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const evaluation = await prisma.studentEvaluation.update({
      where: { id: params.id },
      data: body,
    })
    return NextResponse.json(evaluation)
  } catch (error) {
    console.error('Update evaluation error:', error)
    return NextResponse.json({ error: 'Failed to update evaluation' }, { status: 500 })
  }
}
