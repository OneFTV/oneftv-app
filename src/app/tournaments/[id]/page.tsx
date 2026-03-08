'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Users, Trophy, Loader, AlertCircle, Edit, ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';

interface CategoryInfo {
  id: string;
  name: string;
  format: string;
  gender: string | null;
  skillLevel: string | null;
  maxTeams: number;
  pointsPerSet: number;
  status: string;
  proLeague: boolean;
  _count: { TournamentPlayer: number; TeamRegistration: number };
}

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  location: string;
  city: string | null;
  state: string | null;
  country: string | null;
  date: string;
  endDate: string | null;
  format: string | null;
  status: string;
  maxPlayers: number | null;
  numCourts: number;
  avgGameMinutes: number;
  pointsPerSet: number | null;
  numSets: number;
  proLeague: boolean;
  allowMultiCategory: boolean;
  organizerId: string;
  organizer: { id: string; name: string; email: string };
  players: { id: string; user: { id: string; name: string; email: string } }[];
  Category?: CategoryInfo[];
}

interface Player {
  id: string;
  userId: string;
  name: string;
  email: string;
  seed: number | null;
  group: string | null;
  points: number;
  wins: number;
  losses: number;
  pointDiff: number;
  status: string;
}

interface Game {
  id: string;
  roundName: string;
  roundNumber: number | null;
  roundType: string | null;
  groupName?: string | null;
  court: number;
  scheduledTime: string;
  player1: string;
  player2: string;
  player1HomeId: string | null;
  player2HomeId: string | null;
  player1AwayId: string | null;
  player2AwayId: string | null;
  score1?: number;
  score2?: number;
  set2Home?: number;
  set2Away?: number;
  set3Home?: number;
  set3Away?: number;
  bestOf3?: boolean;
  status: 'pending' | 'scheduled' | 'completed' | 'in_progress';
  winningSide: string | null;
}

