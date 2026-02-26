'use client';

import { useState } from 'react';
import {
  BracketGame,
  classifyDoubleEliminationRounds,
  getDoubleElimRoundLabel,
  BracketSection,
  RoundGroup,
} from '@/lib/bracketUtils';
import MatchCard from './MatchCard';
import { TournamentTheme, lightTheme, darkTheme } from './theme';

interface DoubleEliminationBracketViewProps {
  games: BracketGame[];
  dense?: boolean;
  theme?: TournamentTheme;
}

/* ─── Constants ─── */
const HEADER_H = 36; // px — round label header height
const BASE_SLOT = { normal: 130, dense: 92 }; // px per game in the densest round

/* ─── BracketColumn — fixed slot heights ─── */
function BracketColumn({
  round,
  slotHeight,
  dense,
  theme,
}: {
  round: RoundGroup;
  slotHeight: number;
  dense?: boolean;
  theme: TournamentTheme;
}) {
  const label = getDoubleElimRoundLabel(round.roundName);
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

/* ─── ConnectorColumn — absolute-positioned lines for precise alignment ─── */
function ConnectorColumn({
  feedCount,
  outputCount,
  feedSlotHeight,
  direction,
  dense,
  theme,
}: {
  feedCount: number;
  outputCount: number;
  feedSlotHeight: number;
  direction: 'right' | 'left';
  dense?: boolean;
  theme: TournamentTheme;
}) {
  const connW = dense ? 36 : 48;
  const isMerge = feedCount === outputCount * 2;
  const isRight = direction === 'right';
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
  //
  // Right-pointing:        Left-pointing:
  //   game A ─────┐            ┌───── game A
  //               ├────   ────┤
  //   game B ─────┘            └───── game B
  //
  // Input lines sit on the side where games are, output on the opposite side.

  const inputSide: React.CSSProperties = isRight ? { left: 0 } : { left: '50%' };
  const outputSide: React.CSSProperties = isRight ? { left: '50%' } : { left: 0 };

  return (
    <div className="flex flex-col" style={{ width: connW, minWidth: connW }}>
      <div style={{ height: HEADER_H }} />
      {Array.from({ length: outputCount }).map((_, i) => (
        <div key={i} style={{ height: feedSlotHeight * 2 }} className="relative">
          {/* Top input: horizontal line from game A center to vertical bar */}
          <div
            className={`absolute border-t-2 ${theme.connectorBorder}`}
            style={{ top: halfSlot, width: '50%', ...inputSide }}
          />
          {/* Bottom input: horizontal line from game B center to vertical bar */}
          <div
            className={`absolute border-t-2 ${theme.connectorBorder}`}
            style={{ top: halfSlot * 3, width: '50%', ...inputSide }}
          />
          {/* Vertical bar: connects game A center → game B center */}
          <div
            className={`absolute border-l-2 ${theme.connectorBorder}`}
            style={{ top: halfSlot, left: '50%', height: feedSlotHeight }}
          />
          {/* Output: horizontal line from vertical bar midpoint to next round */}
          <div
            className={`absolute border-t-2 ${theme.connectorBorder}`}
            style={{ top: feedSlotHeight, width: '50%', ...outputSide }}
          />
        </div>
      ))}
    </div>
  );
}

/* ─── Winners Zone (left → center) ─── */
function WinnersZone({
  rounds,
  totalHeight,
  dense,
  theme,
}: {
  rounds: RoundGroup[];
  totalHeight: number;
  dense?: boolean;
  theme: TournamentTheme;
}) {
  return (
    <div className="flex flex-col">
      <div className={`px-3 py-1.5 mb-1 text-xs font-bold uppercase tracking-wider ${theme.sectionHeaderWinners} rounded-t-lg text-center`}>
        Winners Bracket
      </div>
      <div className="flex items-start">
        {rounds.map((round, idx) => {
          const isLast = idx === rounds.length - 1;
          const slotH = totalHeight / round.games.length;
          const nextRound = !isLast ? rounds[idx + 1] : null;

          return (
            <div key={`w-${round.roundNumber}-${idx}`} className="flex">
              <BracketColumn round={round} slotHeight={slotH} dense={dense} theme={theme} />
              {nextRound && (
                <ConnectorColumn
                  feedCount={round.games.length}
                  outputCount={nextRound.games.length}
                  feedSlotHeight={slotH}
                  direction="right"
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

/* ─── Losers Zone (displayed reversed: L6 near center, L1 far right) ─── */
function LosersZone({
  rounds,
  totalHeight,
  dense,
  theme,
}: {
  rounds: RoundGroup[];
  totalHeight: number;
  dense?: boolean;
  theme: TournamentTheme;
}) {
  const displayRounds = [...rounds].reverse();

  return (
    <div className="flex flex-col">
      <div className={`px-3 py-1.5 mb-1 text-xs font-bold uppercase tracking-wider ${theme.sectionHeaderLosers} rounded-t-lg text-center`}>
        Losers Bracket
      </div>
      <div className="flex items-start">
        {displayRounds.map((round, idx) => {
          const isLast = idx === displayRounds.length - 1;
          const slotH = totalHeight / round.games.length;
          const rightCol = !isLast ? displayRounds[idx + 1] : null;

          return (
            <div key={`l-${round.roundNumber}-${idx}`} className="flex">
              <BracketColumn round={round} slotHeight={slotH} dense={dense} theme={theme} />
              {rightCol && (
                <ConnectorColumn
                  feedCount={rightCol.games.length}
                  outputCount={round.games.length}
                  feedSlotHeight={totalHeight / rightCol.games.length}
                  direction="left"
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

/* ─── Finals Zone (center) ─── */
function FinalsZone({
  rounds,
  totalHeight,
  dense,
  theme,
}: {
  rounds: RoundGroup[];
  totalHeight: number;
  dense?: boolean;
  theme: TournamentTheme;
}) {
  const allGames = rounds.flatMap((r) => r.games);

  return (
    <div className={`flex flex-col ${dense ? 'min-w-[200px]' : 'min-w-[250px]'}`}>
      <div className={`px-3 py-1.5 mb-1 text-xs font-bold uppercase tracking-wider ${theme.sectionHeaderFinals} rounded-t-lg text-center`}>
        Finals
      </div>
      <div
        style={{ height: totalHeight + HEADER_H }}
        className={`flex flex-col justify-center ${dense ? 'gap-4 px-2' : 'gap-6 px-3'}`}
      >
        {allGames.map((game) => (
          <div key={game.id}>
            <div className="text-center mb-1">
              <span className={`text-[10px] font-bold ${theme.roundLabel} uppercase tracking-wider`}>
                {getDoubleElimRoundLabel(game.roundName)}
              </span>
            </div>
            <MatchCard
              game={game}
              compact
              dense={dense}
              theme={theme}
              showMatchNumber={!!game.matchNumber}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Theme Toggle — segmented Day / Night switch ─── */
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

/* ─── Mobile: tab navigation ─── */
function MobileBracket({
  sections,
  theme,
}: {
  sections: BracketSection[];
  theme: TournamentTheme;
}) {
  const [activeSection, setActiveSection] = useState(0);
  const currentSection = sections[activeSection];
  const [activeRound, setActiveRound] = useState(0);
  const currentRound = currentSection?.rounds[activeRound];

  const handleSectionChange = (idx: number) => {
    setActiveSection(idx);
    setActiveRound(0);
  };

  if (!currentSection) return null;

  return (
    <div>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {sections.map((sec, idx) => {
          const isActive = idx === activeSection;
          const pillColor =
            sec.side === 'winners'
              ? isActive ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'
              : sec.side === 'losers'
              ? isActive ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-700'
              : isActive ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700';
          return (
            <button
              key={sec.side}
              onClick={() => handleSectionChange(idx)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${pillColor}`}
            >
              {sec.label}
            </button>
          );
        })}
      </div>

      <div className="flex overflow-x-auto gap-2 pb-3 mb-4 -mx-1 px-1">
        {currentSection.rounds.map((round, idx) => {
          const label = getDoubleElimRoundLabel(round.roundName);
          const isActive = idx === activeRound;
          return (
            <button
              key={`${round.roundNumber}-${idx}`}
              onClick={() => setActiveRound(idx)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors
                ${isActive ? 'bg-footvolley-primary text-white' : theme.roundPillInactive}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {currentRound && (
        <div className="space-y-3">
          {currentRound.games.map((game) => (
            <div key={game.id} className="flex justify-center">
              <MatchCard game={game} compact theme={theme} showMatchNumber={!!game.matchNumber} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Desktop: Winners → Finals ← Losers ─── */
function DesktopBracket({
  sections,
  dense,
  theme,
}: {
  sections: BracketSection[];
  dense?: boolean;
  theme: TournamentTheme;
}) {
  const winnersSection = sections.find((s) => s.side === 'winners');
  const losersSection = sections.find((s) => s.side === 'losers');
  const finalsSection = sections.find((s) => s.side === 'finals');

  // Calculate a shared total height from the densest round across all sections
  const allRounds = sections.flatMap((s) => s.rounds);
  const maxGames = Math.max(...allRounds.map((r) => r.games.length), 1);
  const baseSlot = dense ? BASE_SLOT.dense : BASE_SLOT.normal;
  const totalHeight = maxGames * baseSlot;

  const dividerSpacing = dense ? 'mx-4' : 'mx-6';

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex items-start min-w-max">
        {winnersSection && (
          <WinnersZone rounds={winnersSection.rounds} totalHeight={totalHeight} dense={dense} theme={theme} />
        )}

        {winnersSection && finalsSection && (
          <div className={`${dividerSpacing} w-px bg-gray-600/30 self-stretch`} />
        )}

        {finalsSection && (
          <FinalsZone rounds={finalsSection.rounds} totalHeight={totalHeight} dense={dense} theme={theme} />
        )}

        {finalsSection && losersSection && (
          <div className={`${dividerSpacing} w-px bg-gray-600/30 self-stretch`} />
        )}

        {losersSection && (
          <LosersZone rounds={losersSection.rounds} totalHeight={totalHeight} dense={dense} theme={theme} />
        )}
      </div>
    </div>
  );
}

/* ─── Helpers ─── */
function isThemeDark(theme?: TournamentTheme): boolean {
  return !!theme?.cardBg?.includes('dark');
}

/* ─── Main Export ─── */
export default function DoubleEliminationBracketView({
  games,
  dense = false,
  theme: externalTheme,
}: DoubleEliminationBracketViewProps) {
  const [isDark, setIsDark] = useState(() => isThemeDark(externalTheme));
  const theme = isDark ? darkTheme : lightTheme;

  const sections = classifyDoubleEliminationRounds(games);

  if (sections.length === 0) {
    return (
      <div className="text-center py-12">
        <div className={`${theme.emptyIcon} text-5xl mb-3`}>&#127942;</div>
        <p className={`${theme.emptyText} font-medium`}>No bracket games to display</p>
      </div>
    );
  }

  return (
    <div>
      {/* Theme toggle — always visible, hidden in print */}
      <div className="flex justify-end mb-3 no-print">
        <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
      </div>

      <div className={`rounded-xl transition-colors ${isDark ? '' : 'bg-slate-800/50 p-3'}`}>
        {dense ? (
          <DesktopBracket sections={sections} dense theme={theme} />
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block">
              <DesktopBracket sections={sections} theme={theme} />
            </div>
            {/* Mobile */}
            <div className="md:hidden">
              <MobileBracket sections={sections} theme={theme} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
