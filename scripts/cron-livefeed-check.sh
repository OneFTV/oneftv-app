#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LIVEFEED_FILE="$ROOT_DIR/LIVEFEED.md"
LOCK_DIR="/tmp/oneftv-livefeed-cron.lock"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
NPM_BIN="$(command -v npm || true)"

if [[ -z "$NPM_BIN" ]]; then
  append_feed() {
    local type="$1"
    local message="$2"
    local ts
    ts="$(date '+%Y-%m-%d %H:%M')"
    printf '[%s] [CODEX] [%s] %s\n' "$ts" "$type" "$message" >> "$LIVEFEED_FILE"
  }
  append_feed "ERROR" "Auto-check setup error: npm not found on PATH for cron environment."
  exit 1
fi

append_feed() {
  local type="$1"
  local message="$2"
  local ts
  ts="$(date '+%Y-%m-%d %H:%M')"
  printf '[%s] [CODEX] [%s] %s\n' "$ts" "$type" "$message" >> "$LIVEFEED_FILE"
}

last_feed_line() {
  tail -n 1 "$LIVEFEED_FILE" | tr -d '\r'
}

append_feed_if_changed() {
  local type="$1"
  local message="$2"
  local last_line
  local normalized_last
  last_line="$(last_feed_line)"
  normalized_last="${last_line#*] }"

  # Avoid repeated identical Codex status updates when nothing changed.
  if [[ "$normalized_last" == "[CODEX] [$type] $message" ]]; then
    return 0
  fi

  append_feed "$type" "$message"
}

run_cycle() {
  local preflight_output preflight_code types_output types_code
  local summary_line

  set +e
  preflight_output="$(cd "$ROOT_DIR" && "$NPM_BIN" run --silent tester:preflight 2>&1)"
  preflight_code=$?
  set -e

  if [[ "$preflight_code" -eq 2 ]]; then
    append_feed "STATUS" "Auto-check found new Claude updates/requests; running tester actions."

    summary_line="$(printf '%s\n' "$preflight_output" | rg '\[CLAUDE CODE\] \[(DONE|REQUEST)\]' | head -n 1 || true)"
    if [[ -n "$summary_line" ]]; then
      append_feed "NOTE" "Auto-check summary: $summary_line"
    fi

    set +e
    types_output="$(cd "$ROOT_DIR" && "$NPM_BIN" run --silent tester:types 2>&1)"
    types_code=$?
    set -e

    if [[ "$types_code" -eq 0 ]]; then
      append_feed "DONE" "Auto-check tester actions completed: typecheck passed."
    else
      append_feed "ERROR" "Auto-check tester actions failed: typecheck failed."
      append_feed "NOTE" "$(printf '%s\n' "$types_output" | tail -n 1)"
    fi
  elif [[ "$preflight_code" -eq 0 ]]; then
    append_feed_if_changed "STATUS" "Auto-check completed: no new Claude updates requiring tester action."
  else
    append_feed "ERROR" "Auto-check preflight failed (exit $preflight_code)."
    append_feed "NOTE" "$(printf '%s\n' "$preflight_output" | tail -n 1)"
  fi
}

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  exit 0
fi
trap 'rmdir "$LOCK_DIR" >/dev/null 2>&1 || true' EXIT

run_cycle
sleep 30
run_cycle
