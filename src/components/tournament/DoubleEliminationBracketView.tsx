'use client';

import { useState } from 'react';
import {
  BracketGame,
  classifyDoubleEliminationRounds,
  getDoubleElimRoundLabel,
  BracketSection,
} from '@/lib/bracketUtils';
import MatchCard from './MatchCard';
import { TournamentTheme, lightTheme } from './theme';

interface DoubleEliminationBracketViewProps {
  games: BracketGame[];
  dense?: boolean;
  theme?: TournamentTheme;
}

/* --- Section Header --- */
function SectionHeader({
  section,
  theme,
}: {
  section: BracketSection;
  theme: TournamentTheme;
}) {
  const headerClass =
    section.side === 'winners'
      ? theme.sectionHeaderWinners
      : section.side === 'losers'
      ? theme.sectionHeaderLosers
      : theme.sectionHeaderFinals;

  return (
    <div className={`px-4 py-2 rounded-t-lg font-bold text-sm uppercase tracking-wider ${headerClass}`}>
      {section.label}
    </div>
  );
}

/* --- Desktop section with connector lines --- */
function DesktopSection({
  section,
  dense,
  theme,
}: {
  section: BracketSection;
  dense?: boolean;
  theme: TournamentTheme;
}) {
  const colMinWidth = dense ? 'min-w-[180px]' : theme.bracketColumnMinWidth;
  const connectorWidth = 'w-[32px] min-w-[32px]';

  return (
    <div className={`rounded-lg border ${theme.sectionDivider} overflow-hidden`}>
      <SectionHeader section={section} theme={theme} />
      <div className="overflow-x-auto pb-4 pt-2 px-2">
        <div className="flex items-stretch min-w-max">
          {section.rounds.map((round, roundIdx) => {
            const label = getDoubleElimRoundLabel(round.roundName);
            const isLast = roundIdx === section.rounds.length - 1;

            return (
              <div key={`${section.side}-${round.roundNumber}-${roundIdx}`} className="flex">
                {/* Round column */}
                <div className={`flex flex-col ${colMinWidth}`}>
                  {/* Header */}
                  <div className="text-center mb-4 px-2">
                    <span className={`text-xs font-bold ${theme.roundLabel} uppercase tracking-wider`}>
                      {label}
                    </span>
                  </div>
                  {/* Games with flex spacers */}
                  <div className="flex flex-col justify-around flex-1 gap-0">
                    <div style={{ flexGrow: 0.5 }} />
                    {round.games.map((game, gi) => (
                      <div key={game.id}>
                        <div className="px-2">
                          <MatchCard
                            game={game}
                            compact
                            dense={dense}
                            theme={theme}
                            showMatchNumber={!!game.matchNumber}
                          />
                        </div>
                        {gi < round.games.length - 1 && <div style={{ flexGrow: 1 }} />}
                      </div>
                    ))}
                    <div style={{ flexGrow: 0.5 }} />
                  </div>
                </div>

                {/* Connector column */}
                {!isLast && (
                  <div className={`flex flex-col justify-around flex-1 ${connectorWidth}`}>
                    <div style={{ flexGrow: 0.5 }} />
                    {round.games.map((game, gi) => {
                      const isTop = gi % 2 === 0;
                      const hasPartner = gi + 1 < round.games.length;

                      if (isTop && hasPartner) {
                        return (
                          <div key={`conn-${gi}`} className="flex flex-col" style={{ flexGrow: 1 }}>
                            <div className={`flex-1 border-b-2 border-r-2 ${theme.connectorBorder} rounded-tr`} />
                            <div className={`flex-1 border-t-2 border-r-2 ${theme.connectorBorder} rounded-br`} />
                          </div>
                        );
                      } else if (!isTop) {
                        return null;
                      } else {
                        return (
                          <div key={`conn-${gi}`} style={{ flexGrow: 1 }}>
                            <div className="h-full flex items-center">
                              <div className={`w-full border-t-2 ${theme.connectorBorder}`} />
                            </div>
                          </div>
                        );
                      }
                    })}
                    <div style={{ flexGrow: 0.5 }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* --- Mobile: tab navigation for sections then rounds --- */
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
      {/* Section tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {sections.map((sec, idx) => {
          const isActive = idx === activeSection;
          const pillColor =
            sec.side === 'winners'
              ? isActive
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-100 text-emerald-700'
              : sec.side === 'losers'
              ? isActive
                ? 'bg-orange-500 text-white'
                : 'bg-orange-100 text-orange-700'
              : isActive
              ? 'bg-amber-500 text-white'
              : 'bg-amber-100 text-amber-700';
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

      {/* Round pills */}
      <div className="flex overflow-x-auto gap-2 pb-3 mb-4 -mx-1 px-1">
        {currentSection.rounds.map((round, idx) => {
          const label = getDoubleElimRoundLabel(round.roundName);
          const isActive = idx === activeRound;
          return (
            <button
              key={`${round.roundNumber}-${idx}`}
              onClick={() => setActiveRound(idx)}
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

      {/* Stacked cards */}
      {currentRound && (
        <div className="space-y-3">
          {currentRound.games.map((game) => (
            <div key={game.id} className="flex justify-center">
              <MatchCard
                game={game}
                compact
                theme={theme}
                showMatchNumber={!!game.matchNumber}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DoubleEliminationBracketView({
  games,
  dense = false,
  theme = lightTheme,
}: DoubleEliminationBracketViewProps) {
  const sections = classifyDoubleEliminationRounds(games);

  if (sections.length === 0) {
    return (
      <div className="text-center py-12">
        <div className={`${theme.emptyIcon} text-5xl mb-3`}>&#127942;</div>
        <p className={`${theme.emptyText} font-medium`}>No bracket games to display</p>
      </div>
    );
  }

  // Dense/poster mode: always desktop
  if (dense) {
    return (
      <div className="space-y-6">
        {sections.map((section) => (
          <DesktopSection
            key={section.side}
            section={section}
            dense
            theme={theme}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block space-y-6">
        {sections.map((section) => (
          <DesktopSection
            key={section.side}
            section={section}
            theme={theme}
          />
        ))}
      </div>
      {/* Mobile */}
      <div className="md:hidden">
        <MobileBracket sections={sections} theme={theme} />
      </div>
    </>
  );
}
