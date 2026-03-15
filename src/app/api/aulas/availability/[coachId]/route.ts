import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { coachId: string } }) {
  try {
    const { searchParams } = new URL(req.url)
    const level = searchParams.get('level')

    const where: any = { coachId: params.coachId, isActive: true }
    if (level) {
      where.level = { in: [level, 'all'] }
    }

    const slots = await prisma.coachAvailability.findMany({
      where,
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })

    return NextResponse.json(slots)
  } catch (error) {
    console.error('Public availability error:', error)
    return NextResponse.json({ error: 'Erro ao buscar disponibilidade' }, { status: 500 })
  }
}
