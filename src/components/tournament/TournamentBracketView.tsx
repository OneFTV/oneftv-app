'use client';

import { useState } from 'react';
import { BracketGame, isDoubleElimination } from '@/lib/bracketUtils';
import BracketView from './BracketView';
import DoubleEliminationBracketView from './DoubleEliminationBracketView';
import GroupStageView from './GroupStageView';
import RoundRobinView from './RoundRobinView';
import MatchCard from './MatchCard';
import { TournamentTheme, lightTheme } from './theme';
import { Trophy } from 'lucide-react';

interface TournamentBracketViewProps {
  games: BracketGame[];
  format: string;
  dense?: boolean;
  theme?: TournamentTheme;
}

function FlatGamesList({ games, theme }: { games: BracketGame[]; theme: TournamentTheme }) {
  // Group by round for nicer flat view
  const roundMap = new Map<string, BracketGame[]>();
  for (const game of games) {
    const key = game.roundName + (game.groupName ? ` - ${game.groupName}` : '');
    if (!roundMap.has(key)) roundMap.set(key, []);
    roundMap.get(key)!.push(game);
  }

  return (
    <div className="space-y-6">
      {Array.from(roundMap.entries()).map(([roundLabel, roundGames]) => (
        <div key={roundLabel}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`h-4 w-0.5 ${theme.flatRoundDivider} rounded-full`} />
            <span className={`text-xs font-semibold ${theme.flatRoundLabel} uppercase tracking-wider`}>
              {roundLabel}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {roundGames.map((game) => (
              <MatchCard key={game.id} game={game} theme={theme} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TournamentBracketView({
  games,
  format,
  dense = false,
  theme = lightTheme,
}: TournamentBracketViewProps) {
  const [viewMode, setViewMode] = useState<'bracket' | 'list'>('bracket');

  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className={`mx-auto h-12 w-12 ${theme.emptyIcon} mb-3`} />
        <p className={`${theme.emptyText} font-medium`}>No games scheduled yet</p>
        <p className={`${theme.emptySubtext} text-sm mt-1`}>
          Games will appear here once the bracket is generated
        </p>
      </div>
    );
  }

  const renderBracketView = () => {
    const f = format.toLowerCase().replace(/[^a-z_]/g, '_');
    switch (f) {
      case 'double_elimination':
        return <DoubleEliminationBracketView games={games} dense={dense} theme={theme} />;
      case 'bracket':
        return <BracketView games={games} dense={dense} theme={theme} />;
      case 'king_of_the_beach':
      case 'group_knockout':
      case 'group+knockout':
        return <GroupStageView games={games} theme={theme} />;
      case 'round_robin':
        return <RoundRobinView games={games} theme={theme} />;
      default:
        // Try to auto-detect from game data
        if (isDoubleElimination(games)) {
          return <DoubleEliminationBracketView games={games} dense={dense} theme={theme} />;
        }
        if (games.some((g) => g.groupName)) {
          return <GroupStageView games={games} theme={theme} />;
        }
        return <BracketView games={games} dense={dense} theme={theme} />;
    }
  };

  return (
    <div>
      {/* Header with view toggle */}
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-bold ${theme.gamesHeading}`}>Games</h3>
        <div className={`flex ${theme.toggleBg} rounded-lg p-0.5`}>
          <button
            onClick={() => setViewMode('bracket')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              viewMode === 'bracket' ? theme.toggleActive : theme.toggleInactive
            }`}
          >
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-70">
                <path d="M1 2h3v3H1V2zm0 7h3v3H1V9zm6-3.5h3v3H7V5.5zm5 0h2v3h-2V5.5zM4 3.5h3M4 10.5h3M10 7h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Bracket
            </span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              viewMode === 'list' ? theme.toggleActive : theme.toggleInactive
            }`}
          >
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-70">
                <path d="M2 3h10M2 7h10M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              List
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'bracket' ? renderBracketView() : <FlatGamesList games={games} theme={theme} />}
    </div>
  );
}
