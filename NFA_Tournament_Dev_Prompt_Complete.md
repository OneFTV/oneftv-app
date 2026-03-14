# NFA Tour Open - Tournament Bracket
## Complete Development Prompt & Logic Reference (Updated)

## 1. Tournament Overview
The NFA Tour Open is a single-entry double-elimination tournament where all teams start together in one bracket. Teams are not pre-assigned to divisions. Their final division placement (`D1`, `D2`, `D3`) is earned based on how far they progress before being eliminated twice.

All courts are shared across all concurrent matches. Match IDs are globally sequential across the entire event (for Orlando-style events, e.g., `M1` through `M92`).

---

## 2. Division Assignment Logic

When a team loses for the second time, division is assigned by the losers round where that second loss occurs:

| 2nd Loss Occurs At | Assigned Division |
|---|---|
| `L1` or `L2` | Division 3 |
| `L3` or `L4` | Division 2 |
| `L5` or `L6` | Division 1 (Finals) |

---

## 3. Division 1 - Bracket Structure

### 3.1 Winners Bracket

| Round | Matches | Notes |
|---|---:|---|
| `W1` | 16 | All teams enter here |
| `W2` | 8 | `W1` winners advance |
| `W3` | 4 | `W2` winners advance |
| `W4` | 2 | `W3` winners advance |

### 3.2 Losers Ladder

| Round | Matches | Fed By | Loser Goes To |
|---|---:|---|---|
| `L1` | 8 | `W1` losers play each other | Division 3 |
| `L2` | 8 | `L1` winners + `W2` losers | Division 3 |
| `L3` | 4 | `L2` winners play each other | Division 2 |
| `L4` | 4 | `L3` winners + `W3` losers | Division 2 |
| `L5` | 2 | `L4` winners play each other | Division 1 Finals |
| `L6` | 2 | `L5` winners + `W4` losers | Division 1 Finals |

### 3.3 Division 1 Finals

Top survivors from `W4` and `L6` converge into Division 1 Finals:

| Match | Description |
|---|---|
| 1st Semi-Final | `W4` winner vs `L6` survivor (path A) |
| 2nd Semi-Final | `W4` winner vs `L6` survivor (path B) |
| 3rd & 4th Place | Losers of both semi-finals |
| Final Match | Winners of both semi-finals (Champion/Runner-up) |

### 3.4 D1 Final Placements - Orlando Event

| Place | Team |
|---|---|
| Champion | Moises Davalos / Ivan Davalos |
| Runner-up | Fernando Chorei / Billy Oliveira |
| 3rd Place | Pedro Ivo / Felipe Carbonaro |
| 4th Place | Thiago Mixirica / Cesar Fiorio |

---

## 4. Division 2 - Bracket Structure
Division 2 receives 8 teams seeded from D1 at the `L3/L4` elimination stage. It runs its own double-elimination bracket.

| Round | Matches | Bracket Side |
|---|---:|---|
| `W1` (10th Round) | 4 | Winners |
| `W2` (12th Round) | 2 | Winners |
| `L1` (12th Round) | 2 | Losers |
| `L2` (14th Round) | 2 | Losers |
| 1st Semi-Final | 1 | Finals |
| 2nd Semi-Final | 1 | Finals |
| 3rd & 4th Place | 1 | Finals |
| Final Match | 1 | Finals |

### D2 Final Placements - Orlando Event

| Place | Team |
|---|---|
| Champion | Gab Souza / Leozinho Gomes |
| Runner-up | Zuca Palladino / Lucas Silva |
| 3rd Place | Pedro Espindola / Pedro Galimberti |
| 4th Place | Thiago Cunha / Lucca Toledo |

---

## 5. Division 3 - Bracket Structure

D3 structure depends on `openDivisionCount` (3 vs 4 division mode):

### 3-Division Mode (openDivisionCount = 3) — 16 teams, M63–M78
Division 3 receives 16 teams seeded from D1 at the `L1/L2` elimination stage. It runs a single-elimination bracket.

| Round | Matches | Match Numbers | Notes |
|---|---:|---|---|
| `W1` (7th Round) | 8 | M63–M70 | All 16 D3 seeds enter here |
| `W2` (9th Round) | 4 | M71–M74 | `W1` winners advance |
| Semi-Finals `W3` | 2 | M75–M76 | `W2` winners advance |
| 3rd & 4th Place | 1 | M77 | Semi-final losers |
| Final Match | 1 | M78 | Semi-final winners |

