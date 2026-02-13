'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader, AlertCircle, CheckCircle, ArrowLeft, Save, X } from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  status: 'draft' | 'registration' | 'in_progress' | 'completed';
  startDate: string;
  endDate: string;
  organizerId: string;
  pointsPerSet: number;
  proLeague: boolean;
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
  set2Home?: number;
  set2Away?: number;
  set3Home?: number;
  set3Away?: number;
  bestOf3: boolean;
  status: 'pending' | 'completed' | 'in_progress' | 'scheduled';
}

interface SetScores {
  set1Home: number;
  set1Away: number;
  set2Home: number;
  set2Away: number;
  set3Home: number;
  set3Away: number;
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
  const [gameScores, setGameScores] = useState<Record<string, SetScores>>({});
  const [scoreError, setScoreError] = useState<string | null>(null);

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

        const tournamentJson = await tournamentRes.json();
        const tournamentData = tournamentJson.data || tournamentJson;
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
          const initialScores: Record<string, SetScores> = {};
          gamesData.forEach((game: Game) => {
            initialScores[game.id] = {
              set1Home: game.score1 || 0,
              set1Away: game.score2 || 0,
              set2Home: game.set2Home || 0,
              set2Away: game.set2Away || 0,
              set3Home: game.set3Home || 0,
              set3Away: game.set3Away || 0,
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

  const handleScoreUpdate = async (gameId: string, isBestOf3: boolean) => {
    const scores = gameScores[gameId];
    if (!scores) return;

    setScoreError(null);

    const payload: Record<string, number> = {
      scoreHome: scores.set1Home,
      scoreAway: scores.set1Away,
    };

    if (isBestOf3) {
      payload.set2Home = scores.set2Home;
      payload.set2Away = scores.set2Away;

      // Check if set 3 is needed (sets tied 1-1)
      const homeWonSet1 = scores.set1Home > scores.set1Away;
      const homeWonSet2 = scores.set2Home > scores.set2Away;
      const setsTied = (homeWonSet1 && !homeWonSet2) || (!homeWonSet1 && homeWonSet2);

      if (setsTied && (scores.set3Home > 0 || scores.set3Away > 0)) {
        payload.set3Home = scores.set3Home;
        payload.set3Away = scores.set3Away;
      }
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setGames((prev) =>
          prev.map((g) =>
            g.id === gameId
              ? {
                  ...g,
                  score1: scores.set1Home,
                  score2: scores.set1Away,
                  set2Home: isBestOf3 ? scores.set2Home : undefined,
                  set2Away: isBestOf3 ? scores.set2Away : undefined,
                  set3Home: isBestOf3 ? scores.set3Home : undefined,
                  set3Away: isBestOf3 ? scores.set3Away : undefined,
                  status: 'completed' as const,
                }
              : g
          )
        );
        setEditingGameId(null);
        setSuccess('Score updated!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setScoreError(data.error || 'Failed to update score');
      }
    } catch (err) {
      setScoreError('Failed to update score');
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

  const getSetsSummary = (game: Game): string => {
    if (!game.bestOf3 || game.score1 == null) return '';
    let homeSets = 0;
    let awaySets = 0;
    if (game.score1 > (game.score2 || 0)) homeSets++;
    else awaySets++;
    if (game.set2Home != null && game.set2Away != null) {
      if (game.set2Home > game.set2Away) homeSets++;
      else awaySets++;
    }
    if (game.set3Home != null && game.set3Away != null) {
      if (game.set3Home > game.set3Away) homeSets++;
      else awaySets++;
    }
    return `(${homeSets}-${awaySets})`;
  };

  const updateSetScore = (gameId: string, field: keyof SetScores, value: number) => {
    setGameScores((prev) => ({
      ...prev,
      [gameId]: { ...prev[gameId], [field]: value },
    }));
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

  const renderScoreEditor = (game: Game) => {
    const scores = gameScores[game.id];
    if (!scores) return null;

    if (!game.bestOf3) {
      // Single set: simple 2-input
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={scores.set1Home}
              onChange={(e) => updateSetScore(game.id, 'set1Home', parseInt(e.target.value) || 0)}
              className="w-16 px-2 py-1 border rounded text-center"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              min={0}
              value={scores.set1Away}
              onChange={(e) => updateSetScore(game.id, 'set1Away', parseInt(e.target.value) || 0)}
              className="w-16 px-2 py-1 border rounded text-center"
            />
          </div>
          <p className="text-xs text-gray-400">First to {tournament.pointsPerSet}, win by 2</p>
        </div>
      );
    }

    // Best of 3: set-by-set entry
    const homeWonSet1 = scores.set1Home > scores.set1Away;
    const homeWonSet2 = scores.set2Home > scores.set2Away;
    const setsTied = (scores.set1Home > 0 || scores.set1Away > 0) &&
                     (scores.set2Home > 0 || scores.set2Away > 0) &&
                     ((homeWonSet1 && !homeWonSet2) || (!homeWonSet1 && homeWonSet2));

    return (
      <div className="space-y-2">
        {/* Set 1 */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 w-10">Set 1</span>
          <input
            type="number"
            min={0}
            value={scores.set1Home}
            onChange={(e) => updateSetScore(game.id, 'set1Home', parseInt(e.target.value) || 0)}
            className="w-14 px-2 py-1 border rounded text-center text-sm"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            min={0}
            value={scores.set1Away}
            onChange={(e) => updateSetScore(game.id, 'set1Away', parseInt(e.target.value) || 0)}
            className="w-14 px-2 py-1 border rounded text-center text-sm"
          />
        </div>
        {/* Set 2 */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 w-10">Set 2</span>
          <input
            type="number"
            min={0}
            value={scores.set2Home}
            onChange={(e) => updateSetScore(game.id, 'set2Home', parseInt(e.target.value) || 0)}
            className="w-14 px-2 py-1 border rounded text-center text-sm"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            min={0}
            value={scores.set2Away}
            onChange={(e) => updateSetScore(game.id, 'set2Away', parseInt(e.target.value) || 0)}
            className="w-14 px-2 py-1 border rounded text-center text-sm"
          />
        </div>
        {/* Set 3 (only if needed) */}
        {setsTied && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-amber-600 w-10">Set 3</span>
            <input
              type="number"
              min={0}
              value={scores.set3Home}
              onChange={(e) => updateSetScore(game.id, 'set3Home', parseInt(e.target.value) || 0)}
              className="w-14 px-2 py-1 border border-amber-300 rounded text-center text-sm bg-amber-50"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              min={0}
              value={scores.set3Away}
              onChange={(e) => updateSetScore(game.id, 'set3Away', parseInt(e.target.value) || 0)}
              className="w-14 px-2 py-1 border border-amber-300 rounded text-center text-sm bg-amber-50"
            />
          </div>
        )}
        <p className="text-xs text-gray-400">
          Sets 1-2 to {tournament.pointsPerSet}{setsTied ? `, Set 3 to 15` : ''} — win by 2
        </p>
      </div>
    );
  };

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Manage: {tournament.name}</h1>
              <p className="text-gray-600">Status: {statusLabels[tournament.status]}</p>
            </div>
            {tournament.proLeague && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1a2744] text-[#c4a35a]">
                Professional League
              </span>
            )}
          </div>
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
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-600">
                        {game.roundName} - Court {game.court}
                      </p>
                      {game.bestOf3 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#1a2744] text-[#c4a35a]">
                          Bo3
                        </span>
                      )}
                    </div>
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

                  <div className="flex items-start justify-between gap-4">
                    <span className="font-medium text-gray-900 flex-1 text-sm">{game.player1}</span>

                    {editingGameId === game.id ? (
                      <div className="flex flex-col items-center gap-2">
                        {renderScoreEditor(game)}

                        {scoreError && (
                          <p className="text-xs text-red-600 max-w-xs text-center">{scoreError}</p>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleScoreUpdate(game.id, game.bestOf3)}
                            disabled={saving}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                          >
                            <Save size={14} /> Save
                          </button>
                          <button
                            onClick={() => { setEditingGameId(null); setScoreError(null); }}
                            className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 flex items-center gap-1"
                          >
                            <X size={14} /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xl font-bold text-gray-900">
                          {game.score1 ?? '-'} - {game.score2 ?? '-'}
                        </span>
                        {game.bestOf3 && game.score1 != null && (
                          <div className="text-xs text-gray-500 space-y-0.5 text-center">
                            <span className="font-medium">{getSetsSummary(game)}</span>
                            {game.set2Home != null && (
                              <span className="block">
                                {game.score1}-{game.score2}, {game.set2Home}-{game.set2Away}
                                {game.set3Home != null && `, ${game.set3Home}-${game.set3Away}`}
                              </span>
                            )}
                          </div>
                        )}
                        {game.status !== 'completed' && (
                          <button
                            onClick={() => { setEditingGameId(game.id); setScoreError(null); }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1"
                          >
                            Edit Score
                          </button>
                        )}
                      </div>
                    )}

                    <span className="font-medium text-gray-900 flex-1 text-sm text-right">{game.player2}</span>
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
