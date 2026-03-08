'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, AlertTriangle, CheckCircle, Sparkles, Loader } from 'lucide-react';

interface CategoryAssignment {
  id: string;
  name: string;
  scheduledDay: number;
  dayStartTime: string;
  dayEndTime: string;
  maxTeams: number;
  format: string;
  gender: string | null;
  skillLevel: string | null;
  gameCount: number;
  playerCount: number;
}

interface Conflict {
  playerId: string;
  playerName: string;
  categories: { id: string; name: string; day: number }[];
  severity: 'yellow' | 'red';
}

interface DayData {
  startTime: string;
  endTime: string;
  categories: CategoryAssignment[];
}

interface Props {
  tournamentId: string;
}

export default function DayAssignment({ tournamentId }: Props) {
  const [categories, setCategories] = useState<CategoryAssignment[]>([]);
  const [suggestion, setSuggestion] = useState<Record<string, string[]>>({});
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [numDays, setNumDays] = useState(1);
  const [tournamentDate, setTournamentDate] = useState<string>('');
  const [defaultStartTime, setDefaultStartTime] = useState('09:00');
  const [defaultEndTime, setDefaultEndTime] = useState('18:00');
  const [dayTimes, setDayTimes] = useState<Record<number, { start: string; end: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tournaments/${tournamentId}/schedule/day-assignment`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setCategories(data.categories);
      setSuggestion(data.suggestion);
      setConflicts(data.conflicts);
      setNumDays(data.numDays);
      setTournamentDate(data.tournamentDate);
      setDefaultStartTime(data.defaultStartTime);
      setDefaultEndTime(data.defaultEndTime);

      // Init day times from categories or defaults
      const times: Record<number, { start: string; end: string }> = {};
      for (let d = 1; d <= data.numDays; d++) {
        const dayCats = data.categories.filter((c: CategoryAssignment) => c.scheduledDay === d);
        times[d] = {
          start: dayCats[0]?.dayStartTime || data.defaultStartTime,
          end: dayCats[0]?.dayEndTime || data.defaultEndTime,
        };
      }
      setDayTimes(times);
    } catch {
      setError('Failed to load day assignments');
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getDayLabel = (dayNum: number): string => {
    if (!tournamentDate) return `Day ${dayNum}`;
    const d = new Date(tournamentDate);
    d.setDate(d.getDate() + dayNum - 1);
    return `Day ${dayNum}: ${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
  };

  const assignToDay = (categoryId: string, day: number) => {
    setCategories(prev => prev.map(c =>
      c.id === categoryId ? { ...c, scheduledDay: day } : c
    ));
  };

  const applySuggestion = () => {
    setCategories(prev => {
      const updated = [...prev];
      for (const [dayKey, catIds] of Object.entries(suggestion)) {
        const dayNum = parseInt(dayKey.replace('day', ''));
        for (const catId of catIds) {
          const idx = updated.findIndex(c => c.id === catId);
          if (idx >= 0) updated[idx] = { ...updated[idx], scheduledDay: dayNum };
        }
      }
      return updated;
    });
    setSuccess('Suggestion applied! Review and save.');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      const assignments = categories.map(c => ({
        categoryId: c.id,
        day: c.scheduledDay,
        startTime: dayTimes[c.scheduledDay]?.start || defaultStartTime,
        endTime: dayTimes[c.scheduledDay]?.end || defaultEndTime,
      }));

      const res = await fetch(`/api/tournaments/${tournamentId}/schedule/day-assignment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setConflicts(data.conflicts);
      setSuccess('Day assignments saved!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const checkConflicts = async () => {
    setChecking(true);
    await handleSave();
    setChecking(false);
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 border border-blue-400/20 rounded-lg p-6">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader className="animate-spin" size={18} /> Loading day assignments...
        </div>
      </div>
    );
  }

  if (numDays <= 1) {
    return (
      <div className="bg-slate-800/50 border border-blue-400/20 rounded-lg p-6">
        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Calendar size={20} /> Multi-Day Scheduling
        </h2>
        <p className="text-slate-400">This tournament is a single-day event. Multi-day scheduling is not needed.</p>
      </div>
    );
  }

  // Group categories by day for display
  const dayGroups: Record<number, DayData> = {};
  for (let d = 1; d <= numDays; d++) {
    dayGroups[d] = {
      startTime: dayTimes[d]?.start || defaultStartTime,
      endTime: dayTimes[d]?.end || defaultEndTime,
      categories: categories.filter(c => c.scheduledDay === d),
    };
  }

  const conflictCount = conflicts.length;
  const redConflicts = conflicts.filter(c => c.severity === 'red').length;

  return (
    <div className="bg-slate-800/50 border border-blue-400/20 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Calendar size={20} /> Multi-Day Category Assignment
        </h2>
        <div className="flex items-center gap-3">
          {Object.keys(suggestion).length > 0 && (
            <button onClick={applySuggestion}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-purple-900/40 text-purple-300 border border-purple-400/30 rounded-lg hover:bg-purple-900/60 transition">
              <Sparkles size={14} /> Apply Suggestion
            </button>
          )}
          <button onClick={checkConflicts} disabled={checking}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-amber-900/40 text-amber-300 border border-amber-400/30 rounded-lg hover:bg-amber-900/60 transition disabled:opacity-50">
            <AlertTriangle size={14} /> {checking ? 'Checking...' : 'Check Conflicts'}
          </button>
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Assignments'}
          </button>
        </div>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-900/30 border border-green-400/30 rounded-lg flex items-center gap-2 text-green-300 text-sm">
          <CheckCircle size={16} /> {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-400/30 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Day columns */}
      <div className={`grid gap-4 mb-6 ${numDays === 2 ? 'grid-cols-2' : numDays === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {Array.from({ length: numDays }, (_, i) => i + 1).map(dayNum => {
          const day = dayGroups[dayNum];
          return (
            <div key={dayNum} className="bg-slate-900/50 border border-slate-600/30 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-3">{getDayLabel(dayNum)}</h3>

              {/* Time inputs */}
              <div className="flex items-center gap-2 mb-4">
                <label className="text-xs text-slate-400">Start:</label>
                <input type="time" value={day.startTime}
                  onChange={e => setDayTimes(prev => ({ ...prev, [dayNum]: { ...prev[dayNum], start: e.target.value } }))}
                  className="px-2 py-1 bg-slate-800 border border-slate-600/50 rounded text-sm text-white" />
                <label className="text-xs text-slate-400 ml-2">End:</label>
                <input type="time" value={day.endTime}
                  onChange={e => setDayTimes(prev => ({ ...prev, [dayNum]: { ...prev[dayNum], end: e.target.value } }))}
                  className="px-2 py-1 bg-slate-800 border border-slate-600/50 rounded text-sm text-white" />
              </div>

              {/* Category cards */}
              <div className="space-y-2 min-h-[100px]">
                {day.categories.length === 0 ? (
                  <p className="text-slate-500 text-sm italic py-4 text-center">No categories assigned</p>
                ) : (
                  day.categories.map(cat => {
                    const catConflicts = conflicts.filter(c =>
                      c.categories.some(cc => cc.id === cat.id) && c.categories.some(cc => cc.day === dayNum)
                    );
                    const hasRed = catConflicts.some(c => c.severity === 'red');
                    const hasYellow = catConflicts.some(c => c.severity === 'yellow');

                    let borderColor = 'border-slate-600/30';
                    let bgColor = 'bg-slate-800/50';
                    if (hasRed) { borderColor = 'border-red-400/50'; bgColor = 'bg-red-900/20'; }
                    else if (hasYellow) { borderColor = 'border-amber-400/50'; bgColor = 'bg-amber-900/20'; }
                    else if (catConflicts.length === 0 && conflicts.length > 0) { borderColor = 'border-green-400/30'; bgColor = 'bg-green-900/10'; }

                    return (
                      <div key={cat.id} className={`${bgColor} border ${borderColor} rounded-lg p-3 transition-all`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-white text-sm">{cat.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-400">{cat.playerCount} players</span>
                              <span className="text-xs text-slate-400">·</span>
                              <span className="text-xs text-slate-400">{cat.gameCount} games</span>
                              {cat.gender && <span className="text-xs text-slate-500">· {cat.gender}</span>}
                            </div>
                          </div>
                          {/* Day toggle buttons */}
                          <div className="flex gap-1">
                            {Array.from({ length: numDays }, (_, i) => i + 1).map(d => (
                              <button key={d} onClick={() => assignToDay(cat.id, d)}
                                className={`w-7 h-7 rounded text-xs font-bold transition ${
                                  cat.scheduledDay === d
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-700/30 text-slate-400 hover:bg-slate-600/30'
                                }`}>
                                {d}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Day summary */}
              <div className="mt-3 pt-3 border-t border-slate-700/30 flex justify-between text-xs text-slate-400">
                <span>{day.categories.length} categories</span>
                <span>{day.categories.reduce((sum, c) => sum + c.gameCount, 0)} total games</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Conflicts section */}
      {conflictCount > 0 && (
        <div className="bg-slate-900/50 border border-slate-600/30 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className={redConflicts > 0 ? 'text-red-400' : 'text-amber-400'} />
            {conflictCount} Conflict{conflictCount !== 1 ? 's' : ''} Detected
            {redConflicts > 0 && <span className="text-xs text-red-400">({redConflicts} critical)</span>}
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {conflicts.map((conflict, i) => (
              <div key={i} className={`p-2 rounded text-sm ${
                conflict.severity === 'red' ? 'bg-red-900/20 border border-red-400/30 text-red-300'
                : 'bg-amber-900/20 border border-amber-400/30 text-amber-300'
              }`}>
                <span className="font-medium">{conflict.playerName}</span>
                <span className="text-slate-400"> plays in </span>
                {conflict.categories.map((c, j) => (
                  <span key={c.id}>
                    {j > 0 && ' & '}
                    <span className="font-medium">{c.name}</span>
                    <span className="text-slate-400"> (Day {c.day})</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