**Routing (3-div D3):** M63→M71, M64→M71, M65→M72, M66→M72, M67→M73, M68→M73, M69→M74, M70→M74 · M71→M75, M72→M75, M73→M76, M74→M76 · M75→M78(w)/M77(l), M76→M78(w)/M77(l)

### 4-Division Mode (openDivisionCount = 4) — 8 teams, M63–M70
Division 3 receives only 8 teams (L2 losers from D1). It runs a compact 8-team single-elimination bracket.

| Round | Matches | Match Numbers | Notes |
|---|---:|---|---|
| `QF` | 4 | M63–M66 | All 8 D3 seeds enter here |
| Semi-Finals | 2 | M67–M68 | QF winners advance |
| 3rd & 4th Place | 1 | M69 | Semi-final losers |
| Final Match | 1 | M70 | Semi-final winners |

**Routing (4-div D3):** M63→M67(home), M64→M67(away), M65→M68(home), M66→M68(away) · M67→M70(w,home)/M69(l,home), M68→M70(w,away)/M69(l,away)

**Note:** D3 is single-elimination due to time/court constraints while D1/D2 are active.

### D3 Final Placements - Orlando Event

| Place | Team |
|---|---|
| Champion | Rafa Oliveira / Igor Martins |
| Runner-up | Felipe Netto / Bruno Vieira |
| 3rd Place | Guiga Muller / Breno Soares |
| 4th Place | Matheus Paes / Fe Schneider |

---

## 5a. Division 4 (4-Division Mode Only) — 8 teams, M93–M100

Division 4 only exists when `openDivisionCount = 4`. It receives 8 teams seeded from D1 at the `L1` elimination stage (earliest losers). It runs an 8-team single-elimination bracket identical in structure to D3-4div.

| Round | Matches | Match Numbers | Notes |
|---|---:|---|---|
| `QF` | 4 | M93–M96 | All 8 D4 seeds enter here |
| Semi-Finals | 2 | M97–M98 | QF winners advance |
| 3rd & 4th Place | 1 | M99 | Semi-final losers |
| Final Match | 1 | M100 | Semi-final winners |

**Routing:** M93→M97(home), M94→M97(away), M95→M98(home), M96→M98(away) · M97→M100(w,home)/M99(l,home), M98→M100(w,away)/M99(l,away)

---

## 6. Bracket Drop-Down Routing Rules

| Team Result | Current Round | Next Round |
|---|---|---|
| Win | `W1` | `W2` |
| Win | `W2` | `W3` |
| Win | `W3` | `W4` |
| Win | `W4` | D1 Semi-Finals |
| Lose | `W1` | `L1` |
| Lose | `W2` | `L2` (vs `L1` winner) |
| Lose | `W3` | `L4` (vs `L3` winner) |
| Lose | `W4` | `L6` (vs `L5` winner) |
| Win | `L1` | `L2` |
| Win | `L2` | `L3` |
| Win | `L3` | `L4` |
| Win | `L4` | `L5` |
| Win | `L5` | `L6` |
| Win | `L6` | D1 Semi-Finals |
| Lose | `L1` or `L2` | Seeded to D3 |
| Lose | `L3` or `L4` | Seeded to D2 |
| Lose | `L5` or `L6` | D1 3rd/4th Place |

---

## 7. Scoring Rules

| Notation | Meaning |
|---|---|
| `18` | Standard win score (first to 18) |
| `W(18)` | Walkover winner awarded 18 |
| `O(0)` | Walkover opponent/forfeit receives 0 |
| `18 x 14` | Score separator `x` (equivalent to `-` or `/`) |
| `20 x 18` | Extended score allowed after 17-17 (must win by 2) |

---

## 8. Data Model

### 8.1 Tournament

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | String | e.g. `NFA Tour - Orlando Open` |
| `date` | Date | Tournament date |
| `divisions` | Array | Division references |

### 8.2 Division

| Field | Type | Notes |
|---|---|---|
| `id` | String | `D1` \| `D2` \| `D3` |
| `bracket_type` | Enum | `double_elimination` \| `single_elimination` |
| `seeding_source` | Enum | `main_entry` \| `D1_L1_L2_losers` \| `D1_L3_L4_losers` |
| `rounds` | Array | Round references |
| `placements` | Array | 1st through 4th |

