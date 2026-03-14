import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const evaluations = await prisma.studentEvaluation.findMany({
      where: { studentId: params.id },
      include: { coach: { include: { user: { select: { name: true } } } } },
      orderBy: { evaluatedAt: 'desc' },
    })
    return NextResponse.json(evaluations)
  } catch (error) {
    console.error('Get evaluations error:', error)
    return NextResponse.json({ error: 'Failed to fetch evaluations' }, { status: 500 })
  }
}
