# Agent Instructions — OneFTV Footvolley App

## Project Overview

A Next.js 14 footvolley tournament management app with:
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Prisma ORM + MySQL
- **Auth**: NextAuth.js (Google OAuth + credentials)

## Live Feed — Agent Coordination

We use `LIVEFEED.md` in the project root to coordinate between agents (Claude Code and Codex).

### How to Use the Live Feed

**Before starting work**, read `LIVEFEED.md` to see what other agents are doing.

Codex should run this before each testing cycle:
```bash
npm run tester:preflight
```
This flags new Claude Code completions and Codex-targeted requests since the last Codex completion entry.

**While working**, append entries to the `## Feed` section using this format:
```
[YYYY-MM-DD HH:MM] [AGENT_NAME] [TYPE] message
```

**Types:**
- `STATUS` — What you're currently doing
- `ERROR` — Errors you encountered
- `QUESTION` — Questions for the other agent or user
- `DONE` — Task completed
- `BLOCKER` — Something blocking your progress
- `REQUEST` — Asking the other agent to do something
- `NOTE` — General observations or context

**Update the Active Tasks table** when starting/finishing work:
```markdown
| Agent | Current Task | Started |
|-------|-------------|---------|
| Codex | Writing unit tests for scheduling.ts | 2026-02-12 10:30 |
```

Clear your row (set to `- | - | -`) when you finish.

### Example Codex Workflow

```bash
# 1. Read the feed first
cat LIVEFEED.md

# 2. Append your status
echo '[2026-02-12 10:30] [CODEX] [STATUS] Starting unit tests for scheduling.ts' >> LIVEFEED.md

# 3. Do your work...

# 4. Report results
echo '[2026-02-12 11:00] [CODEX] [DONE] Added 12 unit tests for scheduling.ts — all passing' >> LIVEFEED.md
echo '[2026-02-12 11:00] [CODEX] [ERROR] Found bug: generateBracketGames crashes with odd player count' >> LIVEFEED.md
```

### The API (for when app is running)

The feed is also available via API at `/api/livefeed`:
- `GET /api/livefeed` — Returns parsed feed entries and active tasks
- `POST /api/livefeed` — Add entry: `{ "agent": "codex", "type": "STATUS", "message": "..." }`

### Live Feed Page

Visit `/livefeed` in the browser to see a real-time dashboard of all agent activity.

## IMPORTANT: Build Rules

**Codex: DO NOT run `npm run build`, `next build`, or any command that writes to `.next/`.**
The dev server runs live on this machine and shares the `.next/` directory. Running a build from Codex corrupts the cache and crashes the dev server.

**For type checking, use:** `npx tsc --noEmit`
**For static analysis, use:** grep, file reads, AST parsing
**Do NOT use:** `npm run build`, `next build`, `next dev`, `next lint` (prompts interactively)

## Codex Role: Testing

Codex is responsible for **writing and running automated tests**. Priority areas:

### High Priority — Pure Logic (no DB needed)
1. `src/lib/scheduling.ts` — Tournament scheduling, bracket generation, court assignment
2. `src/lib/kotb.ts` — King of the Beach standings, advancement, knockout generation

### Medium Priority — API Routes (mock Prisma)
3. `src/app/api/tournaments/route.ts` — Tournament CRUD
4. `src/app/api/athletes/route.ts` — Athlete management
5. `src/app/api/games/[id]/route.ts` — Game scoring
6. `src/app/api/rankings/route.ts` — Rankings computation

### Testing Stack
- **Framework**: Vitest (needs to be installed)
- **Location**: `__tests__/` directory in project root
- **Config**: `vitest.config.ts` in project root

### Setup Commands
```bash
npm install --save-dev vitest @vitest/coverage-v8
# Then run: npx vitest
```

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/scheduling.ts` | Tournament scheduling engine |
| `src/lib/kotb.ts` | King of the Beach format logic |
| `src/lib/auth.ts` | NextAuth configuration |
| `src/types/index.ts` | All TypeScript interfaces (39 types) |
| `prisma/schema.prisma` | Database schema |
| `LIVEFEED.md` | Agent coordination feed |

## Conventions
- TypeScript strict mode is enabled
- API routes use Zod for input validation
- All tournament formats: KOTB, Single/Double Elimination, Group Knockout, Round Robin
- Player levels: Beginner, Intermediate, Advanced, Elite
- User roles: Admin, Organizer, Referee, Player
