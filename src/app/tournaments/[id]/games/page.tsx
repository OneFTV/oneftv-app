'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader, AlertCircle, ArrowLeft, Trophy } from 'lucide-react';

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

interface Tournament {
  id: string;
  name: string;
  organizerId: string;
}

export default function TournamentGamesPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [selectedRound, setSelectedRound] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedCourt, setSelectedCourt] = useState('all');

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

        const [tournamentRes, gamesRes] = await Promise.all([
          fetch(`/api/tournaments/${tournamentId}`),
          fetch(`/api/tournaments/${tournamentId}/games`),
        ]);

        if (!tournamentRes.ok) {
          throw new Error('Failed to fetch tournament');
        }

        const tournamentData = await tournamentRes.json();
        setTournament(tournamentData);

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

  // Get unique values for filters
  const rounds = Array.from(new Set(games.map((g) => g.roundName))).sort();
  const groups = Array.from(new Set(games.map((g) => g.groupName).filter(Boolean))) as string[];
  const courts = Array.from(new Set(games.map((g) => g.court))).sort((a, b) => a - b);
  const statuses = ['pending', 'in_progress', 'completed'] as const;

  // Filter games
  const filteredGames = games.filter((game) => {
    if (selectedStatus !== 'all' && game.status !== selectedStatus) {
      return false;
    }
    if (selectedRound !== 'all' && game.roundName !== selectedRound) {
      return false;
    }
    if (selectedGroup !== 'all' && game.groupName !== selectedGroup) {
      return false;
    }
    if (selectedCourt !== 'all' && game.court.toString() !== selectedCourt) {
      return false;
    }
    return true;
  });

  const completedCount = filteredGames.filter((g) => g.status === 'completed').length;
  const pendingCount = filteredGames.filter((g) => g.status === 'pending').length;
  const inProgressCount = filteredGames.filter((g) => g.status === 'in_progress').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto h-12 w-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading tournament games...</p>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href={`/tournaments/${tournamentId}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft size={20} />
            Back to Tournament
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
          href={`/tournaments/${tournament.id}`}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Tournament
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tournament Games</h1>
          <p className="text-gray-600">{tournament.name}</p>
        </div>

        {/* Stats */}
        {games.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600 mb-1">Total Games</p>
              <p className="text-3xl font-bold text-gray-900">{games.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg shadow-md p-4 border border-green-200">
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-600">{completedCount}</p>
            </div>
            <div className="bg-blue-50 rounded-lg shadow-md p-4 border border-blue-200">
              <p className="text-sm text-gray-600 mb-1">In Progress</p>
              <p className="text-3xl font-bold text-blue-600">{inProgressCount}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow-md p-4 border border-yellow-200">
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        {games.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Round Filter */}
              {rounds.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Round</label>
                  <select
                    value={selectedRound}
                    onChange={(e) => setSelectedRound(e.target.value)}
                    className="v-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Rounds</option>
                    {rounds.map((round) => (
                      <option key={round} value={round}>
                        {round}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Group Filter */}
              {groups.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Group</label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="v-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Groups</option>
                    {groups.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Court Filter */}
              {courts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Court</label>
                  <select
                    value={selectedCourt}
                    onChange={(e) => setSelectedCourt(e.target.value)}
                    className="v-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Courts</option>
                    {courts.map((court) => (
                      <option key={court} value={court.toString()}>
                        Court {court}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Games List */}
        {filteredGames.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {games.length === 0 ? 'No games scheduled' : 'No games match your filters'}
            </h3>
            <p className="text-gray-600">
              {games.length === 0
                ? 'Games will appear here once the schedule is generated'
                : 'Try adjusting your filter selections'}
            </p>
            {games.length === 0 && isOrganizer && (
              <Link
                href={`/tournaments/${tournament.id}/manage`}
                className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"
              >
                Generate Schedule
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGames.map((game) => {
              const isCompleted = game.status === 'completed';
              const score1 = game.score1 || 0;
              const score2 = game.score2 || 0;
              const player1Won = isCompleted && score1 > score2;
              const player2Won = isCompleted && score2 > score1;

              return (
                <Link
                  key={game.id}
                  href={isOrganizer ? `${tournament.id}/manage` : '#'}
                  className="block bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden border-l-4"
                  style={{
                    borderLeftColor:
                      game.status === 'completed'
                        ? '#10b981'
                        : game.status === 'in_progress'
                        ? '#3b82f6'
                        : '#d1d5db',
                  }}
                >
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-600">
                          {game.roundName}
                          {game.groupName && ` - ${game.groupName}`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Court {game.court} •{' '}
                          {new Date(game.scheduledTime).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-4 ${
                          game.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : game.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {game.status === 'completed'
                          ? 'Completed'
                          : game.status === 'in_progress'
                          ? 'In Progress'
                          : 'Pending'}
                      </span>
                    </div>

                    {/* Score Display */}
                    <div className="flex items-center gap-4">
                      {/* Player 1 */}
                      <div className="flex-1">
                        <p
                          className={`font-semibold text-sm ${
                            player1Won ? 'text-green-600' : 'text-gray-900'
                          }`}
                        >
                          {game.player1}
                        </p>
                      </div>

                      {/* Score */}
                      <div className="flex items-center gap-3">
                        {isCompleted ? (
                          <>
                            <span className="text-2xl font-bold text-gray-900 w-12 text-center">
                              {score1}
                            </span>
                            <span className="text-gray-400">-</span>
                            <span className="text-2xl font-bold text-gray-900 w-12 text-center">
                              {score2}
                            </span>
                          </>
                        ) : (
                          <p className="text-sm text-gray-500 px-4">
                            {new Date(game.scheduledTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        )}
                      </div>

                      {/* Player 2 */}
                      <div className="flex-1 text-right">
                        <p
                          className={`font-semibold text-sm ${
                            player2Won ? 'text-green-600' : 'text-gray-900'
                          }`}
                        >
                          {game.player2}
                        </p>
                      </div>
                    </div>

                    {/* Edit Button for Organizer */}
                    {isOrganizer && !isCompleted && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                          Enter Score
                        </button>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Results Summary */}
        {filteredGames.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-600">
            Showing {filteredGames.length} of {games.length} games
          </div>
        )}
      </div>
    </div>
  );
}
