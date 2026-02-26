# Bracket Visualization Component — Detailed Specification

## 1. Overview

Build a `DoubleEliminationBracketView` component that renders winners bracket, losers bracket, and grand finals as a unified visualization. This component will be integrated into the existing `TournamentBracketView` smart wrapper and will activate when the tournament format is `bracket` (or `double_elimination`) and the game data contains rounds with W/L naming patterns (e.g., `W1`, `L1`, `W2`, `L2`, etc.).

## 2. Current State

### What Exists
- **`BracketView.tsx`**: Renders single-elimination brackets only. Filters to `roundType === 'knockout'` games, groups by `roundNumber`, renders columns with connector lines (desktop) or tabbed round pills (mobile).
- **`MatchCard.tsx`**: Individual match card supporting live indicators, winner highlighting, Bo3 set scores, court/time footer. Fully theme-aware.
- **`TournamentBracketView.tsx`**: Smart wrapper that selects `BracketView`, `GroupStageView`, or `RoundRobinView` based on format. Currently no double-elimination path.
- **`bracketUtils.ts`**: Utilities for `groupGamesByRound()`, `groupGamesByGroup()`, `getRoundLabel()`. Interfaces: `BracketGame`, `RoundGroup`, `GroupCluster`.
- **`theme.ts`**: `TournamentTheme` interface with bracket-specific tokens (`connectorBorder`, `roundLabel`, `bracketColumnMinWidth`). Light and dark themes.
- **`LiveRefresh.tsx`**: Polling-based live refresh (30s interval, `router.refresh()`).
- **NFA Orlando seed**: Real double-elimination data with rounds named `W1`, `L1`, `W2`, `L2`, `W3`, `L3`, `L4`, `W4`, `L5`, `L6`, `SF`, `Final`, `3rd Place`.

### Data Model
- Round names follow the pattern: `'Nth Round W1'`, `'Nth Round L1'`, `'SF'`, `'Final'`, `'3rd Place'`.
- All rounds have `type: 'knockout'` — there is no separate `roundType` for winners vs losers.
- The W/L designation is embedded in the round `name` field.
- `BracketGame.roundName` carries the round name from the DB.

## 3. Component Architecture

### 3.1 New Utility: `classifyDoubleEliminationRounds()`

**File**: `src/lib/bracketUtils.ts`

```typescript
export interface DoubleEliminationBracket {
  winnersRounds: RoundGroup[];   // Rounds containing 'W' in name
  losersRounds: RoundGroup[];    // Rounds containing 'L' in name
  grandFinals: BracketGame[];    // SF + Final + 3rd Place games
}

export function classifyDoubleEliminationRounds(
  games: BracketGame[]
): DoubleEliminationBracket;
```

**Classification Logic**:
1. Group all knockout games by round (using existing `groupGamesByRound`).
2. For each round, inspect `roundName`:
   - Contains ` W` (space+W followed by digit) → winners bracket
   - Contains ` L` (space+L followed by digit) → losers bracket
   - Contains `SF`, `Semi`, `Final`, `3rd`, or `Grand` → grand finals
   - Fallback: if round has only 1-2 games and is the last or second-to-last round → grand finals; otherwise → winners bracket
3. Return the three arrays sorted by `roundNumber`.

**Detection helper**:
```typescript
export function isDoubleElimination(games: BracketGame[]): boolean;
```
Returns `true` if games contain at least one round with `L` pattern AND one with `W` pattern in the round name.

### 3.2 New Component: `DoubleEliminationBracketView`

**File**: `src/components/tournament/DoubleEliminationBracketView.tsx`

**Props**:
```typescript
interface DoubleEliminationBracketViewProps {
  games: BracketGame[];
  dense?: boolean;
  theme?: TournamentTheme;
}
```

