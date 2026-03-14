#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

pass_count=0
warn_count=0
fail_count=0

emit_pass() {
  pass_count=$((pass_count + 1))
  printf 'RESULT|PASS|%s\n' "$1"
}

emit_warn() {
  warn_count=$((warn_count + 1))
  printf 'RESULT|WARN|%s\n' "$1"
}

emit_fail() {
  fail_count=$((fail_count + 1))
  printf 'RESULT|FAIL|%s\n' "$1"
}

http_code() {
  curl -sS -o /dev/null -w '%{http_code}' "$1" || echo "000"
}

# 1) Static validation bundle
if npx tsc --noEmit >/dev/null 2>&1; then
  emit_pass "TypeScript check passed (npx tsc --noEmit)."
else
  emit_fail "TypeScript check failed."
fi

if npx prisma validate >/dev/null 2>&1; then
  emit_pass "Prisma schema validation passed."
else
  emit_fail "Prisma schema validation failed."
fi

page_routes="$(find src/app -type f -name 'page.tsx' | sed 's#^src/app##; s#/page.tsx$##; s#^$#/#; s#^/#/#' | sort -u)"
api_routes="$(find src/app/api -type f -name 'route.ts' | sed 's#^src/app/api#/api#; s#/route.ts$##' | sort -u)"
page_refs="$(rg -No "href=\\\"/[^\\\"#?]*|router\\.push\\(\\s*['\\\"]/[^'\\\")?#]*" src | sed -E "s/.*(\\\"|')\\//\\//; s/[\\\"').]*$//" | rg -v '^/api/' | sort -u || true)"
api_refs="$(rg -No "fetch\\(\\s*['\\\"]/api/[^'\\\")?#]*|axios\\.[a-z]+\\(\\s*['\\\"]/api/[^'\\\")?#]*" src | sed -E "s/.*(\\\"|')\\//\\//; s/[\\\"').]*$//" | sort -u || true)"
missing_pages="$(comm -23 <(printf '%s\n' "$page_refs" | sed '/^$/d' | sort -u) <(printf '%s\n' "$page_routes" | sort -u) || true)"
missing_apis="$(comm -23 <(printf '%s\n' "$api_refs" | sed '/^$/d' | sort -u) <(printf '%s\n' "$api_routes" | sort -u) || true)"

if [[ -z "$missing_pages" && -z "$missing_apis" ]]; then
  emit_pass "Static internal route/API audit passed (0 missing targets)."
else
  [[ -n "$missing_pages" ]] && emit_fail "Missing page routes detected: $(printf '%s' "$missing_pages" | tr '\n' ' ')"
  [[ -n "$missing_apis" ]] && emit_fail "Missing API routes detected: $(printf '%s' "$missing_apis" | tr '\n' ' ')"
fi

placeholder_hits="$(rg -n 'href=\"#\"' src | head -n 20 || true)"
if [[ -n "$placeholder_hits" ]]; then
  emit_warn "Dead-end placeholder links found (href=#)."
else
  emit_pass "No href=# placeholder links detected."
fi

test_files="$(rg --files | rg '__tests__/|\\.test\\.|\\.spec\\.' | head -n 1 || true)"
if [[ -n "$test_files" ]]; then
  emit_pass "Automated test files detected."
else
  emit_warn "No automated test files found (__tests__/*.test/*.spec)."
fi

# 2) Runtime smoke checks (if app server is available)
base_url="http://localhost:3000"
root_code="$(http_code "$base_url/")"
if [[ "$root_code" != "200" ]]; then
  emit_warn "Runtime smoke skipped: local app not reachable at $base_url (status=$root_code)."
else
  emit_pass "Runtime smoke started: local app reachable at $base_url."

  pages=(/ /login /register /tournaments /rankings /athletes /dashboard /profile /athletes/create /tournaments/create)
  page_fail=0
  for p in "${pages[@]}"; do
    code="$(http_code "$base_url$p")"
    if [[ "$code" != "200" ]]; then
      page_fail=1
      emit_fail "Page check failed: GET $p returned $code."
    fi
  done
  if [[ "$page_fail" -eq 0 ]]; then
    emit_pass "Runtime page smoke passed (10/10 expected pages returned 200)."
  fi

  public_apis=(/api/athletes /api/tournaments /api/rankings)
  api_fail=0
  for p in "${public_apis[@]}"; do
    code="$(http_code "$base_url$p")"
    if [[ "$code" != "200" ]]; then
      api_fail=1
      emit_fail "Public API check failed: GET $p returned $code."
    fi
  done
  if [[ "$api_fail" -eq 0 ]]; then
    emit_pass "Runtime public API smoke passed (athletes/tournaments/rankings all 200)."
  fi
fi

printf 'SUMMARY|pass=%d|warn=%d|fail=%d\n' "$pass_count" "$warn_count" "$fail_count"

if [[ "$fail_count" -gt 0 ]]; then
  exit 2
fi

exit 0
