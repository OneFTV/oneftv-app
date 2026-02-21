import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GameService } from '@/modules/game/game.service'
import { batchUpdateScoresSchema } from '@/modules/game/game.schemas'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const result = batchUpdateScoresSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const results = await GameService.batchUpdateScores(result.data, session.user.id)

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return NextResponse.json({
      message: `Updated ${successCount} games${failCount > 0 ? `, ${failCount} failed` : ''}`,
      results,
    }, { status: 200 })
  } catch (error) {
    console.error('Batch update scores error:', error)
    return NextResponse.json({ error: 'Failed to batch update scores' }, { status: 500 })
  }
}
