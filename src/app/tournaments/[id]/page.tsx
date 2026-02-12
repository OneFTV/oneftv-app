'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Users, Trophy, Loader, AlertCircle, Edit, ArrowLeft } from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  description: string;
  location: string;
  city: string;
  state: string;
  country: string;
  startDate: string;
  endDate: string;
  format: 'King of the Beach' | 'Bracket' | 'Group+Knockout' | 'Round Robin';
  status: 'draft' | 'registration' | 'in_progress' | 'completed';
  maxPlayers: number;
  registeredPlayers: number;
  organizerId: string;
  organizerName: string;
  courts: number;
  avgGameDuration: number;
  pointsPerSet: number;
  sets: 1 | 3;
}

interface Player {
  id: string;
  name: string;
  email: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
}

interface Game {
  id: string;
  roundName: string;
  groupName?: string;
  court: number;
  scheduledTime: string;
  player1: string;
  player2: string;
  score1?: number;
  score2?: number;
  status: 'pending' | 'completed' | 'in_progress';
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
  'Bracket': 'bg-indigo-100 text-indigo-800',
  'Group+Knockout': 'bg-pink-100 text-pink-800',
  'Round Robin': 'bg-cyan-100 text-cyan-800',
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

        const tournamentData = await tournamentRes.json();
        setTournament(tournamentData);

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

  const isOrganizer = user && tournament && user.id === tournament.organizerId;

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
                  {tournament.format}
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
                {new Date(tournament.startDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {tournament.endDate !== tournament.startDate &&
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
              <p className="text-sm font-medium text-gray-900">{tournament.courts}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Duration</p>
              <p className="text-sm font-medium text-gray-900">{tournament.avgGameDuration} min</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Players</p>
              <p className="text-sm font-medium text-gray-900">
                {tournament.registeredPlayers}/{tournament.maxPlayers}
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
                      : 'border-transparent text-gray-600 hover:text-gray-900"
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
                        <dd className="text-gray-900">{tournament.format}</dd>
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
                        <dt className="text-sm font-medium text-gray-600">Sets</dt>
                        <dd className="text-gray-900">Best of {tournament.sets}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-600">Organizer</dt>
                        <dd className="text-gray-900">{tournament.organizerName}</dd>
                      </div>
                    </dl>
                  </div>
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
                  {tournament.status === 'registration' && user && (
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition">
                      Register
                    </button>
                  )}
                </div>

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
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">W</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">L</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">PF</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">PA</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">PD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {players.map((player) => (
                          <tr key={player.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-gray-900 font-medium">{player.name}</td>
                            <td className="py-3 px-4 text-center text-gray-700">{player.wins}</td>
                            <td className="py-3 px-4 text-center text-gray-700">{player.losses}</td>
                            <td className="py-3 px-4 text-center text-gray-700">{player.pointsFor}</td>
                            <td className="py-3 px-4 text-center text-gray-700">{player.pointsAgainst}</td>
                            <td className="py-3 px-4 text-center text-gray-700">
                              {player.pointsFor - player.pointsAgainst}
                            </td>
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
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6">Games</h3>
                {games.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-gray-600">No games scheduled yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {games.map((game) => (
                      <div
                        key={game.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-600">
                              {game.roundName}
                              {game.groupName && ` - ${game.groupName}`}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Court {game.court}</p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              game.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : game.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {game.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{game.player1}</p>
                          </div>
                          <div className="mx-4 text-center">
                            {game.score1 !== undefined && game.score2 !== undefined ? (
                              <p className="text-2xl font-bold text-gray-900">
                                {game.score1} - {game.score2}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-500">
                                {new Date(game.scheduledTime).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            )}
                          </div>
                          <div className="flex-1 text-right">
                            <p className="font-medium text-gray-900">{game.player2}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">PF</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">PA</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">PD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...players]
                          .sort(
                            (a, b) =>
                              b.wins - a.wins ||
                              (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst)
                          )
                          .map((player, index) => (
                            <tr key={player.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 text-gray-900 font-bold">{index + 1}</td>
                              <td className="py-3 px-4 text-gray-900 font-medium">{player.name}</td>
                              <td className="py-3 px-4 text-center text-gray-700">{player.wins}</td>
                              <td className="py-3 px-4 text-center text-gray-700">{player.losses}</td>
                              <td className="py-3 px-4 text-center text-gray-700">{player.pointsFor}</td>
                              <td className="py-3 px-4 text-center text-gray-700">
                                {player.pointsAgainst}
                              </td>
                              <td className="py-3 px-4 text-center font-medium text-gray-900">
                                {player.pointsFor - player.pointsAgainst}
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
