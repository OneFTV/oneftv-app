export interface TournamentPopularityScore {
  tournament: string;
  region: string;
  instagramFollowers?: number;
  instagramIndex?: number;
  channelSubscribers?: number;
  peakLiveViewers?: number;
  eventViewsOrAccesses?: number;
  tps: number;
  confidence: "high" | "medium" | "low";
  notes?: string;
}

export interface PlayerPopularityEntry {
  rank: number;
  player: string;
  country: string;
  instagramFollowers: number;
  leagueStreamExposure: number;
  tournamentRankSignal: number;
  popularityScore: number;
  confidence: "high" | "medium";
}

export interface PopularityModuleResponse {
  version: string;
  methodology: string;
  tournamentScores: TournamentPopularityScore[];
  topMen: PlayerPopularityEntry[];
  topWomen: PlayerPopularityEntry[];
  notes: string;
}
