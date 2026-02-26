import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/shared/database/prisma';
import { GameService } from '@/modules/game/game.service';
import LiveRefresh from '@/components/public/LiveRefresh';
import BracketView from '@/components/tournament/BracketView';
import DoubleEliminationBracketView from '@/components/tournament/DoubleEliminationBracketView';
import GroupStageView from '@/components/tournament/GroupStageView';
import RoundRobinView from '@/components/tournament/RoundRobinView';
import { darkTheme } from '@/components/tournament/theme';
import { isDoubleElimination } from '@/lib/bracketUtils';
import type { BracketGame } from '@/lib/bracketUtils';
import PrintButton from './PrintButton';

interface PageProps {
  params: { id: string };
  searchParams: { group?: string };
}

const formatLabels: Record<string, string> = {
  king_of_the_beach: 'KotB',
  bracket: 'Bracket',
  group_knockout: 'Group + KO',
  round_robin: 'Round Robin',
  double_elimination: 'Double Elim',
};

function getGroupBaseName(name: string): string {
  return name
    .replace(/\s*\d+$/, '')
    .replace(/\s*[A-D]$/, '')
    .trim();
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const t = await prisma.tournament.findUnique({
    where: { id: params.id },
    select: { name: true },
  });
  if (!t) return { title: 'Tournament Not Found | OneFTV' };
  const subtitle = searchParams.group || 'All Brackets';
  return {
    title: `${subtitle} - ${t.name} | OneFTV Live`,
    openGraph: {
      title: `${subtitle} - ${t.name}`,
      description: `Full bracket view for ${subtitle} at ${t.name}`,
    },
  };
}

export default async function FullBracketPage({ params, searchParams }: PageProps) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
    select: { id: true, name: true },
  });

  if (!tournament) notFound();

  const allCategories = await prisma.category.findMany({
    where: { tournamentId: tournament.id },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      format: true,
      _count: { select: { players: true } },
    },
  });

  // Filter categories by group if provided
  const groupFilter = searchParams.group;
  const categories = groupFilter
    ? allCategories.filter((cat) => getGroupBaseName(cat.name) === groupFilter)
    : allCategories;

  if (categories.length === 0) notFound();

  // Load games for each category in parallel
  const categoriesWithGames = await Promise.all(
    categories.map(async (cat) => {
      const rawGames = await GameService.listByTournament(tournament.id, cat.id);
      const games: BracketGame[] = rawGames.map((g) => ({
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
      return { ...cat, games };
    })
  );

  const title = groupFilter || 'All Brackets';

  return (
    <>
      <LiveRefresh />

      {/* Print-friendly styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body, .min-h-screen { background: white !important; color: black !important; }
          .bracket-section { page-break-before: always; }
          .bracket-section:first-of-type { page-break-before: avoid; }
          .overflow-x-auto { overflow: visible !important; }
        }
      `}} />

      {/* Sticky sub-header */}
      <div className="sticky top-12 z-40 bg-dark-bg/90 backdrop-blur-md border-b border-dark-border no-print">
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
              <h1 className="font-bold text-white truncate">{title}</h1>
            </div>
            <PrintButton />
          </div>
        </div>
      </div>

      {/* Category jump-links bar */}
      {categoriesWithGames.length > 1 && (
        <div className="sticky top-24 z-30 bg-dark-bg/80 backdrop-blur-sm border-b border-dark-border no-print">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex overflow-x-auto gap-2 py-2 -mx-1 px-1">
              {categoriesWithGames.map((cat) => (
                <a
                  key={cat.id}
                  href={`#cat-${cat.id}`}
                  className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-dark-elevated text-gray-400 hover:text-white hover:bg-dark-divider transition-colors"
                >
                  {cat.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category sections */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
        {categoriesWithGames.map((cat, idx) => (
          <section key={cat.id} id={`cat-${cat.id}`} className={idx > 0 ? 'bracket-section' : ''}>
            {/* Category heading */}
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-white">{cat.name}</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-dark-elevated text-gray-400">
                {formatLabels[cat.format] || cat.format}
              </span>
              <span className="text-xs text-gray-500">
                {cat._count.players} teams
              </span>
            </div>

            {/* Full bracket — poster mode (always desktop, full game info) */}
            {cat.games.length > 0 ? (
              (() => {
                const f = cat.format.toLowerCase().replace(/[^a-z_]/g, '_');
                if (f === 'double_elimination' || isDoubleElimination(cat.games)) {
                  return <DoubleEliminationBracketView games={cat.games} dense theme={darkTheme} />;
                }
                if (f === 'group_knockout' || f === 'king_of_the_beach' || cat.games.some((g) => g.groupName)) {
                  return <GroupStageView games={cat.games} theme={darkTheme} />;
                }
                if (f === 'round_robin') {
                  return <RoundRobinView games={cat.games} theme={darkTheme} />;
                }
                return <BracketView games={cat.games} dense theme={darkTheme} />;
              })()
            ) : (
              <p className="text-gray-500 text-sm py-4">No games scheduled yet</p>
            )}

            {/* Divider (not after last) */}
            {idx < categoriesWithGames.length - 1 && (
              <div className="mt-8 border-t border-dark-border" />
            )}
          </section>
        ))}
      </div>
    </>
  );
}
