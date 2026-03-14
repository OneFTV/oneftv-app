# Bracket Visualization Component — Detailed Specification

> **Status:** Implemented (diverged from original design — see §3 Implementation Notes)
> **Last updated:** 2026-03-10

## 1. Overview

Build a bracket visualization for NFA cascade tournaments that renders all divisions (D1/D2/D3, and optionally D4) in a tabbed, horizontally-scrollable bracket view with live SVG connector lines between matches.

**Original design** specified a `DoubleEliminationBracketView` with three stacked sections (Winners / Losers / Grand Finals). **Actual implementation** replaced this with `NfaBracketView` — a multi-division tabbed component purpose-built for the NFA cascade format (where divisions are earned, not pre-assigned). See §3 for divergence rationale.

---

## 2. Current State (as-built)

### What Was Built

- **`NfaBracketView.tsx`** — Primary NFA bracket component. Tabbed per-division view (D1/D2/D3/D4 + Schedule). Each tab renders an independently horizontally-scrollable bracket via `NfaBracketHorizontal`. Client component (`'use client'`).
- **`NfaBracketHorizontal`** — Inner component for one division. Renders `BracketColumn` list + `ConnectorOverlay` SVG. Uses `bracketRef` to anchor SVG positioning.
- **`ConnectorOverlay`** — SVG overlay that draws elbow-path connector lines between match cards. Reads positions via `getBoundingClientRect()` on `[data-game-id]` elements. Re-draws on resize and after first paint (rAF fix).
- **`BracketColumn`** — Single column in a bracket. Uses `finalsStack` (DE finals: SF1/SF2 in flow, F+3P centred) or `finalsPair` (SE finals: F centred, 3P below) layouts.
- **`NfaMatchCard`** — Wrapper around `MatchCard` that attaches `data-game-id` attribute and renders `seedTarget` cascade badge.
- **`nfaBracketLayout.ts`** — Column definitions per division+mode via `getColumnDefs(division, divisionCount)`. Returns `NfaBracketColumn[]`.
- **`MatchCard.tsx`** — Individual match card (unchanged from original design). Dense mode with `min-w-[160px]`, Bo3 set scores, live indicator, winner highlight.
- **`bracketUtils.ts`** — `BracketGame` interface extended with `winnerNextGameId`, `loserNextGameId`, `categoryId`, `matchNumber`, `bracketSide`, `seedTarget`.

### Data Flow

```
Server component (page.tsx)
  └─ GameService.listByTournament() per division category
       └─ Prisma: game + round + players (includes winnerNextGameId, loserNextGameId)
            └─ NfaBracketView (client component, receives all division games as props)
                 └─ nfaGames = games.map() → adds division / section / round fields
                      └─ NfaBracketHorizontal (per active tab)
                           └─ ConnectorOverlay (SVG) + BracketColumn list
```

### Round / Section Derivation

`deriveRound(game)` extracts a round code from `roundName`:
- `"D3 QF"` → `"W1"`, `"D3 Semi-Final"` → `"SF"`, `"D3 Final"` → `"F"`, `"D3 Bronze"` → `"3P"` (via bracketSide fallback)
- Round codes: `W1..Wn`, `L1..Ln`, `SF`, `F`, `3P`

`deriveSection(game, round)` maps to bracket section — **round code checked first**:
```typescript
if (['SF', 'F', '3P'].includes(round)) return 'finals';  // ← must be first
if (round.startsWith('L')) return 'losers';
if (game.bracketSide) return game.bracketSide;
return 'winners';
```
> **Critical:** SE brackets (D3/D4) store `bracketSide='winners'` on SF games. Without the round-first check, SF games land in the Winners column instead of Finals. This bug was fixed in commit e9a231d.

---

## 3. Implementation Notes (Divergence from Original Design)

| Original Design | Actual Implementation | Reason |
|---|---|---|
| `DoubleEliminationBracketView` with 3 stacked sections | `NfaBracketView` with per-division tabs | NFA format has 3–4 separate division brackets, each with their own bracket type. A single DE view couldn't represent this. |
| `classifyDoubleEliminationRounds()` utility | `getColumnDefs(division, divisionCount)` in `nfaBracketLayout.ts` | Column layout is division-specific and mode-specific (3-div vs 4-div). |
| CSS flexbox connector lines | SVG `<path>` overlay via `ConnectorOverlay` | SVG elbow paths are more precise for complex routing. Uses `[data-game-id]` + `getBoundingClientRect()`. |
| `isDoubleElimination()` auto-detection on `TournamentBracketView` | Explicit `isNfaCascade` check via `category.divisionLabel != null` | NFA cascade is detected structurally, not by round name patterns. |
| Horizontal scroll per section | Horizontal scroll per division tab | One tab = one bracket = one scroll container. |
| Theme tokens `sectionHeaderWinners` etc. | Column header color via `column.headerClass` ('winners'/'losers'/'finals') | Simpler — colour is a property of the column definition. |

