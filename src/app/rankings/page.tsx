'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RefreshCw } from 'lucide-react';

interface RankingEntry {
  rank: number;
  playerName: string;
  yearlyTournamentsWon: number;
  monthlyTournamentsWon: number;
  gamesWon: number;
  totalPoints: number;
}

interface RankingsData {
  overall: RankingEntry[];
  kingOfTheBeach: RankingEntry[];
  bracket: RankingEntry[];
}

export default function RankingsPage() {
  const [rankingsData, setRankingsData] = useState<RankingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overall' | 'kingOfTheBeach' | 'bracket'>('overall');

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rankings');
      const data = await response.json();
      setRankingsData(data);
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

  const currentRankings = activeTab === 'overall'
    ? rankingsData?.overall || []
    : activeTab === 'kingOfTheBeach'
    ? rankingsData?.kingOfTheBeach || []
    : rankingsData?.bracket || [];

  const chartData = currentRankings
    .slice(0, 10)
    .map((entry) => ({
      name: entry.playerName,
      points: entry.totalPoints,
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
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex gap-2">
              {(['overall', 'kingOfTheBeach', 'bracket'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab === 'overall'
                    ? 'Overall'
                    : tab === 'kingOfTheBeach'
                    ? 'King of the Beach'
                    : 'Bracket'}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
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
        ) : currentRankings.length === 0 ? (
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
                        Player Name
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                        Yearly Tournaments Won
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                        Monthly Tournaments Won
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                        Games Won
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        Total Points
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRankings.map((entry) => {
                      const medalIcon = getMedalIcon(entry.rank);
                      const isNegative = entry.totalPoints < 0;

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
                              {entry.playerName}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {entry.yearlyTournamentsWon > 0 && (
                                <>
                                  <span className="text-xl">🏆</span>
                                  <span className="font-semibold text-gray-900">
                                    {entry.yearlyTournamentsWon}
                                  </span>
                                </>
                              )}
                              {entry.yearlyTournamentsWon === 0 && (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {entry.monthlyTournamentsWon > 0 && (
                                <>
                                  <span className="text-xl">👑</span>
                                  <span className="font-semibold text-gray-900">
                                    {entry.monthlyTournamentsWon}
                                  </span>
                                </>
                              )}
                              {entry.monthlyTournamentsWon === 0 && (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-semibold text-gray-900">
                              {entry.gamesWon}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span
                              className={`text-lg font-bold ${
                                isNegative
                                  ? 'text-red-600'
                                  : 'text-blue-600'
                              }`}
                            >
                              {isNegative ? '' : '+'}
                              {entry.totalPoints}
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
    
=