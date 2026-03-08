'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader, AlertCircle, CheckCircle, ArrowLeft, Save, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';

interface CategoryInfo {
  id: string;
  name: string;
  format: string;
  maxTeams: number;
  status: string;
  _count: { TournamentPlayer: number; TeamRegistration: number };
}

interface Tournament {
  id: string;
  name: string;
  status: 'draft' | 'registration' | 'in_progress' | 'completed';
  startDate: string;
  endDate: string;
  organizerId: string;
  pointsPerSet: number | null;
  proLeague: boolean;
  Category?: CategoryInfo[];
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
  matchNumber?: number;
  bracketSide?: string;
}

interface SetScores {
  set1Home: number;
  set1Away: number;
  set2Home: number;
  set2Away: number;
  set3Home: number;
  set3Away: number;
}

interface RoundGroup {
  roundName: string;
  bracketSide: string | null;
  games: Game[];
  completedCount: number;
  totalCount: number;
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

const bracketSideLabels: Record<string, string> = {
  winners: 'Winners',
  losers: 'Losers',
  finals: 'Finals',
};

const bracketSideColors: Record<string, string> = {
  winners: 'bg-blue-100 text-blue-700',
  losers: 'bg-orange-100 text-orange-700',
  finals: 'bg-purple-100 text-purple-700',
};

export default function ManageTournamentPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
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
  const [gameScores, setGameScores] = useState<Record<string, SetScores>>({});
  const [dirtyGames, setDirtyGames] = useState<Set<string>>(new Set());
  const [batchSaving, setBatchSaving] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [generatingCategoryId, setGeneratingCategoryId] = useState<string | null>(null);
  const [collapsedRounds, setCollapsedRounds] = useState<Set<string>>(new Set());

  const originalScores = useRef<Record<string, SetScores>>({});

  // Group games by round
  const roundGroups = useMemo((): RoundGroup[] => {
    const groups: Record<string, RoundGroup> = {};
    for (const game of games) {
      const key = `${game.bracketSide || 'main'}::${game.roundName}`;
      if (!groups[key]) {
        groups[key] = {
          roundName: game.roundName,
          bracketSide: game.bracketSide || null,
          games: [],
          completedCount: 0,
          totalCount: 0,
        };
      }
      groups[key].games.push(game);
      groups[key].totalCount++;
      if (game.status === 'completed') groups[key].completedCount++;
    }
    return Object.values(groups);
  }, [games]);

  // Auto-collapse fully completed rounds on first load
  const hasInitializedCollapse = useRef(false);
  useEffect(() => {
    if (roundGroups.length > 0 && !hasInitializedCollapse.current) {
      hasInitializedCollapse.current = true;
      const collapsed = new Set<string>();
      for (const rg of roundGroups) {
        const key = `${rg.bracketSide || 'main'}::${rg.roundName}`;
        if (rg.completedCount === rg.totalCount && rg.totalCount > 0) {
          collapsed.add(key);
        }
      }
      setCollapsedRounds(collapsed);
    }
  }, [roundGroups]);

