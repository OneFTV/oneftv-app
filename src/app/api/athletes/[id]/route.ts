import { NextRequest, NextResponse } from 'next/server'
import { AthleteService } from '@/modules/athlete/athlete.service'
import { AppError } from '@/shared/api/errors'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await AthleteService.getById(params.id)
    return NextResponse.json({ data: profile }, { status: 200 })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Get athlete error:', error)
    return NextResponse.json({ error: 'Failed to fetch athlete profile' }, { status: 500 })
  }
}
