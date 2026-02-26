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

# 1) TypeScript
if npx tsc --noEmit >/dev/null 2>&1; then
  emit_pass "TypeScript check passed (npx tsc --noEmit)."
else
  emit_fail "TypeScript check failed."
fi

# 2) Prisma schema
if npx prisma validate >/dev/null 2>&1; then
  emit_pass "Prisma schema validation passed."
else
  emit_fail "Prisma schema validation failed."
fi

# 3) Static route/API references audit
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

# 4) Dead-end placeholder link audit
placeholder_hits="$(rg -n 'href=\"#\"' src | head -n 20 || true)"
if [[ -n "$placeholder_hits" ]]; then
  emit_warn "Dead-end placeholder links found (href=#)."
else
  emit_pass "No href=# placeholder links detected."
fi

# 5) Test suite presence audit
test_files="$(rg --files | rg '__tests__/|\\.test\\.|\\.spec\\.' | head -n 1 || true)"
if [[ -n "$test_files" ]]; then
  emit_pass "Automated test files detected."
else
  emit_warn "No automated test files found (__tests__/*.test/*.spec)."
fi

printf 'SUMMARY|pass=%d|warn=%d|fail=%d\n' "$pass_count" "$warn_count" "$fail_count"

if [[ "$fail_count" -gt 0 ]]; then
  exit 2
fi

exit 0
