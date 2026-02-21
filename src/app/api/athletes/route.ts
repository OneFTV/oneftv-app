import { NextRequest, NextResponse } from 'next/server'
import { AthleteService } from '@/modules/athlete/athlete.service'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const result = await AthleteService.list(req.nextUrl.searchParams)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Get athletes error:', error)
    return NextResponse.json({ error: 'Failed to fetch athletes' }, { status: 500 })
  }
}
