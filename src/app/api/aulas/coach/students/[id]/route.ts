import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const rel = await prisma.coachStudent.update({
      where: { id: params.id },
      data: { status: body.status, notes: body.notes, endDate: body.endDate },
    })
    return NextResponse.json(rel)
  } catch (error) {
    console.error('Update student rel error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.coachStudent.update({
      where: { id: params.id },
      data: { status: 'inactive', endDate: new Date() },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove student error:', error)
    return NextResponse.json({ error: 'Failed to remove' }, { status: 500 })
  }
}
