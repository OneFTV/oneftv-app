'use client';

import { BracketGame } from '@/lib/bracketUtils';
import { TournamentTheme, lightTheme } from './theme';

interface RoundRobinViewProps {
  games: BracketGame[];
  theme?: TournamentTheme;
}

interface MatchResult {
  score1: number | undefined;
  score2: number | undefined;
  winningSide: string | null;
  status: string;
}

export default function RoundRobinView({ games, theme = lightTheme }: RoundRobinViewProps) {
  // Collect unique teams
  const teamSet = new Set<string>();
  for (const game of games) {
    if (game.player1 !== 'TBD') teamSet.add(game.player1);
    if (game.player2 !== 'TBD') teamSet.add(game.player2);
  }
  const teams = Array.from(teamSet).sort();

  if (teams.length === 0) {
    return (
      <div className="text-center py-12">
        <div className={`${theme.emptyIcon} text-5xl mb-3`}>&#127942;</div>
        <p className={`${theme.emptyText} font-medium`}>No games to display</p>
      </div>
    );
  }

  // Build lookup: "teamA|teamB" => result
  const matchLookup = new Map<string, MatchResult>();
  for (const game of games) {
    matchLookup.set(`${game.player1}|${game.player2}`, {
      score1: game.score1,
      score2: game.score2,
      winningSide: game.winningSide,
      status: game.status,
    });
  }

  const getResult = (
    rowTeam: string,
    colTeam: string
  ): { display: string; className: string } => {
    if (rowTeam === colTeam) {
      return { display: '', className: theme.diagonalCell };
    }

    const direct = matchLookup.get(`${rowTeam}|${colTeam}`);
    const reverse = matchLookup.get(`${colTeam}|${rowTeam}`);

    if (direct && direct.status === 'completed') {
      const won =
        direct.winningSide === 'home' ||
        (!direct.winningSide &&
          direct.score1 != null &&
          direct.score2 != null &&
          direct.score1 > direct.score2);
      return {
        display: `${direct.score1 ?? 0}-${direct.score2 ?? 0}`,
        className: won ? theme.winCell : theme.lossCell,
      };
    }

    if (reverse && reverse.status === 'completed') {
      const won =
        reverse.winningSide === 'away' ||
        (!reverse.winningSide &&
          reverse.score1 != null &&
          reverse.score2 != null &&
          reverse.score2 > reverse.score1);
      return {
        display: `${reverse.score2 ?? 0}-${reverse.score1 ?? 0}`,
        className: won ? theme.winCell : theme.lossCell,
      };
    }

    if (direct || reverse) {
      return { display: '-', className: theme.pendingCell };
    }

    return { display: '', className: theme.emptyCell };
  };

  // Compute simple standings from games
  const standingsMap = new Map<string, { wins: number; losses: number; pf: number; pa: number }>();
  for (const t of teams) {
    standingsMap.set(t, { wins: 0, losses: 0, pf: 0, pa: 0 });
  }
  for (const game of games) {
    if (game.status !== 'completed') continue;
    const s1 = game.score1 ?? 0;
    const s2 = game.score2 ?? 0;
    const homeWon = game.winningSide === 'home' || (!game.winningSide && s1 > s2);
    const p1s = standingsMap.get(game.player1);
    const p2s = standingsMap.get(game.player2);
    if (p1s) { p1s.pf += s1; p1s.pa += s2; if (homeWon) p1s.wins++; else p1s.losses++; }
    if (p2s) { p2s.pf += s2; p2s.pa += s1; if (homeWon) p2s.losses++; else p2s.wins++; }
  }
  const sortedTeams = [...teams].sort((a, b) => {
    const sa = standingsMap.get(a)!;
    const sb = standingsMap.get(b)!;
    return sb.wins - sa.wins || (sb.pf - sb.pa) - (sa.pf - sa.pa);
  });

  return (
    <div className="space-y-8">
      {/* Cross-table */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="h-6 w-1 bg-footvolley-accent rounded-full" />
          <h4 className={`text-lg font-bold ${theme.sectionHeading}`}>Results Matrix</h4>
        </div>
        <div className={`overflow-x-auto rounded-xl border ${theme.tableBorder}`}>
          <table className="min-w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-footvolley-primary text-white px-3 py-2.5 text-left font-semibold text-xs">
                  Team
                </th>
                {teams.map((team) => (
                  <th
                    key={team}
                    className="bg-footvolley-primary text-white px-2 py-2.5 text-center font-medium text-[11px] whitespace-nowrap max-w-[80px] truncate"
                    title={team}
                  >
                    {team.length > 15 ? team.slice(0, 14) + '...' : team}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teams.map((rowTeam, rowIdx) => (
                <tr key={rowTeam} className={rowIdx % 2 === 0 ? theme.rowEven : theme.rowOdd}>
                  <td className={`sticky left-0 z-10 bg-inherit px-3 py-2 font-semibold ${theme.rowLabel} border-r ${theme.cellBorder} whitespace-nowrap text-xs`}>
                    {rowTeam}
                  </td>
                  {teams.map((colTeam) => {
                    const result = getResult(rowTeam, colTeam);
                    return (
                      <td
                        key={colTeam}
                        className={`px-2 py-2 text-center border ${theme.cellBorder} font-mono text-xs min-w-[52px] ${result.className}`}
                      >
                        {result.display}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Standings */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="h-6 w-1 bg-footvolley-primary rounded-full" />
          <h4 className={`text-lg font-bold ${theme.sectionHeading}`}>Standings</h4>
        </div>
        <div className={`rounded-xl border ${theme.tableBorder} overflow-hidden`}>
          <table className="w-full text-sm">
            <thead>
              <tr className={`${theme.tableHeaderBg} ${theme.tableHeaderText} text-xs uppercase tracking-wider`}>
                <th className="text-left px-4 py-2 w-8">#</th>
                <th className="text-left px-3 py-2">Team</th>
                <th className="text-center px-2 py-2 w-10">W</th>
                <th className="text-center px-2 py-2 w-10">L</th>
                <th className="text-center px-2 py-2 w-12">PF</th>
                <th className="text-center px-2 py-2 w-12">PA</th>
                <th className="text-center px-2 py-2 w-12">+/-</th>
              </tr>
            </thead>
            <tbody>
              {sortedTeams.map((team, idx) => {
                const s = standingsMap.get(team)!;
                const diff = s.pf - s.pa;
                return (
                  <tr key={team} className={`border-t ${theme.tableRowBorder} ${theme.tableRowHover} transition-colors ${theme.standingsRowBg}`}>
                    <td className={`px-4 py-2.5 ${theme.rankText} font-medium`}>{idx + 1}</td>
                    <td className={`px-3 py-2.5 font-semibold ${theme.teamNameText}`}>{team}</td>
                    <td className={`text-center px-2 py-2.5 ${theme.winsText} font-medium`}>{s.wins}</td>
                    <td className={`text-center px-2 py-2.5 ${theme.lossesText} font-medium`}>{s.losses}</td>
                    <td className={`text-center px-2 py-2.5 ${theme.pointsText}`}>{s.pf}</td>
                    <td className={`text-center px-2 py-2.5 ${theme.pointsText}`}>{s.pa}</td>
                    <td className={`text-center px-2 py-2.5 font-mono font-bold text-xs ${
                      diff > 0 ? theme.diffPositive : diff < 0 ? theme.diffNegative : theme.diffNeutral
                    }`}>
                      {diff > 0 ? `+${diff}` : diff}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
