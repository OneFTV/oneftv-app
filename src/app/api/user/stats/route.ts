import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AuthService } from '@/modules/auth/auth.service'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [stats, organizerStats] = await Promise.all([
      AuthService.getStats(session.user.id),
      AuthService.getOrganizerStats(session.user.id),
    ])

    return NextResponse.json({ ...stats, organizer: organizerStats }, { status: 200 })
  } catch (error) {
    console.error('Get user stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
