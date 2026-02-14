'use client';

import { useState } from 'react';
import { BracketGame, groupGamesByRound, getRoundLabel } from '@/lib/bracketUtils';
import DarkMatchCard from './DarkMatchCard';

interface DarkBracketViewProps {
  games: BracketGame[];
}

function DesktopBracket({ rounds, totalRoundNum }: { rounds: ReturnType<typeof groupGamesByRound>; totalRoundNum: number }) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex items-stretch min-w-max">
        {rounds.map((round, roundIdx) => {
          const label = getRoundLabel(round.roundNumber, totalRoundNum);
          const isLast = roundIdx === rounds.length - 1;

          return (
            <div key={round.roundNumber} className="flex">
              <div className="flex flex-col min-w-[280px]">
                <div className="text-center mb-4 px-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {label}
                  </span>
                </div>
                <div className="flex flex-col justify-around flex-1 gap-0">
                  <div style={{ flexGrow: 0.5 }} />
                  {round.games.map((game, gi) => (
                    <div key={game.id}>
                      <div className="px-2">
                        <DarkMatchCard game={game} />
                      </div>
                      {gi < round.games.length - 1 && <div style={{ flexGrow: 1 }} />}
                    </div>
                  ))}
                  <div style={{ flexGrow: 0.5 }} />
                </div>
              </div>

              {!isLast && (
                <div className="flex flex-col justify-around flex-1 w-[32px] min-w-[32px]">
                  <div style={{ flexGrow: 0.5 }} />
                  {round.games.map((game, gi) => {
                    const isTop = gi % 2 === 0;
                    const hasPartner = gi + 1 < round.games.length;

                    if (isTop && hasPartner) {
                      return (
                        <div key={`conn-${gi}`} className="flex flex-col" style={{ flexGrow: 1 }}>
                          <div className="flex-1 border-b-2 border-r-2 border-dark-divider rounded-tr" />
                          <div className="flex-1 border-t-2 border-r-2 border-dark-divider rounded-br" />
                        </div>
                      );
                    } else if (!isTop) {
                      return null;
                    } else {
                      return (
                        <div key={`conn-${gi}`} style={{ flexGrow: 1 }}>
                          <div className="h-full flex items-center">
                            <div className="w-full border-t-2 border-dark-divider" />
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

function MobileBracket({ rounds, totalRoundNum }: { rounds: ReturnType<typeof groupGamesByRound>; totalRoundNum: number }) {
  const [activeRound, setActiveRound] = useState(rounds[0]?.roundNumber ?? 1);
  const activeGames = rounds.find((r) => r.roundNumber === activeRound)?.games ?? [];

  return (
    <div>
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
                  : 'bg-dark-elevated text-gray-400 hover:bg-dark-divider'
                }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className="space-y-3">
        {activeGames.map((game) => (
          <div key={game.id} className="flex justify-center">
            <DarkMatchCard game={game} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DarkBracketView({ games }: DarkBracketViewProps) {
  const knockoutOnly = games.filter((g) => g.roundType === 'knockout');
  const gamesToShow = knockoutOnly.length > 0 ? knockoutOnly : games;
  const rounds = groupGamesByRound(gamesToShow);

  if (rounds.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 text-5xl mb-3">&#127942;</div>
        <p className="text-gray-500 font-medium">No bracket games to display</p>
      </div>
    );
  }

  const totalRoundNum = rounds[rounds.length - 1].roundNumber;

  return (
    <>
      <div className="hidden md:block">
        <DesktopBracket rounds={rounds} totalRoundNum={totalRoundNum} />
      </div>
      <div className="md:hidden">
        <MobileBracket rounds={rounds} totalRoundNum={totalRoundNum} />
      </div>
    </>
  );
}