const statusMap: Record<string, string> = {
  draft: 'Draft',
  registration: 'Registration Open',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const statusColors: Record<string, string> = {
  draft: 'bg-slate-500/20 text-slate-300',
  registration: 'bg-green-500/20 text-green-300',
  in_progress: 'bg-blue-500/20 text-blue-300',
  completed: 'bg-purple-500/20 text-purple-300',
};

const formatColors: Record<string, string> = {
  'King of the Beach': 'bg-yellow-500/20 text-yellow-300',
  'king_of_the_beach': 'bg-yellow-500/20 text-yellow-300',
  'Bracket': 'bg-indigo-500/20 text-indigo-300',
  'bracket': 'bg-indigo-500/20 text-indigo-300',
  'Group+Knockout': 'bg-pink-500/20 text-pink-300',
  'group_knockout': 'bg-pink-500/20 text-pink-300',
  'Round Robin': 'bg-cyan-500/20 text-cyan-300',
  'round_robin': 'bg-cyan-500/20 text-cyan-300',
};

const formatLabels: Record<string, string> = {
  'king_of_the_beach': 'King of the Beach',
  'bracket': 'Bracket',
  'group_knockout': 'Group+Knockout',
  'round_robin': 'Round Robin',
};

export default function TournamentDetailPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const { t } = useTranslation();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'players' | 'standings'>('overview');
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [registering, setRegistering] = useState(false);
  const [registerMsg, setRegisterMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    };

    checkUser();
  }, []);

  useEffect(() => {
    const fetchTournamentData = async () => {
      try {
        setLoading(true);
        setError(null);

        const catParam = selectedCategoryId ? `?categoryId=${selectedCategoryId}` : '';

        const [tournamentRes, playersRes, gamesRes] = await Promise.all([
          fetch(`/api/tournaments/${tournamentId}`),
          fetch(`/api/tournaments/${tournamentId}/players${catParam}`),
          fetch(`/api/tournaments/${tournamentId}/games${catParam}`),
        ]);

        if (!tournamentRes.ok) {
          throw new Error('Failed to fetch tournament');
        }

        const tournamentJson = await tournamentRes.json();
        setTournament(tournamentJson.data || tournamentJson);

        if (playersRes.ok) {
          const playersData = await playersRes.json();
          setPlayers(playersData);
        }

        if (gamesRes.ok) {
          const gamesData = await gamesRes.json();
          setGames(gamesData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (tournamentId) {
      fetchTournamentData();
    }
  }, [tournamentId, selectedCategoryId]);

  const isOrganizer = user && tournament && user.id === tournament.organizer?.id;
  const isRegistered = user && players.some((p) => p.userId === user.id);

  const handleRegister = async () => {
    if (!user || !tournament) return;
    setRegistering(true);
    setRegisterMsg(null);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setRegisterMsg({ type: 'success', text: t('tournaments.register_success') });
        const playersRes = await fetch(`/api/tournaments/${tournamentId}/players`);
        if (playersRes.ok) {
          setPlayers(await playersRes.json());
        }
      } else {
        setRegisterMsg({ type: 'error', text: data.error || t('tournaments.register_failed') });
      }
    } catch {
      setRegisterMsg({ type: 'error', text: t('tournaments.register_network_error') });
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto h-12 w-12 text-cyan-400 animate-spin mb-4" />
          <p className="text-slate-400">{t('tournaments.loading_tournament')}</p>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/tournaments"
            className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 mb-6"
          >
            <ArrowLeft size={20} />
            {t('tournaments.back_to_tournaments')}
          </Link>
          <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-300">
            <AlertCircle size={20} />
            {error || t('tournaments.tournament_not_found')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/tournaments"
          className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Tournaments
        </Link>

        {/* Header */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-xl p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-3">{tournament.name}</h1>
              <div className="flex gap-2 flex-wrap">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${statusColors[tournament.status]}`}
                >
                  {statusMap[tournament.status]}
                </span>
                {tournament.format && (
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${formatColors[tournament.format]}`}
                  >
                    {formatLabels[tournament.format] || tournament.format}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/e/${tournament.id}`}
                target="_blank"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-900 font-medium py-2 px-4 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all"
              >
                <Trophy size={18} />
                {t('tournaments.view_brackets')}
              </Link>
              <Link
                href={`/tournaments/${tournament.id}/manage`}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                <Edit size={20} />
                {t('tournaments.manage')}
              </Link>
              <Link
                href={`/tournaments/${tournament.id}/simulate`}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                🧪 Simulate
              </Link>
            </div>
          </div>

          {/* Inline Meta Strip */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400 mt-4">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} />
              {new Date(tournament.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                timeZone: 'UTC',
              })}
              {tournament.endDate && tournament.endDate !== tournament.date &&
                ` – ${new Date(tournament.endDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  timeZone: 'UTC',
                })}`}
            </span>
            <span className="text-slate-600">·</span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} />
              {tournament.city || 'TBD'}{tournament.state ? `, ${tournament.state}` : ''}
            </span>
            <span className="text-slate-600">·</span>
            <span>{tournament.numCourts || '-'} {t('tournaments.courts')}</span>
            <span className="text-slate-600">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={14} />
              {tournament.players?.length ?? 0}{tournament.maxPlayers ? `/${tournament.maxPlayers}` : ''} {t('tournaments.players')}
            </span>
          </div>
        </div>

        {/* Category Selector */}
        {tournament.Category && tournament.Category.length > 0 && (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-slate-300">{t('tournaments.manage_categories')}</span>
              <span className="text-xs text-slate-500">({tournament.Category.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategoryId(null)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                  selectedCategoryId === null
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-900'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {t('tournaments.all_categories')}
              </button>
              {tournament.Category.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                    selectedCategoryId === cat.id
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-900'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cat.name}
                  <span className="ml-1 text-xs opacity-70">
                    ({cat._count?.TournamentPlayer || 0})
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-xl mb-8">
          <div className="border-b border-slate-700">
            <div className="flex flex-wrap">
              {([
                { key: 'overview' as const, label: t('tournaments.tab_overview') },
                { key: 'players' as const, label: t('tournaments.tab_players') },
                { key: 'standings' as const, label: t('tournaments.tab_standings') },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-6 py-4 font-medium text-sm transition border-b-2 ${
                    activeTab === tab.key
                      ? 'border-cyan-400 text-cyan-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">{t('tournaments.description_title')}</h3>
                  <p className="text-slate-300 whitespace-pre-wrap">
                    {tournament.description || t('tournaments.no_description')}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white mb-3">{t('tournaments.details_title')}</h3>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                    <div>
                      <dt className="text-sm font-medium text-slate-400">{t('tournaments.detail_venue')}</dt>
                      <dd className="text-white">{tournament.location}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-slate-400">{t('tournaments.detail_city')}</dt>
                      <dd className="text-white">
                        {[tournament.city, tournament.state, tournament.country].filter(Boolean).join(', ') || t('tournaments.detail_not_specified')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-slate-400">{t('tournaments.detail_format')}</dt>
                      <dd className="text-white">{tournament.format ? (formatLabels[tournament.format] || tournament.format) : t('tournaments.detail_multi_category')}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-slate-400">{t('tournaments.detail_points_per_set')}</dt>
                      <dd className="text-white">{tournament.pointsPerSet ?? t('tournaments.detail_per_category')}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-slate-400">{t('tournaments.detail_tier')}</dt>
                      <dd className="text-white">
                        {tournament.proLeague ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-300">
                            {t('tournaments.detail_pro_league')}
                          </span>
                        ) : t('tournaments.detail_standard')}
                      </dd>
                    </div>
                    {tournament.proLeague && (
                      <div>
                        <dt className="text-sm font-medium text-slate-400">{t('tournaments.detail_semis_finals')}</dt>
                        <dd className="text-white">{t('tournaments.detail_best_of_3')}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm font-medium text-slate-400">{t('tournaments.detail_organizer')}</dt>
                      <dd className="text-white">{tournament.organizer?.name}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {/* Players Tab */}
            {activeTab === 'players' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white">
                    {t('tournaments.registered_players', { count: `${players.length}${tournament.maxPlayers ? `/${tournament.maxPlayers}` : ''}` })}
                  </h3>
                  {tournament.status === 'registration' && user && !isRegistered && (
                    <button
                      onClick={handleRegister}
                      disabled={registering}
                      className="bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-900 font-medium py-2 px-4 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {registering ? t('tournaments.registering') : t('tournaments.register_button')}
                    </button>
                  )}
                  {isRegistered && (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-300 bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {t('tournaments.already_registered')}
                    </span>
                  )}
                </div>

                {registerMsg && (
                  <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
                    registerMsg.type === 'success' ? 'bg-green-500/10 text-green-300 border border-green-500/30' : 'bg-red-500/10 text-red-300 border border-red-500/30'
                  }`}>
                    {registerMsg.text}
                  </div>
                )}

                {players.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-slate-500 mb-3" />
                    <p className="text-slate-400">{t('tournaments.no_players')}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-3 px-4 font-semibold text-slate-300">{t('tournaments.col_name')}</th>
                          <th className="text-center py-3 px-4 font-semibold text-slate-300">{t('tournaments.col_seed')}</th>
                          <th className="text-center py-3 px-4 font-semibold text-slate-300">{t('tournaments.col_wins')}</th>
                          <th className="text-center py-3 px-4 font-semibold text-slate-300">{t('tournaments.col_losses')}</th>
                          <th className="text-center py-3 px-4 font-semibold text-slate-300">{t('tournaments.col_points')}</th>
                          <th className="text-center py-3 px-4 font-semibold text-slate-300">{t('tournaments.col_point_diff')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {players.map((player) => (
                          <tr key={player.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                            <td className="py-3 px-4 text-white font-medium">{player.name}</td>
                            <td className="py-3 px-4 text-center text-slate-300">{player.seed ?? '-'}</td>
                            <td className="py-3 px-4 text-center text-green-400">{player.wins}</td>
                            <td className="py-3 px-4 text-center text-red-400">{player.losses}</td>
                            <td className="py-3 px-4 text-center text-cyan-400">{player.points}</td>
                            <td className="py-3 px-4 text-center text-slate-300">{player.pointDiff}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Standings Tab */}
            {activeTab === 'standings' && (
              <div>
                <h3 className="text-lg font-bold text-white mb-6">{t('tournaments.standings_title')}</h3>
                {players.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="mx-auto h-12 w-12 text-slate-500 mb-3" />
                    <p className="text-slate-400">{t('tournaments.no_standings')}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-slate-600">
                          <th className="text-left py-3 px-4 font-semibold text-slate-300">{t('tournaments.col_rank')}</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-300">{t('tournaments.col_player')}</th>
                          <th className="text-center py-3 px-4 font-semibold text-slate-300">{t('tournaments.col_wins')}</th>
                          <th className="text-center py-3 px-4 font-semibold text-slate-300">{t('tournaments.col_losses')}</th>
                          <th className="text-center py-3 px-4 font-semibold text-slate-300">{t('tournaments.col_points')}</th>
                          <th className="text-center py-3 px-4 font-semibold text-slate-300">{t('tournaments.col_point_diff')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...players]
                          .sort(
                            (a, b) =>
                              b.wins - a.wins ||
                              b.pointDiff - a.pointDiff
                          )
                          .map((player, index) => (
                            <tr key={player.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                              <td className="py-3 px-4 text-white font-bold">{index + 1}</td>
                              <td className="py-3 px-4 text-white font-medium">{player.name}</td>
                              <td className="py-3 px-4 text-center text-green-400">{player.wins}</td>
                              <td className="py-3 px-4 text-center text-red-400">{player.losses}</td>
                              <td className="py-3 px-4 text-center text-cyan-400">{player.points}</td>
                              <td className="py-3 px-4 text-center font-medium text-white">
                                {player.pointDiff}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
