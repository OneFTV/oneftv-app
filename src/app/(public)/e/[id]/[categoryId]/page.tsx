import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/shared/database/prisma';
import { GameService } from '@/modules/game/game.service';
import LiveRefresh from '@/components/public/LiveRefresh';
import CategorySwitcher from '@/components/public/CategorySwitcher';
import TournamentBracketView from '@/components/tournament/TournamentBracketView';
import NfaBracketView from '@/components/tournament/NfaBracketView';
import { darkTheme } from '@/components/tournament/theme';

interface PageProps {
  params: { id: string; categoryId: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const [t, cat] = await Promise.all([
    prisma.tournament.findUnique({ where: { id: params.id }, select: { name: true } }),
    params.categoryId !== 'main'
      ? prisma.category.findUnique({ where: { id: params.categoryId }, select: { name: true } })
      : null,
  ]);
  if (!t) return { title: 'Tournament Not Found | OneFTV' };
  const catName = cat?.name || 'Bracket';
  return {
    title: `${catName} - ${t.name} | OneFTV Live`,
    openGraph: {
      title: `${catName} - ${t.name}`,
      description: `Live bracket for ${catName} at ${t.name}`,
    },
  };
}

export default async function BracketPage({ params }: PageProps) {
  const isLegacy = params.categoryId === 'main';

  const [tournament, category, games, allCategories] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, city: true, state: true, format: true, openDivisionCount: true },
    }),
    !isLegacy
      ? prisma.category.findUnique({
          where: { id: params.categoryId },
          select: { id: true, name: true, format: true, divisionLabel: true, bracketType: true },
        })
      : null,
    GameService.listByTournament(params.id, isLegacy ? undefined : params.categoryId),
    prisma.category.findMany({
      where: { tournamentId: params.id },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, format: true, divisionLabel: true, bracketType: true },
    }),
  ]);

  if (!tournament) notFound();
  if (!isLegacy && !category) notFound();

  const format = category?.format || tournament.format || 'bracket';
  const categoryName = category?.name || 'Bracket';

  // Detect NFA cascade: if this category has a divisionLabel, render full NFA bracket
  const isNfaCascade = !isLegacy && category?.divisionLabel != null;
  const nfaDivisionCategories = isNfaCascade
    ? allCategories.filter((c) => c.divisionLabel != null)
    : [];
  const divisionCount = (tournament.openDivisionCount === 4 ? 4 : 3) as 3 | 4;

  // For NFA cascade, load games from ALL division categories
  let allNfaGames = games;
  if (isNfaCascade && nfaDivisionCategories.length > 1) {
    const allDivisionCategoryIds = nfaDivisionCategories.map((c) => c.id);
    const allDivGames = await Promise.all(
      allDivisionCategoryIds.map((catId) => GameService.listByTournament(params.id, catId))
    );
    allNfaGames = allDivGames.flat();
  }

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
              <h1 className="font-bold text-white truncate">{categoryName}</h1>
            </div>
            {allCategories.length > 1 && (
              <CategorySwitcher
                tournamentId={tournament.id}
                categories={allCategories}
                currentCategoryId={isLegacy ? '' : params.categoryId}
              />
            )}
          </div>
        </div>
      </div>

      {/* Full-width bracket */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isNfaCascade ? (
          <NfaBracketView
            games={allNfaGames.map((g) => ({
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
              status: g.status as 'pending' | 'scheduled' | 'completed' | 'in_progress',
              matchNumber: g.matchNumber ?? undefined,
              bracketSide: g.bracketSide ?? undefined,
              winnerNextGameId: g.winnerNextGameId ?? undefined,
              loserNextGameId: g.loserNextGameId ?? undefined,
              seedTarget: g.seedTarget ?? undefined,
            }))}
            categories={nfaDivisionCategories}
            divisionCount={divisionCount}
            tournamentName={tournament.name}
          />
        ) : (
          <TournamentBracketView
            dense
            games={games.map((g) => ({
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
              status: g.status as 'pending' | 'scheduled' | 'completed' | 'in_progress',
              matchNumber: g.matchNumber ?? undefined,
              bracketSide: g.bracketSide ?? undefined,
              winnerNextGameId: g.winnerNextGameId ?? undefined,
              loserNextGameId: g.loserNextGameId ?? undefined,
              seedTarget: g.seedTarget ?? undefined,
            }))}
            format={format}
            theme={darkTheme}
          />
        )}
      </div>
    </>
  );
}
