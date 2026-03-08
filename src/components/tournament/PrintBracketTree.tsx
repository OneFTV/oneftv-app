'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * PrintBracketTree — pure CSS/HTML tournament bracket for printing.
 * Renders rounds as columns with connector lines via CSS borders.
 */

interface PrintGame {
  id: string;
  matchNumber: number | null;
  homeTeam: string;
  awayTeam: string;
  scoreHome: number | null;
  scoreAway: number | null;
  status: string;
  roundName: string | null;
  roundNumber: number | null;
  roundType: string | null;
  groupName: string | null;
  bracketSide: string | null;
  winnerNextGameId: string | null;
  loserNextGameId: string | null;
  winningSide: string | null;
}

interface PrintBracketTreeProps {
  games: PrintGame[];
  categoryName: string;
  format: string;
}

/* ─── Helpers ─── */

function groupByRound(games: PrintGame[]): { roundNumber: number; roundName: string; games: PrintGame[] }[] {
  const map = new Map<number, { roundNumber: number; roundName: string; games: PrintGame[] }>();
  for (const g of games) {
    const rn = g.roundNumber ?? 0;
    if (!map.has(rn)) {
      map.set(rn, { roundNumber: rn, roundName: g.roundName || `Round ${rn}`, games: [] });
    }
    map.get(rn)!.games.push(g);
  }
  return Array.from(map.values()).sort((a, b) => a.roundNumber - b.roundNumber);
}

function getRoundLabel(roundNumber: number, totalRounds: number, name: string): string {
  const fromFinal = totalRounds - roundNumber;
  if (fromFinal === 0) return 'Final';
  if (fromFinal === 1) return 'Semifinals';
  if (fromFinal === 2) return 'Quarterfinals';
  return name || `Round ${roundNumber}`;
}

/* ─── Match Card ─── */

function PrintMatch({ game }: { game: PrintGame }) {
  const hasScore = game.scoreHome !== null && game.scoreAway !== null;
  const homeWon = game.winningSide === 'home';
  const awayWon = game.winningSide === 'away';

  return (
    <div className="print-match">
      <div className="print-match-header">
        {game.matchNumber ? `#${game.matchNumber}` : ''}
      </div>
      <div className={`print-match-team ${homeWon ? 'font-bold' : ''}`}>
        <span className="print-match-name">{game.homeTeam || 'TBD'}</span>
        <span className="print-match-score">{hasScore ? game.scoreHome : ''}</span>
      </div>
      <div className={`print-match-team print-match-team-away ${awayWon ? 'font-bold' : ''}`}>
        <span className="print-match-name">{game.awayTeam || 'TBD'}</span>
        <span className="print-match-score">{hasScore ? game.scoreAway : ''}</span>
      </div>
    </div>
  );
}

/* ─── Single Bracket Section ─── */

function BracketSection({ games, title }: { games: PrintGame[]; title?: string }) {
  const rounds = groupByRound(games);
  if (rounds.length === 0) return null;

  const totalRounds = rounds.length;

  return (
    <div className="print-bracket-section">
      {title && <h4 className="text-sm font-bold mb-2 uppercase tracking-wide">{title}</h4>}
      <div className="print-bracket-container">
        {rounds.map((round, ri) => {
          const label = getRoundLabel(round.roundNumber, rounds[rounds.length - 1].roundNumber, round.roundName);
          // Each round's slot height doubles relative to the first round
          const multiplier = Math.pow(2, ri);

          return (
            <div key={round.roundNumber} className="print-bracket-round">
              <div className="print-round-header">{label}</div>
              <div className="print-round-games">
                {round.games.map((game, gi) => (
                  <div
                    key={game.id}
                    className="print-round-slot"
                    style={{
                      flex: `${multiplier} 0 0%`,
                    }}
                  >
                    {/* Connector lines */}
                    {ri > 0 && (
                      <div className="print-connector-in" />
                    )}
                    <PrintMatch game={game} />
                    {ri < totalRounds - 1 && (
                      <div className="print-connector-out" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Component ─── */

export default function PrintBracketTree({ games, categoryName, format }: PrintBracketTreeProps) {
  // Filter out group-stage games (only bracket games)
  const bracketGames = games.filter(g => g.roundNumber !== null && g.roundNumber !== undefined);

  if (bracketGames.length === 0) {
    return (
      <div className="print-bracket-empty">
        <p className="text-sm text-gray-500 italic">No bracket games for {categoryName}</p>
      </div>
    );
  }

  const isDE = format === 'double_elimination';

  if (isDE) {
    const winners = bracketGames.filter(g => !g.bracketSide || g.bracketSide === 'winners');
    const losers = bracketGames.filter(g => g.bracketSide === 'losers');
    const finals = bracketGames.filter(g => g.bracketSide === 'grand_final' || g.bracketSide === 'finals');

    return (
      <div>
        <BracketSection games={winners} title="Winners Bracket" />
        {losers.length > 0 && <BracketSection games={losers} title="Losers Bracket" />}
        {finals.length > 0 && <BracketSection games={finals} title="Grand Final" />}
      </div>
    );
  }

  return <BracketSection games={bracketGames} />;
}