### 8.3 Round

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `label` | String | e.g. `1st Round W1`, `10th Round W1` |
| `division_id` | String | Division reference |
| `bracket_side` | Enum | `winners` \| `losers` \| `finals` |
| `sequence` | Integer | UI ordering |
| `match_count` | Integer | Number of matches |

### 8.4 Match

| Field | Type | Notes |
|---|---|---|
| `match_id` | String | Global ID like `M65` |
| `division_id` | String | Division owner |
| `round_id` | UUID | Round reference |
| `court` | Integer | 1-4 shared |
| `scheduled_time` | Time | e.g. `3:20 PM` |
| `team_a` | Object | `{ player1, player2 }` |
| `team_b` | Object | `{ player1, player2 }` |
| `score_a` | Integer\|null | Null until played |
| `score_b` | Integer\|null | Null until played |
| `result_type` | Enum | `normal` \| `walkover` \| `forfeit` |
| `winner_id` | Derived | Derived at result time |
| `winner_advances_to` | Object | `{ match_id, slot: 'A'|'B' }` |
| `loser_drops_to` | Object/String | `{ match_id, slot }` or `seed_D2` / `seed_D3` / `eliminated` |

---

## 9. Bracket Generation Algorithm

### 9.1 Division 1 Generation Steps
1. Build winners rounds `W1..W4` with counts `16, 8, 4, 2`.
2. Build losers rounds `L1..L6` with counts `8, 8, 4, 4, 2, 2`.
3. Wire drop-down routing: `W1->L1`, `W2->L2`, `W3->L4`, `W4->L6`.
4. Wire elimination routing: `L1/L2 losers -> D3`, `L3/L4 losers -> D2`, `L5/L6 losers -> D1 bronze path`.
5. Create D1 finals: 2 semis, bronze, final.
6. Pre-populate `winner_advances_to` and `loser_drops_to` before play starts.

### 9.2 Division 2, 3, and 4 Generation Steps

**Implementation:** `SchedulingService.generateEmptyDivisionBracket()` creates game records then does a second-pass routing wire-up using `matchToGameId` map. The generators (`generateD3Bracket8`, `generateD4Bracket`, `generateD2Bracket` in `double-elimination.ts`) return `DEGameTemplate[]` arrays with `winnerGoesTo`/`loserGoesTo` matchNumber references that are resolved to DB IDs.

**3-division mode:**
1. Wait until D1 seeding is resolved.
2. Seed D3 from `L1/L2` losers into D3 `W1` (16 teams, M63–M78).
3. Seed D2 from `L3/L4` losers into D2 `W1` (8 teams, M79–M92).
4. Build remaining rounds/finals per each division structure.

**4-division mode:**
1. Seed D4 from D1 `L1` losers (8 teams, M93–M100).
2. Seed D3 from D1 `L2` losers (8 teams, M63–M70).
3. Seed D2 from D1 `L3/L4` losers (8 teams, M79–M92, same as 3-div).
4. Build all three sub-brackets with `generateD4Bracket`, `generateD3Bracket8`, `generateD2Bracket`.

**Critical:** After game creation, `winnerNextGameId`/`loserNextGameId` must be wired via the second pass. If this is missed (e.g., partial regeneration), bracket connector lines will not render. Use `POST /api/tournaments/[id]/schedule/wire-routing` to re-wire without clearing results.

---

## 10. Scheduling Constraints
Courts 1-4 are shared by all active divisions. No two matches can share the same court-time slot.

Global match IDs should be assigned in rough chronological order and are valid for display sorting.

| Time Window | Active Divisions |
|---|---|
| 9:00 AM - 12:40 PM | D1 only (`W1..W4`, `L1..L4`) |
| 1:20 PM - 3:00 PM | D3 starts (`W1`, `W2`) while D1 continues |
| 3:20 PM onward | D2 starts (`W1`) while D1 and D3 continue |
| 5:00 PM - 6:40 PM | All 3 divisions in finals phase concurrently |

---

## 11. Verified Examples - Orlando Event

### Janser Pinho / Joao Gabriel Freitas

| Match | Division | Bracket | Opponent | Score | Result |
|---|---|---|---|---|---|
| `M1` | D1 | W1 | - | Lost | drops to `L1` |
| `M11` | D1 | L1 | Bernardo Avila / Tuio Silveira | Lost | seeded to D3 |
| `M53` | D3 | W1 | Matheus Paes / Fe Schneider | 12-18 | Eliminated |

### Fabricio Barancoski / Piu Montemor

