#!/usr/bin/env bash
# Verify that the degraded bash fallback keeps review non-blocking for
# dependency-ordered implementation.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK_VIEW="${SCRIPT_DIR}/../work-view.sh"
ROOT="$(mktemp -d)"
trap 'rm -rf "$ROOT"' EXIT

PASS=0
FAIL=0

assert_contains() {
  local label="$1" haystack="$2" needle="$3"
  if grep -Fq "$needle" <<<"$haystack"; then
    echo "  PASS: $label"
    ((PASS++))
  else
    echo "  FAIL: $label"
    echo "        missing: $needle"
    ((FAIL++))
  fi
}

assert_not_contains() {
  local label="$1" haystack="$2" needle="$3"
  if ! grep -Fq "$needle" <<<"$haystack"; then
    echo "  PASS: $label"
    ((PASS++))
  else
    echo "  FAIL: $label"
    echo "        unexpected: $needle"
    ((FAIL++))
  fi
}

write_feature() {
  local id="$1" stage="$2" deps="$3"
  cat >"$ROOT/.work/active/features/${id}.md" <<EOF
---
id: $id
kind: feature
stage: $stage
tags: []
parent: null
depends_on: $deps
release_binding: null
gate_origin: null
created: 2026-01-01
updated: 2026-01-01
---

# $id
EOF
}

mkdir -p "$ROOT/.work/active/features"
printf '# Test conventions\n' >"$ROOT/.work/CONVENTIONS.md"
write_feature "upstream" "review" "[]"
write_feature "downstream" "implementing" "[upstream]"

ready="$(cd "$ROOT" && "$WORK_VIEW" --ready --paths)"
blocked="$(cd "$ROOT" && "$WORK_VIEW" --blocked --paths)"

assert_contains "review dependency permits downstream readiness" "$ready" "downstream.md"
assert_not_contains "review dependency does not report downstream blocked" "$blocked" "downstream.md"

echo
printf 'Results: %d passed, %d failed\n' "$PASS" "$FAIL"
((FAIL == 0))
