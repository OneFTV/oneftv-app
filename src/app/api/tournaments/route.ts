import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TournamentService } from '@/modules/tournament/tournament.service'
import { createTournamentSchema } from '@/modules/tournament/tournament.schemas'
import { parsePagination } from '@/shared/api/pagination'
import { AppError } from '@/shared/api/errors'
import type { CreateTournamentInput } from '@/modules/tournament/tournament.types'

export async function GET(req: NextRequest) {
  try {
    const { page, limit } = parsePagination(req.nextUrl.searchParams)
    const filters = {
      status: req.nextUrl.searchParams.get('status') || undefined,
      format: req.nextUrl.searchParams.get('format') || undefined,
      search: req.nextUrl.searchParams.get('search') || undefined,
      organizerId: req.nextUrl.searchParams.get('organizerId') || undefined,
    }
    const { data } = await TournamentService.list(filters, page, limit)
    return NextResponse.json(data)
  } catch (error) {
    console.error('List tournaments error:', error)
    return NextResponse.json({ error: 'Failed to fetch tournaments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const result = createTournamentSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const tournament = await TournamentService.create(result.data as CreateTournamentInput, session.user.id)
    return NextResponse.json(
      { message: 'Tournament created successfully', id: tournament.id, data: tournament },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Create tournament error:', error)
    return NextResponse.json({ error: 'Failed to create tournament' }, { status: 500 })
  }
}
