import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RegistrationService } from '@/modules/tournament/registration.service'
import { AppError } from '@/shared/api/errors'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tournamentPlayer = await RegistrationService.register(params.id, session.user.id)

    return NextResponse.json(
      { message: 'Successfully registered for tournament', data: tournamentPlayer },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Tournament registration error:', error)
    return NextResponse.json({ error: 'Failed to register for tournament' }, { status: 500 })
  }
}
