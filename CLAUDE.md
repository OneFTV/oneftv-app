# Claude Code Instructions — OneFTV

## Live Feed Coordination

Before starting work, read `LIVEFEED.md` to check what Codex or other agents are working on.

When working on tasks, update the feed by editing `LIVEFEED.md`:
- Append entries to the `## Feed` section: `[TIMESTAMP] [CLAUDE CODE] [TYPE] message`
- Update the Active Tasks table with your current task
- Check for QUESTION, BLOCKER, or REQUEST entries from Codex and help resolve them

Types: STATUS | ERROR | QUESTION | DONE | BLOCKER | REQUEST | NOTE

## Project Overview

Next.js 14 footvolley tournament app. See `AGENTS.md` for full details.

## Testing Division

- **Claude Code**: Browser-based E2E testing, visual QA, manual flow verification
- **Codex**: Unit tests (scheduling, kotb logic), API route tests with mocked DB
