export interface TournamentTheme {
  // Card
  cardBorder: string;
  cardLiveBorder: string;
  cardBg: string;
  cardWinnerBg: string;
  cardText: string;
  cardScoreText: string;
  cardFooterBg: string;
  cardFooterText: string;
  cardDivider: string;
  cardTbdOpacity: string;
  cardBo3Badge: string;
  cardSetScoreBg: string;
  cardSet3Text: string;

  // Bracket
  connectorBorder: string;
  roundLabel: string;
  roundPillInactive: string;
  bracketColumnMinWidth: string;

  // Group stage
  groupCardBorder: string;
  groupHeaderBg: string;
  tableHeaderBg: string;
  tableHeaderText: string;
  tableRowHover: string;
  tableRowBorder: string;
  tableCellBg: string;
  rankText: string;
  teamNameText: string;
  winsText: string;
  lossesText: string;
  diffPositive: string;
  diffNegative: string;
  diffNeutral: string;
  legendBg: string;
  legendText: string;
  matchesSectionBg: string;
  matchesSectionHeaderBg: string;
  matchesSectionHeaderText: string;

  // Round robin
  diagonalCell: string;
  winCell: string;
  lossCell: string;
  pendingCell: string;
  emptyCell: string;
  rowEven: string;
  rowOdd: string;
  rowLabel: string;
  cellBorder: string;
  tableBorder: string;
  standingsRowBg: string;
  pointsText: string;

  // Section headings
  sectionHeading: string;

  // Empty state
  emptyIcon: string;
  emptyText: string;
  emptySubtext: string;

  // Toggle buttons (TournamentBracketView)
  toggleBg: string;
  toggleActive: string;
  toggleInactive: string;
  gamesHeading: string;
  flatRoundDivider: string;
  flatRoundLabel: string;

  // Double-elimination section headers
  sectionHeaderWinners: string;
  sectionHeaderLosers: string;
  sectionHeaderFinals: string;
  sectionDivider: string;
  matchNumberBadge: string;
}

export const lightTheme: TournamentTheme = {
  // Card
  cardBorder: 'border-slate-600/50',
  cardLiveBorder: 'border-red-400 ring-2 ring-red-300/40',
  cardBg: 'bg-slate-800/50 text-slate-300',
  cardWinnerBg: 'bg-footvolley-primary text-white',
  cardText: '',
  cardScoreText: '',
  cardFooterBg: 'bg-slate-700/30',
  cardFooterText: 'text-gray-400',
  cardDivider: 'border-gray-100',
  cardTbdOpacity: 'opacity-50',
  cardBo3Badge: 'bg-[#1a2744] text-[#c4a35a]',
  cardSetScoreBg: 'bg-slate-700/30',
  cardSet3Text: 'text-amber-600',

  // Bracket
  connectorBorder: 'border-slate-600/50',
  roundLabel: 'text-gray-400',
  roundPillInactive: 'bg-slate-700/30 text-slate-400 hover:bg-slate-600/30',
  bracketColumnMinWidth: 'min-w-[240px]',

  // Group stage
  groupCardBorder: 'border-slate-600/50',
  groupHeaderBg: 'bg-footvolley-primary',
  tableHeaderBg: 'bg-slate-700/30',
  tableHeaderText: 'text-gray-400',
  tableRowHover: 'hover:bg-slate-700/30',
  tableRowBorder: 'border-gray-100',
  tableCellBg: '',
  rankText: 'text-gray-400',
  teamNameText: 'text-slate-200',
  winsText: 'text-green-600',
  lossesText: 'text-red-500',
  diffPositive: 'text-green-600',
  diffNegative: 'text-red-500',
  diffNeutral: 'text-gray-400',
  legendBg: 'bg-slate-700/30',
  legendText: 'text-gray-400',
  matchesSectionBg: '',
  matchesSectionHeaderBg: 'bg-slate-700/30',
  matchesSectionHeaderText: 'text-gray-400',

  // Round robin
  diagonalCell: 'bg-gray-800',
  winCell: 'bg-green-50 text-green-700 font-semibold',
  lossCell: 'bg-red-50 text-red-600',
  pendingCell: 'text-gray-300',
  emptyCell: 'text-gray-200',
  rowEven: 'bg-slate-800/30',
  rowOdd: 'bg-slate-700/30',
  rowLabel: 'text-slate-200',
  cellBorder: 'border-gray-100',
  tableBorder: 'border-slate-600/50 shadow-sm',
  standingsRowBg: '',
  pointsText: 'text-slate-400',

  // Section headings
  sectionHeading: 'text-white',

  // Empty state
  emptyIcon: 'text-gray-300',
  emptyText: 'text-gray-400',
  emptySubtext: 'text-gray-300',

  // Toggle
  toggleBg: 'bg-slate-700/30',
  toggleActive: 'bg-slate-800 text-white shadow-sm',
  toggleInactive: 'text-slate-400 hover:text-slate-200',
  gamesHeading: 'text-white',
  flatRoundDivider: 'bg-gray-300',
  flatRoundLabel: 'text-gray-400',

  // Double-elimination section headers
  sectionHeaderWinners: 'bg-emerald-600 text-white',
  sectionHeaderLosers: 'bg-orange-500 text-white',
  sectionHeaderFinals: 'bg-amber-500 text-white',
  sectionDivider: 'border-slate-600/50',
  matchNumberBadge: 'bg-slate-700/30 text-slate-400',
};

