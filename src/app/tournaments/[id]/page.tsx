'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Users, Trophy, Loader, AlertCircle, Edit, ArrowLeft, ChevronDown, ChevronUp, Info } from 'lucide-react';
import TournamentBracketView from '@/components/tournament/TournamentBracketView';

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
  format: string;
  status: string;
  maxPlayers: number;
  numCourts: number;
  avgGameMinutes: number;
  pointsPerSet: number;
  numSets: number;
  proLeague: boolean;
  organizerId: string;
  organizer: { id: string; name: string; email: string };
  players: { id: string; user: { id: string; name: string; email: string } }[];
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
  draft: 'bg-gray-100 text-gray-800',
  registration: 'bg-green-100 text-green-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-purple-100 text-purple-800',
};

const formatColors: Record<string, string> = {
  'King of the Beach': 'bg-yellow-100 text-yellow-800',
  'king_of_the_beach': 'bg-yellow-100 text-yellow-800',
  'Bracket': 'bg-indigo-100 text-indigo-800',
  'bracket': 'bg-indigo-100 text-indigo-800',
  'Group+Knockout': 'bg-pink-100 text-pink-800',
  'group_knockout': 'bg-pink-100 text-pink-800',
  'Round Robin': 'bg-cyan-100 text-cyan-800',
  'round_robin': 'bg-cyan-100 text-cyan-800',
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

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'players' | 'games' | 'standings'>('overview');
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [registering, setRegistering] = useState(false);
  const [registerMsg, setRegisterMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [rulesExpanded, setRulesExpanded] = useState(false);

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

        const [tournamentRes, playersRes, gamesRes] = await Promise.all([
          fetch(`/api/tournaments/${tournamentId}`),
          fetch(`/api/tournaments/${tournamentId}/players`),
          fetch(`/api/tournaments/${tournamentId}/games`),
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
  }, [tournamentId]);

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
        setRegisterMsg({ type: 'success', text: 'Successfully registered!' });
        // Refresh players list
        const playersRes = await fetch(`/api/tournaments/${tournamentId}/players`);
        if (playersRes.ok) {
          setPlayers(await playersRes.json());
        }
      } else {
        setRegisterMsg({ type: 'error', text: data.error || 'Registration failed' });
      }
    } catch {
      setRegisterMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto h-12 w-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading tournament details...</p>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/tournaments"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft size={20} />
            Back to Tournaments
          </Link>
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800">
            <AlertCircle size={20} />
            {error || 'Tournament not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/tournaments"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Tournaments
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{tournament.name}</h1>
              <div className="flex gap-2 flex-wrap">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${statusColors[tournament.status]}`}
                >
                  {statusMap[tournament.status]}
                </span>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${formatColors[tournament.format]}`}
                >
                  {formatLabels[tournament.format] || tournament.format}
                </span>
              </div>
            </div>
            {isOrganizer && (
              <Link
                href={`/tournaments/${tournament.id}/manage`}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                <Edit size={20} />
                Manage
              </Link>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Date</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(tournament.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {tournament.endDate && tournament.endDate !== tournament.date &&
                  ` - ${new Date(tournament.endDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}`}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Location</p>
              <p className="text-sm font-medium text-gray-900">
                {tournament.city}, {tournament.state}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Courts</p>
              <p className="text-sm font-medium text-gray-900">{tournament.numCourts}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Duration</p>
              <p className="text-sm font-medium text-gray-900">{tournament.avgGameMinutes} min</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Players</p>
              <p className="text-sm font-medium text-gray-900">
                {tournament.players?.length ?? 0}/{tournament.maxPlayers}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <div className="flex flex-wrap">
              {(['overview', 'players', 'games', 'standings'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 font-medium text-sm transition border-b-2 ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Tournament Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {tournament.description || 'No description provided'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Tournament Details</h3>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium text-gray-600">Venue</dt>
                        <dd className="text-gray-900">{tournament.location}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-600">City</dt>
                        <dd className="text-gray-900">
                          {tournament.city}, {tournament.state}, {tournament.country}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-600">Format</dt>
                        <dd className="text-gray-900">{formatLabels[tournament.format] || tournament.format}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Game Settings</h3>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium text-gray-600">Points Per Set</dt>
                        <dd className="text-gray-900">{tournament.pointsPerSet}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-600">Tournament Tier</dt>
                        <dd className="text-gray-900">
                          {tournament.proLeague ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#1a2744] text-[#c4a35a]">
                              Professional League
                            </span>
                          ) : 'Standard'}
                        </dd>
                      </div>
                      {tournament.proLeague && (
                        <div>
                          <dt className="text-sm font-medium text-gray-600">Semis & Finals</dt>
                          <dd className="text-gray-900">Best of 3 sets (3rd set to 15 pts)</dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-sm font-medium text-gray-600">Organizer</dt>
                        <dd className="text-gray-900">{tournament.organizer?.name}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Footvolley Rules Card */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setRulesExpanded(!rulesExpanded)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Info size={16} className="text-[#1a2744]" />
                      Footvolley Rules
                    </span>
                    {rulesExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                  </button>
                  {rulesExpanded && (
                    <div className="px-4 py-4 space-y-4 text-sm text-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Scoring</h4>
                          <ul className="space-y-1.5 text-gray-600">
                            <li>Sets played to <strong>{tournament.pointsPerSet} points</strong></li>
                            <li>Winner must lead by <strong>2 points</strong> minimum</li>
                            {tournament.proLeague && (
                              <>
                                <li>Semis & Finals: <strong>best of 3 sets</strong></li>
                                <li>Deciding set (3rd): played to <strong>15 points</strong></li>
                              </>
                            )}
                            <li>Rally scoring — point on every play</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Teams & Play</h4>
                          <ul className="space-y-1.5 text-gray-600">
                            <li><strong>2 players</strong> per team</li>
                            <li>Max <strong>3 touches</strong> per side</li>
                            <li>No hands or arms — feet, head, chest, knees only</li>
                            <li>Serve must be <strong>kicked with the foot</strong></li>
                          </ul>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Court & Net</h4>
                          <ul className="space-y-1.5 text-gray-600">
                            <li>Court: <strong>16m x 8m</strong> (sand)</li>
                            <li>Net height (men): <strong>2.20m</strong></li>
                            <li>Net height (women): <strong>2.10m</strong></li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Faults</h4>
                          <ul className="space-y-1.5 text-gray-600">
                            <li>Touching the net during play</li>
                            <li>4+ touches before returning the ball</li>
                            <li>Same player touching ball twice in a row</li>
                            <li>Ball landing outside court boundaries</li>
                          </ul>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                        Based on European Footvolley League 2025 Official Rules
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Players Tab */}
            {activeTab === 'players' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">
                    Registered Players ({players.length}/{tournament.maxPlayers})
                  </h3>
                  {tournament.status === 'registration' && user && !isRegistered && (
                    <button
                      onClick={handleRegister}
                      disabled={registering}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {registering ? 'Registering...' : 'Register'}
                    </button>
                  )}
                  {isRegistered && (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Registered
                    </span>
                  )}
                </div>

                {registerMsg && (
                  <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
                    registerMsg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {registerMsg.text}
                  </div>
                )}

                {players.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-gray-600">No players registered yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Name</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">Seed</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">W</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">L</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">Pts</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">PD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {players.map((player) => (
                          <tr key={player.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-gray-900 font-medium">{player.name}</td>
                            <td className="py-3 px-4 text-center text-gray-700">{player.seed ?? '-'}</td>
                            <td className="py-3 px-4 text-center text-gray-700">{player.wins}</td>
                            <td className="py-3 px-4 text-center text-gray-700">{player.losses}</td>
                            <td className="py-3 px-4 text-center text-gray-700">{player.points}</td>
                            <td className="py-3 px-4 text-center text-gray-700">{player.pointDiff}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Games Tab */}
            {activeTab === 'games' && (
              <TournamentBracketView games={games} format={tournament.format} />
            )}

            {/* Standings Tab */}
            {activeTab === 'standings' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6">Standings</h3>
                {players.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-gray-600">No standings data available</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-300">
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Rank</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Player</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">W</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">L</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">Pts</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">PD</th>
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
                            <tr key={player.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 text-gray-900 font-bold">{index + 1}</td>
                              <td className="py-3 px-4 text-gray-900 font-medium">{player.name}</td>
                              <td className="py-3 px-4 text-center text-gray-700">{player.wins}</td>
                              <td className="py-3 px-4 text-center text-gray-700">{player.losses}</td>
                              <td className="py-3 px-4 text-center text-gray-700">{player.points}</td>
                              <td className="py-3 px-4 text-center font-medium text-gray-900">
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
