import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const city = searchParams.get('city')
    const country = searchParams.get('country')
    const query = searchParams.get('q')

    const where: Record<string, unknown> = { isActive: true }
    if (city) where.city = { contains: city }
    if (country) where.country = country
    if (query) {
      where.OR = [
        { user: { name: { contains: query } } },
        { city: { contains: query } },
        { bio: { contains: query } },
      ]
    }

    const coaches = await prisma.coachProfile.findMany({
      where: where as any,
      include: {
        user: { select: { name: true, avatar: true } },
        _count: { select: { students: true, reviews: true } },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(coaches)
  } catch (error) {
    console.error('Search coaches error:', error)
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 })
  }
}
