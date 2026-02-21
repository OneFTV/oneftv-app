'use client';

import { useState } from 'react';
import { BracketGame, groupGamesByRound, getRoundLabel } from '@/lib/bracketUtils';
import MatchCard from './MatchCard';
import { TournamentTheme, lightTheme } from './theme';

interface BracketViewProps {
  games: BracketGame[];
  dense?: boolean;
  theme?: TournamentTheme;
}

/* --- Desktop bracket with connector lines --- */
function DesktopBracket({
  rounds,
  totalRoundNum,
  dense,
  theme,
}: {
  rounds: ReturnType<typeof groupGamesByRound>;
  totalRoundNum: number;
  dense?: boolean;
  theme: TournamentTheme;
}) {
  const colMinWidth = theme.bracketColumnMinWidth;
  const connectorWidth = 'w-[32px] min-w-[32px]';

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex items-stretch min-w-max">
        {rounds.map((round, roundIdx) => {
          const label = getRoundLabel(round.roundNumber, totalRoundNum);
          const isLast = roundIdx === rounds.length - 1;

          return (
            <div key={round.roundNumber} className="flex">
              {/* Round column */}
              <div className={`flex flex-col ${colMinWidth}`}>
                {/* Header */}
                <div className="text-center mb-4 px-2">
                  <span className={`text-xs font-bold ${theme.roundLabel} uppercase tracking-wider`}>
                    {label}
                  </span>
                </div>
                {/* Games with flex spacers for vertical centering */}
                <div className="flex flex-col justify-around flex-1 gap-0">
                  {/* Leading half-spacer */}
                  <div style={{ flexGrow: 0.5 }} />
                  {round.games.map((game, gi) => (
                    <div key={game.id}>
                      <div className="px-2">
                        <MatchCard game={game} compact theme={theme} />
                      </div>
                      {gi < round.games.length - 1 && <div style={{ flexGrow: 1 }} />}
                    </div>
                  ))}
                  {/* Trailing half-spacer */}
                  <div style={{ flexGrow: 0.5 }} />
                </div>
              </div>

              {/* Connector column (between this round and next) */}
              {!isLast && (
                <div className={`flex flex-col justify-around flex-1 ${connectorWidth}`}>
                  <div style={{ flexGrow: 0.5 }} />
                  {round.games.map((game, gi) => {
                    // For pairs: top game gets bottom+right border, bottom game gets top+right border
                    const isTop = gi % 2 === 0;
                    const hasPartner = gi + 1 < round.games.length;

                    if (isTop && hasPartner) {
                      return (
                        <div key={`conn-${gi}`} className="flex flex-col" style={{ flexGrow: 1 }}>
                          {/* Top arm */}
                          <div className={`flex-1 border-b-2 border-r-2 ${theme.connectorBorder} rounded-tr`} />
                          {/* Bottom arm */}
                          <div className={`flex-1 border-t-2 border-r-2 ${theme.connectorBorder} rounded-br`} />
                        </div>
                      );
                    } else if (!isTop) {
                      // Skip — handled by the pair above
                      return null;
                    } else {
                      // Odd game without a partner (bye)
                      return (
                        <div key={`conn-${gi}`} style={{ flexGrow: 1 }}>
                          <div className="h-full flex items-center">
                            <div className={`w-full border-t-2 ${theme.connectorBorder}`} />
                          </div>
                        </div>
                      );
                    }
                  })}
                  <div style={{ flexGrow: 0.5 }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* --- Mobile bracket: round tabs + stacked cards --- */
function MobileBracket({
  rounds,
  totalRoundNum,
  theme,
}: {
  rounds: ReturnType<typeof groupGamesByRound>;
  totalRoundNum: number;
  theme: TournamentTheme;
}) {
  const [activeRound, setActiveRound] = useState(rounds[0]?.roundNumber ?? 1);
  const activeGames = rounds.find((r) => r.roundNumber === activeRound)?.games ?? [];

  return (
    <div>
      {/* Round selector pills */}
      <div className="flex overflow-x-auto gap-2 pb-3 mb-4 -mx-1 px-1">
        {rounds.map((round) => {
          const label = getRoundLabel(round.roundNumber, totalRoundNum);
          const isActive = round.roundNumber === activeRound;
          return (
            <button
              key={round.roundNumber}
              onClick={() => setActiveRound(round.roundNumber)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors
                ${isActive
                  ? 'bg-footvolley-primary text-white'
                  : theme.roundPillInactive
                }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Stacked match cards */}
      <div className="space-y-3">
        {activeGames.map((game) => (
          <div key={game.id} className="flex justify-center">
            <MatchCard game={game} compact theme={theme} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BracketView({ games, dense = false, theme = lightTheme }: BracketViewProps) {
  // Prefer knockout games; fall back to all games for pure bracket formats
  const knockoutOnly = games.filter((g) => g.roundType === 'knockout');
  const gamesToShow = knockoutOnly.length > 0 ? knockoutOnly : games;
  const rounds = groupGamesByRound(gamesToShow);

  if (rounds.length === 0) {
    return (
      <div className="text-center py-12">
        <div className={`${theme.emptyIcon} text-5xl mb-3`}>&#127942;</div>
        <p className={`${theme.emptyText} font-medium`}>No bracket games to display</p>
      </div>
    );
  }

  const totalRoundNum = rounds[rounds.length - 1].roundNumber;

  // Dense mode: always show desktop layout (poster view)
  if (dense) {
    return <DesktopBracket rounds={rounds} totalRoundNum={totalRoundNum} dense theme={theme} />;
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block">
        <DesktopBracket rounds={rounds} totalRoundNum={totalRoundNum} theme={theme} />
      </div>
      {/* Mobile */}
      <div className="md:hidden">
        <MobileBracket rounds={rounds} totalRoundNum={totalRoundNum} theme={theme} />
      </div>
    </>
  );
}
