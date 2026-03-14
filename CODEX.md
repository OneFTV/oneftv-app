# Codex CLI Instructions — OneFTV

## Build Rules — CRITICAL

**DO NOT run these commands** (they corrupt the live dev server cache):
- `npm run build`
- `next build`
- `next dev`
- `next lint`

**Safe commands you CAN run:**
- `npx tsc --noEmit` — type checking
- `npx vitest` — run tests
- `cat`, `grep`, file reads — static analysis

## Your Role: Testing

Write and run automated tests. See `AGENTS.md` for full details on priority areas and testing stack.

## Key Files

| File | Purpose |
|------|---------|
| `AGENTS.md` | Full project details and your testing responsibilities |
| `src/lib/scheduling.ts` | Tournament scheduling engine (high priority for tests) |
| `src/lib/bracketUtils.ts` | Bracket utility functions (high priority for tests) |
| `prisma/schema.prisma` | Database schema |
