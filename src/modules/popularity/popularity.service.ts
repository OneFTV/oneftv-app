import {
  INSTAGRAM_WEIGHT,
  LEAGUE_STREAM_WEIGHT,
  LEAGUE_STREAM_WEIGHTS,
  POPULARITY_VERSION,
  TOP_MEN_SEEDS_V04,
  TOP_WOMEN_SEEDS_V04,
  TOURNAMENT_POPULARITY_SCORES_V01,
  TOURNAMENT_RANK_WEIGHT,
  type LeagueKey,
  type PlayerPopularitySeed,
} from "./popularity.constants";
import type {
  PlayerPopularityEntry,
  PopularityModuleResponse,
  TournamentPopularityScore,
} from "./popularity.types";

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function computeLeagueExposure(seed: PlayerPopularitySeed): number {
  const leagueKeys = Object.keys(LEAGUE_STREAM_WEIGHTS) as LeagueKey[];
  const weightedSum = leagueKeys.reduce((acc, key) => {
    return acc + (seed.leaguePresence[key] || 0) * LEAGUE_STREAM_WEIGHTS[key];
  }, 0);
  const maxWeight = leagueKeys.reduce((acc, key) => acc + LEAGUE_STREAM_WEIGHTS[key], 0);
  return maxWeight > 0 ? (weightedSum / maxWeight) * 100 : 0;
}

function rankToSignal(rank: number): number {
  return Math.max(35, 100 - (rank - 1) * 6);
}

function computeTournamentRankSignal(seed: PlayerPopularitySeed): { signal: number; sourceCount: number } {
  const keys = Object.keys(seed.leagueRanks) as LeagueKey[];
  if (keys.length === 0) return { signal: 35, sourceCount: 0 };

  const weightedSignals = keys.map((key) => {
    const rank = seed.leagueRanks[key]!;
    const weight = LEAGUE_STREAM_WEIGHTS[key] || 1;
    return { value: rankToSignal(rank), weight };
  });

  const sumWeight = weightedSignals.reduce((acc, row) => acc + row.weight, 0);
  const sumScore = weightedSignals.reduce((acc, row) => acc + row.value * row.weight, 0);
  return { signal: sumWeight > 0 ? sumScore / sumWeight : 35, sourceCount: keys.length };
}

function computeConfidence(sourceCount: number): "high" | "medium" {
  if (sourceCount >= 3) return "high";
  return "medium";
}

function buildRankings(seeds: PlayerPopularitySeed[]): PlayerPopularityEntry[] {
  if (seeds.length === 0) return [];

  const maxFollowers = Math.max(...seeds.map((s) => s.instagramFollowers), 1);

  const rows = seeds.map((seed) => {
    const instagramIndex = (seed.instagramFollowers / maxFollowers) * 100;
    const leagueStreamExposure = computeLeagueExposure(seed);
    const rankData = computeTournamentRankSignal(seed);
    const tournamentRankSignal = rankData.signal;

    const popularityScore =
      instagramIndex * INSTAGRAM_WEIGHT +
      leagueStreamExposure * LEAGUE_STREAM_WEIGHT +
      tournamentRankSignal * TOURNAMENT_RANK_WEIGHT;

    return {
      player: seed.player,
      country: seed.country,
      instagramFollowers: seed.instagramFollowers,
      leagueStreamExposure: round1(leagueStreamExposure),
      tournamentRankSignal: round1(tournamentRankSignal),
      popularityScore: round1(popularityScore),
      confidence: computeConfidence(rankData.sourceCount),
    };
  });

  return rows
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, 50)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function mapTournamentScores(): TournamentPopularityScore[] {
  const maxInstagram = Math.max(
    ...TOURNAMENT_POPULARITY_SCORES_V01.map((t) => t.instagramFollowers || 0),
    1
  );

  return TOURNAMENT_POPULARITY_SCORES_V01.map((t) => ({
    tournament: t.tournament,
    region: t.region,
    instagramFollowers: t.instagramFollowers,
    instagramIndex: round1(((t.instagramFollowers || 0) / maxInstagram) * 100),
    channelSubscribers: t.channelSubscribers,
    peakLiveViewers: t.peakLiveViewers,
    eventViewsOrAccesses: t.eventViewsOrAccesses,
    tps: t.tps,
    confidence: t.confidence,
    notes: t.notes,
  }));
}

export function getPopularitySnapshot(): PopularityModuleResponse {
  return {
    version: POPULARITY_VERSION,
    methodology:
      "DB-Engines style multi-signal blend: 45% Instagram index + 20% league stream exposure + 35% tournament-rank signal across BW Cup, TAF, LBF, CBFT, LSK, and WorldFootvolley.",
    tournamentScores: mapTournamentScores(),
    topMen: buildRankings(TOP_MEN_SEEDS_V04),
    topWomen: buildRankings(TOP_WOMEN_SEEDS_V04),
    notes:
      "v0.4 prioritizes players with top placements across the selected tournaments/sources. Confidence is promoted to high when ranking coverage spans at least three of the six sources.",
  };
}
