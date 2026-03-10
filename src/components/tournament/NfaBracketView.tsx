'use client';

import { useState, useRef, useLayoutEffect, useCallback, useMemo, useEffect } from 'react';
import { BracketGame } from '@/lib/bracketUtils';
import {
  NfaBracketColumn,
  getColumnDefs,
  getDivisionKeys,
  divisionBadgeColors,
  divisionTagBg,
} from '@/lib/nfaBracketLayout';
import MatchCard from './MatchCard';
import { TournamentTheme, darkTheme } from './theme';

/* ─────────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────────── */

interface NfaBracketViewProps {
  /** BracketGame array across ALL divisions */
  games: BracketGame[];
  /** Category records with divisionLabel */
  categories: CategoryInfo[];
  /** 3-division or 4-division NFA format */
  divisionCount: 3 | 4;
  /** Display name for the tournament header */
  tournamentName?: string;
  /** Number of courts (for schedule grid) */
  numCourts?: number;
  /** Category ID from the URL — pre-selects the matching division tab */
  initialCategoryId?: string;
}

interface CategoryInfo {
  id: string;
  name: string;
  divisionLabel?: string | null;
  bracketType?: string | null;
  [key: string]: unknown;
}

/** Internal representation tying a game to its division */
interface NfaGame extends BracketGame {
  division: string;
  section: string; // winners | losers | finals
  round: string;   // W1, W2, L1, SF, F, 3P, etc.
}

/* ─────────────────────────────────────────────────────────────────
 * Helpers
 * ───────────────────────────────────────────────────────────────── */

/** Derive the NFA round code from the roundName.
 *  roundName examples: "Winners Round 1" -> "W1", "Losers Round 3" -> "L3",
 *  "Semi-Final" -> "SF", "Final" -> "F", "3rd Place" -> "3P"
 *  Also handles direct round codes like "W1", "L2", "SF", "F", "3P".
 */
function deriveRound(game: BracketGame): string {
  const rn = game.roundName || '';

  // Direct codes
  if (/^W\d+$/i.test(rn)) return rn.toUpperCase();
  if (/^L\d+$/i.test(rn)) return rn.toUpperCase();
  if (/^SF$/i.test(rn)) return 'SF';
  if (/^F$/i.test(rn)) return 'F';
  if (/^3P$/i.test(rn)) return '3P';

  // Descriptive names
  if (/semi[- ]?final/i.test(rn)) return 'SF';
  if (/3rd\s*place/i.test(rn)) return '3P';
  if (/\bfinal\b/i.test(rn) && !/semi/i.test(rn)) return 'F';

  // Pattern: "Nth Round W2" or "1st Round W1"
  const roundCodeMatch = rn.match(/\b([WL]\d+)\b/i);
  if (roundCodeMatch) return roundCodeMatch[1].toUpperCase();

  // Fallback: use roundType or bracketSide + roundNumber
  if (game.roundType === 'semi_final') return 'SF';
  if (game.roundType === 'final') return 'F';
  if (game.roundType === 'third_place') return '3P';

  const side = game.bracketSide || 'winners';
  const num = game.roundNumber ?? 1;
  if (side === 'winners') return `W${num}`;
  if (side === 'losers') return `L${num}`;
  if (side === 'finals') {
    // Heuristic: round 1 of finals is SF, round 2 is F, round 3 is 3P
    if (num <= 1) return 'SF';
    if (num === 2) return 'F';
    return '3P';
  }

  return `W${num}`;
}

/** Derive the NFA section from bracketSide or round.
 *  Round code takes precedence for finals rounds because some SE brackets
 *  (D3, D4) store bracketSide='winners' on Semi-Final games, but the
 *  column layout expects section='finals' for the SF column.
 */
function deriveSection(game: BracketGame, round: string): string {
  // Round-derived checks first (most reliable for SE/DE finals rounds)
  if (['SF', 'F', '3P'].includes(round)) return 'finals';
  if (round.startsWith('L')) return 'losers';
  // Fall back to stored bracketSide for winners-bracket rounds
  if (game.bracketSide) return game.bracketSide;
  return 'winners';
}

/** Build a map from categoryId -> divisionLabel. */
function buildCategoryDivisionMap(categories: CategoryInfo[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const cat of categories) {
    if (cat.divisionLabel) {
      map.set(cat.id, cat.divisionLabel);
    }
  }
  return map;
}

