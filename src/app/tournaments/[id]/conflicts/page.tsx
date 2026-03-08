'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle, CheckCircle, Lock, Unlock, ArrowLeft, Loader,
  RefreshCw, Zap, Globe,
} from 'lucide-react';

interface GameInfo {
  id: string;
  category: string;
  roundName: string;
  court: number;
  scheduledTime: string;
}

interface Suggestion {
  gameId: string;
  newTime?: string;
  newCourt?: number;
}

interface Conflict {
  id: string;
  playerName: string;
  game1: GameInfo;
  game2: GameInfo;
  suggestion?: Suggestion;
}

const cardClass = 'bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-xl p-6';

export default function ConflictsPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lockedGames, setLockedGames] = useState<Set<string>>(new Set());
  const [resolved, setResolved] = useState(false);

  const fetchConflicts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/schedule/conflicts`);
      if (!res.ok) throw new Error('Failed to fetch conflicts');
      const data = await res.json();
      const list: Conflict[] = data.conflicts || data.data || data || [];
      setConflicts(Array.isArray(list) ? list : []);
      setResolved(Array.isArray(list) && list.length === 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => { fetchConflicts(); }, [fetchConflicts]);

  const handleOptimize = async () => {
    setOptimizing(true);
    setError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/schedule/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lockedGameIds: Array.from(lockedGames),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Optimization failed');
      }
      await fetchConflicts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization failed');
    } finally {
      setOptimizing(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'registration' }),
      });
      if (!res.ok) throw new Error('Failed to publish');
      router.push(`/tournaments/${tournamentId}/manage`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  const toggleLock = (gameId: string) => {
    setLockedGames(prev => {
      const next = new Set(prev);
      if (next.has(gameId)) next.delete(gameId);
      else next.add(gameId);
      return next;
    });
  };

  const formatTime = (t: string) => {
    try {
      return new Date(t).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch { return t; }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <Loader className="h-10 w-10 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href={`/tournaments/${tournamentId}/manage`}
            className="p-2 text-slate-400 hover:text-white transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Review Conflicts</h1>
            <p className="text-sm text-slate-400">Resolve scheduling conflicts before publishing</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-300">
            <AlertTriangle size={20} />
            {error}
          </div>
        )}

        {/* Status Banner */}
        {resolved ? (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3 text-green-300">
            <CheckCircle size={20} />
            <span className="font-medium">All conflicts resolved! You can publish the tournament.</span>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-300">
            <AlertTriangle size={20} />
            <span className="font-medium">{conflicts.length} unresolved conflict{conflicts.length !== 1 ? 's' : ''}.</span>
            <span className="text-sm text-red-300/70 ml-1">Use &quot;Approve All&quot; to auto-resolve or lock specific games first.</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button onClick={handleOptimize} disabled={optimizing || resolved}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed">
            <Zap size={16} />
            {optimizing ? 'Optimizing...' : 'Approve All'}
          </button>
          <button onClick={fetchConflicts} disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-800 transition">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button onClick={handlePublish} disabled={publishing || !resolved}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed ml-auto">
            <Globe size={16} />
            {publishing ? 'Publishing...' : 'Publish Tournament'}
          </button>
        </div>

        {/* Locked games info */}
        {lockedGames.size > 0 && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-400/30 rounded-lg text-sm text-amber-300">
            <Lock size={14} className="inline mr-1.5" />
            {lockedGames.size} game{lockedGames.size !== 1 ? 's' : ''} locked — optimizer will work around these.
          </div>
        )}

        {/* Conflicts List */}
        {conflicts.length === 0 && !resolved && (
          <div className={cardClass}>
            <p className="text-slate-400 text-center">No conflicts found.</p>
          </div>
        )}

        <div className="space-y-4">
          {conflicts.map((conflict) => (
            <div key={conflict.id} className={cardClass}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white font-semibold">{conflict.playerName}</h3>
                  <p className="text-xs text-slate-400">Scheduling overlap detected</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Game 1 */}
                <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-cyan-400 uppercase">Game 1</span>
                    <button onClick={() => toggleLock(conflict.game1.id)}
                      className={`p-1.5 rounded transition ${lockedGames.has(conflict.game1.id) ? 'text-amber-400 bg-amber-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                      title={lockedGames.has(conflict.game1.id) ? 'Unlock game' : 'Lock game (prevent moving)'}>
                      {lockedGames.has(conflict.game1.id) ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>
                  </div>
                  <p className="text-sm text-white">{conflict.game1.category}</p>
                  <p className="text-xs text-slate-400">{conflict.game1.roundName} · Court {conflict.game1.court}</p>
                  <p className="text-xs text-slate-400">{formatTime(conflict.game1.scheduledTime)}</p>
                </div>

                {/* Game 2 */}
                <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-cyan-400 uppercase">Game 2</span>
                    <button onClick={() => toggleLock(conflict.game2.id)}
                      className={`p-1.5 rounded transition ${lockedGames.has(conflict.game2.id) ? 'text-amber-400 bg-amber-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                      title={lockedGames.has(conflict.game2.id) ? 'Unlock game' : 'Lock game (prevent moving)'}>
                      {lockedGames.has(conflict.game2.id) ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>
                  </div>
                  <p className="text-sm text-white">{conflict.game2.category}</p>
                  <p className="text-xs text-slate-400">{conflict.game2.roundName} · Court {conflict.game2.court}</p>
                  <p className="text-xs text-slate-400">{formatTime(conflict.game2.scheduledTime)}</p>
                </div>
              </div>

              {/* Suggestion */}
              {conflict.suggestion && (
                <div className="bg-cyan-500/10 border border-cyan-400/20 rounded-lg p-3">
                  <p className="text-xs text-cyan-300">
                    💡 Suggested: Move game <strong>{conflict.suggestion.gameId.slice(0, 8)}</strong>
                    {conflict.suggestion.newTime && <> to <strong>{formatTime(conflict.suggestion.newTime)}</strong></>}
                    {conflict.suggestion.newCourt != null && <> on Court <strong>{conflict.suggestion.newCourt}</strong></>}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Manual resolution hints */}
        {conflicts.length > 0 && (
          <div className="mt-8 p-4 bg-slate-800/40 border border-slate-600/30 rounded-xl">
            <h4 className="text-sm font-semibold text-slate-300 mb-2">💡 Manual Resolution Tips</h4>
            <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
              <li>Lock games you don&apos;t want moved, then click &quot;Approve All&quot;</li>
              <li>Add more courts or extend the schedule window to free up slots</li>
              <li>Consider splitting categories across different days</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