**Desktop Layout** (md+ breakpoint):
```
┌─────────────────────────────────────────────────────────────────┐
│ WINNERS BRACKET                                                 │
│ ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐                   │
│ │  W1  │───>│  W2  │───>│  W3  │───>│  W4  │──┐               │
│ │(16gm)│    │(8gm) │    │(4gm) │    │(2gm) │  │               │
│ └──────┘    └──────┘    └──────┘    └──────┘  │               │
├────────────────────────────────────────────────┼───────────────┤
│ LOSERS BRACKET                                 │  GRAND FINALS │
│ ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐  │  ┌──────────┐ │
│ │  L1  │───>│  L2  │───>│  L3  │───>│  L4  │──┤  │ Semifinal│ │
│ │(8gm) │    │(8gm) │    │(4gm) │    │(4gm) │  │  │ 3rd Place│ │
│ └──────┘    └──────┘    └──────┘    └──────┘  │  │ Final    │ │
│             ┌──────┐    ┌──────┐              │  └──────────┘ │
│             │  L5  │───>│  L6  │──────────────┘               │
│             │(2gm) │    │(2gm) │                               │
│             └──────┘    └──────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

The layout uses a vertically stacked approach:
- **Section 1 — Winners Bracket**: Rendered using the existing `DesktopBracket` sub-component pattern (columns with connector lines). Section header: "WINNERS BRACKET" with a gold/accent accent bar.
- **Section 2 — Losers Bracket**: Same column-based rendering. Section header: "LOSERS BRACKET" with a muted/secondary accent bar. Games are typically smaller (compact mode on inner cards).
- **Section 3 — Grand Finals**: Rendered as a centered column showing SF, 3rd Place, and Final as vertically stacked `MatchCard` components with prominent styling. Header: "GRAND FINALS".

Each section is independently horizontally scrollable.

**Mobile Layout** (below md):
- Tab navigation at the top with three pills: `Winners` | `Losers` | `Finals`
- Within each tab, use the existing `MobileBracket` round-selector pattern (round pills + stacked cards)
- Finals tab shows all grand final games as a simple vertical stack

**Visual Enhancements**:
- Section headers use theme-aware colors. Add new theme tokens:
  - `sectionHeaderWinners: string` (e.g., `'bg-amber-500/10 text-amber-700'` light, `'bg-amber-500/20 text-amber-400'` dark)
  - `sectionHeaderLosers: string` (e.g., `'bg-gray-100 text-gray-600'` light, `'bg-gray-800 text-gray-400'` dark)
  - `sectionHeaderFinals: string` (e.g., `'bg-footvolley-primary/10 text-footvolley-primary'` light, dark variant)
- Connector lines between winners/losers and grand finals sections are drawn as dashed vertical lines on desktop
- Grand finals match cards use larger sizing (non-compact) with additional prominence styling

### 3.3 Theme Extensions

**File**: `src/components/tournament/theme.ts`

Add to `TournamentTheme` interface:
```typescript
// Double elimination sections
sectionHeaderWinners: string;
sectionHeaderLosers: string;
sectionHeaderFinals: string;
sectionDivider: string;
```

Add corresponding values to `lightTheme` and `darkTheme`.

### 3.4 Integration into `TournamentBracketView`

**File**: `src/components/tournament/TournamentBracketView.tsx`

Modify `renderBracketView()` to:
1. Import `isDoubleElimination` and `DoubleEliminationBracketView`.
2. Before the existing switch statement, check: `if (isDoubleElimination(games)) return <DoubleEliminationBracketView ... />`.
3. This auto-detection means no format string changes are needed — the component inspects game data.
4. Also handle the explicit case `case 'double_elimination':` in the switch to force this view.

### 3.5 `getRoundLabel()` Enhancement

**File**: `src/lib/bracketUtils.ts`

Update `getRoundLabel()` to handle double-elimination round names more gracefully:
- If `roundName` contains `W1`/`W2`/etc → display as "Winners R1", "Winners R2", etc.
- If `roundName` contains `L1`/`L2`/etc → display as "Losers R1", "Losers R2", etc.
- `SF` → "Semifinals"
- `Final` → "Final"
- `3rd` → "3rd Place"

Add a new function:
```typescript
export function getDoubleElimRoundLabel(roundName: string): string;
```

## 4. Live Updates

### Current Mechanism
The app uses `LiveRefresh` (polling every 30s via `router.refresh()`). This works for Server Components because `router.refresh()` re-fetches server data without full page reload.

### Enhancement for This Component
- The `DoubleEliminationBracketView` is a client component receiving `games` as props.
- Live updates flow through the parent page's server-side data fetch → re-render props down.
- **No new WebSocket/SSE infrastructure needed** — the existing polling mechanism already handles this.
- Add visual feedback: when a game transitions from `scheduled` → `in_progress`, the `MatchCard` already shows a pulsing red LIVE indicator.
- Add a `lastUpdated` timestamp display in the component footer: "Last updated: X seconds ago" with a refresh countdown ring (purely cosmetic, driven by parent's LiveRefresh).
- On the public event page (`/e/[id]`), the `LiveRefresh` component is already included. No changes needed.
- On the tournament detail page (`/tournaments/[id]`), ensure `LiveRefresh` is included when the tournament status is `in_progress`.

### Future Enhancement (Out of Scope)
- Server-Sent Events (SSE) endpoint for real-time push updates could replace polling but is not required for this task.

## 5. File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/lib/bracketUtils.ts` | Edit | Add `classifyDoubleEliminationRounds()`, `isDoubleElimination()`, `getDoubleElimRoundLabel()` |
| `src/components/tournament/theme.ts` | Edit | Add 4 new theme tokens to interface + both theme objects |
| `src/components/tournament/DoubleEliminationBracketView.tsx` | Create | New component with desktop (stacked sections) and mobile (tabbed) layouts |
| `src/components/tournament/TournamentBracketView.tsx` | Edit | Add auto-detection + explicit `double_elimination` case |