---

## 4. Division Bracket Structures

### Match Number Ranges (global, cross-division)

| Division | Mode | Type | Match Range | Games |
|---|---|---|---|---|
| D1 | both | Double Elimination | M1 – M62 | 62 |
| D3 | 3-div | Single Elimination (16-team) | M63 – M78 | 16 |
| D3 | 4-div | Single Elimination (8-team) | M63 – M70 | 8 |
| D2 | both | Double Elimination (8-team) | M79 – M92 | 14 |
| D4 | 4-div only | Single Elimination (8-team) | M93 – M100 | 8 |

### D1 (Double Elimination, 32-team)
- Winners: W1(16) → W2(8) → W3(4) → W4(2) → Finals
- Losers: L1(8) → L2(8) → L3(4) → L4(4) → L5(2) → L6(2) → Finals
- Finals: SF1, SF2, Bronze, Final (`finalsStack` layout)
- Column order: W1 | W2 | W3 | W4 | Finals | L6 | L5 | L4 | L3 | L2 | L1

### D2 (Double Elimination, 8-team) — M79–M92
- Winners: W1(4) → W2(2)
- Losers: L1(2) → L2(2)
- Finals: SF1, SF2, Bronze, Final
- Column order: W1 | W2 | Finals | L2 | L1

### D3 — 3-div mode (Single Elimination, 16-team) — M63–M78
- W1(8) → W2(4) → SF(2) → Final + Bronze (`finalsPair` layout)
- Column order: W1 | W2 | SF+Finals

### D3 — 4-div mode (Single Elimination, 8-team) — M63–M70
- QF(4) → SF(2) → Final + Bronze (`finalsPair` layout)
- Column order: QF | SF+Finals

### D4 — 4-div only (Single Elimination, 8-team) — M93–M100
- QF(4) → SF(2) → Final + Bronze (`finalsPair` layout)
- Column order: QF | SF+Finals

---

## 5. ConnectorOverlay — SVG Routing Lines

### How It Works
1. `useLayoutEffect` → calls `draw()` after React commits DOM changes.
2. `draw()` gathers positions: `bracketEl.querySelectorAll('[data-game-id]')` → `getBoundingClientRect()` relative to bracket container.
3. For each game with `winnerNextGameId` or `loserNextGameId` set, and both IDs present in `pos[]`, compute an elbow path and push to `paths[]`.
4. `setDims({ w: el.scrollWidth, h: el.scrollHeight })` + `setPaths(newPaths)`.
5. If `paths.length === 0 || dims.w === 0` → return `null` (no SVG rendered).
6. SVG is `absolute top-0 left-0` inside the `relative` bracket container, covers full `scrollWidth × scrollHeight`.

### Elbow Path Shape
```
M{startX},{startY} H{midX} V{endY} H{endX}
```
Right-angle connector: horizontal → vertical → horizontal.
Straight line (`H{endX}`) when vertical difference < 15px.

### Colors & Stroke
- Winners: `rgba(52,211,153,0.9)` (emerald-400)
- Losers: `rgba(251,146,60,0.9)` (orange-400)
- `strokeWidth={2.5}`, `strokeLinecap="round"`, `strokeLinejoin="round"`

### `shouldDrawConnector` Rules
- `SF → F` in separate columns: draw if `pos[tgt].cx > pos[src].cx + 50` (separates SE cross-column from DE same-column)
- Skip if target round is `F` or `3P` (except the SF→F case above)
- Skip if source round is `F` or `3P`
- Draw if same section OR target/source is `finals` section

### Known Issue Fixed: Hydration Timing
`useLayoutEffect` during Next.js SSR hydration fires before card positions are stable. The SVG produced 0 paths and returned `null`, so connectors were invisible on first load — only appearing after a browser `resize` event.

**Fix:** Added `requestAnimationFrame(() => draw())` inside the `useEffect` resize handler:
```typescript
useEffect(() => {
  const handler = () => draw();
  window.addEventListener('resize', handler);
  const raf = requestAnimationFrame(() => draw()); // post-paint re-draw
  return () => {
    window.removeEventListener('resize', handler);
    cancelAnimationFrame(raf);
  };
}, [draw]);
```

### Prerequisite: `winnerNextGameId` Must Be Wired in DB
If `winnerNextGameId` / `loserNextGameId` is `null` on game records, `draw()` finds 0 valid connections → `paths.length === 0` → SVG returns `null` → no connectors.

**Diagnosis:** `document.querySelectorAll('svg')` — if no wide SVG found, routing is unwired. Confirm via React fiber: `game.winnerNextGameId` on the card's fiber props.

**Fix endpoint:** `POST /api/tournaments/[id]/schedule/wire-routing` — patches only routing FK fields on existing games without touching scores/status/players. Safe to call on live tournaments.

---

## 6. Column Min-Width Fix

