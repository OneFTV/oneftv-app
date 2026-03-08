import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/shared/database/prisma'
import { randomUUID } from 'crypto'

async function verifyOrganizer(tournamentId: string, userId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { organizerId: true },
  })
  if (!tournament) return null
  if (tournament.organizerId !== userId) return false
  return true
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authorized = await verifyOrganizer(params.id, session.user.id)
    if (authorized === null) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    if (authorized === false) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const links = await prisma.refereeLink.findMany({
      where: { tournamentId: params.id },
      orderBy: { courtNumber: 'asc' },
    })

    return NextResponse.json({ data: links })
  } catch (error) {
    console.error('Get referee links error:', error)
    return NextResponse.json({ error: 'Failed to fetch referee links' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authorized = await verifyOrganizer(params.id, session.user.id)
    if (authorized === null) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    if (authorized === false) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const courtNumber = body.courtNumber
    if (typeof courtNumber !== 'number' || courtNumber < 1) {
      return NextResponse.json({ error: 'Invalid courtNumber' }, { status: 400 })
    }

    // Upsert: if link exists for this court, regenerate token
    const existing = await prisma.refereeLink.findUnique({
      where: { tournamentId_courtNumber: { tournamentId: params.id, courtNumber } },
    })

    let link
    if (existing) {
      link = await prisma.refereeLink.update({
        where: { id: existing.id },
        data: { token: randomUUID(), isActive: true },
      })
    } else {
      link = await prisma.refereeLink.create({
        data: {
          tournamentId: params.id,
          courtNumber,
          token: randomUUID(),
        },
      })
    }

    return NextResponse.json({ data: link }, { status: 201 })
  } catch (error) {
    console.error('Create referee link error:', error)
    return NextResponse.json({ error: 'Failed to create referee link' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authorized = await verifyOrganizer(params.id, session.user.id)
    if (authorized === null) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    if (authorized === false) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const linkId = searchParams.get('linkId')
    if (!linkId) {
      return NextResponse.json({ error: 'linkId query parameter required' }, { status: 400 })
    }

    await prisma.refereeLink.update({
      where: { id: linkId },
      data: { isActive: false },
    })

    return NextResponse.json({ message: 'Referee link revoked' })
  } catch (error) {
    console.error('Delete referee link error:', error)
    return NextResponse.json({ error: 'Failed to revoke referee link' }, { status: 500 })
  }
}
