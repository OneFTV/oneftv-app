import { BracketGame } from '@/lib/bracketUtils';

interface DarkMatchCardProps {
  game: BracketGame;
}

export default function DarkMatchCard({ game }: DarkMatchCardProps) {
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
        w-[260px] rounded-md border overflow-hidden text-[13px] leading-tight
        transition-shadow hover:shadow-lg hover:shadow-black/20
        ${isLive ? 'border-red-500/60 ring-2 ring-red-500/40' : 'border-dark-border'}
        ${isTBD ? 'opacity-40' : ''}
      `}
    >
      {/* Team 1 */}
      <div
        className={`flex items-center justify-between px-2.5 py-[7px] border-b border-dark-border
          ${p1Wins ? 'bg-footvolley-primary text-white' : 'bg-dark-surface text-gray-300'}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isCompleted && (
            <span className={`w-[3px] h-3.5 rounded-full flex-shrink-0 ${p1Wins ? 'bg-footvolley-accent' : 'bg-transparent'}`} />
          )}
          <span className={`truncate ${p1Wins ? 'font-semibold' : 'font-medium'}`}>
            {game.player1}
          </span>
        </div>
        <span className={`font-mono font-bold min-w-[24px] text-right ${p1Wins ? 'text-footvolley-accent' : 'text-gray-500'}`}>
          {game.score1 ?? '-'}
        </span>
      </div>

      {/* Team 2 */}
      <div
        className={`flex items-center justify-between px-2.5 py-[7px]
          ${p2Wins ? 'bg-footvolley-primary text-white' : 'bg-dark-surface text-gray-300'}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isCompleted && (
            <span className={`w-[3px] h-3.5 rounded-full flex-shrink-0 ${p2Wins ? 'bg-footvolley-accent' : 'bg-transparent'}`} />
          )}
          <span className={`truncate ${p2Wins ? 'font-semibold' : 'font-medium'}`}>
            {game.player2}
          </span>
        </div>
        <span className={`font-mono font-bold min-w-[24px] text-right ${p2Wins ? 'text-footvolley-accent' : 'text-gray-500'}`}>
          {game.score2 ?? '-'}
        </span>
      </div>

      {/* Set scores for bestOf3 */}
      {game.bestOf3 && isCompleted && game.set2Home != null && (
        <div className="flex items-center justify-center gap-2 px-2.5 py-1 bg-dark-elevated border-t border-dark-border">
          <span className="text-[10px] font-medium text-gray-500">
            {game.score1}-{game.score2}
          </span>
          <span className="text-[10px] font-medium text-gray-500">
            {game.set2Home}-{game.set2Away}
          </span>
          {game.set3Home != null && (
            <span className="text-[10px] font-medium text-footvolley-accent">
              {game.set3Home}-{game.set3Away}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-2.5 py-1 bg-dark-elevated text-[11px] text-gray-500 border-t border-dark-border">
        <span className="flex items-center gap-1">
          Court {game.court}
          {game.bestOf3 && (
            <span className="px-1 py-px rounded text-[9px] font-bold bg-footvolley-primary text-footvolley-accent">Bo3</span>
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
