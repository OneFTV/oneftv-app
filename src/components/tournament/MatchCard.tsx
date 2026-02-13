'use client';

import { BracketGame } from '@/lib/bracketUtils';

interface MatchCardProps {
  game: BracketGame;
  compact?: boolean;
}

export default function MatchCard({ game, compact = false }: MatchCardProps) {
  const isCompleted = game.status === 'completed';
  const isLive = game.status === 'in_progress';

  // Determine winner
  const p1Wins =
    isCompleted &&
    (game.winningSide === 'home' ||
      (!game.winningSide &&
        game.score1 != null &&
        game.score2 != null &&
        game.score1 > game.score2));
  const p2Wins =
    isCompleted &&
    (game.winningSide === 'away' ||
      (!game.winningSide &&
        game.score1 != null &&
        game.score2 != null &&
        game.score2 > game.score1));

  const isTBD = game.player1 === 'TBD' && game.player2 === 'TBD';

  return (
    <div
      className={`
        rounded-lg border overflow-hidden shadow-sm transition-shadow hover:shadow-md
        ${isLive ? 'border-red-400 ring-2 ring-red-300/40' : 'border-gray-200'}
        ${isTBD ? 'opacity-50' : ''}
        ${compact ? 'w-[220px]' : 'w-full'}
      `}
    >
      {/* Player 1 (Home) */}
      <div
        className={`
          flex items-center justify-between px-3 py-2 text-sm border-b border-gray-100
          ${p1Wins ? 'bg-footvolley-primary text-white' : 'bg-white text-gray-700'}
        `}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isCompleted && (
            <span
              className={`w-1 h-4 rounded-full flex-shrink-0 ${
                p1Wins ? 'bg-footvolley-accent' : 'bg-transparent'
              }`}
            />
          )}
          <span
            className={`truncate ${
              p1Wins ? 'font-semibold' : 'font-medium'
            }`}
          >
            {game.player1}
          </span>
        </div>
        <span
          className={`
            font-mono font-bold text-sm min-w-[28px] text-right
            ${p1Wins ? 'text-footvolley-accent' : ''}
          `}
        >
          {game.score1 ?? '-'}
        </span>
      </div>

      {/* Player 2 (Away) */}
      <div
        className={`
          flex items-center justify-between px-3 py-2 text-sm
          ${p2Wins ? 'bg-footvolley-primary text-white' : 'bg-white text-gray-700'}
        `}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isCompleted && (
            <span
              className={`w-1 h-4 rounded-full flex-shrink-0 ${
                p2Wins ? 'bg-footvolley-accent' : 'bg-transparent'
              }`}
            />
          )}
          <span
            className={`truncate ${
              p2Wins ? 'font-semibold' : 'font-medium'
            }`}
          >
            {game.player2}
          </span>
        </div>
        <span
          className={`
            font-mono font-bold text-sm min-w-[28px] text-right
            ${p2Wins ? 'text-footvolley-accent' : ''}
          `}
        >
          {game.score2 ?? '-'}
        </span>
      </div>

      {/* Set scores for bestOf3 */}
      {game.bestOf3 && isCompleted && game.set2Home != null && (
        <div className="flex items-center justify-center gap-2 px-3 py-1 bg-gray-50 border-t border-gray-100">
          <span className="text-[10px] font-medium text-gray-500">
            {game.score1}-{game.score2}
          </span>
          <span className="text-[10px] font-medium text-gray-500">
            {game.set2Home}-{game.set2Away}
          </span>
          {game.set3Home != null && (
            <span className="text-[10px] font-medium text-amber-600">
              {game.set3Home}-{game.set3Away}
            </span>
          )}
        </div>
      )}

      {/* Footer: court + time + live indicator */}
      <div className="flex items-center justify-between px-3 py-1 bg-gray-50 text-[11px] text-gray-400 border-t border-gray-100">
        <span className="flex items-center gap-1">
          Court {game.court}
          {game.bestOf3 && (
            <span className="px-1 py-px rounded text-[9px] font-bold bg-[#1a2744] text-[#c4a35a]">Bo3</span>
          )}
        </span>
        <div className="flex items-center gap-1.5">
          {isLive && (
            <span className="flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
            </span>
          )}
          <span>
            {isLive
              ? 'LIVE'
              : game.scheduledTime
              ? new Date(game.scheduledTime).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
