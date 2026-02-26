'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TournamentRecord {
  id: string;
  name: string;
  date: string;
  format: string;
  placement: number;
  wins: number;
  losses: number;
  pointsEarned: number;
}

interface AthleteProfile {
  id: string;
  name: string;
  nationality: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro';
  country: string;
  flagEmoji: string;
  totalPoints: number;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  tournamentsPlayed: number;
  bestFinish: number;
  tournamentHistory: TournamentRecord[];
  pointsOverTime: Array<{ date: string; points: number }>;
}

const LEVEL_COLORS = {
  Beginner: 'bg-blue-100 text-blue-800',
  Intermediate: 'bg-green-100 text-green-800',
  Advanced: 'bg-purple-100 text-purple-800',
  Pro: 'bg-yellow-100 text-yellow-800',
};

export default function AthleteProfilePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const athleteId = params.id as string;

  const [athlete, setAthlete] = useState<AthleteProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAthlete = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/athletes/${athleteId}`);
        const json = await response.json();
        const raw = json.data || json;

        // Map API response to AthleteProfile interface
        const stats = raw.overallStats || {};
        const profile: AthleteProfile = {
          id: raw.id,
          name: raw.name,
          nationality: raw.nationality || '',
          level: raw.level || 'Beginner',
          country: raw.country || '',
          flagEmoji: raw.flagEmoji || '',
          totalPoints: stats.points ?? raw.totalPoints ?? 0,
          gamesPlayed: stats.gamesPlayed ?? raw.gamesPlayed ?? 0,
          gamesWon: stats.wins ?? raw.gamesWon ?? 0,
          winRate: stats.winRate != null ? stats.winRate / 100 : (raw.winRate ?? 0),
          tournamentsPlayed: stats.tournamentsPlayed ?? raw.tournamentsPlayed ?? 0,
          bestFinish: stats.bestFinish ?? raw.bestFinish ?? 0,
          tournamentHistory: (raw.tournamentHistory || []).map((th: Record<string, unknown>) => {
            const t = (th.tournament || th) as Record<string, unknown>;
            const s = (th.stats || th) as Record<string, unknown>;
            return {
              id: (t.id || th.id) as string,
              name: (t.name || th.name || '') as string,
              date: (t.startDate || t.date || th.date || '') as string,
              format: (t.format || th.format || '') as string,
              placement: (th.placement ?? 0) as number,
              wins: (s.wins ?? th.wins ?? 0) as number,
              losses: (s.losses ?? th.losses ?? 0) as number,
              pointsEarned: (s.points ?? th.pointsEarned ?? 0) as number,
            };
          }),
          pointsOverTime: raw.pointsOverTime || [],
        };
        setAthlete(profile);
      } catch (error) {
        console.error('Failed to fetch athlete:', error);
      } finally {
        setLoading(false);
      }
    };

    if (athleteId) {
      fetchAthlete();
    }
  }, [athleteId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">{t('athletes.loading_profile')}</p>
        </div>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-white mb-2">
            {t('athletes.athlete_not_found')}
          </p>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {t('athletes.go_back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-blue-400/20">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('athletes.back_to_athletes')}
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-slate-800/50 border-b border-blue-400/20">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-start gap-8">
            <div className="text-7xl">{athlete.flagEmoji}</div>
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-4xl font-bold text-white">
                  {athlete.name}
                </h1>
                <span
                  className={`px-4 py-2 rounded-full text-lg font-semibold ${
                    LEVEL_COLORS[athlete.level]
                  }`}
                >
                  {athlete.level}
                </span>
              </div>
              <p className="text-xl text-slate-400 mb-2">
                {athlete.nationality} • {athlete.country}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-blue-400/20 rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <p className="text-slate-400 text-sm font-medium mb-2">
              {t('athletes.total_points')}
            </p>
            <p className="text-3xl font-bold text-blue-600">
              {athlete.totalPoints}
            </p>
          </div>

          <div className="bg-slate-800/50 border border-blue-400/20 rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <p className="text-slate-400 text-sm font-medium mb-2">
              {t('athletes.games_played')}
            </p>
            <p className="text-3xl font-bold text-green-600">
              {athlete.gamesPlayed}
            </p>
          </div>

          <div className="bg-slate-800/50 border border-blue-400/20 rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
            <p className="text-slate-400 text-sm font-medium mb-2">
              {t('athletes.games_won')}
            </p>
            <p className="text-3xl font-bold text-purple-600">
              {athlete.gamesWon}
            </p>
          </div>

          <div className="bg-slate-800/50 border border-blue-400/20 rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
            <p className="text-slate-400 text-sm font-medium mb-2">
              {t('athletes.win_rate')}
            </p>
            <p className="text-3xl font-bold text-yellow-600">
              {((athlete.winRate || 0) * 100).toFixed(1)}%
            </p>
          </div>

          <div className="bg-slate-800/50 border border-blue-400/20 rounded-lg shadow-sm p-6 border-l-4 border-red-500">
            <p className="text-slate-400 text-sm font-medium mb-2">
              {t('athletes.tournaments_played')}
            </p>
            <p className="text-3xl font-bold text-red-600">
              {athlete.tournamentsPlayed}
            </p>
          </div>

          <div className="bg-slate-800/50 border border-blue-400/20 rounded-lg shadow-sm p-6 border-l-4 border-indigo-500">
            <p className="text-slate-400 text-sm font-medium mb-2">
              {t('athletes.best_finish')}
            </p>
            <p className="text-3xl font-bold text-indigo-600">
              #{athlete.bestFinish}
            </p>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-slate-800/50 border border-blue-400/20 rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            {t('athletes.points_over_time')}
          </h2>
          {athlete.pointsOverTime && athlete.pointsOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={athlete.pointsOverTime}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="points"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ fill: '#2563eb', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-slate-400">
              {t('athletes.no_points_history')}
            </div>
          )}
        </div>

        {/* Tournament History */}
        <div className="bg-slate-800/50 border border-blue-400/20 rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-600/50">
            <h2 className="text-2xl font-bold text-white">
              {t('athletes.tournament_history')}
            </h2>
          </div>

          {athlete.tournamentHistory && athlete.tournamentHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/30 border-b border-slate-600/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                      {t('athletes.col_tournament')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                      {t('athletes.col_date')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                      {t('athletes.col_format')}
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-white">
                      {t('athletes.col_placement')}
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-white">
                      {t('athletes.col_record')}
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-white">
                      {t('athletes.col_points')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {athlete.tournamentHistory.map((tournament, idx) => (
                    <tr
                      key={tournament.id}
                      className={`border-b border-slate-600/50 hover:bg-slate-700/30 transition-colors ${
                        idx % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-700/30'
                      }`}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-white">
                        {tournament.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {tournament.date ? new Date(tournament.date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {tournament.format}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-center">
                        <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                          #{tournament.placement}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span className="text-green-600 font-semibold">
                          {tournament.wins}W
                        </span>
                        <span className="text-gray-400 mx-1">-</span>
                        <span className="text-red-600 font-semibold">
                          {tournament.losses}L
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-right text-blue-600">
                        {tournament.pointsEarned}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400">
              {t('athletes.no_tournament_history')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
