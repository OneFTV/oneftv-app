'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';

interface RankingEntry {
  rank: number;
  userId: string;
  name: string;
  stats: {
    totalPoints: number;
    totalWins: number;
    totalLosses: number;
    totalPointDiff: number;
    gamesPlayed: number;
    winRate: number;
    tournamentsPlayed: number;
    tournamentsWon: number;
  };
}

export default function RankingsPage() {
  const { t } = useTranslation();
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rankings');
      const json = await response.json();
      setRankings(json.data || json || []);
    } catch (error) {
      console.error('Failed to fetch rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchRankings();
    } catch (error) {
      console.error('Failed to refresh rankings:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  const getRankingColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/10 border-l-4 border-yellow-400';
    if (rank === 2) return 'bg-slate-400/10 border-l-4 border-slate-400';
    if (rank === 3) return 'bg-orange-500/10 border-l-4 border-orange-400';
    return 'border-l-4 border-slate-700 hover:bg-slate-800/50';
  };

  const chartData = rankings
    .slice(0, 10)
    .map((entry) => ({
      name: entry.name,
      points: entry.stats.totalPoints,
    }));

  const RankingTableSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-16 bg-slate-700 rounded animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/50 to-cyan-600/50 border-b border-blue-400/20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            {t('rankings.title')}
          </h1>
          <p className="text-blue-200 text-lg">
            {t('rankings.subtitle')}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">{t('rankings.overall_rankings')}</h2>
            <div className="flex items-center gap-3">
              <Link
                href="/rankings/popularity"
                className="px-4 py-2 rounded-lg border border-blue-400/30 text-blue-300 hover:bg-blue-500/10 transition-colors font-semibold"
              >
                Popularity Rankings
              </Link>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-900 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? t('rankings.refreshing') : t('rankings.refresh')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-xl p-8">
            <RankingTableSkeleton />
          </div>
        ) : rankings.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-xl p-12 text-center">
            <p className="text-2xl font-bold text-white mb-2">
              {t('rankings.no_rankings')}
            </p>
            <p className="text-slate-400">
              {t('rankings.no_rankings_desc')}
            </p>
          </div>
        ) : (
          <>
            {/* Rankings Table */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-xl overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50 border-b border-slate-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 w-20">
                        {t('rankings.col_rank')}
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        {t('rankings.col_player')}
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">
                        {t('rankings.col_wins')}
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">
                        {t('rankings.col_losses')}
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">
                        {t('rankings.col_win_pct')}
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">
                        {t('rankings.col_tournaments')}
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">
                        {t('rankings.col_points')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((entry) => {
                      const medalIcon = getMedalIcon(entry.rank);

                      return (
                        <tr
                          key={entry.rank}
                          className={`border-b border-slate-700/50 transition-colors ${getRankingColor(entry.rank)}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {medalIcon && (
                                <span className="text-2xl">{medalIcon}</span>
                              )}
                              <span className="text-xl font-bold text-white">
                                #{entry.rank}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-white">
                              {entry.name}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-semibold text-green-400">
                              {entry.stats.totalWins}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-semibold text-red-400">
                              {entry.stats.totalLosses}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-semibold text-white">
                              {entry.stats.winRate ?? 0}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="font-semibold text-white">
                                {entry.stats.tournamentsPlayed}
                              </span>
                              {entry.stats.tournamentsWon > 0 && (
                                <span className="text-sm text-yellow-400 font-bold">
                                  ({entry.stats.tournamentsWon} {t('rankings.tournaments_won')})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-lg font-bold text-cyan-400">
                              {entry.stats.totalPoints}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Performance Chart */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                {t('rankings.chart_title')}
              </h2>
              { chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                    />
                    <YAxis stroke="#64748b" style={{ fontSize: '12px' }} tick={{ fill: '#94a3b8' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                      }}
                      formatter={(value) => [value, 'Total Points']}
                    />
                    <Legend wrapperStyle={{ color: '#94a3b8' }} />
                    <Bar
                      dataKey="points"
                      fill="url(#blueGradient)"
                      radius={[8, 8, 0, 0]}
                      name="Total Points"
                     />
                    <defs>
                      <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#22d3ee" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  {t('rankings.no_chart_data')}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
