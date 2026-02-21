import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/database/prisma'
import { GameService } from '@/modules/game/game.service'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id },
      select: { id: true },
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    const categoryId = req.nextUrl.searchParams.get('categoryId') || undefined
    const games = await GameService.listByTournament(params.id, categoryId)
    return NextResponse.json(games, { status: 200 })
  } catch (error) {
    console.error('Get tournament games error:', error)
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
  }
}