  const toggleRound = useCallback((key: string) => {
    setCollapsedRounds(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

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

  const fetchGames = useCallback(async () => {
    const catParam = selectedCategoryId ? `?categoryId=${selectedCategoryId}` : '';
    const gamesRes = await fetch(`/api/tournaments/${tournamentId}/games${catParam}`);
    if (gamesRes.ok) {
      const gamesData = await gamesRes.json();
      setGames(gamesData);
      const initial: Record<string, SetScores> = {};
      gamesData.forEach((game: Game) => {
        initial[game.id] = {
          set1Home: game.score1 || 0,
          set1Away: game.score2 || 0,
          set2Home: game.set2Home || 0,
          set2Away: game.set2Away || 0,
          set3Home: game.set3Home || 0,
          set3Away: game.set3Away || 0,
        };
      });
      setGameScores(initial);
      originalScores.current = JSON.parse(JSON.stringify(initial));
      setDirtyGames(new Set());
    }
  }, [tournamentId, selectedCategoryId]);

  useEffect(() => {
    const fetchTournamentData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [tournamentRes] = await Promise.all([
          fetch(`/api/tournaments/${tournamentId}`),
          fetchGames(),
        ]);

        if (!tournamentRes.ok) throw new Error('Failed to fetch tournament');

        const tournamentJson = await tournamentRes.json();
        const tournamentData = tournamentJson.data || tournamentJson;
        setTournament(tournamentData);

        if (user && user.id) {
          setAuthorized(true);
        } else if (user) {
          setError(t('tournaments.manage_unauthorized'));
          setAuthorized(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    if (tournamentId && user) fetchTournamentData();
  }, [tournamentId, user, selectedCategoryId, fetchGames]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTournament(prev => prev ? { ...prev, status: newStatus as Tournament['status'] } : prev);
        setSuccess(t('tournaments.manage_status_updated', { status: statusLabels[newStatus] }));
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update status');
      }
    } catch {
      setError('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const updateSetScore = useCallback((gameId: string, field: keyof SetScores, value: number) => {
    setGameScores(prev => {
      const updated = { ...prev, [gameId]: { ...prev[gameId], [field]: value } };
      const orig = originalScores.current[gameId];
      const cur = updated[gameId];
      const isDirty = orig && (
        cur.set1Home !== orig.set1Home || cur.set1Away !== orig.set1Away ||
        cur.set2Home !== orig.set2Home || cur.set2Away !== orig.set2Away ||
        cur.set3Home !== orig.set3Home || cur.set3Away !== orig.set3Away
      );
      setDirtyGames(prev => {
        const next = new Set(prev);
        if (isDirty) next.add(gameId);
        else next.delete(gameId);
        return next;
      });
      return updated;
    });
  }, []);

  const handleBatchSave = async () => {
    if (dirtyGames.size === 0) return;

    setBatchSaving(true);
    setError(null);

    const scores = Array.from(dirtyGames).map(gameId => {
      const s = gameScores[gameId];
      const game = games.find(g => g.id === gameId);
      const entry: Record<string, unknown> = {
        gameId,
        scoreHome: s.set1Home,
        scoreAway: s.set1Away,
      };
      if (game?.bestOf3) {
        entry.set2Home = s.set2Home;
        entry.set2Away = s.set2Away;
        if (s.set3Home > 0 || s.set3Away > 0) {
          entry.set3Home = s.set3Home;
          entry.set3Away = s.set3Away;
        }
      }
      return entry;
    });

    try {
      const res = await fetch('/api/games/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores }),
      });

      const data = await res.json();

      if (res.ok) {
        const failedResults = (data.results as Array<{ gameId: string; success: boolean; error?: string }>)
          .filter(r => !r.success);

        if (failedResults.length > 0) {
          setError(`${failedResults.length} game(s) failed: ${failedResults.map(r => r.error).join(', ')}`);
        }

        setSuccess(data.message);
        setTimeout(() => setSuccess(''), 4000);

        // Re-fetch all games to reflect bracket advancement (players moved to next games)
        await fetchGames();
      } else {
        setError(data.error || 'Failed to save scores');
      }
    } catch {
      setError('Failed to save scores');
    } finally {
      setBatchSaving(false);
    }
  };

  const handleGenerateSchedule = async (categoryId?: string) => {
    try {
      if (categoryId) setGeneratingCategoryId(categoryId);
      else setGenerating(true);

      const body = categoryId ? JSON.stringify({ categoryId }) : undefined;
      const res = await fetch(`/api/tournaments/${tournamentId}/generate`, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body,
      });

      if (res.ok) {
        setSuccess(categoryId ? t('tournaments.manage_category_generated') : t('tournaments.manage_schedule_generated'));
        await fetchGames();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to generate schedule');
      }
    } catch {
      setError('Failed to generate schedule');
    } finally {
      setGenerating(false);
      setGeneratingCategoryId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto h-12 w-12 text-blue-600 animate-spin mb-4" />
          <p className="text-slate-400">{t('tournaments.manage_loading')}</p>
        </div>
      </div>
    );
  }

  if (error && !authorized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <Link href="/tournaments" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
            <ArrowLeft size={20} /> {t('tournaments.back_to_tournaments')}
          </Link>
          <div className="p-6 bg-red-900/30 border border-red-400/30 rounded-lg flex items-center gap-3 text-red-300">
            <AlertCircle size={20} />
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) return null;

  const availableTransitions = STATUS_TRANSITIONS[tournament.status] || [];

  const renderScoreMatrix = (roundGames: Game[]) => (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b-2 border-slate-600/50 text-left">
          <th className="py-2 px-2 font-semibold text-slate-400 w-14">#</th>
          <th className="py-2 px-2 font-semibold text-slate-400">Home Team</th>
          <th className="py-2 px-2 font-semibold text-slate-400 text-center" colSpan={2}>Set 1</th>
          <th className="py-2 px-2 font-semibold text-slate-400 text-center" colSpan={2}>Set 2</th>
          <th className="py-2 px-2 font-semibold text-slate-400 text-center" colSpan={2}>Set 3</th>
          <th className="py-2 px-2 font-semibold text-slate-400">Away Team</th>
          <th className="py-2 px-2 font-semibold text-slate-400 text-center w-20">Status</th>
        </tr>
        <tr className="border-b border-slate-700/30 text-[10px] text-gray-400">
          <th />
          <th />
          <th className="px-2 text-center">H</th>
          <th className="px-2 text-center">A</th>
          <th className="px-2 text-center">H</th>
          <th className="px-2 text-center">A</th>
          <th className="px-2 text-center">H</th>
          <th className="px-2 text-center">A</th>
          <th />
          <th />
        </tr>
      </thead>
      <tbody>
        {roundGames.map(game => {
          const scores = gameScores[game.id];
          if (!scores) return null;
          const isDirty = dirtyGames.has(game.id);
          const isBo3 = game.bestOf3;
          const isCompleted = game.status === 'completed';

          const homeWonSet1 = scores.set1Home > scores.set1Away;
          const homeWonSet2 = scores.set2Home > scores.set2Away;
          const set1Played = scores.set1Home > 0 || scores.set1Away > 0;
          const set2Played = scores.set2Home > 0 || scores.set2Away > 0;
          const setsTied = set1Played && set2Played &&
            ((homeWonSet1 && !homeWonSet2) || (!homeWonSet1 && homeWonSet2));

          const inputClass = (dirty: boolean) =>
            `w-12 px-1 py-1 border rounded text-center text-sm focus:ring-1 focus:ring-blue-400 focus:border-blue-400 ${
              dirty ? 'border-amber-400 bg-amber-900/30' : 'border-slate-600/50'
            }`;

          return (
            <tr key={game.id}
              className={`border-b border-slate-700/30 transition-colors ${
                isDirty ? 'bg-amber-900/30' : isCompleted && !isDirty ? 'bg-green-900/20' : 'hover:bg-slate-700/30'
              }`}>
              <td className="py-2 px-2">
                {game.matchNumber != null ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-700/30 text-slate-400">
                    M{game.matchNumber}
                  </span>
                ) : (
                  <span className="text-slate-500 text-xs">-</span>
                )}
              </td>

              <td className="py-2 px-2 font-medium text-white text-xs max-w-[180px] truncate">
                {game.player1 || <span className="text-slate-500 italic">TBD</span>}
              </td>

              {/* Set 1 */}
              <td className="py-2 px-1 text-center">
                <input type="number" min={0} value={scores.set1Home}
                  onChange={e => updateSetScore(game.id, 'set1Home', parseInt(e.target.value) || 0)}
                  className={inputClass(isDirty)} />
              </td>
              <td className="py-2 px-1 text-center">
                <input type="number" min={0} value={scores.set1Away}
                  onChange={e => updateSetScore(game.id, 'set1Away', parseInt(e.target.value) || 0)}
                  className={inputClass(isDirty)} />
              </td>

              {/* Set 2 */}
              <td className="py-2 px-1 text-center">
                {isBo3 ? (
                  <input type="number" min={0} value={scores.set2Home}
                    onChange={e => updateSetScore(game.id, 'set2Home', parseInt(e.target.value) || 0)}
                    className={inputClass(isDirty)} />
                ) : <span className="text-gray-300">-</span>}
              </td>
              <td className="py-2 px-1 text-center">
                {isBo3 ? (
                  <input type="number" min={0} value={scores.set2Away}
                    onChange={e => updateSetScore(game.id, 'set2Away', parseInt(e.target.value) || 0)}
                    className={inputClass(isDirty)} />
                ) : <span className="text-gray-300">-</span>}
              </td>

              {/* Set 3 */}
              <td className="py-2 px-1 text-center">
                {isBo3 && setsTied ? (
                  <input type="number" min={0} value={scores.set3Home}
                    onChange={e => updateSetScore(game.id, 'set3Home', parseInt(e.target.value) || 0)}
                    className={`${inputClass(isDirty)} ${!isDirty ? '!border-amber-200 !bg-amber-900/30/50' : ''}`} />
                ) : <span className="text-gray-300">-</span>}
              </td>
              <td className="py-2 px-1 text-center">
                {isBo3 && setsTied ? (
                  <input type="number" min={0} value={scores.set3Away}
                    onChange={e => updateSetScore(game.id, 'set3Away', parseInt(e.target.value) || 0)}
                    className={`${inputClass(isDirty)} ${!isDirty ? '!border-amber-200 !bg-amber-900/30/50' : ''}`} />
                ) : <span className="text-gray-300">-</span>}
              </td>

              <td className="py-2 px-2 font-medium text-white text-xs max-w-[180px] truncate">
                {game.player2 || <span className="text-slate-500 italic">TBD</span>}
              </td>

              <td className="py-2 px-2 text-center">
                {isDirty ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-900/40 text-amber-300">changed</span>
                ) : (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    isCompleted ? 'bg-green-100 text-green-300'
                    : game.status === 'in_progress' ? 'bg-blue-100 text-blue-800'
                    : 'bg-slate-700/30 text-slate-400'
                  }`}>
                    {game.status === 'scheduled' ? 'pending' : game.status}
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back */}
        <Link href={`/tournaments/${tournamentId}`} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeft size={20} /> Back to Tournament
        </Link>

        {/* Header */}
        <div className="bg-slate-800/50 border border-blue-400/20 rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Manage: {tournament.name}</h1>
              <p className="text-slate-400">Status: {statusLabels[tournament.status]}</p>
            </div>
            <div className="flex items-center gap-3">
              {tournament.proLeague && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1a2744] text-[#c4a35a]">
                  Professional League
                </span>
              )}
              <Link
                href={`/tournaments/${tournamentId}/simulate`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/80 text-white rounded-lg font-medium hover:bg-purple-700 transition text-sm"
              >
                🧪 Simulate
              </Link>
            </div>
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-400/30 rounded-lg flex items-center gap-3 text-green-300">
            <CheckCircle size={20} /> {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-400/30 rounded-lg flex items-center gap-3 text-red-300">
            <AlertCircle size={20} /> {error}
          </div>
        )}

        {/* Status */}
        <div className="bg-slate-800/50 border border-blue-400/20 rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Tournament Status</h2>
          {availableTransitions.length > 0 ? (
            <div className="flex gap-3">
              {availableTransitions.map(nextStatus => (
                <button key={nextStatus} onClick={() => handleStatusChange(nextStatus)} disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50">
                  {saving ? 'Updating...' : `Move to ${statusLabels[nextStatus]}`}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-slate-400">This tournament is completed. No further status changes available.</p>
          )}
        </div>

        {/* Category Selector */}
        {tournament.Category && tournament.Category.length > 0 && (
          <div className="bg-slate-800/50 border border-blue-400/20 rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-bold text-white mb-4">Categorias</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => setSelectedCategoryId(null)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                  selectedCategoryId === null ? 'bg-blue-600 text-white' : 'bg-slate-700/30 text-slate-400 hover:bg-slate-600/30'
                }`}>
                Todas
              </button>
              {tournament.Category.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                    selectedCategoryId === cat.id ? 'bg-blue-600 text-white' : 'bg-slate-700/30 text-slate-400 hover:bg-slate-600/30'
                  }`}>
                  {cat.name}
                  <span className="ml-1 text-xs opacity-70">({cat._count?.TournamentPlayer || 0}/{cat.maxTeams})</span>
                </button>
              ))}
            </div>
            {(tournament.status === 'registration' || tournament.status === 'draft') && (
              <div className="border-t border-slate-700/30 pt-4 mt-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Gerar Schedule por Categoria</h3>
                <div className="flex flex-wrap gap-2">
                  {tournament.Category.map(cat => (
                    <button key={cat.id} onClick={() => handleGenerateSchedule(cat.id)}
                      disabled={generating || generatingCategoryId === cat.id}
                      className="px-3 py-1.5 text-xs font-medium bg-green-900/30 text-green-300 border border-green-400/30 rounded-lg hover:bg-green-100 transition disabled:opacity-50">
                      {generatingCategoryId === cat.id ? 'Gerando...' : `Gerar ${cat.name}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generate Schedule */}
        {(tournament.status === 'registration' || tournament.status === 'draft') && (
          <div className="bg-slate-800/50 border border-blue-400/20 rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-bold text-white mb-4">Schedule</h2>
            <button onClick={() => handleGenerateSchedule()} disabled={generating}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50">
              {generating ? 'Generating...' : 'Generate Schedule (All Categories)'}
            </button>
            {games.length > 0 && (
              <Link href={`/tournaments/${tournamentId}/conflicts`}
                className="ml-4 inline-flex items-center gap-2 px-5 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition">
                <AlertCircle size={16} />
                Review Conflicts
              </Link>
            )}
          </div>
        )}

        {/* Score Matrix — Grouped by Round */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Score Matrix ({games.length} games)</h2>
            <div className="flex items-center gap-3">
              <button onClick={() => fetchGames()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 border border-slate-600/50 rounded-lg hover:bg-slate-700/30 transition">
                <RefreshCw size={14} /> Refresh
              </button>
              {dirtyGames.size > 0 && (
                <button onClick={handleBatchSave} disabled={batchSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                  <Save size={16} />
                  {batchSaving ? 'Saving...' : `Update All (${dirtyGames.size})`}
                </button>
              )}
            </div>
          </div>

          {games.length === 0 ? (
            <div className="bg-slate-800/50 border border-blue-400/20 rounded-lg shadow-sm p-6">
              <p className="text-slate-400">No games scheduled yet. Generate a schedule first.</p>
            </div>
          ) : (
            roundGroups.map(rg => {
              const key = `${rg.bracketSide || 'main'}::${rg.roundName}`;
              const isCollapsed = collapsedRounds.has(key);
              const allDone = rg.completedCount === rg.totalCount;
              const dirtyInRound = rg.games.filter(g => dirtyGames.has(g.id)).length;

              return (
                <div key={key} className="bg-slate-800/50 border border-blue-400/20 rounded-lg shadow-sm overflow-hidden">
                  {/* Round header — click to expand/collapse */}
                  <button
                    onClick={() => toggleRound(key)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-700/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      {isCollapsed
                        ? <ChevronRight size={18} className="text-gray-400" />
                        : <ChevronDown size={18} className="text-gray-400" />
                      }
                      <span className="font-semibold text-white">{rg.roundName}</span>
                      {rg.bracketSide && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${bracketSideColors[rg.bracketSide] || 'bg-slate-700/30 text-slate-400'}`}>
                          {bracketSideLabels[rg.bracketSide] || rg.bracketSide}
                        </span>
                      )}
                      {rg.games[0]?.bestOf3 && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#1a2744] text-[#c4a35a]">Bo3</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {dirtyInRound > 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-900/40 text-amber-300">
                          {dirtyInRound} changed
                        </span>
                      )}
                      <span className={`text-xs font-medium ${allDone ? 'text-green-600' : 'text-gray-500'}`}>
                        {rg.completedCount}/{rg.totalCount} done
                      </span>
                    </div>
                  </button>

                  {/* Round games */}
                  {!isCollapsed && (
                    <div className="px-3 pb-3 overflow-x-auto">
                      {renderScoreMatrix(rg.games)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sticky bottom save bar */}
        {dirtyGames.size > 0 && (
          <div className="sticky bottom-4 mt-4 p-4 bg-amber-900/30 border border-amber-400/30 rounded-lg flex items-center justify-between shadow-lg">
            <p className="text-amber-300 text-sm font-medium">
              {dirtyGames.size} game{dirtyGames.size !== 1 ? 's' : ''} modified
            </p>
            <button onClick={handleBatchSave} disabled={batchSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50">
              <Save size={16} />
              {batchSaving ? 'Saving...' : 'Update All'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