| Match | Division | Bracket | Opponent | Score | Result |
|---|---|---|---|---|---|
| `M22` | D1 | W1 | Pedro Espindola / Pedro Galimberti | 20-18 | advances to `W2` |
| `M29` | D1 | W2 | Diego Tavares / Yuri Ribeiro | 9-18 | drops to `L2` |
| `M38` | D1 | L2 | Thiago Platz / Gilberto Camillato | 18-7 | advances to `L3` |
| `M46` | D1 | L3 | Moises Davalos / Ivan Davalos | 18-20 | seeded to D2 |
| `M66` | D2 | W1 | Marcos Chantel / Anderson Silva | 16-18 | drops to D2 losers |
| `M76` | D2 | Losers | Pedro Espindola / Pedro Galimberti | 14-18 | Eliminated |

Notable: Fabricio/Piu lost to eventual D1 champions (Moises/Ivan) by 2 points in `M46`, and faced Pedro/Pedro twice (won `M22`, lost `M76`).

---

## 12. Deterministic Reproduction Rules (Required for Orlando-Exact Output)

### 12.1 Initial Seeding (D1 W1)
Use fixed seed order `S1..S32`.

- `M1`: `S1 vs S32`
- `M2`: `S16 vs S17`
- `M3`: `S8 vs S25`
- `M4`: `S9 vs S24`
- `M5`: `S4 vs S29`
- `M6`: `S13 vs S20`
- `M7`: `S5 vs S28`
- `M8`: `S12 vs S21`
- `M9`: `S2 vs S31`
- `M10`: `S15 vs S18`
- `M11`: `S7 vs S26`
- `M12`: `S10 vs S23`
- `M13`: `S3 vs S30`
- `M14`: `S14 vs S19`
- `M15`: `S6 vs S27`
- `M16`: `S11 vs S22`

### 12.2 Winners Bracket Progression
- `W2`: `winner(M1) vs winner(M2)`, ..., `winner(M15) vs winner(M16)`
- `W3`: `winner(W2-1) vs winner(W2-2)`, ..., `winner(W2-7) vs winner(W2-8)`
- `W4`: `winner(W3-1) vs winner(W3-2)`, `winner(W3-3) vs winner(W3-4)`

### 12.3 Losers Ladder Wiring (Exact Slots)
- `L1-i = loser(W1 odd-index match) vs loser(W1 even-index match)` for `i=1..8`
- `L2-i = winner(L1-i) vs loser(W2-i)` for `i=1..8`
- `L3-i = winner(L2-(2i-1)) vs winner(L2-(2i))` for `i=1..4`
- `L4-i = winner(L3-i) vs loser(W3-i)` for `i=1..4`
- `L5-i = winner(L4-(2i-1)) vs winner(L4-(2i))` for `i=1..2`
- `L6-i = winner(L5-i) vs loser(W4-i)` for `i=1..2`

### 12.4 D1 Finals Wiring
- `SF1 = winner(W4-1) vs winner(L6-1)`
- `SF2 = winner(W4-2) vs winner(L6-2)`
- `Bronze = loser(SF1) vs loser(SF2)`
- `Final = winner(SF1) vs winner(SF2)`

### 12.5 D2/D3 Seeding from D1 Eliminations
- D3 seeds (16): losers of `L1`, then losers of `L2`, in chronological D1 completion order.
- D2 seeds (8): losers of `L3`, then losers of `L4`, in chronological D1 completion order.
- If completion timestamps tie, lower `match_id` first.

### 12.6 Match ID, Court, and Time Determinism
Assign globally by this exact priority:
1. `scheduled_time` ascending
2. `court` ascending
3. division priority `D1 > D3 > D2`
4. bracket order `Winners > Losers > Finals`

Court assignment uses first-available court (`1..4`) with stable sort by round sequence. No randomization allowed.

### 12.7 Walkover/Forfeit Invariance
- Walkover is always `W(18)-O(0)`.
- Walkover winner advances exactly as a normal winner.
- Walkover loser drops/eliminates exactly as a normal loser.
- Routing logic must be invariant to `result_type`.

---

## 13. Bracket Visual Layout Specification

### 13.1 Global Canvas
- Use one horizontal bracket canvas with left-to-right progression.
- Keep all divisions visible in a single screen flow when possible (desktop), with independent stacked sections on mobile.
- Show shared tournament header at top: event name, date, courts, legend.

### 13.2 Column Order (Left to Right)