Finals columns have no right-side bracket connectors to push them wider, so they stay at their CSS minimum. With `min-w-[185px]`, the name container (~147px) was too narrow for long team names ("Rodrigo Lima & Michel Bezerra" needs ~177px), causing `overflow-hidden` to clip text.

**Fix:** Increased to `min-w-[240px]` on all `BracketColumn` wrappers. At 240px the name container (~186px) fits all observed team names. QF/SF columns naturally exceed 240px due to bracket connector hook elements.

---

## 7. File Changes (Actual)

| File | Action | Description |
|------|--------|-------------|
| `src/components/tournament/NfaBracketView.tsx` | Created | Main NFA bracket component with tabs, columns, ConnectorOverlay |
| `src/lib/nfaBracketLayout.ts` | Created | Column definitions per division/mode (`getColumnDefs`) |
| `src/modules/scheduling/double-elimination.ts` | Extended | Added `generateD3Bracket8`, `generateD4Bracket`, `generateD2Bracket` generators + routing tables |
| `src/modules/scheduling/scheduling.service.ts` | Extended | `generateEmptyDivisionBracket` with routing second-pass; `generateAllDivisionBrackets` |
| `src/modules/scheduling/scheduling.repository.ts` | Extended | `updateGameRouting()`, `findGameByMatchNumber()` |
| `src/app/api/tournaments/[id]/schedule/wire-routing/route.ts` | Created | Safe routing patch endpoint (no data loss) |
| `src/app/(public)/e/[id]/[categoryId]/page.tsx` | Modified | NFA cascade detection + multi-division game fetch |
| `src/lib/bracketUtils.ts` | Modified | `BracketGame` extended with `winnerNextGameId`, `loserNextGameId`, `categoryId`, `matchNumber`, `bracketSide`, `seedTarget` |
| `src/components/tournament/MatchCard.tsx` | Minor edits | Dense mode sizing, `seedTarget` badge |
| `src/components/tournament/TournamentBracketView.tsx` | Modified | Routes to `NfaBracketView` when `isNfaCascade` |

---

## 8. Acceptance Criteria — Updated Status

| AC | Description | Status | Notes |
|---|---|---|---|
| AC-1 | Renders labeled sections per division | ✅ | Tabbed (D1/D2/D3/D4) instead of stacked sections |
| AC-2 | Winners rounds in column layout with connector lines | ✅ | SVG ConnectorOverlay |
| AC-3 | Losers rounds in column layout with connector lines | ✅ | SVG ConnectorOverlay |
| AC-4 | Grand Finals section displays SF, 3P, Final prominently | ✅ | `finalsStack` (DE) / `finalsPair` (SE) layouts |
| AC-5 | `isDoubleElimination()` detection | ⚠️ | Not used; NFA cascade detected via `category.divisionLabel` instead |
| AC-6 | `classifyDoubleEliminationRounds()` separator | ⚠️ | Not used; `getColumnDefs` + `deriveSection/Round` replace this |
| AC-7 | TournamentBracketView auto-detects and routes | ✅ | `isNfaCascade` check → `NfaBracketView` |
| AC-8 | Mobile tab navigation | ✅ | Division tabs work on all viewports |
| AC-9 | Light and dark theme support | ✅ | `darkTheme` applied throughout |
| AC-10 | Live game indicators for in-progress matches | ✅ | Existing `MatchCard` live indicator |
| AC-11 | Works with LiveRefresh polling | ✅ | Server component re-render passes fresh props |
| AC-12 | Dense/poster mode renders all sections | ✅ | Dense mode on MatchCard |
| AC-13 | Single-elimination tournaments still use BracketView | ✅ | Non-NFA categories route to `TournamentBracketView` |
| AC-14 | Empty state when no games | ✅ | NfaBracketView empty state guard |
| AC-15 | TBD matches render with reduced opacity | ✅ | Existing MatchCard behavior |
| AC-16 | Context-appropriate round labels | ✅ | `deriveRound()` + column headers |
| AC-17 | Handles varied bracket sizes (8-team, 32-team) | ✅ | 3-div and 4-div mode; D3 8/16 team variants |
| AC-18 | Horizontal scrolling per section | ✅ | Per-division tab scroll container |

---

## 9. Known Remaining Gaps

- **D2 column headers**: Column labels show raw round label string (e.g., "10TH ROUND W1") instead of clean labels ("Winners R1"). Cosmetic only — does not affect functionality.
- **`deriveRound` for D2 Bronze**: Falls through to bracketSide heuristic, returns `'F'` instead of `'3P'`. Does not affect rendering (Bronze card renders correctly via `finalsPair` layout), but `shouldDrawConnector` filtering is affected.
- **No unit tests**: Bracket generation, routing, and `deriveSection`/`deriveRound` logic have no automated test coverage. Recommend Vitest suite for `double-elimination.ts` routing tables.
