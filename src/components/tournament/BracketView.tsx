'use client';

import { useState } from 'react';
import { BracketGame, groupGamesByRound, getRoundLabel } from '@/lib/bracketUtils';
import MatchCard from './MatchCard';
import { TournamentTheme, lightTheme, darkTheme } from './theme';

interface BracketViewProps {
  games: BracketGame[];
  dense?: boolean;
  theme?: TournamentTheme;
}

/* ─── Constants (matched from DoubleEliminationBracketView) ─── */
const HEADER_H = 36; // px — round label header height
const BASE_SLOT = { normal: 130, dense: 92 }; // px per game in the densest round

/* ─── BracketColumn — fixed slot heights ─── */
function BracketColumn({
  round,
  slotHeight,
  label,
  dense,
  theme,
}: {
  round: { roundNumber: number; games: BracketGame[] };
  slotHeight: number;
  label: string;
  dense?: boolean;
  theme: TournamentTheme;
}) {
  const colMinWidth = dense ? 'min-w-[190px]' : theme.bracketColumnMinWidth;

  return (
    <div className={`flex flex-col ${colMinWidth}`}>
      <div style={{ height: HEADER_H }} className="flex items-center justify-center px-3">
        <span className={`text-xs font-bold ${theme.roundLabel} uppercase tracking-wider`}>
          {label}
        </span>
      </div>
      {round.games.map((game) => (
        <div
          key={game.id}
          style={{ height: slotHeight }}
          className="flex items-center"
        >
          <div className={`${dense ? 'px-1.5' : 'px-3'} w-full`}>
            <MatchCard
              game={game}
              compact
              dense={dense}
              theme={theme}
              showMatchNumber={!!game.matchNumber}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── ConnectorColumn — absolute-positioned lines (matched from DoubleEliminationBracketView) ─── */
function ConnectorColumn({
  feedCount,
  outputCount,
  feedSlotHeight,
  dense,
  theme,
}: {
  feedCount: number;
  outputCount: number;
  feedSlotHeight: number;
  dense?: boolean;
  theme: TournamentTheme;
}) {
  const connW = dense ? 36 : 48;
  const isMerge = feedCount === outputCount * 2;
  const halfSlot = feedSlotHeight / 2;

  if (!isMerge) {
    // Straight 1:1 — single horizontal line centered in each slot
    return (
      <div className="flex flex-col" style={{ width: connW, minWidth: connW }}>
        <div style={{ height: HEADER_H }} />
        {Array.from({ length: feedCount }).map((_, i) => (
          <div key={i} style={{ height: feedSlotHeight }} className="flex items-center">
            <div className={`w-full border-t-2 ${theme.connectorBorder}`} />
          </div>
        ))}
      </div>
    );
  }

  // Merge 2→1 using absolute positioning for pixel-perfect lines
  return (
    <div className="flex flex-col" style={{ width: connW, minWidth: connW }}>
      <div style={{ height: HEADER_H }} />
      {Array.from({ length: outputCount }).map((_, i) => (
        <div key={i} style={{ height: feedSlotHeight * 2 }} className="relative">
          {/* Top input */}
          <div
            className={`absolute border-t-2 ${theme.connectorBorder}`}
            style={{ top: halfSlot, width: '50%', left: 0 }}
          />
          {/* Bottom input */}
          <div
            className={`absolute border-t-2 ${theme.connectorBorder}`}
            style={{ top: halfSlot * 3, width: '50%', left: 0 }}
          />
          {/* Vertical bar */}
          <div
            className={`absolute border-l-2 ${theme.connectorBorder}`}
            style={{ top: halfSlot, left: '50%', height: feedSlotHeight }}
          />
          {/* Output */}
          <div
            className={`absolute border-t-2 ${theme.connectorBorder}`}
            style={{ top: feedSlotHeight, width: '50%', left: '50%' }}
          />
        </div>
      ))}
    </div>
  );
}

/* ─── Theme Toggle — segmented Day / Night switch (same as DoubleEliminationBracketView) ─── */
function ThemeToggle({
  isDark,
  onToggle,
}: {
  isDark: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="inline-flex rounded-full overflow-hidden shadow-md border border-slate-600/30">
      <button
        onClick={() => isDark && onToggle()}
        className={`
          inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold transition-all
          ${!isDark
            ? 'bg-amber-400 text-slate-900'
            : 'bg-gray-700 text-gray-400 hover:text-gray-200'
          }
        `}
        title="Day mode"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
        Day
      </button>
      <button
        onClick={() => !isDark && onToggle()}
        className={`
          inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold transition-all
          ${isDark
            ? 'bg-indigo-600 text-white'
            : 'bg-slate-700 text-slate-400 hover:text-slate-200'
          }
        `}
        title="Night mode"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
        Night
      </button>
    </div>
  );
}

/* ─── Desktop bracket with fixed slot heights and connector lines ─── */
function DesktopBracket({
  rounds,
  totalRoundNum,
  totalHeight,
  dense,
  theme,
}: {
  rounds: ReturnType<typeof groupGamesByRound>;
  totalRoundNum: number;
  totalHeight: number;
  dense?: boolean;
  theme: TournamentTheme;
}) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex items-start min-w-max">
        {rounds.map((round, roundIdx) => {
          const label = getRoundLabel(round.roundNumber, totalRoundNum);
          const isLast = roundIdx === rounds.length - 1;
          const slotH = totalHeight / round.games.length;
          const nextRound = !isLast ? rounds[roundIdx + 1] : null;

          return (
            <div key={round.roundNumber} className="flex">
              <BracketColumn
                round={round}
                slotHeight={slotH}
                label={label}
                dense={dense}
                theme={theme}
              />
              {nextRound && (
                <ConnectorColumn
                  feedCount={round.games.length}
                  outputCount={nextRound.games.length}
                  feedSlotHeight={slotH}
                  dense={dense}
                  theme={theme}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Mobile bracket: round tabs + stacked cards ─── */
function MobileBracket({
  rounds,
  totalRoundNum,
  theme,
}: {
  rounds: ReturnType<typeof groupGamesByRound>;
  totalRoundNum: number;
  theme: TournamentTheme;
}) {
  const [activeRound, setActiveRound] = useState(rounds[0]?.roundNumber ?? 1);
  const activeGames = rounds.find((r) => r.roundNumber === activeRound)?.games ?? [];

  return (
    <div>
      {/* Round selector pills */}
      <div className="flex overflow-x-auto gap-2 pb-3 mb-4 -mx-1 px-1">
        {rounds.map((round) => {
          const label = getRoundLabel(round.roundNumber, totalRoundNum);
          const isActive = round.roundNumber === activeRound;
          return (
            <button
              key={round.roundNumber}
              onClick={() => setActiveRound(round.roundNumber)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors
                ${isActive
                  ? 'bg-footvolley-primary text-white'
                  : theme.roundPillInactive
                }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Stacked match cards */}
      <div className="space-y-3">
        {activeGames.map((game) => (
          <div key={game.id} className="flex justify-center">
            <MatchCard game={game} compact theme={theme} showMatchNumber={!!game.matchNumber} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Helpers ─── */
function isThemeDark(theme?: TournamentTheme): boolean {
  return !!theme?.cardBg?.includes('dark');
}

/* ─── Main Export ─── */
export default function BracketView({
  games,
  dense = false,
  theme: externalTheme,
}: BracketViewProps) {
  const [isDark, setIsDark] = useState(() => isThemeDark(externalTheme));
  const theme = isDark ? darkTheme : lightTheme;

  // Prefer knockout games; fall back to all games for pure bracket formats
  const knockoutOnly = games.filter((g) => g.roundType === 'knockout');
  const gamesToShow = knockoutOnly.length > 0 ? knockoutOnly : games;
  const rounds = groupGamesByRound(gamesToShow);

  if (rounds.length === 0) {
    return (
      <div className="text-center py-12">
        <div className={`${theme.emptyIcon} text-5xl mb-3`}>&#127942;</div>
        <p className={`${theme.emptyText} font-medium`}>No bracket games to display</p>
      </div>
    );
  }

  const totalRoundNum = rounds[rounds.length - 1].roundNumber;

  // Calculate total height from the densest round (most games)
  const maxGames = Math.max(...rounds.map((r) => r.games.length), 1);
  const baseSlot = dense ? BASE_SLOT.dense : BASE_SLOT.normal;
  const totalHeight = maxGames * baseSlot;

  return (
    <div>
      {/* Theme toggle — always visible, hidden in print */}
      <div className="flex justify-end mb-3 no-print">
        <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
      </div>

      <div className={`rounded-xl transition-colors ${isDark ? '' : 'bg-slate-800/50 p-3'}`}>
        {dense ? (
          <DesktopBracket rounds={rounds} totalRoundNum={totalRoundNum} totalHeight={totalHeight} dense theme={theme} />
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block">
              <DesktopBracket rounds={rounds} totalRoundNum={totalRoundNum} totalHeight={totalHeight} theme={theme} />
            </div>
            {/* Mobile */}
            <div className="md:hidden">
              <MobileBracket rounds={rounds} totalRoundNum={totalRoundNum} theme={theme} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
