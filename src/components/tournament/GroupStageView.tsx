'use client';

import { BracketGame, groupGamesByGroup } from '@/lib/bracketUtils';
import MatchCard from './MatchCard';
import BracketView from './BracketView';
import { TournamentTheme, lightTheme } from './theme';

interface GroupStageViewProps {
  games: BracketGame[];
  theme?: TournamentTheme;
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

function GroupCard({ groupName, games, theme }: { groupName: string; games: BracketGame[]; theme: TournamentTheme }) {
  const standings = computeGroupStandings(games);

  return (
    <div className={`rounded-xl border ${theme.groupCardBorder} overflow-hidden shadow-sm`}>
      {/* Header */}
      <div className={`${theme.groupHeaderBg} px-4 py-3`}>
        <h4 className="text-white font-bold text-sm uppercase tracking-wider">
          {groupName}
        </h4>
      </div>

      {/* Standings table */}
      {standings.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className={`${theme.tableHeaderBg} ${theme.tableHeaderText} text-xs uppercase tracking-wider`}>
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
                  className={`border-t ${theme.tableRowBorder} transition-colors ${theme.tableRowHover} ${
                    qualifies ? 'border-l-[3px] border-l-green-500' : 'border-l-[3px] border-l-transparent'
                  }`}
                >
                  <td className={`px-4 py-2 ${theme.rankText} font-medium text-xs ${theme.tableCellBg}`}>
                    {idx + 1}
                  </td>
                  <td className={`px-3 py-2 font-semibold ${theme.teamNameText} truncate max-w-[200px] ${theme.tableCellBg}`}>
                    {s.name}
                  </td>
                  <td className={`text-center px-2 py-2 ${theme.pointsText || theme.rankText} ${theme.tableCellBg}`}>{s.played}</td>
                  <td className={`text-center px-2 py-2 ${theme.winsText} font-medium ${theme.tableCellBg}`}>{s.wins}</td>
                  <td className={`text-center px-2 py-2 ${theme.lossesText} font-medium ${theme.tableCellBg}`}>{s.losses}</td>
                  <td
                    className={`text-center px-2 py-2 font-mono text-xs font-bold ${theme.tableCellBg} ${
                      diff > 0 ? theme.diffPositive : diff < 0 ? theme.diffNegative : theme.diffNeutral
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

      {/* Qualification legend */}
      <div className={`px-4 py-2 ${theme.legendBg} border-t ${theme.tableRowBorder}`}>
        <div className={`flex items-center gap-1.5 text-[10px] ${theme.legendText}`}>
          <span className="w-2.5 h-2.5 bg-green-500 rounded-sm" />
          <span>Advances to knockout</span>
        </div>
      </div>

      {/* Match results */}
      <div className={`border-t ${theme.groupCardBorder}`}>
        <div className={`px-4 py-2 ${theme.matchesSectionHeaderBg}`}>
          <span className={`text-xs font-semibold ${theme.matchesSectionHeaderText} uppercase tracking-wider`}>
            Matches
          </span>
        </div>
        <div className={`p-3 space-y-2 ${theme.matchesSectionBg}`}>
          {games.map((game) => (
            <MatchCard key={game.id} game={game} theme={theme} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GroupStageView({ games, theme = lightTheme }: GroupStageViewProps) {
  const groupGames = games.filter(
    (g) => g.roundType === 'group' || g.groupName
  );
  const knockoutGames = games.filter(
    (g) => g.roundType === 'knockout' && !g.groupName
  );

  const groups = groupGamesByGroup(groupGames);

  return (
    <div className="space-y-10">
      {/* Group cards */}
      {groups.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-6 w-1 bg-footvolley-accent rounded-full" />
            <h4 className={`text-lg font-bold ${theme.sectionHeading}`}>Group Stage</h4>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {groups.map((group) => (
              <GroupCard
                key={group.groupName}
                groupName={group.groupName}
                games={group.games}
                theme={theme}
              />
            ))}
          </div>
        </div>
      )}

      {/* Knockout bracket */}
      {knockoutGames.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-6 w-1 bg-footvolley-secondary rounded-full" />
            <h4 className={`text-lg font-bold ${theme.sectionHeading}`}>Knockout Stage</h4>
          </div>
          <BracketView games={knockoutGames} theme={theme} />
        </div>
      )}

      {groups.length === 0 && knockoutGames.length === 0 && (
        <div className="text-center py-12">
          <div className={`${theme.emptyIcon} text-5xl mb-3`}>&#127942;</div>
          <p className={`${theme.emptyText} font-medium`}>No games to display</p>
        </div>
      )}
    </div>
  );
}
