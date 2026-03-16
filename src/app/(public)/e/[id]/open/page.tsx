import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/shared/database/prisma';
import { GameService } from '@/modules/game/game.service';
import LiveRefresh from '@/components/public/LiveRefresh';
import NfaBracketView from '@/components/tournament/NfaBracketView';
import type { BracketGame } from '@/lib/bracketUtils';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const t = await prisma.tournament.findUnique({
    where: { id: params.id },
    select: { name: true },
  });
  if (!t) return { title: 'Tournament Not Found | OneFTV' };
  return {
    title: `Open Division - ${t.name} | OneFTV Live`,
    openGraph: {
      title: `Open Division - ${t.name}`,
      description: `All Open Division brackets for ${t.name}`,
    },
  };
}

export default async function OpenDivisionPage({ params }: PageProps) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, openDivisionCount: true },
  });

  if (!tournament) notFound();

  // Fetch all Open Division categories (any category with a divisionLabel)
  const openCategories = await prisma.category.findMany({
    where: {
      tournamentId: tournament.id,
      divisionLabel: { not: null },
    },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, divisionLabel: true, bracketType: true },
  });

  if (openCategories.length === 0) notFound();

  // Load games for all open divisions in parallel
  const allGamesArrays = await Promise.all(
    openCategories.map((cat) => GameService.listByTournament(tournament.id, cat.id))
  );
  const allGames: BracketGame[] = allGamesArrays.flat().map((g) => ({
    ...g,
    court: g.court ?? 1,
    scheduledTime: g.scheduledTime || '',
    score1: g.score1 ?? undefined,
    score2: g.score2 ?? undefined,
    set2Home: g.set2Home ?? undefined,
    set2Away: g.set2Away ?? undefined,
    set3Home: g.set3Home ?? undefined,
    set3Away: g.set3Away ?? undefined,
    bestOf3: g.bestOf3 ?? false,
    status: g.status as BracketGame['status'],
    matchNumber: g.matchNumber ?? undefined,
    bracketSide: g.bracketSide ?? undefined,
    winnerNextGameId: g.winnerNextGameId ?? undefined,
    loserNextGameId: g.loserNextGameId ?? undefined,
    seedTarget: g.seedTarget ?? undefined,
  }));

  const divisionCount = (tournament.openDivisionCount === 4 ? 4 : 3) as 3 | 4;

  return (
    <>
      <LiveRefresh />

      {/* Sticky header */}
      <div className="sticky top-12 z-40 bg-dark-bg/90 backdrop-blur-md border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href={`/e/${tournament.id}`}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">{tournament.name}</span>
              </Link>
              <span className="text-slate-400 hidden sm:inline">/</span>
              <h1 className="font-bold text-white truncate">Open Division</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Stacked bracket view */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <NfaBracketView
          games={allGames}
          categories={openCategories}
          divisionCount={divisionCount}
          stacked
        />
      </div>
    </>
  );
}
