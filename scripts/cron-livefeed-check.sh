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
  local preflight_output preflight_code action_output action_code
  local action_cmd action_label
  local pass_count warn_count fail_count
  local line kind msg
  local summary_line

  set +e
  preflight_output="$(cd "$ROOT_DIR" && "$NPM_BIN" run --silent tester:preflight 2>&1)"
  preflight_code=$?
  set -e

  if [[ "$preflight_code" -eq 2 ]]; then
    action_cmd="tester:action"
    action_label="targeted tester action bundle"
    if printf '%s\n' "$preflight_output" | rg -qi '\[CLAUDE CODE\] \[(DONE|STATUS)\].*(complete|completed|ready for testing|all tasks)'; then
      action_cmd="tester:full"
      action_label="FULL app test bundle"
    fi

    append_feed "STATUS" "Auto-check found actionable Claude updates; running $action_label."

    summary_line="$(printf '%s\n' "$preflight_output" | rg '\[CLAUDE CODE\] \[(DONE|REQUEST|STATUS)\]' | head -n 1 || true)"
    if [[ -n "$summary_line" ]]; then
      append_feed "NOTE" "Auto-check summary: $summary_line"
    fi

    set +e
    action_output="$(cd "$ROOT_DIR" && "$NPM_BIN" run --silent "$action_cmd" 2>&1)"
    action_code=$?
    set -e

    pass_count=0
    warn_count=0
    fail_count=0

    while IFS= read -r line; do
      [[ "$line" != RESULT\|* ]] && continue
      kind="$(printf '%s' "$line" | cut -d'|' -f2)"
      msg="$(printf '%s' "$line" | cut -d'|' -f3-)"

      case "$kind" in
        PASS)
          pass_count=$((pass_count + 1))
          append_feed "DONE" "Tester check PASS: $msg"
          ;;
        WARN)
          warn_count=$((warn_count + 1))
          append_feed "NOTE" "Tester check WARN: $msg"
          ;;
        FAIL)
          fail_count=$((fail_count + 1))
          append_feed "ERROR" "Tester check FAIL: $msg"
          ;;
      esac
    done <<< "$action_output"

    if [[ "$action_code" -eq 0 ]]; then
      append_feed "DONE" "Auto-check tester actions completed ($action_cmd): pass=$pass_count warn=$warn_count fail=$fail_count."
    else
      append_feed "ERROR" "Auto-check tester actions completed with failures ($action_cmd): pass=$pass_count warn=$warn_count fail=$fail_count."
      append_feed "NOTE" "$(printf '%s\n' "$action_output" | tail -n 1)"
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
