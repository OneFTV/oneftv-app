'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader, AlertCircle, CheckCircle, Users, Play, FastForward, RotateCcw, Zap } from 'lucide-react';

interface Conflict {
  playerId: string;
  playerName: string;
  game1: { categoryName: string; courtNumber: number; time: string; roundNumber: number | null };
  game2: { categoryName: string; courtNumber: number; time: string; roundNumber: number | null };
}

interface RoundStatus {
  id: string;
  name: string;
  roundNumber: number;
  total: number;
  completed: number;
  pending: number;
}

interface Tournament {
  id: string;
  name: string;
  organizerId: string;
  status: string;
}

export default function SimulatePage() {
  const params = useParams();
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState('');

  // Simulation state
  const [generating, setGenerating] = useState(false);
  const [playersCreated, setPlayersCreated] = useState<number | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [advancing, setAdvancing] = useState(false);
  const [advancingAll, setAdvancingAll] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [rounds, setRounds] = useState<RoundStatus[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        const [userRes, tournamentRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch(`/api/tournaments/${tournamentId}`),
        ]);

        if (!userRes.ok || !tournamentRes.ok) {
          setError('Failed to load data');
          return;
        }

        const user = await userRes.json();
        const tData = await tournamentRes.json();
        const t = tData.data || tData;
        setTournament(t);

        if (user.id === t.organizerId) {
          setAuthorized(true);
        } else {
          setError('Only the tournament organizer can access this page.');
        }
      } catch {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [tournamentId]);

  const fetchRounds = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/simulate/advance-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: true }),
      });
      // We just use the rounds info from any advance call
    } catch { /* ignore */ }
  }, [tournamentId]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setSuccess('');
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/simulate/generate-players`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPlayersCreated(data.playersCreated);
      setConflicts(data.conflicts || []);
      setSuccess(`✅ ${data.playersCreated} players registered!`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate players');
    } finally {
      setGenerating(false);
    }
  };

  const handleAdvance = async (advanceAll = false) => {
    if (advanceAll) setAdvancingAll(true);
    else setAdvancing(true);
    setError(null);
    setSuccess('');
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/simulate/advance-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advanceAll }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRounds(data.rounds || []);
      setSuccess(`✅ ${data.gamesCompleted} games completed! ${data.remainingRounds} rounds remaining.`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to advance round');
    } finally {
      setAdvancing(false);
      setAdvancingAll(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all simulation data? This will remove all players and reset all games.')) return;
    setResetting(true);
    setError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/simulate/reset`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPlayersCreated(null);
      setConflicts([]);
      setRounds([]);
      setSuccess('🔄 Simulation reset complete.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset');
    } finally {
      setResetting(false);
    }
  };

  const handleAutoResolve = async () => {
    setResolving(true);
    setError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/schedule/optimize`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Re-detect conflicts
      const conflictRes = await fetch(`/api/tournaments/${tournamentId}/schedule/conflicts`);
      const conflictData = await conflictRes.json();
      setConflicts(conflictData.conflicts || []);
      setSuccess(`✅ Optimization complete. ${conflictData.count || 0} conflicts remaining.`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve conflicts');
    } finally {
      setResolving(false);
    }
  };

  // Compute progress
  const totalGames = rounds.reduce((s, r) => s + r.total, 0);
  const completedGames = rounds.reduce((s, r) => s + r.completed, 0);
  const progressPct = totalGames > 0 ? Math.round((completedGames / totalGames) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <Loader className="h-12 w-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!authorized || !tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="p-6 bg-red-900/30 border border-red-400/30 rounded-lg flex items-center gap-3 text-red-300">
            <AlertCircle size={20} /> {error || 'Unauthorized'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Back */}
        <Link href={`/tournaments/${tournamentId}/manage`} className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6">
          <ArrowLeft size={20} /> Back to Manage
        </Link>

        {/* Header */}
        <div className="bg-slate-800/50 border border-blue-400/20 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧪</span>
            <div>
              <h1 className="text-2xl font-bold text-white">Simulation Sandbox</h1>
              <p className="text-slate-400">{tournament.name}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-4 p-4 bg-green-900/30 border border-green-400/30 rounded-lg flex items-center gap-3 text-green-300">
            <CheckCircle size={20} /> {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-400/30 rounded-lg flex items-center gap-3 text-red-300">
            <AlertCircle size={20} /> {error}
          </div>
        )}

        {/* Progress Bar */}
        {rounds.length > 0 && (
          <div className="bg-slate-800/50 border border-blue-400/20 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-300">Tournament Progress</span>
              <span className="text-sm font-bold text-white">{progressPct}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">{completedGames}/{totalGames} games completed</p>
          </div>
        )}

        {/* Step 1: Generate Players */}
        <div className="bg-slate-800/50 border border-blue-400/20 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users size={20} className="text-blue-400" />
            Step 1: Generate Simulated Players
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            Creates realistic player registrations with multi-category assignments following NFA tournament patterns.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {generating ? <Loader size={16} className="animate-spin" /> : <Users size={16} />}
              {generating ? 'Generating...' : 'Generate Simulated Players'}
            </button>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="px-5 py-2.5 bg-red-600/80 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              <RotateCcw size={16} />
              {resetting ? 'Resetting...' : 'Reset Simulation'}
            </button>
          </div>
          {playersCreated !== null && (
            <p className="mt-3 text-sm text-green-300">
              {playersCreated} player registrations created.
            </p>
          )}
        </div>

        {/* Step 2: Conflict Review */}
        <div className="bg-slate-800/50 border border-blue-400/20 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <AlertCircle size={20} className="text-amber-400" />
            Step 2: Conflict Review
          </h2>
          {conflicts.length === 0 ? (
            <p className="text-green-300 text-sm">✅ No scheduling conflicts detected.</p>
          ) : (
            <>
              <p className="text-amber-300 text-sm mb-3">{conflicts.length} conflict(s) detected:</p>
              <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                {conflicts.map((c, i) => (
                  <div key={i} className="bg-slate-700/30 rounded-lg p-3 text-sm">
                    <span className="font-medium text-white">{c.playerName}</span>
                    <span className="text-slate-400"> — </span>
                    <span className="text-amber-300">{c.game1.categoryName} (R{c.game1.roundNumber})</span>
                    <span className="text-slate-400"> vs </span>
                    <span className="text-amber-300">{c.game2.categoryName} (R{c.game2.roundNumber})</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAutoResolve}
                  disabled={resolving}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  <Zap size={16} />
                  {resolving ? 'Resolving...' : 'Auto-Resolve All'}
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 transition disabled:opacity-50"
                >
                  Regenerate Players
                </button>
              </div>
            </>
          )}
        </div>

        {/* Step 3: Game Progression */}
        <div className="bg-slate-800/50 border border-blue-400/20 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Play size={20} className="text-green-400" />
            Step 3: Simulate Game Progression
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            Advance through rounds with randomized realistic scores. Winners are automatically promoted in the bracket.
          </p>
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => handleAdvance(false)}
              disabled={advancing || advancingAll}
              className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Play size={16} />
              {advancing ? 'Advancing...' : 'Advance Phase'}
            </button>
            <button
              onClick={() => handleAdvance(true)}
              disabled={advancing || advancingAll}
              className="px-5 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              <FastForward size={16} />
              {advancingAll ? 'Advancing...' : 'Advance All to Finals'}
            </button>
          </div>

          {/* Round status cards */}
          {rounds.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {rounds.map(r => {
                const pct = r.total > 0 ? Math.round((r.completed / r.total) * 100) : 0;
                const isDone = r.completed === r.total;
                return (
                  <div
                    key={r.id}
                    className={`rounded-lg p-4 border ${
                      isDone
                        ? 'bg-green-900/20 border-green-400/30'
                        : 'bg-slate-700/20 border-slate-600/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white text-sm">{r.name}</span>
                      {isDone && <CheckCircle size={16} className="text-green-400" />}
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 mb-1">
                      <div
                        className={`h-2 rounded-full transition-all ${isDone ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400">{r.completed}/{r.total} complete</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
