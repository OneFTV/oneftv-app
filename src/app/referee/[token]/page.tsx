'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'

interface Player {
  id: string
  name: string
}

interface Game {
  id: string
  status: string
  courtNumber: number
  matchNumber: number | null
  scoreHome: number | null
  scoreAway: number | null
  set2Home: number | null
  set2Away: number | null
  set3Home: number | null
  set3Away: number | null
  winningSide: string | null
  User_Game_player1HomeIdToUser: Player | null
  User_Game_player2HomeIdToUser: Player | null
  User_Game_player1AwayIdToUser: Player | null
  User_Game_player2AwayIdToUser: Player | null
  Round: { name: string; roundNumber: number } | null
  Category: { id: string; name: string } | null
}

interface UpcomingGame {
  id: string
  status: string
  matchNumber: number | null
  User_Game_player1HomeIdToUser: Player | null
  User_Game_player2HomeIdToUser: Player | null
  User_Game_player1AwayIdToUser: Player | null
  User_Game_player2AwayIdToUser: Player | null
  Category: { name: string } | null
}

interface RefereeData {
  tournament: { id: string; name: string; location: string; status: string }
  courtNumber: number
  currentGame: Game | null
  upcomingGames: UpcomingGame[]
}

function teamName(p1: Player | null, p2: Player | null): string {
  const names = [p1?.name, p2?.name].filter(Boolean)
  return names.length > 0 ? names.join(' & ') : 'TBD'
}

export default function RefereePage() {
  const params = useParams()
  const token = params.token as string

  const [data, setData] = useState<RefereeData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  // Score state for current game
  const [scores, setScores] = useState({
    set1Home: 0, set1Away: 0,
    set2Home: 0, set2Away: 0,
    set3Home: 0, set3Away: 0,
  })

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/referee/${token}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Failed to load')
        return
      }
      setData(json.data)
      const g = json.data.currentGame as Game | null
      if (g) {
        setScores({
          set1Home: g.scoreHome ?? 0,
          set1Away: g.scoreAway ?? 0,
          set2Home: g.set2Home ?? 0,
          set2Away: g.set2Away ?? 0,
          set3Home: g.set3Home ?? 0,
          set3Away: g.set3Away ?? 0,
        })
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const updateScore = (field: keyof typeof scores, delta: number) => {
    setScores(prev => ({
      ...prev,
      [field]: Math.max(0, prev[field] + delta),
    }))
  }

  const handleSubmit = async (status: string) => {
    if (!data?.currentGame) return
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch(`/api/referee/${token}/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: data.currentGame.id,
          scoreHome: scores.set1Home,
          scoreAway: scores.set1Away,
          set2Home: scores.set2Home,
          set2Away: scores.set2Away,
          set3Home: scores.set3Home,
          set3Away: scores.set3Away,
          status,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setSaveMsg(json.error || 'Failed to save')
      } else {
        setSaveMsg(status === 'completed' ? '✅ Game completed!' : '✅ Score saved!')
        await fetchData()
      }
    } catch {
      setSaveMsg('Network error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-cyan-400 text-xl animate-pulse">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-red-400 text-xl text-center">{error}</div>
      </div>
    )
  }

  if (!data) return null

  const game = data.currentGame
  const homeName = game ? teamName(game.User_Game_player1HomeIdToUser, game.User_Game_player2HomeIdToUser) : ''
  const awayName = game ? teamName(game.User_Game_player1AwayIdToUser, game.User_Game_player2AwayIdToUser) : ''

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-cyan-400">{data.tournament.name}</h1>
        <p className="text-slate-400 text-lg">Court {data.courtNumber}</p>
      </div>

      {/* Current Game */}
      {game ? (
        <div className="bg-slate-800 rounded-xl p-4 mb-6">
          <div className="text-center mb-1">
            <span className="text-xs text-slate-400">{game.Round?.name} {game.Category ? `• ${game.Category.name}` : ''}</span>
          </div>

          {/* Teams */}
          <div className="grid grid-cols-3 gap-2 items-center mb-4">
            <div className="text-center">
              <p className="text-sm font-medium text-cyan-300">{homeName}</p>
            </div>
            <div className="text-center text-2xl font-bold text-cyan-400">VS</div>
            <div className="text-center">
              <p className="text-sm font-medium text-orange-300">{awayName}</p>
            </div>
          </div>

          {/* Score input — single set */}
          <div className="mb-3">
            <div className="grid grid-cols-2 gap-4">
              {/* Team 1 */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => updateScore('set1Home', -1)}
                  className="w-11 h-11 rounded-lg bg-slate-700 text-xl font-bold active:bg-slate-600 select-none"
                >−</button>
                <span className="w-10 text-center text-2xl font-mono font-bold">{scores.set1Home}</span>
                <button
                  onClick={() => updateScore('set1Home', 1)}
                  className="w-11 h-11 rounded-lg bg-cyan-700 text-xl font-bold active:bg-cyan-600 select-none"
                >+</button>
              </div>
              {/* Team 2 */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => updateScore('set1Away', -1)}
                  className="w-11 h-11 rounded-lg bg-slate-700 text-xl font-bold active:bg-slate-600 select-none"
                >−</button>
                <span className="w-10 text-center text-2xl font-mono font-bold">{scores.set1Away}</span>
                <button
                  onClick={() => updateScore('set1Away', 1)}
                  className="w-11 h-11 rounded-lg bg-orange-700 text-xl font-bold active:bg-orange-600 select-none"
                >+</button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => handleSubmit('in_progress')}
              disabled={saving}
              className="flex-1 h-12 rounded-lg bg-slate-600 font-semibold text-sm active:bg-slate-500 disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => handleSubmit('completed')}
              disabled={saving}
              className="flex-1 h-12 rounded-lg bg-cyan-600 font-bold text-sm active:bg-cyan-500 disabled:opacity-50"
            >
              Complete Game
            </button>
          </div>

          {saveMsg && (
            <p className={`text-center mt-2 text-sm ${saveMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
              {saveMsg}
            </p>
          )}
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl p-8 mb-6 text-center">
          <p className="text-slate-400 text-lg">No active game on this court</p>
        </div>
      )}

      {/* Upcoming Games */}
      {data.upcomingGames.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-cyan-400 mb-3">Up Next</h2>
          {data.upcomingGames.map(g => (
            <div key={g.id} className="bg-slate-800 rounded-lg p-3 mb-2 flex justify-between items-center">
              <div className="text-sm">
                <span>{teamName(g.User_Game_player1HomeIdToUser, g.User_Game_player2HomeIdToUser)}</span>
                <span className="text-slate-500 mx-2">vs</span>
                <span>{teamName(g.User_Game_player1AwayIdToUser, g.User_Game_player2AwayIdToUser)}</span>
              </div>
              {g.Category && <span className="text-xs text-slate-500">{g.Category.name}</span>}
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-slate-600 mt-6">Auto-refreshes every 30s</p>
    </div>
  )
}
