#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FEED_FILE="$ROOT_DIR/LIVEFEED.md"

if [[ ! -f "$FEED_FILE" ]]; then
  echo "ERROR: LIVEFEED.md not found at $FEED_FILE"
  exit 1
fi

LAST_CODEX_DONE_LINE="$(grep -n '\[CODEX\] \[DONE\]' "$FEED_FILE" | tail -n 1 | cut -d: -f1 || true)"
if [[ -z "${LAST_CODEX_DONE_LINE:-}" ]]; then
  LAST_CODEX_DONE_LINE=1
fi

PENDING_REQUESTS="$(tail -n +"$LAST_CODEX_DONE_LINE" "$FEED_FILE" | grep -E '\[CLAUDE CODE\] \[REQUEST\].*(Codex|CODEX|codex)' || true)"
NEW_CLAUDE_DONE="$(tail -n +"$LAST_CODEX_DONE_LINE" "$FEED_FILE" | grep -E '\[CLAUDE CODE\] \[DONE\]' || true)"

echo "Live feed preflight"
echo "Feed file: $FEED_FILE"
echo "Last [CODEX] [DONE] line: $LAST_CODEX_DONE_LINE"
echo

ACTION_NEEDED=0

if [[ -n "$PENDING_REQUESTS" ]]; then
  ACTION_NEEDED=1
  echo "Requests from Claude Code to Codex:"
  echo "$PENDING_REQUESTS"
  echo
fi

if [[ -n "$NEW_CLAUDE_DONE" ]]; then
  ACTION_NEEDED=1
  echo "New Claude Code completions after last Codex completion (likely needs testing):"
  echo "$NEW_CLAUDE_DONE"
  echo
fi

if [[ "$ACTION_NEEDED" -eq 0 ]]; then
  echo "No new Claude requests/completions found since last Codex [DONE]."
  echo "Proceed with normal testing tasks."
  exit 0
fi

echo "Action needed: review items above and run relevant tests."
exit 2
