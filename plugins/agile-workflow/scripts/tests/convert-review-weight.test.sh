#!/usr/bin/env bash
# Structural contract test for review_weight handling in convert/SKILL.md.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_MD="${SCRIPT_DIR}/../../skills/convert/SKILL.md"
PASS=0
FAIL=0

assert_contains() {
  local label="$1" block="$2" pattern="$3"
  if printf '%s' "$block" | grep -Fq -- "$pattern"; then
    echo "  PASS: $label"
    ((PASS++))
  else
    echo "  FAIL: $label"
    ((FAIL++))
  fi
}

extract_block() {
  local start="$1" end="$2"
  awk -v start="$start" -v end="$end" '
    $0 == start { collecting = 1 }
    collecting && $0 == end { collecting = 0 }
    collecting { print }
  ' "$SKILL_MD"
}

if [ ! -f "$SKILL_MD" ]; then
  echo "FAIL: convert/SKILL.md not found at $SKILL_MD" >&2
  exit 1
fi

INTERVIEW_BLOCK="$(extract_block '### Phase 3: Conventions interview' '### Phase 4: Create substrate skeleton')"
WRITE_BLOCK="$(extract_block '### Phase 5: Write CONVENTIONS.md' '### Phase 6: Write the canonical AGENTS.md section')"
AUDIT_BLOCK="$(extract_block '### Phase S1: Audit substrate health' '### Phase S2: Plan the sync')"
PRESERVE_BLOCK="$(extract_block '### Phase S4: Preserve user state' '### Phase S5: Commit')"
RULES_BLOCK="$(extract_block '### Phase 6.5: Write `.agents/rules/agile-workflow.md` (rules-first, then slim)' '### Phase 7: Preserve Claude Code compatibility')"

assert_contains "bootstrap keeps the six-question interview" "$INTERVIEW_BLOCK" \
  'Six questions, in order'
assert_contains "review weight adds no interview question" "$INTERVIEW_BLOCK" \
  'not another interview question'
assert_contains "fresh bootstrap writes the standard default" "$WRITE_BLOCK" \
  'review_weight: standard'
assert_contains "all five values are discoverable" "$WRITE_BLOCK" \
  'none | light | standard | thorough | maximum'
assert_contains "missing setting resolves to standard" "$WRITE_BLOCK" \
  'is absent, review and autopilot resolve it to `standard`'
assert_contains "convert points to canonical policy" "$WRITE_BLOCK" \
  'principles/SKILL.md` Part IV and `review/SKILL.md'
assert_contains "sync accepts absence without migration" "$AUDIT_BLOCK" \
  'sync neither inserts the default into older projects'
assert_contains "sync preserves existing values" "$PRESERVE_BLOCK" \
  'preserve an existing value byte-for-byte'
assert_contains "sync never resets the setting" "$PRESERVE_BLOCK" \
  'never added, reset, or rewritten by sync'
assert_contains "generated rules name standard as the default" "$RULES_BLOCK" \
  'Review weight defaults to'
assert_contains "generated rules keep standard single-pass" "$RULES_BLOCK" \
  'material blockers, verification, and `done` without re-review'
assert_contains "generated rules reserve multi-pass review" "$RULES_BLOCK" \
  'Only `thorough` and `maximum` use multi-pass review'
assert_contains "generated rules ignore small findings for convergence" "$RULES_BLOCK" \
  'findings are parked unbound, kept as nits, or rejected by judgment'

printf '\nResults: %d passed, %d failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
