import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GameService } from '@/modules/game/game.service'
import { updateGameSchema } from '@/modules/game/game.schemas'
import { AppError } from '@/shared/api/errors'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const game = await GameService.getById(params.id)
    return NextResponse.json({ data: game }, { status: 200 })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Get game error:', error)
    return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const result = updateGameSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const updatedGame = await GameService.updateScore(params.id, result.data, session.user.id)
    return NextResponse.json({ message: 'Game updated successfully', data: updatedGame }, { status: 200 })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Update game error:', error)
    return NextResponse.json({ error: 'Failed to update game' }, { status: 500 })
  }
}
