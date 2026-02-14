'use client';

import { BracketGame, groupGamesByGroup } from '@/lib/bracketUtils';
import DarkMatchCard from './DarkMatchCard';
import DarkBracketView from './DarkBracketView';

interface DarkGroupStageViewProps {
  games: BracketGame[];
}

interface PlayerStanding {
  name: string;
  played: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
}

function computeGroupStandings(games: BracketGame[]): PlayerStanding[] {
  const map = new Map<string, PlayerStanding>();

  const getOrCreate = (name: string): PlayerStanding => {
    if (!map.has(name)) {
      map.set(name, { name, played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 });
    }
    return map.get(name)!;
  };

  for (const game of games) {
    if (game.status !== 'completed') continue;
    if (game.player1 === 'TBD' || game.player2 === 'TBD') continue;

    const p1 = getOrCreate(game.player1);
    const p2 = getOrCreate(game.player2);
    const s1 = game.score1 ?? 0;
    const s2 = game.score2 ?? 0;

    p1.played++;
    p2.played++;
    p1.pointsFor += s1;
    p1.pointsAgainst += s2;
    p2.pointsFor += s2;
    p2.pointsAgainst += s1;

    const homeWon = game.winningSide === 'home' || (!game.winningSide && s1 > s2);
    if (homeWon) {
      p1.wins++;
      p2.losses++;
    } else {
      p2.wins++;
      p1.losses++;
    }
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      b.wins - a.wins ||
      (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst)
  );
}

function DarkGroupCard({ groupName, games }: { groupName: string; games: BracketGame[] }) {
  const standings = computeGroupStandings(games);

  return (
    <div className="rounded-xl border border-dark-border overflow-hidden">
      <div className="bg-gradient-to-r from-footvolley-primary to-footvolley-primary/70 px-4 py-3">
        <h4 className="text-white font-bold text-sm uppercase tracking-wider">
          {groupName}
        </h4>
      </div>

      {standings.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-dark-elevated text-gray-500 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-2 w-8">#</th>
              <th className="text-left px-3 py-2">Team</th>
              <th className="text-center px-2 py-2 w-8">P</th>
              <th className="text-center px-2 py-2 w-8">W</th>
              <th className="text-center px-2 py-2 w-8">L</th>
              <th className="text-center px-2 py-2 w-12">+/-</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, idx) => {
              const diff = s.pointsFor - s.pointsAgainst;
              const qualifies = idx < 2;
              return (
                <tr
                  key={s.name}
                  className={`border-t border-dark-border transition-colors hover:bg-dark-elevated ${
                    qualifies ? 'border-l-[3px] border-l-green-500' : 'border-l-[3px] border-l-transparent'
                  }`}
                >
                  <td className="px-4 py-2 text-gray-500 font-medium text-xs bg-dark-surface">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-2 font-semibold text-gray-200 truncate max-w-[200px] bg-dark-surface">
                    {s.name}
                  </td>
                  <td className="text-center px-2 py-2 text-gray-400 bg-dark-surface">{s.played}</td>
                  <td className="text-center px-2 py-2 text-green-400 font-medium bg-dark-surface">{s.wins}</td>
                  <td className="text-center px-2 py-2 text-red-400 font-medium bg-dark-surface">{s.losses}</td>
                  <td
                    className={`text-center px-2 py-2 font-mono text-xs font-bold bg-dark-surface ${
                      diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-gray-500'
                    }`}
                  >
                    {diff > 0 ? `+${diff}` : diff}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <div className="px-4 py-2 bg-dark-elevated border-t border-dark-border">
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-sm" />
          <span>Advances to knockout</span>
        </div>
      </div>

      <div className="border-t border-dark-border">
        <div className="px-4 py-2 bg-dark-elevated">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Matches
          </span>
        </div>
        <div className="p-3 space-y-2 bg-dark-surface">
          {games.map((game) => (
            <div key={game.id} className="flex justify-center">
              <DarkMatchCard game={game} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DarkGroupStageView({ games }: DarkGroupStageViewProps) {
  const groupGames = games.filter(
    (g) => g.roundType === 'group' || g.groupName
  );
  const knockoutGames = games.filter(
    (g) => g.roundType === 'knockout' && !g.groupName
  );

  const groups = groupGamesByGroup(groupGames);

  return (
    <div className="space-y-10">
      {groups.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-6 w-1 bg-footvolley-accent rounded-full" />
            <h4 className="text-lg font-bold text-gray-100">Group Stage</h4>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {groups.map((group) => (
              <DarkGroupCard
                key={group.groupName}
                groupName={group.groupName}
                games={group.games}
              />
            ))}
          </div>
        </div>
      )}

      {knockoutGames.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-6 w-1 bg-footvolley-secondary rounded-full" />
            <h4 className="text-lg font-bold text-gray-100">Knockout Stage</h4>
          </div>
          <DarkBracketView games={knockoutGames} />
        </div>
      )}

      {groups.length === 0 && knockoutGames.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-600 text-5xl mb-3">&#127942;</div>
          <p className="text-gray-500 font-medium">No games to display</p>
        </div>
      )}
    </div>
  );
}
