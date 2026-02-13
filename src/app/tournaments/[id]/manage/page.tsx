'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader, AlertCircle, CheckCircle, ArrowLeft, Save } from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  status: 'draft' | 'registration' | 'in_progress' | 'completed';
  startDate: string;
  endDate: string;
  organizerId: string;
}

interface Game {
  id: string;
  roundName: string;
  court: number;
  scheduledTime: string;
  player1: string;
  player2: string;
  score1?: number;
  score2?: number;
  status: 'pending' | 'completed' | 'in_progress';
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['registration', 'in_progress'],
  registration: ['in_progress', 'completed'],
  in_progress: ['completed'],
  completed: [],
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  registration: 'Registration Open',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export default function ManageTournamentPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [gameScores, setGameScores] = useState<Record<string, { score1: number; score2: number }>>({});

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

        // Check authorization
        if (user && user.id === tournamentData.organizerId) {
          setAuthorized(true);
        } else if (user) {
          setError('You are not authorized to manage this tournament');
          setAuthorized(false);
        }

        if (gamesRes.ok) {
          const gamesData = await gamesRes.json();
          setGames(gamesData);
          // Initialize game scores
          const initialScores: Record<string, { score1: number; score2: number }> = {};
          gamesData.forEach((game: Game) => {
            initialScores[game.id] = {
              score1: game.score1 || 0,
              score2: game.score2 || 0,
            };
          });
          setGameScores(initialScores);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    if (tournamentId && user) {
      fetchTournamentData();
    }
  }, [tournamentId, user]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setTournament((prev) => prev ? { ...prev, status: newStatus as Tournament['status'] } : prev);
        setSuccess(`Status updated to ${statusLabels[newStatus]}`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update status');
      }
    } catch (err) {
      setError('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleScoreUpdate = async (gameId: string) => {
    const scores = gameScores[gameId];
    if (!scores) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/tournaments/${tournamentId}/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score1: scores.score1,
          score2: scores.score2,
          status: 'completed',
        }),
      });

      if (res.ok) {
        setGames((prev) =>
          prev.map((g) =>
            g.id === gameId
              ? { ...g, score1: scores.score1, score2: scores.score2, status: 'completed' as const }
              : g
          )
        );
        setEditingGameId(null);
        setSuccess('Score updated!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update score');
      }
    } catch (err) {
      setError('Failed to update score');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateSchedule = async () => {
    try {
      setGenerating(true);
      const res = await fetch(`/api/tournaments/${tournamentId}/generate`, {
        method: 'POST',
      });

      if (res.ok) {
        setSuccess('Schedule generated successfully!');
        // Refresh games
        const gamesRes = await fetch(`/api/tournaments/${tournamentId}/games`);
        if (gamesRes.ok) {
          const gamesData = await gamesRes.json();
          setGames(gamesData);
        }
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to generate schedule');
      }
    } catch (err) {
      setError('Failed to generate schedule');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto h-12 w-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (error && !authorized) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <Link href="/tournaments" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
            <ArrowLeft size={20} /> Back to Tournaments
          </Link>
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800">
            <AlertCircle size={20} />
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) return null;

  const availableTransitions = STATUS_TRANSITIONS[tournament.status] || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href={`/tournaments/${tournamentId}`}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Tournament
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Manage: {tournament.name}</h1>
          <p className="text-gray-600">Status: {statusLabels[tournament.status]}</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-800">
            <CheckCircle size={20} />
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Status Management */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Tournament Status</h2>
          {availableTransitions.length > 0 ? (
            <div className="flex gap-3">
              {availableTransitions.map((nextStatus) => (
                <button
                  key={nextStatus}
                  onClick={() => handleStatusChange(nextStatus)}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {saving ? 'Updating...' : `Move to ${statusLabels[nextStatus]}`}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">This tournament is completed. No further status changes available.</p>
          )}
        </div>

        {/* Generate Schedule */}
        {(tournament.status === 'registration' || tournament.status === 'draft') && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Schedule</h2>
            <button
              onClick={handleGenerateSchedule}
              disabled={generating}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate Schedule'}
            </button>
          </div>
        )}

        {/* Games Management */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Games ({games.length})</h2>
          {games.length === 0 ? (
            <p className="text-gray-600">No games scheduled yet. Generate a schedule first.</p>
          ) : (
            <div className="space-y-4">
              {games.map((game) => (
                <div key={game.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-600">
                      {game.roundName} - Court {game.court}
                    </p>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
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
                    <span className="font-medium text-gray-900">{game.player1}</span>
                    {editingGameId === game.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={gameScores[game.id]?.score1 || 0}
                          onChange={(e) =>
                            setGameScores((prev) => ({
                              ...prev,
                              [game.id]: { ...prev[game.id], score1: parseInt(e.target.value) || 0 },
                            }))
                          }
                          className="w-16 px-2 py-1 border rounded text-center"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                          type="number"
                          min={0}
                          value={gameScores[game.id]?.score2 || 0}
                          onChange={(e) =>
                            setGameScores((prev) => ({
                              ...prev,
                              [game.id]: { ...prev[game.id], score2: parseInt(e.target.value) || 0 },
                            }))
                          }
                          className="w-16 px-2 py-1 border rounded text-center"
                        />
                        <button
                          onClick={() => handleScoreUpdate(game.id)}
                          disabled={saving}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={() => setEditingGameId(null)}
                          className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-gray-900">
                          {game.score1 ?? '-'} - {game.score2 ?? '-'}
                        </span>
                        {game.status !== 'completed' && (
                          <button
                            onClick={() => setEditingGameId(game.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit Score
                          </button>
                        )}
                      </div>
                    )}
                    <span className="font-medium text-gray-900">{game.player2}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
