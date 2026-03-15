'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy } from 'lucide-react';

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

interface CascadeTournament {
  id: string;
  name: string;
  date: string;
}

export default function NfaRankingsPage() {
  const [rankings, setRankings] = useState<NfaRankingEntry[]>([]);
  const [divisions, setDivisions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [tournamentName, setTournamentName] = useState('');
  const [tournaments, setTournaments] = useState<CascadeTournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);

  const fetchRankings = useCallback(async (tournamentId?: string | null) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (tournamentId) params.set('tournamentId', tournamentId);

      const response = await fetch(`/api/rankings/nfa?${params}`);
      const json = await response.json();

      setRankings(json.data || []);
      setTournamentName(json.tournament || '');
      setDivisions(json.divisions || []);

      // Set tournaments list (only on first load or when list arrives)
      if (json.tournaments?.length) {
        setTournaments(json.tournaments);
        // Auto-select the tournament returned by the API
        if (!tournamentId && json.tournamentId) {
          setSelectedTournamentId(json.tournamentId);
        }
      }
    } catch (error) {
      console.error('Failed to fetch rankings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  const handleTournamentChange = (id: string) => {
    setSelectedTournamentId(id);
    fetchRankings(id);
  };

  // Group rankings by division
  const rankingsByDivision = divisions.reduce<Record<string, NfaRankingEntry[]>>((acc, div) => {
    acc[div] = rankings.filter((r) => r.division === div);
    return acc;
  }, {});

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

  // Division style based on index position (1st = red, 2nd = orange, 3rd = yellow, etc.)
  const getDivisionStyle = (index: number) => {
    const styles = [
      { border: 'border-red-500/30', header: 'from-red-600/30 to-red-900/20 border-red-500/30', badge: 'bg-red-500/20 text-red-300', accent: 'text-red-400' },
      { border: 'border-orange-500/30', header: 'from-orange-600/30 to-orange-900/20 border-orange-500/30', badge: 'bg-orange-500/20 text-orange-300', accent: 'text-orange-400' },
      { border: 'border-yellow-500/30', header: 'from-yellow-600/30 to-yellow-900/20 border-yellow-500/30', badge: 'bg-yellow-500/20 text-yellow-300', accent: 'text-yellow-400' },
      { border: 'border-emerald-500/30', header: 'from-emerald-600/30 to-emerald-900/20 border-emerald-500/30', badge: 'bg-emerald-500/20 text-emerald-300', accent: 'text-emerald-400' },
    ];
    return styles[index] || styles[styles.length - 1];
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
            <h1 className="text-4xl font-bold text-white">Open Division Rankings</h1>
          </div>
          <p className="text-blue-200 text-lg">
            {tournamentName || 'Tournament Rankings'}
          </p>
        </div>
      </div>

      {/* Tournament selector */}
      {tournaments.length > 1 && (
        <div className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400 font-medium">Tournament:</span>
              <div className="flex gap-2 overflow-x-auto">
                {tournaments.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleTournamentChange(t.id)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                      selectedTournamentId === t.id
                        ? 'bg-blue-500/30 text-white border border-blue-400/50'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content — all divisions stacked */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {loading ? (
          <div className="space-y-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-xl p-8">
                <div className="h-8 w-48 bg-slate-700 rounded animate-pulse mb-4" />
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="h-14 bg-slate-700 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : divisions.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-xl p-12 text-center">
            <p className="text-2xl font-bold text-white mb-2">No ranking data available</p>
            <p className="text-slate-400">No cascade division tournaments found with ranking data.</p>
          </div>
        ) : (
          divisions.map((div, divIndex) => {
            const entries = rankingsByDivision[div] || [];
            const style = getDivisionStyle(divIndex);
            // Per-division ranking (1-based within each division)
            let divRank = 0;

            return (
              <div key={div} className={`bg-gradient-to-br from-slate-800/50 to-slate-900/50 border ${style.border} rounded-xl overflow-hidden`}>
                {/* Division Header */}
                <div className={`bg-gradient-to-r ${style.header} border-b px-6 py-5`}>
                  <h2 className="text-2xl font-bold text-white">{div}</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {entries.length} {entries.length === 1 ? 'player' : 'players'}
                  </p>
                </div>

                {entries.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <p className="text-slate-400">No ranking data available for this division.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-800/50 border-b border-slate-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300 w-20">#</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Player</th>
                          <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">W</th>
                          <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">L</th>
                          <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">+/-</th>
                          <th className="px-6 py-3 text-right text-sm font-semibold text-slate-300">Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map((entry) => {
                          divRank++;
                          const medalIcon = getMedalIcon(divRank);
                          return (
                            <tr
                              key={`${entry.userId}-${entry.division}`}
                              className={`border-b border-slate-700/50 transition-colors ${getRankingColor(divRank)}`}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  {medalIcon && <span className="text-xl">{medalIcon}</span>}
                                  <span className="text-lg font-bold text-white">#{divRank}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{getCountryFlag(entry.country)}</span>
                                  <span className="font-semibold text-white">{entry.name}</span>
                                </div>
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
                                <span className={`text-lg font-bold ${style.accent}`}>{entry.points}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
