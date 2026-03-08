'use client';

import { useState, useEffect, useCallback } from 'react';

// Types for referee game data
interface GameData {
  id: string;
  tournamentName: string;
  courtNumber: number;
  homeTeam: string;
  awayTeam: string;
  scoreHome: number;
  scoreAway: number;
  set2Home: number | null;
  set2Away: number | null;
  set3Home: number | null;
  set3Away: number | null;
  numSets: number;
  pointsPerSet: number;
  status: 'scheduled' | 'in_progress' | 'completed';
  matchNumber: number | null;
}

// Mock data for development — TODO: replace with API calls
const MOCK_GAME: GameData = {
  id: 'mock-game-1',
  tournamentName: 'NFA Austin 2026',
  courtNumber: 1,
  homeTeam: 'Player A & Player B',
  awayTeam: 'Player C & Player D',
  scoreHome: 0,
  scoreAway: 0,
  set2Home: null,
  set2Away: null,
  set3Home: null,
  set3Away: null,
  numSets: 1,
  pointsPerSet: 18,
  status: 'in_progress',
  matchNumber: 1,
};

export default function RefereePage({ params }: { params: { token: string } }) {
  const { token } = params;
  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSet, setCurrentSet] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const fetchGame = useCallback(async () => {
    try {
      const res = await fetch(`/api/referee/${token}`);
      if (res.ok) {
        const data = await res.json();
        setGame(data);
        setError(null);
      } else if (res.status === 404) {
        // No current game for this court
        setGame(null);
        setError(null);
      } else {
        throw new Error('Failed to load game');
      }
    } catch {
      // TODO: API not yet implemented — use mock data
      setGame({ ...MOCK_GAME });
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchGame();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchGame, 30000);
    return () => clearInterval(interval);
  }, [fetchGame]);

  const updateScore = async (side: 'home' | 'away', delta: number) => {
    if (!game || game.status === 'completed') return;

    const scoreKey = currentSet === 1 ? 'score' : currentSet === 2 ? 'set2' : 'set3';
    const homeKey = scoreKey === 'score' ? 'scoreHome' : `${scoreKey}Home` as keyof GameData;
    const awayKey = scoreKey === 'score' ? 'scoreAway' : `${scoreKey}Away` as keyof GameData;

    const currentHome = (game[homeKey] as number | null) ?? 0;
    const currentAway = (game[awayKey] as number | null) ?? 0;

    const newHome = side === 'home' ? Math.max(0, currentHome + delta) : currentHome;
    const newAway = side === 'away' ? Math.max(0, currentAway + delta) : currentAway;

    // Optimistic update
    setGame({
      ...game,
      [homeKey]: newHome,
      [awayKey]: newAway,
    });

    // TODO: PUT to API
    try {
      setSaving(true);
      await fetch(`/api/referee/${token}/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          set: currentSet,
          scoreHome: currentSet === 1 ? newHome : game.scoreHome,
          scoreAway: currentSet === 1 ? newAway : game.scoreAway,
          set2Home: currentSet === 2 ? newHome : game.set2Home,
          set2Away: currentSet === 2 ? newAway : game.set2Away,
          set3Home: currentSet === 3 ? newHome : game.set3Home,
          set3Away: currentSet === 3 ? newAway : game.set3Away,
        }),
      }).catch(() => {
        // API not implemented yet — score already updated optimistically
      });
    } finally {
      setSaving(false);
    }
  };

  const endGame = async () => {
    if (!game) return;
    // Determine winner based on total sets won
    let homeSets = 0;
    let awaySets = 0;
    if ((game.scoreHome ?? 0) > (game.scoreAway ?? 0)) homeSets++;
    else if ((game.scoreAway ?? 0) > (game.scoreHome ?? 0)) awaySets++;
    if (game.numSets >= 2) {
      if ((game.set2Home ?? 0) > (game.set2Away ?? 0)) homeSets++;
      else if ((game.set2Away ?? 0) > (game.set2Home ?? 0)) awaySets++;
    }
    if (game.numSets >= 3) {
      if ((game.set3Home ?? 0) > (game.set3Away ?? 0)) homeSets++;
      else if ((game.set3Away ?? 0) > (game.set3Home ?? 0)) awaySets++;
    }

    const winningSide = homeSets >= awaySets ? 'home' : 'away';

    // TODO: PUT to API to end game
    try {
      await fetch(`/api/referee/${token}/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          status: 'completed',
          winningSide,
        }),
      }).catch(() => {});
    } catch {
      // API not ready
    }

    setGame({ ...game, status: 'completed' });
    setShowEndConfirm(false);
  };

  const nextGame = () => {
    setLoading(true);
    setCurrentSet(1);
    setShowEndConfirm(false);
    fetchGame();
  };

  const getSetScore = (set: number): { home: number; away: number } => {
    if (set === 1) return { home: game?.scoreHome ?? 0, away: game?.scoreAway ?? 0 };
    if (set === 2) return { home: game?.set2Home ?? 0, away: game?.set2Away ?? 0 };
    return { home: game?.set3Home ?? 0, away: game?.set3Away ?? 0 };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Game Scheduled</h1>
          <p className="text-gray-500 mb-6">There is no active game for this court right now.</p>
          <button
            onClick={nextGame}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl text-lg font-semibold active:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const currentSetScore = getSetScore(currentSet);
  const isCompleted = game.status === 'completed';

  return (
    <div className="min-h-screen bg-white select-none">
      {/* Header */}
      <div className="bg-gray-900 text-white px-4 py-3 text-center">
        <h1 className="text-sm font-medium text-gray-300">{game.tournamentName}</h1>
        <p className="text-lg font-bold">Court {game.courtNumber}</p>
        {game.matchNumber && (
          <p className="text-xs text-gray-400">Game #{game.matchNumber}</p>
        )}
      </div>

      {/* Teams */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between text-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Home</p>
            <p className="text-sm font-bold text-gray-900 truncate">{game.homeTeam}</p>
          </div>
          <span className="text-gray-300 text-xl font-light">vs</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Away</p>
            <p className="text-sm font-bold text-gray-900 truncate">{game.awayTeam}</p>
          </div>
        </div>
      </div>

      {/* Set tabs if multi-set */}
      {game.numSets > 1 && (
        <div className="flex justify-center gap-2 px-4 py-2">
          {Array.from({ length: game.numSets }, (_, i) => i + 1).map((set) => {
            const s = getSetScore(set);
            return (
              <button
                key={set}
                onClick={() => setCurrentSet(set)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                  currentSet === set
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Set {set}
                {(s.home > 0 || s.away > 0) && (
                  <span className="ml-1 text-xs opacity-75">({s.home}-{s.away})</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Score Display */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-center gap-4">
          {/* Home Score Controls */}
          <div className="flex flex-col items-center gap-3 flex-1">
            <button
              onClick={() => updateScore('home', 1)}
              disabled={isCompleted}
              className="w-20 h-20 rounded-2xl bg-green-500 text-white text-4xl font-bold flex items-center justify-center active:bg-green-600 disabled:opacity-40 shadow-lg"
            >
              +
            </button>
            <span className="text-[64px] leading-none font-black text-gray-900 tabular-nums">
              {currentSetScore.home}
            </span>
            <button
              onClick={() => updateScore('home', -1)}
              disabled={isCompleted || currentSetScore.home === 0}
              className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 text-3xl font-bold flex items-center justify-center active:bg-red-200 disabled:opacity-30 shadow"
            >
              −
            </button>
          </div>

          {/* Divider */}
          <div className="text-4xl font-light text-gray-300 pb-4">—</div>

          {/* Away Score Controls */}
          <div className="flex flex-col items-center gap-3 flex-1">
            <button
              onClick={() => updateScore('away', 1)}
              disabled={isCompleted}
              className="w-20 h-20 rounded-2xl bg-green-500 text-white text-4xl font-bold flex items-center justify-center active:bg-green-600 disabled:opacity-40 shadow-lg"
            >
              +
            </button>
            <span className="text-[64px] leading-none font-black text-gray-900 tabular-nums">
              {currentSetScore.away}
            </span>
            <button
              onClick={() => updateScore('away', -1)}
              disabled={isCompleted || currentSetScore.away === 0}
              className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 text-3xl font-bold flex items-center justify-center active:bg-red-200 disabled:opacity-30 shadow"
            >
              −
            </button>
          </div>
        </div>
      </div>

      {/* Set summary for multi-set games */}
      {game.numSets > 1 && (
        <div className="px-4 pb-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="grid grid-cols-4 gap-1 text-center text-xs font-semibold text-gray-400">
              <div></div>
              {Array.from({ length: game.numSets }, (_, i) => (
                <div key={i}>S{i + 1}</div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-1 text-center text-sm mt-1">
              <div className="text-left text-gray-600 font-medium truncate">Home</div>
              {Array.from({ length: game.numSets }, (_, i) => {
                const s = getSetScore(i + 1);
                return <div key={i} className="font-bold text-gray-900">{s.home}</div>;
              })}
            </div>
            <div className="grid grid-cols-4 gap-1 text-center text-sm mt-0.5">
              <div className="text-left text-gray-600 font-medium truncate">Away</div>
              {Array.from({ length: game.numSets }, (_, i) => {
                const s = getSetScore(i + 1);
                return <div key={i} className="font-bold text-gray-900">{s.away}</div>;
              })}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-4 pb-8 space-y-3">
        {!isCompleted ? (
          <>
            {!showEndConfirm ? (
              <button
                onClick={() => setShowEndConfirm(true)}
                className="w-full py-4 rounded-2xl bg-gray-900 text-white text-lg font-bold active:bg-gray-800 shadow-lg"
              >
                End Game
              </button>
            ) : (
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-4">
                <p className="text-center text-gray-900 font-semibold mb-3">
                  End game with score {game.scoreHome} — {game.scoreAway}?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEndConfirm(false)}
                    className="flex-1 py-3 rounded-xl bg-gray-200 text-gray-700 font-bold active:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={endGame}
                    className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold active:bg-red-700"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <p className="text-green-800 font-bold text-lg">Game Complete ✓</p>
              <p className="text-green-600 text-sm mt-1">
                Final: {game.scoreHome} — {game.scoreAway}
              </p>
            </div>
            <button
              onClick={nextGame}
              className="w-full py-4 rounded-2xl bg-blue-600 text-white text-lg font-bold active:bg-blue-700 shadow-lg"
            >
              Next Game →
            </button>
          </div>
        )}
      </div>

      {/* Saving indicator */}
      {saving && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm shadow-lg">
          Saving...
        </div>
      )}
    </div>
  );
}