/** Format minutes since midnight to time string (e.g. "9:00 AM"). */
function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

/** Get the number of games per division. */
function countByDivision(games: NfaGame[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const g of games) {
    counts[g.division] = (counts[g.division] || 0) + 1;
  }
  return counts;
}

/* ─────────────────────────────────────────────────────────────────
 * Sub-components
 * ───────────────────────────────────────────────────────────────── */

/** Division tab bar */
function DivisionTabs({
  divisions,
  activeTab,
  onTabChange,
  gameCounts,
}: {
  divisions: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  gameCounts: Record<string, number>;
}) {
  const tabs = [...divisions, 'schedule'];

  return (
    <div className="flex gap-1 bg-slate-800/80 px-4 py-2 border-b border-slate-700 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = tab === activeTab;
        const isDivision = tab !== 'schedule';
        const count = isDivision ? (gameCounts[tab] || 0) : Object.values(gameCounts).reduce((a, b) => a + b, 0);
        const badgeColor = isDivision
          ? (divisionBadgeColors[tab] || 'bg-slate-500')
          : 'bg-slate-500';

        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`
              px-5 py-2 rounded-md text-sm font-semibold transition-all whitespace-nowrap
              ${isActive
                ? 'bg-slate-700 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
              }
            `}
          >
            {isDivision ? `Division ${tab.slice(1)}` : 'Schedule'}
            <span
              className={`inline-block ml-2 text-[11px] px-1.5 py-0.5 rounded-full font-bold text-white ${badgeColor}`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Summary stats bar */
function DivisionSummary({
  division,
  gameCount,
  teamCount,
  format,
}: {
  division: string;
  gameCount: number;
  teamCount: number;
  format: string;
}) {
  const stats = [
    { value: gameCount, label: 'Total Games' },
    { value: division, label: 'Division' },
    { value: teamCount, label: 'Teams' },
    { value: format, label: 'Format' },
  ];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-5 flex gap-6 flex-wrap">
      {stats.map((s, i) => (
        <div key={i} className="text-center">
          <div className="text-2xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            {s.value}
          </div>
          <div className="text-xs text-slate-400">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/** NFA-style match card specifically for the NFA bracket.
 *  Re-uses the existing MatchCard component but wraps it with
 *  a data-game-id attribute needed for connector drawing.
 */
function NfaMatchCard({
  game,
  theme,
}: {
  game: NfaGame;
  theme: TournamentTheme;
}) {
  return (
    <div className="my-0.5 relative z-[2]" data-game-id={game.id}>
      <MatchCard
        game={game}
        compact
        dense
        theme={theme}
        showMatchNumber={!!game.matchNumber}
      />
      {/* Cascade badge */}
      {game.seedTarget && (
        <div className="absolute -bottom-0.5 right-1 z-10">
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-pink-500 text-white font-semibold">
            {'\u2192'} {game.seedTarget}
          </span>
        </div>
      )}
    </div>
  );
}

/** Renders a single bracket column */
function BracketColumn({
  column,
  games,
  theme,
}: {
  column: NfaBracketColumn;
  games: NfaGame[];
  theme: TournamentTheme;
}) {
  // Filter games for this column
  const colGames = games.filter(
    (g) => column.rounds.includes(g.round) && column.sections.includes(g.section),
  );

  // Sort for finals columns
  if (column.finalsStack) {
    const order: Record<string, number> = { SF: 0, F: 1, '3P': 2 };
    colGames.sort((a, b) => (order[a.round] ?? 9) - (order[b.round] ?? 9));
  }
  if (column.finalsPair) {
    const order: Record<string, number> = { F: 0, '3P': 1 };
    colGames.sort((a, b) => (order[a.round] ?? 9) - (order[b.round] ?? 9));
  }

  // Header colour
  const headerBg =
    column.headerClass === 'winners'
      ? 'bg-emerald-600'
      : column.headerClass === 'losers'
        ? 'bg-orange-600'
        : 'bg-amber-600';

  // Division tag colour
  const tagBg = column.divisionTag
    ? (divisionTagBg[column.divisionTag.cssClass] || 'bg-pink-500')
    : '';

  return (
    <div className="flex flex-col min-w-[185px] flex-shrink-0">
      {/* Header */}
      <div
        className={`py-1 px-1.5 text-center text-[10px] font-bold uppercase tracking-wide leading-snug whitespace-pre-line rounded-t text-white ${headerBg}`}
      >
        {column.label}
      </div>

      {/* Cascade badge */}
      {column.divisionTag && (
        <div className={`text-[9px] text-center py-0.5 px-1.5 font-bold text-white rounded-sm mt-0.5 ${tagBg}`}>
          {column.divisionTag.text}
        </div>
      )}

      {/* Games area */}
      {column.finalsStack ? (
        <FinalsStackLayout games={colGames} theme={theme} />
      ) : column.finalsPair ? (
        <FinalsPairLayout games={colGames} theme={theme} />
      ) : (
        <div className="flex-1 flex flex-col justify-around py-1 min-h-[200px]">
          {colGames.map((g) => (
            <NfaMatchCard key={g.id} game={g} theme={theme} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Finals stack: SFs in flow, F + 3P centred between them (DE layout) */
function FinalsStackLayout({
  games,
  theme,
}: {
  games: NfaGame[];
  theme: TournamentTheme;
}) {
  const sfGames = games.filter((g) => g.round === 'SF');
  const fpGames = games.filter((g) => g.round === 'F' || g.round === '3P');

  return (
    <div className="flex-1 flex flex-col justify-around py-1 min-h-[700px] relative">
      {/* SFs in normal flow */}
      {sfGames.map((g) => (
        <NfaMatchCard key={g.id} game={g} theme={theme} />
      ))}
      {/* F + 3P centred between the SFs */}
      {fpGames.length > 0 && (
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-none z-[3]">
          {fpGames.map((g) => (
            <div key={g.id} className="pointer-events-auto w-[calc(100%-4px)]">
              <NfaMatchCard game={g} theme={theme} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Finals pair: F centred, 3P below (SE layout) */
function FinalsPairLayout({
  games,
  theme,
}: {
  games: NfaGame[];
  theme: TournamentTheme;
}) {
  const finalGame = games.find((g) => g.round === 'F');
  const thirdGame = games.find((g) => g.round === '3P');

  return (
    <div className="flex-1 relative py-1 min-h-[200px]">
      {finalGame && (
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 z-[3]">
          <NfaMatchCard game={finalGame} theme={theme} />
        </div>
      )}
      {thirdGame && (
        <div className="absolute top-[calc(50%+60px)] left-0 right-0 z-[3]">
          <NfaMatchCard game={thirdGame} theme={theme} />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
 * SVG Connector Lines
 * ───────────────────────────────────────────────────────────────── */

interface CardPos {
  l: number;
  r: number;
  t: number;
  b: number;
  cx: number;
  cy: number;
  h: number;
}

/** Gather positions of all match cards in a bracket container. */
function gatherCardPositions(
  bracketEl: HTMLDivElement,
): Record<string, CardPos> {
  const cards = bracketEl.querySelectorAll<HTMLElement>('[data-game-id]');
  const rect = bracketEl.getBoundingClientRect();
  const sl = bracketEl.scrollLeft;
  const st = bracketEl.scrollTop;

  const pos: Record<string, CardPos> = {};
  cards.forEach((card) => {
    const id = card.getAttribute('data-game-id');
    if (!id) return;
    const r = card.getBoundingClientRect();
    pos[id] = {
      l: r.left - rect.left + sl,
      r: r.right - rect.left + sl,
      t: r.top - rect.top + st,
      b: r.bottom - rect.top + st,
      cx: (r.left + r.right) / 2 - rect.left + sl,
      cy: (r.top + r.bottom) / 2 - rect.top + st,
      h: r.height,
    };
  });
  return pos;
}

/** Build an SVG path string for an elbow connector. */
function elbowPath(
  src: CardPos,
  tgt: CardPos,
  slot: string | null,
): string {
  const goRight = tgt.cx > src.cx;
  const startX = goRight ? src.r + 1 : src.l - 1;
  const startY = src.cy;
  const endX = goRight ? tgt.l - 1 : tgt.r + 1;

  let endY: number;
  if (slot === 'top' || slot === 'home') {
    endY = tgt.t + tgt.h * 0.33;
  } else if (slot === 'bottom' || slot === 'away') {
    endY = tgt.b - tgt.h * 0.33;
  } else {
    endY = tgt.cy;
  }

  // Straight line when nearly same vertical level
  const isStraight = Math.abs(src.cy - tgt.cy) < 15;
  if (isStraight) endY = startY;

  const midX = (startX + endX) / 2;

  return isStraight
    ? `M${startX},${startY} H${endX}`
    : `M${startX},${startY} H${midX} V${endY} H${endX}`;
}

/** Determine whether to draw a connector between two games. */
function shouldDrawConnector(
  srcId: string,
  tgtId: string,
  sectionOf: Record<string, string>,
  roundOf: Record<string, string>,
  pos: Record<string, CardPos>,
): boolean {
  const srcRound = roundOf[srcId];
  const tgtRound = roundOf[tgtId];

  // Allow SF -> Final connectors when in separate columns (single-elim layout)
  if (tgtRound === 'F' && srcRound === 'SF') {
    if (pos[tgtId] && pos[srcId] && pos[tgtId].cx > pos[srcId].cx + 50) return true;
    return false; // same column (DE finalsStack) -- skip
  }

  // Skip connectors to/from Final and 3rd Place
  const finalsRounds = new Set(['F', '3P']);
  if (finalsRounds.has(tgtRound)) return false;
  if (finalsRounds.has(srcRound)) return false;

  const ss = sectionOf[srcId];
  const ts = sectionOf[tgtId];
  if (!ss || !ts) return false;

  // Same section: always draw
  if (ss === ts) return true;

  // Into or out of finals: draw (adjacent sections)
  if (ts === 'finals' || ss === 'finals') return true;

  // Cross-section (winners<->losers): skip to avoid clutter
  return false;
}

/** Draw SVG connector overlay for a division bracket. */
function ConnectorOverlay({
  bracketRef,
  games,
  visible,
}: {
  bracketRef: React.RefObject<HTMLDivElement | null>;
  games: NfaGame[];
  visible: boolean;
}) {
  const [paths, setPaths] = useState<{ d: string; color: string }[]>([]);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  const draw = useCallback(() => {
    const el = bracketRef.current;
    if (!el || !visible) {
      setPaths([]);
      return;
    }

    const pos = gatherCardPositions(el);
    const divIds = new Set(games.map((g) => g.id));

    // Build lookups
    const sectionOf: Record<string, string> = {};
    const roundOf: Record<string, string> = {};
    games.forEach((g) => {
      sectionOf[g.id] = g.section;
      roundOf[g.id] = g.round;
    });

    const newPaths: { d: string; color: string }[] = [];

    for (const g of games) {
      // Winner connection
      if (g.winnerNextGameId && divIds.has(g.winnerNextGameId) && pos[g.id] && pos[g.winnerNextGameId]) {
        if (shouldDrawConnector(g.id, g.winnerNextGameId, sectionOf, roundOf, pos)) {
          // Infer slot from matchNumber parity (even = home/top, odd = away/bottom)
          const slot = g.matchNumber != null ? (g.matchNumber % 2 === 1 ? 'top' : 'bottom') : null;
          newPaths.push({
            d: elbowPath(pos[g.id], pos[g.winnerNextGameId], slot),
            color: 'rgba(5,150,105,0.4)',
          });
        }
      }

      // Loser connection (within same division)
      if (g.loserNextGameId && divIds.has(g.loserNextGameId) && pos[g.id] && pos[g.loserNextGameId]) {
        if (shouldDrawConnector(g.id, g.loserNextGameId, sectionOf, roundOf, pos)) {
          const slot = g.matchNumber != null ? (g.matchNumber % 2 === 1 ? 'top' : 'bottom') : null;
          newPaths.push({
            d: elbowPath(pos[g.id], pos[g.loserNextGameId], slot),
            color: 'rgba(234,88,12,0.4)',
          });
        }
      }
    }

    setDims({ w: el.scrollWidth, h: el.scrollHeight });
    setPaths(newPaths);
  }, [bracketRef, games, visible]);

  // Draw on mount and when visibility changes
  useLayoutEffect(() => {
    draw();
  }, [draw]);

  // Redraw on window resize
  useEffect(() => {
    const handler = () => draw();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [draw]);

  if (paths.length === 0 || dims.w === 0) return null;

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none z-[1]"
      width={dims.w}
      height={dims.h}
    >
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill="none"
          stroke={p.color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────
 * NfaBracketHorizontal — Horizontal scrollable bracket
 * ───────────────────────────────────────────────────────────────── */

function NfaBracketHorizontal({
  division,
  divisionCount,
  games,
  theme,
}: {
  division: string;
  divisionCount: 3 | 4;
  games: NfaGame[];
  theme: TournamentTheme;
}) {
  const bracketRef = useRef<HTMLDivElement>(null);
  const columns = useMemo(
    () => getColumnDefs(division, divisionCount),
    [division, divisionCount],
  );

  const divGames = useMemo(
    () => games.filter((g) => g.division === division),
    [games, division],
  );

  return (
    <div
      ref={bracketRef}
      className="flex overflow-x-auto gap-6 py-2 pb-4 items-stretch relative"
    >
      {/* SVG connector overlay */}
      <ConnectorOverlay bracketRef={bracketRef} games={divGames} visible={true} />

      {columns.map((col, i) => (
        <BracketColumn key={i} column={col} games={divGames} theme={theme} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
 * Schedule Grid
 * ───────────────────────────────────────────────────────────────── */

interface TimeSlot {
  time: string;
  timeMinutes: number;
}

function ScheduleGrid({
  games,
  numCourts,
}: {
  games: NfaGame[];
  numCourts: number;
}) {
  // Group games by time slot and court
  const { timeSlots, grid } = useMemo(() => {
    const timeMap = new Map<number, TimeSlot>();
    const gridMap = new Map<string, NfaGame[]>();

    for (const g of games) {
      if (!g.scheduledTime) continue;
      const d = new Date(g.scheduledTime);
      const mins = d.getHours() * 60 + d.getMinutes();
      const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

      if (!timeMap.has(mins)) {
        timeMap.set(mins, { time: timeStr, timeMinutes: mins });
      }

      const key = `${mins}-${g.court}`;
      if (!gridMap.has(key)) gridMap.set(key, []);
      gridMap.get(key)!.push(g);
    }

    const slots = Array.from(timeMap.values()).sort((a, b) => a.timeMinutes - b.timeMinutes);
    return { timeSlots: slots, grid: gridMap };
  }, [games]);

  if (timeSlots.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        No scheduled games to display.
      </div>
    );
  }

  // Division badge colour mapping
  const divBorderColors: Record<string, string> = {
    D1: 'border-l-blue-500',
    D2: 'border-l-purple-500',
    D3: 'border-l-emerald-500',
    D4: 'border-l-rose-500',
  };

  const divBgColors: Record<string, string> = {
    D1: 'bg-blue-500',
    D2: 'bg-purple-500',
    D3: 'bg-emerald-500',
    D4: 'bg-rose-500',
  };

  return (
    <div>
      {/* Summary */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-5 flex gap-6 flex-wrap">
        <div className="text-center">
          <div className="text-2xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            {games.length}
          </div>
          <div className="text-xs text-slate-400">Total Games</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            {numCourts}
          </div>
          <div className="text-xs text-slate-400">Courts</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            {timeSlots.length}
          </div>
          <div className="text-xs text-slate-400">Time Slots</div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="bg-slate-700/50 px-3 py-2 text-center font-bold border border-slate-600 sticky top-0 z-10">
                Time
              </th>
              {Array.from({ length: numCourts }).map((_, c) => (
                <th
                  key={c}
                  className="bg-slate-700/50 px-3 py-2 text-center font-bold border border-slate-600 sticky top-0 z-10 min-w-[180px]"
                >
                  Court {c + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot, rowIdx) => (
              <tr key={slot.timeMinutes} className={rowIdx % 2 === 0 ? '' : 'bg-slate-800/30'}>
                <td className="px-3 py-1 text-center font-bold whitespace-nowrap border border-slate-600 bg-slate-800">
                  {slot.time}
                </td>
                {Array.from({ length: numCourts }).map((_, c) => {
                  const key = `${slot.timeMinutes}-${c + 1}`;
                  const cellGames = grid.get(key) || [];
                  return (
                    <td key={c} className="px-1.5 py-1 border border-slate-600 align-top">
                      {cellGames.length > 0 ? (
                        cellGames.map((g) => (
                          <div
                            key={g.id}
                            className={`bg-slate-800 rounded px-1.5 py-1 my-0.5 border-l-[3px] text-xs ${
                              divBorderColors[g.division] || 'border-l-slate-500'
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              <span className="font-bold">
                                {g.matchNumber != null ? `M${g.matchNumber}` : g.id}
                              </span>
                              <span
                                className={`text-[10px] px-1 rounded text-white font-semibold ${
                                  divBgColors[g.division] || 'bg-slate-500'
                                }`}
                              >
                                {g.division}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {g.player1} vs {g.player2}
                            </div>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-600 text-[11px]">{'\u2014'}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
 * Main Export: NfaBracketView
 * ───────────────────────────────────────────────────────────────── */

export default function NfaBracketView({
  games,
  categories,
  divisionCount,
  tournamentName,
  numCourts = 4,
  initialCategoryId,
}: NfaBracketViewProps) {
  const theme = darkTheme;
  const divisions = getDivisionKeys(divisionCount);

  // Derive the initial tab from the URL's categoryId
  const initialTab = useMemo(() => {
    if (initialCategoryId) {
      const cat = categories.find((c) => c.id === initialCategoryId);
      if (cat?.divisionLabel && divisions.includes(cat.divisionLabel)) {
        return cat.divisionLabel;
      }
    }
    return divisions[0];
  }, [initialCategoryId, categories, divisions]);

  const [activeTab, setActiveTab] = useState(initialTab);

  // Build enriched NfaGame array with division/section/round
  const nfaGames = useMemo(() => {
    const catMap = buildCategoryDivisionMap(categories);

    return games.map((g): NfaGame => {
      const round = deriveRound(g);
      const section = deriveSection(g, round);

      // Division is typically passed via a wrapper or can be inferred
      // from the game's id matching a category's games.
      // Derive division from the game's categoryId (now typed on BracketGame)
      const divisionFromCat = g.categoryId ? catMap.get(g.categoryId) : undefined;
      const division = divisionFromCat || 'D1';

      return {
        ...g,
        division,
        section,
        round,
      };
    });
  }, [games, categories]);

  const gameCounts = useMemo(() => countByDivision(nfaGames), [nfaGames]);

  // Determine team count and format per division
  const divisionInfo = useMemo(() => {
    const info: Record<string, { teams: number; format: string }> = {};
    for (const div of divisions) {
      const divGames = nfaGames.filter((g) => g.division === div);
      // Estimate team count from first-round games
      const firstRoundGames = divGames.filter((g) => g.round === 'W1');
      const teams = firstRoundGames.length * 2 || divGames.length;
      const cat = categories.find((c) => c.divisionLabel === div);
      const format =
        cat?.bracketType === 'double_elimination'
          ? 'Double Elim'
          : cat?.bracketType === 'single_elimination'
            ? 'Single Elim'
            : div === 'D1' || div === 'D2'
              ? 'Double Elim'
              : 'Single Elim';
      info[div] = { teams, format };
    }
    return info;
  }, [nfaGames, categories, divisions]);

  // Empty state
  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-3 text-slate-400">&#127942;</div>
        <p className="text-slate-500 font-medium">No bracket games to display</p>
      </div>
    );
  }

  return (
    <div className="min-h-[400px]">
      {/* Header */}
      {tournamentName && (
        <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            {tournamentName}
          </h1>
          <div className="text-sm text-slate-400">
            {numCourts} Courts {'\u00B7'} {games.length} total games
          </div>
        </div>
      )}

      {/* Tabs */}
      <DivisionTabs
        divisions={divisions}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        gameCounts={gameCounts}
      />

      {/* Content */}
      <div className="p-5">
        {divisions.map((div) => {
          if (activeTab !== div) return null;
          const info = divisionInfo[div] || { teams: 0, format: 'Unknown' };
          return (
            <div key={div}>
              <DivisionSummary
                division={div}
                gameCount={gameCounts[div] || 0}
                teamCount={info.teams}
                format={info.format}
              />
              <NfaBracketHorizontal
                division={div}
                divisionCount={divisionCount}
                games={nfaGames}
                theme={theme}
              />
            </div>
          );
        })}

        {activeTab === 'schedule' && (
          <ScheduleGrid games={nfaGames} numCourts={numCourts} />
        )}
      </div>
    </div>
  );
}
