import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const profile = await prisma.coachProfile.findUnique({
      where: { userId: session.user.id },
      include: { user: { select: { name: true, email: true, avatar: true } } },
    })
    return NextResponse.json(profile)
  } catch (error) {
    console.error('Get coach profile error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json()
    const profile = await prisma.coachProfile.upsert({
      where: { userId: session.user.id },
      update: {
        bio: body.bio,
        experience: body.experience,
        certifications: body.certifications ? JSON.stringify(body.certifications) : undefined,
        hourlyRate: body.hourlyRate,
        currency: body.currency || 'USD',
        latitude: body.latitude,
        longitude: body.longitude,
        city: body.city,
        state: body.state,
        country: body.country,
        locationName: body.locationName,
        maxGroupSize: body.maxGroupSize,
        photos: body.photos ? JSON.stringify(body.photos) : undefined,
        coverPhoto: body.coverPhoto,
      },
      create: {
        userId: session.user.id,
        bio: body.bio,
        experience: body.experience,
        certifications: body.certifications ? JSON.stringify(body.certifications) : undefined,
        hourlyRate: body.hourlyRate,
        currency: body.currency || 'USD',
        latitude: body.latitude,
        longitude: body.longitude,
        city: body.city,
        state: body.state,
        country: body.country,
        locationName: body.locationName,
        maxGroupSize: body.maxGroupSize || 4,
        photos: body.photos ? JSON.stringify(body.photos) : undefined,
        coverPhoto: body.coverPhoto,
      },
    })
    return NextResponse.json(profile)
  } catch (error) {
    console.error('Upsert coach profile error:', error)
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
  }
}
