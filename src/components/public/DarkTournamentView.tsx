'use client';

import { BracketGame } from '@/lib/bracketUtils';
import DarkBracketView from './DarkBracketView';
import DarkGroupStageView from './DarkGroupStageView';
import DarkRoundRobinView from './DarkRoundRobinView';

interface DarkTournamentViewProps {
  games: BracketGame[];
  format: string;
}

export default function DarkTournamentView({ games, format }: DarkTournamentViewProps) {
  if (games.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-600 text-5xl mb-3">&#127942;</div>
        <p className="text-gray-500 font-medium">No games scheduled yet</p>
        <p className="text-gray-600 text-sm mt-1">
          Games will appear here once the bracket is generated
        </p>
      </div>
    );
  }

  const f = format.toLowerCase().replace(/[^a-z_]/g, '_');
  switch (f) {
    case 'bracket':
      return <DarkBracketView games={games} />;
    case 'king_of_the_beach':
    case 'group_knockout':
    case 'group_knockout':
      return <DarkGroupStageView games={games} />;
    case 'round_robin':
      return <DarkRoundRobinView games={games} />;
    default:
      if (games.some((g) => g.groupName)) {
        return <DarkGroupStageView games={games} />;
      }
      return <DarkBracketView games={games} />;
  }
}
