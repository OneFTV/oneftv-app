import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SchedulingService } from '@/modules/scheduling/scheduling.service'
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

    // Accept optional categoryId in the body
    let categoryId: string | undefined
    try {
      const body = await req.json()
      categoryId = body?.categoryId
    } catch {
      // No body is fine — generate all
    }

    const updatedTournament = await SchedulingService.generateSchedule(
      params.id,
      session.user.id,
      categoryId
    )

    return NextResponse.json(
      { message: 'Tournament schedule generated successfully', data: updatedTournament },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Generate schedule error:', error)
    return NextResponse.json(
      { error: 'Failed to generate tournament schedule' },
      { status: 500 }
    )
  }
}
