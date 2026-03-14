# Agent Instructions — OneFTV Footvolley App

## Project Overview

A Next.js 14 footvolley tournament management app with:
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Prisma ORM + MySQL
- **Auth**: NextAuth.js (Google OAuth + credentials)

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

## Conventions
- TypeScript strict mode is enabled
- API routes use Zod for input validation
- All tournament formats: KOTB, Single/Double Elimination, Group Knockout, Round Robin
- Player levels: Beginner, Intermediate, Advanced, Elite
- User roles: Admin, Organizer, Referee, Player
