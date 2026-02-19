export interface GameWithDetails {
  id: string
  scoreHome: number
  scoreAway: number
  set2Home: number | null
  set2Away: number | null
  set3Home: number | null
  set3Away: number | null
  winningSide: string | null
  status: string
  courtNumber: number | null
  scheduledTime: Date | null
  player1Home: { id: string; name: string | null } | null
  player2Home: { id: string; name: string | null } | null
  player1Away: { id: string; name: string | null } | null
  player2Away: { id: string; name: string | null } | null
  round: { name: string; roundNumber: number; type: string; bestOf3: boolean } | null
  group: { name: string } | null
  tournament: { id: string; name: string; pointsPerSet: number; proLeague: boolean }
}

export interface GameListItem {
  id: string
  roundName: string
  roundNumber: number | null
  roundType: string | null
  court: number | null
  scheduledTime: string | null
  player1: string
  player2: string
  player1HomeId: string | null
  player2HomeId: string | null
  player1AwayId: string | null
  player2AwayId: string | null
  score1: number | null
  score2: number | null
  set2Home: number | null
  set2Away: number | null
  set3Home: number | null
  set3Away: number | null
  bestOf3: boolean
  status: string
  winningSide: string | null
  groupName: string | null
  categoryId: string | null
  // Double-elimination fields
  matchNumber: number | null
  bracketSide: string | null
  winnerNextGameId: string | null
  loserNextGameId: string | null
  seedTarget: string | null
}

export interface UpdateGameScoreInput {
  scoreHome: number
  scoreAway: number
  set2Home?: number
  set2Away?: number
  set3Home?: number
  set3Away?: number
}