## 6. Edge Cases

1. **Single-elimination tournaments with W/L-named rounds**: `isDoubleElimination()` requires BOTH W and L patterns. A tournament with only `W1, W2, SF, Final` (no losers rounds) will be treated as single-elimination and rendered by existing `BracketView`.
2. **Incomplete brackets**: Games with `player1 === 'TBD'` render with reduced opacity (existing MatchCard behavior).
3. **No games yet**: Falls through to existing empty state in `TournamentBracketView`.
4. **Mixed round types**: Only `roundType === 'knockout'` games are included (consistent with existing `BracketView` filtering).
5. **Varied double-elimination structures**: The NFA Orlando data shows multiple structures (32-team full DE, 8-team modified, 16-team single-elim). The classifier handles all via pattern matching on round names.
6. **Category-aware**: Works per-category since games are already filtered by `categoryId` before reaching the component.

## 7. Responsive Behavior

- **Desktop (md+)**: Full bracket visualization with connector lines per section, horizontally scrollable sections.
- **Mobile (<md)**: Tab-based navigation (Winners | Losers | Finals), round pills within each tab, vertically stacked match cards.
- **Dense/Poster mode**: All sections rendered in desktop layout regardless of screen size, compact card sizing.

## 8. Performance Considerations

- All bracket classification happens client-side on the already-fetched games array (typically <100 games per category). No additional API calls.
- Connector line rendering uses CSS flexbox (no canvas/SVG), consistent with existing `BracketView`.
- Theme tokens use Tailwind classes — no runtime style computation.

---

## Acceptance Criteria

- **[AC-1]** DoubleEliminationBracketView renders three labeled sections: Winners Bracket, Losers Bracket, and Grand Finals when given double-elimination game data
- **[AC-2]** Winners bracket section displays all W-rounds (W1, W2, W3, W4) in column layout with connector lines on desktop
- **[AC-3]** Losers bracket section displays all L-rounds (L1-L6) in column layout with connector lines on desktop
- **[AC-4]** Grand Finals section displays Semifinal, 3rd Place, and Final matches prominently
- **[AC-5]** isDoubleElimination() correctly detects double-elimination game data based on round name patterns
- **[AC-6]** classifyDoubleEliminationRounds() correctly separates games into winners, losers, and grand finals arrays
- **[AC-7]** TournamentBracketView auto-detects double elimination and renders DoubleEliminationBracketView
- **[AC-8]** Mobile layout shows tab navigation with Winners, Losers, and Finals tabs
- **[AC-9]** Component supports both light and dark themes via TournamentTheme prop
- **[AC-10]** Live game indicators display correctly for in-progress matches
- **[AC-11]** Component works with the existing LiveRefresh polling mechanism for live score updates
- **[AC-12]** Dense/poster mode renders all sections in desktop layout regardless of viewport size
- **[AC-13]** Single-elimination tournaments still render with existing BracketView
- **[AC-14]** Empty state displays correctly when no games exist
- **[AC-15]** TBD matches render with reduced opacity in all bracket sections
- **[AC-16]** Round labels display context-appropriate names for double elimination
- **[AC-17]** Component handles varied double-elimination bracket sizes (8-team modified, 32-team full)
- **[AC-18]** Horizontal scrolling works independently per bracket section on desktop
