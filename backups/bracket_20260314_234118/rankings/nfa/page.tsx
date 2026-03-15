'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Filter } from 'lucide-react';

interface NfaRankingEntry {
  rank: number;
  userId: string;
  name: string;
  country: string;
  nationality: string;
  division: string;
  points: number;
  wins: number;
  losses: number;
  pointDiff: number;
}

const DIVISIONS = [
  'All Divisions',
  'Open Division 1',
  'Open Division 2',
  'Open Division 3',
  "Women's Division",
  'Master Division',
  'Beginners Division',
];

export default function NfaRankingsPage() {
  const [rankings, setRankings] = useState<NfaRankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDivision, setSelectedDivision] = useState('All Divisions');
  const [tournamentName, setTournamentName] = useState('');

  useEffect(() => {
    fetchRankings();
  }, [selectedDivision]);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedDivision !== 'All Divisions') {
        params.set('division', selectedDivision);
      }
      const response = await fetch(`/api/rankings/nfa?${params}`);
      const json = await response.json();
      setRankings(json.data || []);
      if (json.tournament) setTournamentName(json.tournament);
    } catch (error) {
      console.error('Failed to fetch NFA rankings:', error);
    } finally {
      setLoading(false);
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

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      'Brazil': '🇧🇷',
      'United States': '🇺🇸',
      'Paraguay': '🇵🇾',
    };
    return flags[country] || '🌍';
  };

  const getDivisionColor = (division: string) => {
    if (division.includes('Division 1')) return 'bg-red-500/20 text-red-300 border-red-500/30';
    if (division.includes('Division 2')) return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    if (division.includes('Division 3')) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    if (division.includes('Women')) return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
    if (division.includes('Master')) return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    if (division.includes('Beginner')) return 'bg-green-500/20 text-green-300 border-green-500/30';
    return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/50 to-cyan-600/50 border-b border-blue-400/20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Link
            href="/rankings"
            className="inline-flex items-center gap-2 text-blue-300 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Rankings
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <h1 className="text-4xl font-bold text-white">NFA Rankings</h1>
          </div>
          <p className="text-blue-200 text-lg">
            {tournamentName || 'National Footvolley Association Tour Rankings'}
          </p>
        </div>
      </div>

      {/* Division Filter */}
      <div className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-5 h-5 text-slate-400" />
            {DIVISIONS.map((div) => (
              <button
                key={div}
                onClick={() => setSelectedDivision(div)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  selectedDivision === div
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-900 shadow-lg shadow-blue-500/30'
                    : 'border border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:border-blue-400/30'
                }`}
              >
                {div}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-xl p-8">
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-700 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ) : rankings.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-xl p-12 text-center">
            <p className="text-2xl font-bold text-white mb-2">No rankings available</p>
            <p className="text-slate-400">NFA tournament data has not been loaded yet.</p>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 w-20">#</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Player</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Division</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">W</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">L</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">+/-</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((entry) => {
                    const medalIcon = getMedalIcon(entry.rank);
                    return (
                      <tr
                        key={`${entry.userId}-${entry.division}`}
                        className={`border-b border-slate-700/50 transition-colors ${getRankingColor(entry.rank)}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {medalIcon && <span className="text-xl">{medalIcon}</span>}
                            <span className="text-lg font-bold text-white">#{entry.rank}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getCountryFlag(entry.country)}</span>
                            <span className="font-semibold text-white">{entry.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDivisionColor(entry.division)}`}>
                            {entry.division}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-semibold text-green-400">{entry.wins}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-semibold text-red-400">{entry.losses}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-semibold ${entry.pointDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {entry.pointDiff > 0 ? '+' : ''}{entry.pointDiff}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-lg font-bold text-cyan-400">{entry.points}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
