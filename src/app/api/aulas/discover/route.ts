import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const city = searchParams.get('city')
    const country = searchParams.get('country')
    const q = searchParams.get('q')
    const minRate = searchParams.get('minRate')
    const maxRate = searchParams.get('maxRate')

    const where: Record<string, unknown> = { isActive: true }
    if (city) where.city = { contains: city }
    if (country) where.country = country
    if (q) {
      where.OR = [
        { user: { name: { contains: q } } },
        { city: { contains: q } },
        { locationName: { contains: q } },
      ]
    }
    if (minRate) where.hourlyRate = { ...(where.hourlyRate as any || {}), gte: parseFloat(minRate) }
    if (maxRate) where.hourlyRate = { ...(where.hourlyRate as any || {}), lte: parseFloat(maxRate) }

    const coaches = await prisma.coachProfile.findMany({
      where: where as any,
      include: {
        user: { select: { name: true, avatar: true } },
        _count: { select: { students: true, reviews: true, classes: true } },
        reviews: { select: { rating: true } },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    })

    // Calculate average rating
    const result = coaches.map(c => {
      const avgRating = c.reviews.length ? c.reviews.reduce((sum, r) => sum + r.rating, 0) / c.reviews.length : 0
      const { reviews: _reviews, ...rest } = c
      return { ...rest, avgRating: Math.round(avgRating * 10) / 10 }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Discover error:', error)
    return NextResponse.json({ error: 'Failed to search coaches' }, { status: 500 })
  }
}
