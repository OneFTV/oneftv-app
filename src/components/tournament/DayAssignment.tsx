'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, AlertTriangle, CheckCircle, Sparkles, Loader, Save } from 'lucide-react';

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
  categories: string[];
  severity: 'red' | 'yellow';
  message: string;
}

interface DayAssignmentProps {
  tournamentId: string;
  numDays: number;
  startDate: string;
  endDate?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
}

export default function DayAssignment({
  tournamentId,
  numDays,
  startDate,
  endDate,
  defaultStartTime = '09:00',
  defaultEndTime = '18:00',
}: DayAssignmentProps) {
  const [categories, setCategories] = useState<CategoryAssignment[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dayTimes, setDayTimes] = useState<Record<number, { start: string; end: string }>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Generate day labels
  const days = Array.from({ length: numDays }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
    const dayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    return { num: i + 1, label: `${dayName} ${dayDate}` };
  });

  // Init day times
  useEffect(() => {
    const times: Record<number, { start: string; end: string }> = {};
    days.forEach(d => {
      times[d.num] = { start: defaultStartTime, end: defaultEndTime };
    });
    setDayTimes(times);
  }, [numDays]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/schedule/day-assignment`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        if (data.conflicts) setConflicts(data.conflicts);
        // Update day times from category data
        const times = { ...dayTimes };
        (data.categories || []).forEach((c: CategoryAssignment) => {
          if (c.dayStartTime && c.dayEndTime) {
            times[c.scheduledDay] = { start: c.dayStartTime, end: c.dayEndTime };
          }
        });
        setDayTimes(times);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDayChange = (catId: string, day: number) => {
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, scheduledDay: day } : c));
    setHasChanges(true);
    setMessage(null);
  };

  const handleDayTimeChange = (day: number, field: 'start' | 'end', value: string) => {
    setDayTimes(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
    setHasChanges(true);
  };

  const applySuggestion = async () => {
    setApplying(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/schedule/day-assignment`);
      if (res.ok) {
        const data = await res.json();
        if (data.suggestion) {
          const newCats = [...categories];
          Object.entries(data.suggestion).forEach(([dayKey, catIds]) => {
            const dayNum = parseInt(dayKey.replace('day', ''));
            (catIds as string[]).forEach(id => {
              const cat = newCats.find(c => c.id === id);
              if (cat) cat.scheduledDay = dayNum;
            });
          });
          setCategories(newCats);
          setHasChanges(true);
          setMessage({ type: 'success', text: 'Suggestion applied! Review and save.' });
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to get suggestion' });
    } finally {
      setApplying(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
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
      if (res.ok) {
        setConflicts(data.conflicts || []);
        setHasChanges(false);
        setMessage({
          type: data.conflicts?.length > 0 ? 'error' : 'success',
          text: data.conflicts?.length > 0
            ? `Saved! ${data.conflicts.length} conflict(s) found — review below.`
            : 'Saved! No conflicts detected. ✅',
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  const checkConflicts = async () => {
    setChecking(true);
    await save();
    setChecking(false);
  };

  if (numDays <= 1) return null;
  if (loading) return <div className="flex items-center gap-2 text-slate-400 p-4"><Loader className="animate-spin" size={16} /> Loading...</div>;

  // Group categories by day for summary
  const byDay: Record<number, CategoryAssignment[]> = {};
  days.forEach(d => { byDay[d.num] = categories.filter(c => c.scheduledDay === d.num); });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Calendar size={20} className="text-cyan-400" />
          Schedule by Day
        </h3>
        <div className="flex gap-2">
          <button
            onClick={applySuggestion}
            disabled={applying}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg hover:bg-purple-600/50 transition disabled:opacity-50"
          >
            {applying ? <Loader className="animate-spin" size={14} /> : <Sparkles size={14} />}
            Suggest
          </button>
          <button
            onClick={save}
            disabled={saving || !hasChanges}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-lg hover:bg-cyan-600/50 transition disabled:opacity-50"
          >
            {saving ? <Loader className="animate-spin" size={14} /> : <Save size={14} />}
            Save
          </button>
        </div>
      </div>

      {/* Day time settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {days.map(d => (
          <div key={d.num} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <div className="text-sm font-medium text-white mb-2">{d.label}</div>
            <div className="flex items-center gap-3 text-sm">
              <label className="text-slate-400">Start</label>
              <input
                type="time"
                value={dayTimes[d.num]?.start || '09:00'}
                onChange={e => handleDayTimeChange(d.num, 'start', e.target.value)}
                className="bg-slate-700 text-white rounded px-2 py-1 border border-slate-600 text-sm"
              />
              <label className="text-slate-400">End</label>
              <input
                type="time"
                value={dayTimes[d.num]?.end || '18:00'}
                onChange={e => handleDayTimeChange(d.num, 'end', e.target.value)}
                className="bg-slate-700 text-white rounded px-2 py-1 border border-slate-600 text-sm"
              />
              <span className="text-xs text-slate-500">({byDay[d.num]?.length || 0} cats)</span>
            </div>
          </div>
        ))}
      </div>

      {/* Category list */}
      <div className="space-y-2">
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white text-sm">{cat.name}</span>
                <span className="text-xs text-slate-500">{cat.playerCount} players</span>
                {cat.gender && <span className="text-xs text-slate-500">• {cat.gender}</span>}
              </div>
            </div>
            <div className="flex items-center gap-1 ml-3">
              {days.map(d => (
                <button
                  key={d.num}
                  onClick={() => handleDayChange(cat.id, d.num)}
                  className={`w-20 py-1.5 text-xs font-medium rounded-md transition ${
                    cat.scheduledDay === d.num
                      ? 'bg-cyan-500 text-slate-900'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {d.label.split(' ')[0]} {d.num}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Save + Check */}
      <button
        onClick={checkConflicts}
        disabled={checking}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-lg hover:bg-amber-600/50 transition disabled:opacity-50"
      >
        {checking ? <Loader className="animate-spin" size={16} /> : <AlertTriangle size={16} />}
        Save & Check Conflicts
      </button>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {message.text}
        </div>
      )}

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-amber-400">⚠️ Conflicts ({conflicts.length})</h4>
          {conflicts.map((c, i) => (
            <div key={i} className={`p-3 rounded-lg text-sm border ${
              c.severity === 'red' ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
            }`}>
              <span className="font-medium">{c.playerName}</span>
              <span className="text-slate-400 ml-1">— {c.categories.join(' + ')}</span>
              <div className="text-xs mt-1 opacity-80">{c.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
