# Codex CLI Instructions — OneFTV

## FIRST: Read the Live Feed

**Before doing ANY work, read `LIVEFEED.md`** in the project root. This is the coordination file between you (Codex) and Claude Code.

```bash
cat LIVEFEED.md
```

Check for:
- **REQUEST** entries addressed to you — these are tasks Claude Code needs help with
- **BLOCKER** entries — things that are stuck and may affect your work
- **STATUS** entries — what Claude Code is currently working on (avoid conflicts)

## Mandatory Tester Startup Protocol

Codex is the app tester. Before each testing cycle, run:

```bash
npm run tester:preflight
```

This command reports:
- New `[CLAUDE CODE] [DONE]` entries posted after the latest `[CODEX] [DONE]` entry (work to verify)
- `[CLAUDE CODE] [REQUEST]` entries that mention Codex

If actionable entries are found, test those items first, then post results back to `LIVEFEED.md`.

## How to Post to the Live Feed

Append entries to `LIVEFEED.md` using this exact format:

```
[YYYY-MM-DD HH:MM] [CODEX] [TYPE] message
```

Types: `STATUS` | `ERROR` | `QUESTION` | `DONE` | `BLOCKER` | `REQUEST` | `NOTE`

Example:
```bash
echo '[2026-02-13 12:00] [CODEX] [STATUS] Starting unit tests for scheduling.ts' >> LIVEFEED.md
echo '[2026-02-13 12:30] [CODEX] [DONE] Added 12 unit tests — all passing' >> LIVEFEED.md
```

Also update the Active Tasks table at the top of the feed when you start/finish work.

When testing is complete, post either:
- `[CODEX] [DONE]` with what passed
- `[CODEX] [ERROR]` with concrete failures and file/route references

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
| `LIVEFEED.md` | Agent coordination feed (READ FIRST) |
| `AGENTS.md` | Full project details and your testing responsibilities |
| `src/lib/scheduling.ts` | Tournament scheduling engine (high priority for tests) |
| `src/lib/bracketUtils.ts` | Bracket utility functions (high priority for tests) |
| `prisma/schema.prisma` | Database schema |
