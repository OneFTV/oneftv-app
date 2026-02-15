'use client';

import { BracketGame } from '@/lib/bracketUtils';
import { TournamentTheme, lightTheme } from './theme';

interface MatchCardProps {
  game: BracketGame;
  compact?: boolean;
  theme?: TournamentTheme;
}

export default function MatchCard({ game, compact = false, theme = lightTheme }: MatchCardProps) {
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
        ${isLive ? theme.cardLiveBorder : theme.cardBorder}
        ${isTBD ? theme.cardTbdOpacity : ''}
        ${compact ? 'w-[220px]' : 'w-full'}
      `}
    >
      {/* Player 1 (Home) */}
      <div
        className={`
          flex items-center justify-between px-3 py-2 text-sm border-b ${theme.cardDivider}
          ${p1Wins ? theme.cardWinnerBg : theme.cardBg}
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
            ${p1Wins ? 'text-footvolley-accent' : theme.cardScoreText}
          `}
        >
          {game.score1 ?? '-'}
        </span>
      </div>

      {/* Player 2 (Away) */}
      <div
        className={`
          flex items-center justify-between px-3 py-2 text-sm
          ${p2Wins ? theme.cardWinnerBg : theme.cardBg}
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
            ${p2Wins ? 'text-footvolley-accent' : theme.cardScoreText}
          `}
        >
          {game.score2 ?? '-'}
        </span>
      </div>

      {/* Set scores for bestOf3 */}
      {game.bestOf3 && isCompleted && game.set2Home != null && (
        <div className={`flex items-center justify-center gap-2 px-3 py-1 ${theme.cardSetScoreBg} border-t ${theme.cardDivider}`}>
          <span className="text-[10px] font-medium text-gray-500">
            {game.score1}-{game.score2}
          </span>
          <span className="text-[10px] font-medium text-gray-500">
            {game.set2Home}-{game.set2Away}
          </span>
          {game.set3Home != null && (
            <span className={`text-[10px] font-medium ${theme.cardSet3Text}`}>
              {game.set3Home}-{game.set3Away}
            </span>
          )}
        </div>
      )}

      {/* Footer: court + time + live indicator */}
      <div className={`flex items-center justify-between px-3 py-1 ${theme.cardFooterBg} text-[11px] ${theme.cardFooterText} border-t ${theme.cardDivider}`}>
        <span className="flex items-center gap-1">
          Court {game.court}
          {game.bestOf3 && (
            <span className={`px-1 py-px rounded text-[9px] font-bold ${theme.cardBo3Badge}`}>Bo3</span>
          )}
        </span>
        <div className="flex items-center gap-1.5">
          {isLive && (
            <span className="flex h-1.5 w-1.5 relative">
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
