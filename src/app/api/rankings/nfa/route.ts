import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Division tier priority: divisions with divisionLabel rank by their
 * numeric suffix (D1=1, D2=2, etc.). Non-cascade categories rank after.
 */
function getDivisionTier(divisionLabel: string | null): number {
  if (!divisionLabel) return 100;
  const num = parseInt(divisionLabel.replace(/\D/g, ''), 10);
  return isNaN(num) ? 50 : num;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const division = searchParams.get('division'); // e.g. "Open Division 1"

    let tournament: { id: string; name: string } | null = null;

    if (tournamentId) {
      // Specific tournament requested
      tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        select: { id: true, name: true },
      });
    } else {
      // Find the most recent cascade tournament (has categories with divisionLabel)
      const cascadeCategory = await prisma.category.findFirst({
        where: { divisionLabel: { not: null } },
        orderBy: { Tournament: { date: 'desc' } },
        select: { Tournament: { select: { id: true, name: true } } },
      });
      tournament = cascadeCategory?.Tournament ?? null;
    }

    if (!tournament) {
      return NextResponse.json({ data: [], tournament: null, tournaments: [] });
    }

    // Also return list of all cascade tournaments for the UI selector
    const allCascadeTournaments = await prisma.tournament.findMany({
      where: {
        Category: { some: { divisionLabel: { not: null } } },
      },
      orderBy: { date: 'desc' },
      select: { id: true, name: true, date: true },
    });

    // Build category filter
    const categoryWhere: Record<string, unknown> = { tournamentId: tournament.id };
    if (division) {
      categoryWhere.name = division;
    }

    const categories = await prisma.category.findMany({
      where: categoryWhere,
      select: { id: true, name: true, divisionLabel: true },
    });

    const categoryIds = categories.map((c) => c.id);
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
    const divisionLabelMap = new Map(categories.map((c) => [c.id, c.divisionLabel]));

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
    const entries = players.map((p) => {
      const catName = p.categoryId ? categoryMap.get(p.categoryId) || '' : '';
      const divLabel = p.categoryId ? divisionLabelMap.get(p.categoryId) || null : null;
      return {
        userId: p.userId,
        name: p.User.name,
        country: p.User.country || '',
        nationality: p.User.nationality || '',
        state: p.User.state || '',
        division: catName,
        categoryId: p.categoryId,
        divisionTier: getDivisionTier(divLabel),
        points: p.points,
        wins: p.wins,
        losses: p.losses,
        pointDiff: p.pointDiff,
      };
    });

    // Sort by division tier first, then by points within division
    entries.sort((a, b) =>
      a.divisionTier - b.divisionTier ||
      b.points - a.points ||
      b.wins - a.wins ||
      b.pointDiff - a.pointDiff
    );

    // Distribute points in ranked order: top player gets N points, next gets N-1, etc.
    const totalPlayers = entries.length;
    const ranked = entries.map((e, i) => ({
      rank: i + 1,
      ...e,
      points: totalPlayers - i,
    }));

    // Get unique division names that have players (for the UI to iterate)
    const divisionsWithPlayers = [...new Set(ranked.map((r) => r.division))].filter(Boolean);

    return NextResponse.json({
      data: ranked,
      tournament: tournament.name,
      tournamentId: tournament.id,
      divisions: divisionsWithPlayers,
      tournaments: allCascadeTournaments,
    });
  } catch (error) {
    console.error('Cascade rankings error:', error);
    return NextResponse.json({ error: 'Failed to fetch rankings' }, { status: 500 });
  }
}
