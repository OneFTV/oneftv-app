# Project Lessons Learned — OneFTV

> Unified lessons from Claude Code (architecture, code, gotchas) and Codex (coordination, validation, data quality).

---

## Part 1: Architecture & Code Patterns

### Modular Monolith (src/modules/)
Each domain has its own folder with Service, Repository, Types, and Schemas.
- `auth/`, `tournament/`, `game/`, `category/`, `ranking/`, `scheduling/`, `popularity/`
- Service classes use static methods and delegate DB access to Repository classes
- Repositories use Prisma exclusively — no raw SQL

### Service + Repository Pattern
```
API Route → Service (business logic) → Repository (DB queries) → Prisma
```
- Services handle validation, authorization, and orchestration
- Repositories handle all Prisma queries and return typed results
- Makes mocking for tests straightforward

### API Validation with Zod
All API inputs validated with Zod schemas before processing. Custom error classes (`NotFoundError`, `ValidationError`, `ForbiddenError`) map to HTTP status codes automatically.

### Error Class Hierarchy
```typescript
class AppError extends Error { statusCode: number }
class NotFoundError extends AppError { /* 404 */ }
class ValidationError extends AppError { /* 400 */ }
class ForbiddenError extends AppError { /* 403 */ }
```
API routes catch these and return the matching HTTP status.

---

## Part 2: Key Features & Implementation Details

### Double-Elimination Brackets (NFA Format)
- Winners bracket (32->16->8->4->2->1) + Losers bracket (L1-L6)
- Each game stores `winnerNextGameId`, `loserNextGameId`, `winnerSlot`, `loserSlot` for routing
- Routing table is hardcoded from NFA PDF specs (`D1_ROUTING_TABLE` with 62 matches)
- Cross-division seeding: losers from D1 seed into D2/D3 via `seedTarget` field (e.g., "D2-S3")

### Score Matrix (Batch Score Entry)
- Spreadsheet-style table grouped by round with collapsible accordion sections
- Dirty tracking compares current scores to `originalScores.current` ref snapshot
- Single batch POST to `/api/games/batch` for all changed games
- After save, always re-fetch games to reflect bracket advancement
- Set 3 inputs only render when Set 1 & 2 results are tied (conditional)

### Dual Profile Page
- Single `/profile` route with Player and Organizer tabs
- Organizer tab only visible when `stats.organizer.tournamentCount > 0`
- Single API call (`/api/user/stats`) returns both player stats and organizer stats

### Multi-Category System
- One tournament can have multiple categories (Pro, Amateur, etc.)
- Each category has its own format, players, rounds, games, and standings
- `/api/tournaments/[id]/games?categoryId=xyz` filters by category
- Generate endpoint scoped per category

### Score Validation (Professional League)
- 2-point advantage rule: winner must lead by 2+ points (18-16 OK, 18-17 NOT OK)
- Best-of-3: Set 1 & 2 to 18 points, Set 3 (if tied 1-1) to 15 points
- Validation in `score.validator.ts` with `validateGameScores()` and `validateSetScore()`

### Bracket Advancement (Fire-and-Forget)
`advanceBracket()` runs async after score save — doesn't block the response:
```typescript
this.advanceBracket(id, winningSide).catch(err => console.error(...))
```
- UI must re-fetch games after batch save to see player movements
- Bracket routing errors only appear in server logs

### Client-Side i18n
- Translation files in `src/locales/{lang}/{namespace}.json`
- Languages: en, es, fr, pt-BR
- `TranslationContext` loads translations client-side after hydration
- SSR shows translation keys briefly before hydration completes (known behavior, not a bug)

---

## Part 3: Gotchas & Common Bugs

### Stale `.next` Cache
**Symptom**: Site returns 500, "Cannot find module './1682.js'" or similar webpack chunk errors.
**Cause**: Dev server running too long or cache corrupted after schema/file changes.
**Fix**: `rm -rf .next && npx next dev`

### Prisma Schema Changes Require Regeneration
**Symptom**: New fields return null/undefined even though DB has data.
**Cause**: Cached Prisma client doesn't pick up new model fields automatically.
**Fix**: `npx prisma generate` then restart dev server.

