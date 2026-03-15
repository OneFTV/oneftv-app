import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const division = searchParams.get('division'); // e.g. "Open Division 1"

    // Find the NFA Orlando tournament
    const tournament = await prisma.tournament.findFirst({
      where: { name: { contains: 'NFA Tour' } },
      select: { id: true, name: true },
    });

    if (!tournament) {
      return NextResponse.json({ data: [], tournament: null });
    }

    // Build category filter
    const categoryWhere: Record<string, unknown> = { tournamentId: tournament.id };
    if (division) {
      categoryWhere.name = division;
    }

    const categories = await prisma.category.findMany({
      where: categoryWhere,
      select: { id: true, name: true },
    });

    const categoryIds = categories.map((c) => c.id);
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    // Fetch tournament players with their user info
    const players = await prisma.tournamentPlayer.findMany({
      where: {
        tournamentId: tournament.id,
        categoryId: { in: categoryIds },
        points: { gt: 0 },
      },
      include: {
        User: {
          select: { id: true, name: true, country: true, nationality: true, state: true },
        },
      },
      orderBy: { points: 'desc' },
    });

    // Build ranking entries
    const entries = players.map((p) => ({
      userId: p.userId,
      name: p.User.name,
      country: p.User.country || '',
      nationality: p.User.nationality || '',
      state: p.User.state || '',
      division: p.categoryId ? categoryMap.get(p.categoryId) || '' : '',
      categoryId: p.categoryId,
      points: p.points,
      wins: p.wins,
      losses: p.losses,
      pointDiff: p.pointDiff,
    }));

    // Sort by points desc, then wins desc
    entries.sort((a, b) => b.points - a.points || b.wins - a.wins);

    // Add rank
    const ranked = entries.map((e, i) => ({ rank: i + 1, ...e }));

    return NextResponse.json({
      data: ranked,
      tournament: tournament.name,
      divisions: categories.map((c) => c.name),
    });
  } catch (error) {
    console.error('NFA rankings error:', error);
    return NextResponse.json({ error: 'Failed to fetch NFA rankings' }, { status: 500 });
  }
}
