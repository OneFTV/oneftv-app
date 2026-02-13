'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RefreshCw } from 'lucide-react';

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
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const getRankingColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-50 border-l-4 border-yellow-400';
    if (rank === 2) return 'bg-gray-50 border-l-4 border-gray-400';
    if (rank === 3) return 'bg-orange-50 border-l-4 border-orange-400';
    return 'bg-white border-l-4 border-gray-200 hover:bg-gray-50';
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
        <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-2">
            👑 King of the Beach - Footvolley Ranking
          </h1>
          <p className="text-blue-100 text-lg">
            Track the top athletes in competitive footvolley
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Overall Rankings</h2>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Ranking'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <RankingTableSkeleton />
          </div>
        ) : rankings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-2xl font-bold text-gray-900 mb-2">
              No rankings available
            </p>
            <p className="text-gray-600">
              Rankings will be updated as tournaments are completed
            </p>
          </div>
        ) : (
          <>
            {/* Rankings Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-20">
                        Rank
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Player
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                        W
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                        L
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                        Win %
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                        Tournaments
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        Points
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((entry) => {
                      const medalIcon = getMedalIcon(entry.rank);

                      return (
                        <tr
                          key={entry.rank}
                          className={`border-b border-gray-200 transition-colors ${getRankingColor(
                            entry.rank
                          )}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {medalIcon && (
                                <span className="text-2xl">{medalIcon}</span>
                              )}
                              <span className="text-xl font-bold text-gray-900">
                                #{entry.rank}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-gray-900">
                              {entry.name}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-semibold text-gray-900">
                              {entry.stats.totalWins}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-semibold text-gray-900">
                              {entry.stats.totalLosses}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-semibold text-gray-900">
                              {entry.stats.winRate}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="font-semibold text-gray-900">
                                {entry.stats.tournamentsPlayed}
                              </span>
                              {entry.stats.tournamentsWon > 0 && (
                                <span className="text-sm text-yellow-600 font-bold">
                                  ({entry.stats.tournamentsWon} won)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-lg font-bold text-blue-600">
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
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Top 10 Players by Total Points
              </h2>
              { chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => [value, 'Total Points']}
                    />
                    <Legend />
                    <Bar
                      dataKey="points"
                      fill="#2563eb"
                      radius={[8, 8, 0, 0]}
                      name="Total Points"
                     />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No data available for chart
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