### API Response Shape Inconsistency
Some endpoints return `{data: {...}}`, others return flat objects/arrays. Frontend must handle both:
```typescript
const data = response.data || response  // defensive unwrap
```
**Prevention**: Standardize all endpoints to same response envelope.

### Format Enum Mismatch
Create form must send snake_case values (`"king_of_the_beach"`) matching Prisma enum, not display labels. Mismatch causes tournaments with no games generated.

### NaN/Null Display Bugs
Always guard against NaN/null in stat displays:
```typescript
{winRate ? `${winRate}%` : 'N/A'}
{city || '-'}
```

### Navbar Missing Profile Link
The Navbar initially only had Dashboard and Logout. Profile was only reachable via dashboard quick action. Fixed by adding explicit Profile link to desktop + mobile nav.

### Batch Update Without Re-fetch = Stale UI
After batch score save, bracket advancement runs async. UI won't show player movements to next round unless you re-fetch games after save.

---

## Part 4: Reusable Patterns

### Dirty Tracking for Batch Forms
```typescript
const originalScores = useRef<Record<string, ScoreData>>({})
const [dirtyGames, setDirtyGames] = useState<Set<string>>(new Set())
// Compare current vs original to determine dirty state
```

### Collapsible Round Sections
Auto-collapse fully completed rounds on initial load. Group by `${bracketSide}::${roundName}` key. Keeps long tournament manage pages performant.

### Parallel Data Fetching
```typescript
const [profileRes, statsRes] = await Promise.all([
  fetch('/api/user/profile'),
  fetch('/api/user/stats'),
])
```

---

## Part 5: Coordination & Process (Codex + Claude Code)

### Coordination must be explicit and automated
- `LIVEFEED.md` workflow (read first, post STATUS/ERROR/DONE, maintain Active Tasks) improved coordination between Codex and Claude Code.
- Automated feed checks reduced silent drift between implementation and testing.

### Lightweight checks were too shallow
- A fast `tsc`-only pass gave false confidence.
- Better validation: typecheck + schema validation + route/API audits + runtime smoke checks.
- Step-by-step logging in `LIVEFEED.md` made test actions auditable.

### Build rules are critical
- **Codex must NOT run `npm run build` or `next build`** — it writes to `.next/` and corrupts the live dev server cache.
- Use `npx tsc --noEmit` for type checking instead.

### Automation quality depends on environment-hardening
- Cron jobs failed initially due to PATH/npm issues.
- Duplicate/no-op feed spam required dedupe logic to keep the feed usable.

---

## Part 6: Data Quality & Rankings

### Data model clarity is critical for ranking credibility
- Ranking outputs were misleading when seed data lacked clear provenance.
- Moved from ad-hoc popularity outputs to explicit multi-signal scoring with documented weights.

### Popularity ranking uses agreed source backbone
- Sources: BW Cup, TAF, LBF, CBFT, LSK, WorldFootvolley
- Scoring: 55% Instagram + 30% league stream exposure + 15% world ranking signal
- Confidence tied to source coverage, not assumed.

### UX should surface scoring components
- Showing only final score caused trust issues.
- Exposing component columns (Instagram, stream exposure, tournament-rank signal) improved explainability.

---

## Part 7: Testing Gaps (Known)

- No unit tests for bracket generation logic
- No unit tests for score validation
- No unit tests for double-elimination routing
- No `__tests__/` directory or `*.test.*` / `*.spec.*` files in repo
- Recommendation: Add Vitest suite for pure logic modules (`scheduling`, `kotb`, `score.validator`)

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/modules/game/game.service.ts` | Game updates, validation, batch ops, bracket advancement |
| `src/modules/scheduling/generators.ts` | Bracket/KOTB/RoundRobin generation |
| `src/modules/game/score.validator.ts` | Score validation (2-point rule, set logic) |
| `src/app/tournaments/[id]/manage/page.tsx` | Score matrix + batch update UI |
| `src/app/profile/page.tsx` | Dual profile (player + organizer tabs) |
| `src/app/api/games/batch/route.ts` | Batch score update endpoint |
| `prisma/schema.prisma` | Database models (21+ models) |
| `LIVEFEED.md` | Agent coordination feed |
| `AGENTS.md` | Agent roles and project overview |
| `CLAUDE.md` | Claude Code-specific instructions |
