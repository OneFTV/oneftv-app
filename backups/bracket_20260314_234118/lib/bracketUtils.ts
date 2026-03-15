export interface BracketGame {
  id: string;
  roundName: string;
  roundNumber: number | null;
  roundType: string | null;
  court: number;
  scheduledTime: string;
  player1: string;
  player2: string;
  player1HomeId: string | null;
  player2HomeId: string | null;
  player1AwayId: string | null;
  player2AwayId: string | null;
  score1?: number;
  score2?: number;
  set2Home?: number;
  set2Away?: number;
  set3Home?: number;
  set3Away?: number;
  bestOf3?: boolean;
  status: 'pending' | 'scheduled' | 'completed' | 'in_progress';
  winningSide: string | null;
  groupName?: string | null;
  // Double-elimination fields
  matchNumber?: number;
  bracketSide?: string;
  winnerNextGameId?: string;
  loserNextGameId?: string;
  seedTarget?: string;
  /** Category this game belongs to — used for NFA division routing */
  categoryId?: string | null;
}

export interface RoundGroup {
  roundNumber: number;
  roundName: string;
  roundType: string | null;
  games: BracketGame[];
}

export interface GroupCluster {
  groupName: string;
  games: BracketGame[];
}

/** Organize flat games array into rounds sorted by roundNumber */
export function groupGamesByRound(games: BracketGame[]): RoundGroup[] {
  const roundMap = new Map<number, RoundGroup>();

  for (const game of games) {
    const rn = game.roundNumber ?? 0;
    if (!roundMap.has(rn)) {
      roundMap.set(rn, {
        roundNumber: rn,
        roundName: game.roundName,
        roundType: game.roundType,
        games: [],
      });
    }
    roundMap.get(rn)!.games.push(game);
  }

  return Array.from(roundMap.values()).sort(
    (a, b) => a.roundNumber - b.roundNumber
  );
}

/** Organize games by group name */
export function groupGamesByGroup(games: BracketGame[]): GroupCluster[] {
  const groupMap = new Map<string, GroupCluster>();

  for (const game of games) {
    const gn = game.groupName || 'Ungrouped';
    if (!groupMap.has(gn)) {
      groupMap.set(gn, { groupName: gn, games: [] });
    }
    groupMap.get(gn)!.games.push(game);
  }

  return Array.from(groupMap.values()).sort((a, b) =>
    a.groupName.localeCompare(b.groupName)
  );
}

/** Get a display label for a round based on its position relative to the final */
export function getRoundLabel(
  roundNumber: number,
  totalRounds: number
): string {
  const roundsFromFinal = totalRounds - roundNumber;

  switch (roundsFromFinal) {
    case 0:
      return 'Final';
    case 1:
      return 'Semifinals';
    case 2:
      return 'Quarterfinals';
    default:
      return `Round ${roundNumber}`;
  }
}

/* ---- Double Elimination utilities ---- */

/** Returns true if the games set contains losers bracket or finals games */
export function isDoubleElimination(games: BracketGame[]): boolean {
  return games.some(
    (g) => g.bracketSide === 'losers' || g.bracketSide === 'finals'
  );
}

export interface BracketSection {
  side: 'winners' | 'losers' | 'finals';
  label: string;
  rounds: RoundGroup[];
}

/** Group games into Winners / Losers / Finals sections, each with sorted rounds */
export function classifyDoubleEliminationRounds(
  games: BracketGame[]
): BracketSection[] {
  const sideMap: Record<string, BracketGame[]> = {
    winners: [],
    losers: [],
    finals: [],
  };

  for (const g of games) {
    const side = g.bracketSide || 'winners';
    if (!sideMap[side]) sideMap[side] = [];
    sideMap[side].push(g);
  }

  const sections: BracketSection[] = [];

  for (const side of ['winners', 'losers', 'finals'] as const) {
    const sideGames = sideMap[side];
    if (!sideGames || sideGames.length === 0) continue;

    const rounds = groupGamesByRound(sideGames);
    sections.push({
      side,
      label:
        side === 'winners'
          ? 'Winners Bracket'
          : side === 'losers'
          ? 'Losers Bracket'
          : 'Grand Finals',
      rounds,
    });
  }

  return sections;
}

/** Map round names to display labels for DE brackets */
export function getDoubleElimRoundLabel(roundName: string): string {
  // Already a good label? return as-is
  if (roundName.startsWith('Winners') || roundName.startsWith('Losers') || roundName.includes('Final') || roundName.includes('Semi')) {
    return roundName;
  }
  const m = roundName.match(/^([WL])(\d+)$/i);
  if (m) {
    const prefix = m[1].toUpperCase() === 'W' ? 'Winners' : 'Losers';
    return `${prefix} R${m[2]}`;
  }
  return roundName;
}
