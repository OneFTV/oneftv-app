'use client';

import { useMemo } from 'react';

interface CapacityCalculatorProps {
  courts: number;
  referees: number;
  days: number;
  hoursPerDay: number;
  avgGameMinutes: number;
}

const FORMAT_GAME_ESTIMATES: Record<string, { label: string; gamesPerTeam: number }> = {
  bracket: { label: 'Single Elimination', gamesPerTeam: 2.5 },
  double_elimination: { label: 'Double Elimination', gamesPerTeam: 4 },
  group_knockout: { label: 'Group + Knockout', gamesPerTeam: 5 },
  round_robin: { label: 'Round Robin', gamesPerTeam: 7 },
  king_of_the_beach: { label: 'King of the Beach', gamesPerTeam: 6 },
};

export default function CapacityCalculator({
  courts,
  referees,
  days,
  hoursPerDay,
  avgGameMinutes,
}: CapacityCalculatorProps) {
  const { simultaneousGames, totalGames, maxTeamsByFormat, utilizationPct } = useMemo(() => {
    const simultaneous = Math.min(courts, referees);
    const slotsPerDay = Math.floor((hoursPerDay * 60) / avgGameMinutes);
    const total = simultaneous * days * slotsPerDay;
    const utilization = courts > 0 ? Math.round((simultaneous / courts) * 100) : 0;

    const teamsByFormat: Record<string, number> = {};
    for (const [key, info] of Object.entries(FORMAT_GAME_ESTIMATES)) {
      teamsByFormat[key] = Math.floor(total / info.gamesPerTeam);
    }

    return {
      simultaneousGames: simultaneous,
      totalGames: total,
      maxTeamsByFormat: teamsByFormat,
      utilizationPct: utilization,
    };
  }, [courts, referees, days, hoursPerDay, avgGameMinutes]);

  return (
    <div className="space-y-6">
      {/* Main stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-400/30 rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-cyan-300">{totalGames}</p>
          <p className="text-sm text-slate-400 mt-1">Total Games</p>
        </div>
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-400/30 rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-purple-300">{simultaneousGames}</p>
          <p className="text-sm text-slate-400 mt-1">Simultaneous</p>
        </div>
      </div>

      {/* Summary sentence */}
      <div className="bg-slate-800/60 border border-slate-600/30 rounded-lg p-4">
        <p className="text-sm text-slate-300">
          With <strong className="text-white">{courts} court{courts !== 1 ? 's' : ''}</strong>,{' '}
          <strong className="text-white">{referees} referee{referees !== 1 ? 's' : ''}</strong>,{' '}
          <strong className="text-white">{days} day{days !== 1 ? 's' : ''}</strong> of{' '}
          <strong className="text-white">{hoursPerDay}h</strong> each →{' '}
          you can run <strong className="text-cyan-400">{totalGames} games</strong>{' '}
          ({simultaneousGames} at a time, {avgGameMinutes}min avg)
        </p>
      </div>

      {/* Utilization bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-400">Court Utilization</span>
          <span className="text-xs text-slate-400">{utilizationPct}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              utilizationPct === 100 ? 'bg-green-500' : utilizationPct >= 75 ? 'bg-blue-500' : 'bg-amber-500'
            }`}
            style={{ width: `${utilizationPct}%` }}
          />
        </div>
        {utilizationPct < 100 && (
          <p className="text-xs text-amber-400 mt-1">
            💡 You have more courts than referees. Add {courts - referees} more referee{courts - referees !== 1 ? 's' : ''} to use all courts.
          </p>
        )}
      </div>

      {/* Max teams by format */}
      <div>
        <h4 className="text-sm font-medium text-slate-300 mb-3">Max Teams by Format</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(FORMAT_GAME_ESTIMATES).map(([key, info]) => (
            <div
              key={key}
              className="flex items-center justify-between px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-lg"
            >
              <span className="text-xs text-slate-400">{info.label}</span>
              <span className="text-sm font-semibold text-white">{maxTeamsByFormat[key]} teams</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
