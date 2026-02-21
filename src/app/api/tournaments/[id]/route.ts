import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TournamentService } from '@/modules/tournament/tournament.service'
import { updateTournamentSchema } from '@/modules/tournament/tournament.schemas'
import { AppError } from '@/shared/api/errors'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournament = await TournamentService.getById(params.id)
    return NextResponse.json({ data: tournament })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Get tournament error:', error)
    return NextResponse.json({ error: 'Failed to fetch tournament' }, { status: 500 })
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
    const result = updateTournamentSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const tournament = await TournamentService.update(params.id, result.data, session.user.id)
    return NextResponse.json({ message: 'Tournament updated successfully', data: tournament })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Update tournament error:', error)
    return NextResponse.json({ error: 'Failed to update tournament' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await TournamentService.delete(params.id, session.user.id)
    return NextResponse.json({ message: 'Tournament deleted successfully' })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Delete tournament error:', error)
    return NextResponse.json({ error: 'Failed to delete tournament' }, { status: 500 })
  }
}
