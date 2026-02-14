import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/shared/database/prisma';
import LiveRefresh from '@/components/public/LiveRefresh';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const t = await prisma.tournament.findUnique({
    where: { id: params.id },
    select: { name: true, description: true, bannerUrl: true },
  });
  if (!t) return { title: 'Tournament Not Found | OneFTV' };
  return {
    title: `${t.name} | OneFTV Live`,
    openGraph: {
      title: t.name,
      description: t.description || `Live tournament on OneFTV`,
    },
  };
}

const statusMap: Record<string, string> = {
  draft: 'Draft',
  registration: 'Registration',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const statusDotColor: Record<string, string> = {
  draft: 'bg-gray-500',
  registration: 'bg-emerald-500',
  in_progress: 'bg-blue-500',
  completed: 'bg-purple-500',
};

const formatLabels: Record<string, string> = {
  king_of_the_beach: 'King of the Beach',
  bracket: 'Bracket',
  group_knockout: 'Group + Knockout',
  round_robin: 'Round Robin',
};

export default async function ScoreboardPage({ params }: PageProps) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
    include: {
      categories: {
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { players: true } } },
      },
      games: {
        where: { status: { in: ['in_progress', 'completed'] } },
        include: {
          player1Home: { select: { name: true } },
          player2Home: { select: { name: true } },
          player1Away: { select: { name: true } },
          player2Away: { select: { name: true } },
          round: { select: { name: true } },
          category: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!tournament) notFound();

  const liveGames = tournament.games.filter((g) => g.status === 'in_progress');
  const recentGames = tournament.games.filter((g) => g.status === 'completed');
  const hasCategories = tournament.categories.length > 0;

  const formatPlayerNames = (g: typeof tournament.games[number]) => {
    const home = [g.player1Home?.name, g.player2Home?.name].filter(Boolean).join(' & ') || 'TBD';
    const away = [g.player1Away?.name, g.player2Away?.name].filter(Boolean).join(' & ') || 'TBD';
    return { home, away };
  };

  const dateStr = new Date(tournament.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const endDateStr = tournament.endDate && tournament.endDate.getTime() !== tournament.date.getTime()
    ? ` - ${new Date(tournament.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : '';
  const locationStr = [tournament.city, tournament.state].filter(Boolean).join(', ');

  // Get recent games per category for category sections
  const gamesByCategory = new Map<string, typeof tournament.games>();
  for (const g of tournament.games) {
    const catId = g.category?.id || '__none__';
    if (!gamesByCategory.has(catId)) gamesByCategory.set(catId, []);
    if (gamesByCategory.get(catId)!.length < 4) {
      gamesByCategory.get(catId)!.push(g);
    }
  }

  return (
    <>
      <LiveRefresh />

      {/* Hero header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-footvolley-primary/30 to-dark-bg" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {tournament.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {dateStr}{endDateStr}
                </span>
                {locationStr && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {locationStr}
                  </span>
                )}
              </div>
            </div>
            <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-dark-elevated border border-dark-border`}>
              <span className={`w-2 h-2 rounded-full ${statusDotColor[tournament.status] || 'bg-gray-500'} ${tournament.status === 'in_progress' ? 'animate-pulse' : ''}`} />
              {statusMap[tournament.status] || tournament.status}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Live matches strip */}
        {liveGames.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <h2 className="text-sm font-bold text-red-400 uppercase tracking-wider">Live Now</h2>
            </div>
            <div className="flex overflow-x-auto gap-3 pb-2 -mx-1 px-1">
              {liveGames.map((game) => {
                const { home, away } = formatPlayerNames(game);
                return (
                  <div
                    key={game.id}
                    className="flex-shrink-0 w-[280px] rounded-lg border border-red-500/30 bg-dark-surface overflow-hidden ring-1 ring-red-500/20"
                  >
                    <div className="flex items-center justify-between px-3 py-2 border-b border-dark-border">
                      <span className="text-xs text-gray-500 truncate">{game.category?.name || game.round?.name || ''}</span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-400">
                        <span className="flex h-1.5 w-1.5 relative">
                          <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                        </span>
                        LIVE
                      </span>
                    </div>
                    <div className="px-3 py-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-200 truncate flex-1">{home}</span>
                        <span className="text-lg font-bold text-white ml-2">{game.scoreHome ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-200 truncate flex-1">{away}</span>
                        <span className="text-lg font-bold text-white ml-2">{game.scoreAway ?? 0}</span>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-dark-elevated text-[11px] text-gray-500">
                      Court {game.courtNumber}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category sections */}
        {hasCategories ? (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tournament.categories.map((cat) => {
                const catGames = gamesByCategory.get(cat.id) || [];
                const catLive = catGames.filter((g) => g.status === 'in_progress');
                return (
                  <div key={cat.id} className="rounded-xl border border-dark-border bg-dark-surface overflow-hidden hover:border-dark-divider transition-colors">
                    {/* Category header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          cat.status === 'in_progress' ? 'bg-blue-500 animate-pulse' :
                          cat.status === 'completed' ? 'bg-purple-500' :
                          cat.status === 'registration' ? 'bg-emerald-500' : 'bg-gray-500'
                        }`} />
                        <h3 className="font-semibold text-gray-100 truncate">{cat.name}</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-dark-elevated text-gray-400">
                          {formatLabels[cat.format] || cat.format}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {cat._count.players} teams
                      </span>
                    </div>

                    {/* Recent matches */}
                    {catGames.length > 0 ? (
                      <div className="divide-y divide-dark-border">
                        {catGames.slice(0, 3).map((game) => {
                          const { home, away } = formatPlayerNames(game);
                          const isLive = game.status === 'in_progress';
                          const homeWon = game.status === 'completed' && (game.winningSide === 'home' || (!game.winningSide && (game.scoreHome ?? 0) > (game.scoreAway ?? 0)));
                          const awayWon = game.status === 'completed' && (game.winningSide === 'away' || (!game.winningSide && (game.scoreAway ?? 0) > (game.scoreHome ?? 0)));
                          return (
                            <div key={game.id} className="flex items-center gap-2 px-4 py-2 text-sm">
                              {isLive ? (
                                <span className="flex h-1.5 w-1.5 flex-shrink-0 relative">
                                  <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-red-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                                </span>
                              ) : (
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${game.status === 'completed' ? 'bg-gray-600' : 'bg-gray-700'}`} />
                              )}
                              <span className={`truncate flex-1 ${homeWon ? 'text-white font-semibold' : 'text-gray-400'}`}>{home}</span>
                              <span className="font-mono text-xs text-gray-500 w-[60px] text-center">
                                {game.scoreHome ?? 0} <span className="text-gray-600">x</span> {game.scoreAway ?? 0}
                              </span>
                              <span className={`truncate flex-1 text-right ${awayWon ? 'text-white font-semibold' : 'text-gray-400'}`}>{away}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-600">No matches played yet</div>
                    )}

                    {/* View Bracket link */}
                    <Link
                      href={`/e/${tournament.id}/${cat.id}`}
                      className="flex items-center justify-between px-4 py-2.5 bg-dark-elevated border-t border-dark-border text-sm font-medium text-footvolley-accent hover:text-white transition-colors group"
                    >
                      <span>View Bracket</span>
                      <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Legacy: no categories — show flat scoreboard */
          <div className="space-y-4">
            {recentGames.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Recent Matches</h2>
                <div className="rounded-xl border border-dark-border bg-dark-surface overflow-hidden divide-y divide-dark-border">
                  {recentGames.slice(0, 10).map((game) => {
                    const { home, away } = formatPlayerNames(game);
                    const homeWon = game.winningSide === 'home' || (!game.winningSide && (game.scoreHome ?? 0) > (game.scoreAway ?? 0));
                    const awayWon = game.winningSide === 'away' || (!game.winningSide && (game.scoreAway ?? 0) > (game.scoreHome ?? 0));
                    return (
                      <div key={game.id} className="flex items-center gap-2 px-4 py-2.5 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-600 flex-shrink-0" />
                        <span className={`truncate flex-1 ${homeWon ? 'text-white font-semibold' : 'text-gray-400'}`}>{home}</span>
                        <span className="font-mono text-xs text-gray-500 w-[60px] text-center">
                          {game.scoreHome ?? 0} <span className="text-gray-600">x</span> {game.scoreAway ?? 0}
                        </span>
                        <span className={`truncate flex-1 text-right ${awayWon ? 'text-white font-semibold' : 'text-gray-400'}`}>{away}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <Link
              href={`/e/${tournament.id}/main`}
              className="inline-flex items-center gap-2 text-sm font-medium text-footvolley-accent hover:text-white transition-colors"
            >
              View Bracket
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
