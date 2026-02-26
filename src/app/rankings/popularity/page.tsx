'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';

interface TournamentPopularityScore {
  tournament: string;
  region: string;
  instagramFollowers?: number;
  instagramIndex?: number;
  channelSubscribers?: number;
  peakLiveViewers?: number;
  eventViewsOrAccesses?: number;
  tps: number;
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
}

interface PlayerPopularityLeader {
  rank: number;
  player: string;
  country: string;
  instagramFollowers: number;
  leagueStreamExposure: number;
  tournamentRankSignal: number;
  popularityScore: number;
  confidence: 'high' | 'medium';
}

interface PopularityResponse {
  version: string;
  methodology: string;
  tournamentScores: TournamentPopularityScore[];
  topMen: PlayerPopularityLeader[];
  topWomen: PlayerPopularityLeader[];
  notes: string;
}

function formatNumber(value?: number) {
  if (value == null) return '-';
  return value.toLocaleString();
}

export default function PopularityRankingsPage() {
  const [data, setData] = useState<PopularityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPopularity = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/popularity', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch popularity snapshot');
      const json = await response.json();
      setData(json);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPopularity();
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchPopularity();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-2">Popularity Rankings</h1>
          <p className="text-blue-100 text-lg">
            Tournament Popularity Score (TPS) snapshot with Instagram + stream signals.
          </p>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/rankings" className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
              Back to Rankings
            </Link>
            {data && (
              <span className="text-sm text-gray-600">
                Version: <span className="font-semibold">{data.version}</span>
              </span>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="h-8 w-72 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ) : !data ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-600">
            Failed to load popularity data.
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Top 50 Players by Popularity (Men)</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Rank</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Player</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Country</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Instagram</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">League Exposure</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Tournament Rank Signal</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Popularity Score</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topMen.length === 0 ? (
                      <tr className="border-t border-gray-200">
                        <td colSpan={8} className="px-4 py-6 text-sm text-gray-600">
                          Men popularity ranking is pending verified professional data from approved leagues.
                        </td>
                      </tr>
                    ) : (
                      data.topMen.map((entry) => (
                        <tr key={`men-${entry.rank}-${entry.player}`} className="border-t border-gray-200">
                          <td className="px-4 py-3 text-sm font-bold text-gray-900">#{entry.rank}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">{entry.player}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{entry.country}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 text-right">{formatNumber(entry.instagramFollowers)}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 text-right">{entry.leagueStreamExposure.toFixed(1)}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 text-right">{entry.tournamentRankSignal.toFixed(1)}</td>
                          <td className="px-4 py-3 text-sm font-bold text-blue-700 text-right">{entry.popularityScore.toFixed(1)}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{entry.confidence}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Top 50 Players by Popularity (Women)</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Rank</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Player</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Country</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Instagram</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">League Exposure</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Tournament Rank Signal</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Popularity Score</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topWomen.map((entry) => (
                      <tr key={`women-${entry.rank}-${entry.player}`} className="border-t border-gray-200">
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">#{entry.rank}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{entry.player}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{entry.country}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 text-right">{formatNumber(entry.instagramFollowers)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 text-right">{entry.leagueStreamExposure.toFixed(1)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 text-right">{entry.tournamentRankSignal.toFixed(1)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-blue-700 text-right">{entry.popularityScore.toFixed(1)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{entry.confidence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-600 mt-4">{data.notes}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">{data.version} Tournament Popularity Score (TPS)</h2>
                <p className="text-sm text-gray-600 mt-1">{data.methodology}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tournament</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Region</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Tournament IG</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">IG Index</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Subscribers</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Peak Live</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Event Views</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">TPS</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tournamentScores.map((row) => (
                      <tr key={row.tournament} className="border-t border-gray-200">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{row.tournament}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{row.region}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 text-right">{formatNumber(row.instagramFollowers)}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 text-right">{row.instagramIndex?.toFixed(1) ?? '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 text-right">{formatNumber(row.channelSubscribers)}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 text-right">{formatNumber(row.peakLiveViewers)}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 text-right">{formatNumber(row.eventViewsOrAccesses)}</td>
                        <td className="px-6 py-4 text-sm font-bold text-blue-700 text-right">{row.tps.toFixed(1)}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{row.confidence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