**Implementation:** `getColumnDefs(division, divisionCount)` in `nfaBracketLayout.ts` returns `NfaBracketColumn[]`. Each column filters games by `rounds[]` + `sections[]`. Columns use `min-w-[240px]` with `flex-shrink-0`; the bracket container is `overflow-x-auto`.

**D1 bracket (per-division tab):**
1. `W1` through `W4` (winners bracket)
2. `D1 Finals` column — `finalsStack` layout (SF1, SF2 in flow; F + 3P centred between)
3. `L6` through `L1` (losers ladder, right side)

**D2 bracket (DE, 8-team):**
- W1 | W2 | Finals (SF/F/3P) | L2 | L1  _(losers on right, mirroring D1 pattern)_

**D3 bracket (SE, 8-team, 4-div):**
- QF | SF + Finals  _(finalsPair layout: F centred, 3P below)_

**D3 bracket (SE, 16-team, 3-div):**
- W1 | W2 | SF + Finals  _(finalsPair layout)_

**D4 bracket (SE, 8-team):** Identical column layout to D3-4div.

- Winners rounds appear left of Finals column.
- Losers (DE brackets) appear right of Finals column (mirrored flow toward finals).

### 13.3 Division Zoning
- Apply colored section bands:
  - `D1` zone: `W4`, `L5`, `L6`, and D1 Finals
  - `D2` zone: `L3`, `L4` outcomes + D2 bracket
  - `D3` zone: `L1`, `L2` outcomes + D3 bracket
- Show section labels above columns: `OPEN DIVISION`, `DIVISION 1`, `DIVISION 2`, `DIVISION 3`.

### 13.4 Match Card Design
Each card must show:
- `match_id` (e.g., `M37`)
- court and scheduled time
- Team A row and Team B row
- score values aligned right
- winner highlight (bold + accent border)
- walkover badge when `result_type=walkover` (`W(18)` / `O(0)`)

Optional badges:
- `LIVE`, `FINAL`, `PENDING`

### 13.5 Connector Lines and Flow
- **Implementation:** `ConnectorOverlay` component (in `NfaBracketView.tsx`) renders an absolute-positioned SVG overlay inside the scrollable bracket container.
- Positions gathered via `getBoundingClientRect()` on `[data-game-id]` card elements relative to the bracket container.
- Elbow path shape: `M${startX},${startY} H${midX} V${endY} H${endX}` (right-angle connector).
- Winner connectors: `rgba(52,211,153,0.9)` (emerald-400), losers: `rgba(251,146,60,0.9)` (orange-400), strokeWidth 2.5.
- **Hydration fix:** `useLayoutEffect` fires before card positions are stable during Next.js SSR hydration. A `requestAnimationFrame(() => draw())` in `useEffect` ensures a post-paint re-draw.
- **Prerequisite:** All games must have `winnerNextGameId` / `loserNextGameId` populated in DB. If null, SVG returns null (0 paths). Use `POST /api/tournaments/[id]/schedule/wire-routing` to fix without losing results.
- Cross-division drops use `seedTarget` badge on the card (e.g., `→ D2-S3`). No connector line drawn for cross-division drops.

### 13.6 Finals Emphasis
- D1 Finals cards should be visually larger than regular cards.
- Final match card should be the most prominent element (center emphasis, stronger border/background).
- Bronze match should be adjacent to final but visually secondary.

### 13.7 D2 and D3 Sub-Brackets
- Render D2 and D3 as separate grouped bracket blocks below or to the far right of D1 (depending on viewport width).
- Preserve their own winners/losers/finals structure.
- Show incoming seed list source at the block header:
  - D2: `Seeded from D1 L3/L4 eliminations`
  - D3: `Seeded from D1 L1/L2 eliminations`

### 13.8 Responsiveness
- Desktop: full multi-column bracket with horizontal scroll if needed.
- Tablet: compress card width, keep connectors visible.
- Mobile: switch to stacked round-by-round layout with collapsible rounds and mini-connector indicators.
- Maintain fixed legend and sticky round headers for orientation.

### 13.9 Visual Legend
Include persistent legend:
- solid line = winner advances
- dashed line = loser drops
- trophy icon = champion path
- bronze icon = 3rd place path
- walkover badge meaning (`W(18)/O(0)`)

### 13.10 UX Behavior
- Hover/tap on team highlights its full path across rounds.
- Clicking a match opens details drawer (players, score, result type, next routing).
- Filters: by division (`D1/D2/D3`), court, and time window.
- Search by player name highlights all relevant matches.
