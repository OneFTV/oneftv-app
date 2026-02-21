import { NextRequest, NextResponse } from 'next/server'
import { RegistrationService } from '@/modules/tournament/registration.service'
import { AppError } from '@/shared/api/errors'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = req.nextUrl.searchParams.get('categoryId') || undefined
    const players = await RegistrationService.listPlayers(params.id, categoryId)
    return NextResponse.json(players, { status: 200 })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Get tournament players error:', error)
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 })
  }
}
