import { NextRequest, NextResponse } from 'next/server'
import { RankingService } from '@/modules/ranking/ranking.service'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const format = searchParams.get('format')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))

    const result = await RankingService.getRankings(format, page, limit)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Get rankings error:', error)
    return NextResponse.json({ error: 'Failed to fetch rankings' }, { status: 500 })
  }
}
