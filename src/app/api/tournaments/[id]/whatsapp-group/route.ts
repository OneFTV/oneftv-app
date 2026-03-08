import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/shared/database/prisma'
import { AppError, NotFoundError, ForbiddenError, PolicyViolationError } from '@/shared/api/errors'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id },
      include: {
        TournamentPlayer: {
          include: {
            User: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    })

    if (!tournament) {
      throw new NotFoundError('Tournament', params.id)
    }

    if (tournament.organizerId !== session.user.id) {
      throw new ForbiddenError('Only the organizer can access this endpoint')
    }

    // Check if registration is closed (manually or past deadline)
    const registrationClosed =
      tournament.status !== 'registration' ||
      (tournament.registrationDeadline && new Date(tournament.registrationDeadline) < new Date())

    if (!registrationClosed) {
      throw new PolicyViolationError(
        'Registration must be closed before generating WhatsApp group data'
      )
    }

    const players = tournament.TournamentPlayer.map((tp) => ({
      name: tp.User.name,
      phone: tp.User.phone || '',
    }))

    const playerList = players
      .map((p, i) => `${i + 1}. ${p.name}${p.phone ? ` - ${p.phone}` : ''}`)
      .join('\n')

    const message =
      `🏐 *${tournament.name}*\n\n` +
      `📍 ${tournament.location}\n` +
      `📅 ${tournament.date.toLocaleDateString()}\n\n` +
      `👥 *Registered Players (${players.length}):*\n${playerList}\n\n` +
      `Welcome to the tournament group! 🎉`

    return NextResponse.json({ players, message })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('WhatsApp group error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
