'use client';

import { useState } from 'react';
import { BracketGame, groupGamesByRound, getRoundLabel } from '@/lib/bracketUtils';

interface BracketViewProps {
  games: BracketGame[];
}

/* Compact match card for the bracket tree */
function BracketMatchCard({ game }: { game: BracketGame }) {
  const isCompleted = game.status === 'completed';
  const isLive = game.status === 'in_progress';
  const p1Wins =
    isCompleted &&
    (game.winningSide === 'home' ||
      (!game.winningSide && (game.score1 ?? 0) > (game.score2 ?? 0)));
  const p2Wins =
    isCompleted &&
    (game.winningSide === 'away' ||
      (!game.winningSide && (game.score2 ?? 0) > (game.score1 ?? 0)));

  const isTBD = game.player1 === 'TBD' && game.player2 === 'TBD';

  return (
    <div
      className={`
        w-[220px] rounded-md border overflow-hidden text-[13px] leading-tight
        transition-shadow hover:shadow-md
        ${isLive ? 'border-red-400 ring-2 ring-red-300/40' : 'border-gray-200'}
        ${isTBD ? 'opacity-40' : 'shadow-sm'}
      `}
    >
      {/* Player 1 */}
      <div
        className={`flex items-center justify-between px-2.5 py-[7px] border-b border-gray-100
          ${p1Wins ? 'bg-footvolley-primary text-white' : 'bg-white text-gray-700'}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isCompleted && (
            <span className={`w-[3px] h-3.5 rounded-full flex-shrink-0 ${p1Wins ? 'bg-footvolley-accent' : 'bg-transparent'}`} />
          )}
          <span className={`truncate ${p1Wins ? 'font-semibold' : 'font-medium'}`}>
            {game.player1}
          </span>
        </div>
        <span className={`font-mono font-bold min-w-[24px] text-right ${p1Wins ? 'text-footvolley-accent' : ''}`}>
          {game.score1 ?? '-'}
        </span>
      </div>
      {/* Player 2 */}
      <div
        className={`flex items-center justify-between px-2.5 py-[7px]
          ${p2Wins ? 'bg-footvolley-primary text-white' : 'bg-white text-gray-700'}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isCompleted && (
            <span className={`w-[3px] h-3.5 rounded-full flex-shrink-0 ${p2Wins ? 'bg-footvolley-accent' : 'bg-transparent'}`} />
          )}
          <span className={`truncate ${p2Wins ? 'font-semibold' : 'font-medium'}`}>
            {game.player2}
          </span>
        </div>
        <span className={`font-mono font-bold min-w-[24px] text-right ${p2Wins ? 'text-footvolley-accent' : ''}`}>
          {game.score2 ?? '-'}
        </span>
      </div>
    </div>
  );
}

/* --- Desktop bracket with connector lines --- */
function DesktopBracket({ rounds, totalRoundNum }: { rounds: ReturnType<typeof groupGamesByRound>; totalRoundNum: number }) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex items-stretch min-w-max">
        {rounds.map((round, roundIdx) => {
          const label = getRoundLabel(round.roundNumber, totalRoundNum);
          const isLast = roundIdx === rounds.length - 1;

          return (
            <div key={round.roundNumber} className="flex">
              {/* Round column */}
              <div className="flex flex-col min-w-[240px]">
                {/* Header */}
                <div className="text-center mb-4 px-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
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
                        <BracketMatchCard game={game} />
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
                <div className="flex flex-col justify-around flex-1 w-[32px] min-w-[32px]">
                  <div style={{ flexGrow: 0.5 }} />
                  {round.games.map((game, gi) => {
                    // For pairs: top game gets bottom+right border, bottom game gets top+right border
                    const isTop = gi % 2 === 0;
                    const hasPartner = gi + 1 < round.games.length;

                    if (isTop && hasPartner) {
                      return (
                        <div key={`conn-${gi}`} className="flex flex-col" style={{ flexGrow: 1 }}>
                          {/* Top arm */}
                          <div className="flex-1 border-b-2 border-r-2 border-gray-300 rounded-tr" />
                          {/* Bottom arm */}
                          <div className="flex-1 border-t-2 border-r-2 border-gray-300 rounded-br" />
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
                            <div className="w-full border-t-2 border-gray-300" />
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
function MobileBracket({ rounds, totalRoundNum }: { rounds: ReturnType<typeof groupGamesByRound>; totalRoundNum: number }) {
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
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
          <BracketMatchCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}

export default function BracketView({ games }: BracketViewProps) {
  // Prefer knockout games; fall back to all games for pure bracket formats
  const knockoutOnly = games.filter((g) => g.roundType === 'knockout');
  const gamesToShow = knockoutOnly.length > 0 ? knockoutOnly : games;
  const rounds = groupGamesByRound(gamesToShow);

  if (rounds.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-300 text-5xl mb-3">&#127942;</div>
        <p className="text-gray-400 font-medium">No bracket games to display</p>
      </div>
    );
  }

  const totalRoundNum = rounds[rounds.length - 1].roundNumber;

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block">
        <DesktopBracket rounds={rounds} totalRoundNum={totalRoundNum} />
      </div>
      {/* Mobile */}
      <div className="md:hidden">
        <MobileBracket rounds={rounds} totalRoundNum={totalRoundNum} />
      </div>
    </>
  );
}