export const darkTheme: TournamentTheme = {
  // Card
  cardBorder: 'border-dark-border',
  cardLiveBorder: 'border-red-500/60 ring-2 ring-red-500/40',
  cardBg: 'bg-dark-surface text-gray-300',
  cardWinnerBg: 'bg-footvolley-primary text-white',
  cardText: 'text-gray-500',
  cardScoreText: 'text-gray-500',
  cardFooterBg: 'bg-dark-elevated',
  cardFooterText: 'text-gray-500',
  cardDivider: 'border-dark-border',
  cardTbdOpacity: 'opacity-40',
  cardBo3Badge: 'bg-footvolley-primary text-footvolley-accent',
  cardSetScoreBg: 'bg-dark-elevated',
  cardSet3Text: 'text-footvolley-accent',

  // Bracket
  connectorBorder: 'border-dark-divider',
  roundLabel: 'text-gray-500',
  roundPillInactive: 'bg-dark-elevated text-gray-400 hover:bg-dark-divider',
  bracketColumnMinWidth: 'min-w-[280px]',

  // Group stage
  groupCardBorder: 'border-dark-border',
  groupHeaderBg: 'bg-gradient-to-r from-footvolley-primary to-footvolley-primary/70',
  tableHeaderBg: 'bg-dark-elevated',
  tableHeaderText: 'text-gray-500',
  tableRowHover: 'hover:bg-dark-elevated',
  tableRowBorder: 'border-dark-border',
  tableCellBg: 'bg-dark-surface',
  rankText: 'text-gray-500',
  teamNameText: 'text-gray-200',
  winsText: 'text-green-400',
  lossesText: 'text-red-400',
  diffPositive: 'text-green-400',
  diffNegative: 'text-red-400',
  diffNeutral: 'text-gray-500',
  legendBg: 'bg-dark-elevated',
  legendText: 'text-gray-500',
  matchesSectionBg: 'bg-dark-surface',
  matchesSectionHeaderBg: 'bg-dark-elevated',
  matchesSectionHeaderText: 'text-gray-500',

  // Round robin
  diagonalCell: 'bg-dark-bg',
  winCell: 'bg-green-900/30 text-green-400 font-semibold',
  lossCell: 'bg-red-900/20 text-red-400',
  pendingCell: 'text-slate-400',
  emptyCell: 'text-slate-300',
  rowEven: 'bg-dark-surface',
  rowOdd: 'bg-dark-elevated',
  rowLabel: 'text-gray-200',
  cellBorder: 'border-dark-border',
  tableBorder: 'border-dark-border',
  standingsRowBg: 'bg-dark-surface',
  pointsText: 'text-gray-400',

  // Section headings
  sectionHeading: 'text-gray-100',

  // Empty state
  emptyIcon: 'text-slate-400',
  emptyText: 'text-gray-500',
  emptySubtext: 'text-slate-400',

  // Toggle
  toggleBg: 'bg-dark-elevated',
  toggleActive: 'bg-dark-surface text-white shadow-sm',
  toggleInactive: 'text-gray-400 hover:text-gray-200',
  gamesHeading: 'text-gray-100',
  flatRoundDivider: 'bg-dark-divider',
  flatRoundLabel: 'text-gray-500',

  // Double-elimination section headers
  sectionHeaderWinners: 'bg-emerald-700 text-white',
  sectionHeaderLosers: 'bg-orange-700 text-white',
  sectionHeaderFinals: 'bg-amber-600 text-white',
  sectionDivider: 'border-dark-border',
  matchNumberBadge: 'bg-dark-elevated text-gray-500',
};
