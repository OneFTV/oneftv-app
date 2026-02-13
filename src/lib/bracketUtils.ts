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
