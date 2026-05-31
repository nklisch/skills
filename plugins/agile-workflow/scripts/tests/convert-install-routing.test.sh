#!/usr/bin/env bash
# convert-install-routing.test.sh — structural regression guard for convert/SKILL.md
#
# The convert skill's install path MUST route through install-work-view.sh in
# BOTH the bootstrap branch (Phase 4: Create substrate skeleton) and the sync
# branch (Phase S3: Apply refreshes). A future edit that reverts either block to
# a raw `cp .../work-view.sh .work/bin/work-view` would silently bypass the
# prebuilt-binary selection + bash fallback the installer provides, and pass the
# existing install-work-view.test.sh (which tests the helper directly, not the
# seam).
#
# This is a structural test on the SKILL.md prose (Recommendation A from the
# cross-model consult): for a markdown skill, guard the instructions as written.
# It extracts the bounded Phase 4 and Phase S3 blocks and asserts:
#   1. each block references install-work-view.sh
#   2. neither block contains a raw `cp ... work-view.sh ... .work/bin/work-view`
#
# Runnable locally and from CI. Exits non-zero if any assertion fails.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_MD="${SCRIPT_DIR}/../../skills/convert/SKILL.md"

# ---------------------------------------------------------------------------
# Counters
# ---------------------------------------------------------------------------
PASS=0
FAIL=0
ERRORS=()

# ---------------------------------------------------------------------------
# assert helpers
# ---------------------------------------------------------------------------
assert_true() {
  local label="$1"
  if eval "$2"; then
    echo "  PASS: $label"
    ((PASS++))
  else
    echo "  FAIL: $label"
    echo "        condition false: $2"
    ((FAIL++))
    ERRORS+=("$label")
  fi
}

assert_false() {
  local label="$1"
  if ! eval "$2"; then
    echo "  PASS: $label"
    ((PASS++))
  else
    echo "  FAIL: $label"
    echo "        expected false but was true: $2"
    ((FAIL++))
    ERRORS+=("$label")
  fi
}

# ---------------------------------------------------------------------------
# extract_block <start-heading> <end-heading>
# Prints the lines of SKILL.md from the start heading (inclusive) up to but not
# including the end heading. Anchors on exact "### <Phase ...>" headings.
# ---------------------------------------------------------------------------
extract_block() {
  local start="$1" end="$2"
  awk -v start="$start" -v end="$end" '
    $0 == start { collecting = 1 }
    collecting && $0 == end { collecting = 0 }
    collecting { print }
  ' "$SKILL_MD"
}

# ---------------------------------------------------------------------------
# Preflight: SKILL.md exists
# ---------------------------------------------------------------------------
echo ""
echo "=== Preflight: convert/SKILL.md present ==="
assert_true "convert/SKILL.md exists" "[ -f '$SKILL_MD' ]"
if [ ! -f "$SKILL_MD" ]; then
  echo "ERROR: cannot locate convert/SKILL.md at $SKILL_MD" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Extract the two bounded blocks
# ---------------------------------------------------------------------------
PHASE4_BLOCK="$(extract_block "### Phase 4: Create substrate skeleton" "### Phase 5: Write CONVENTIONS.md")"
PHASES3_BLOCK="$(extract_block "### Phase S3: Apply refreshes" "### Phase S4: Preserve user state")"

# A raw fallback copy regression looks like:
#   cp "${PLUGIN_ROOT}/scripts/work-view.sh" .work/bin/work-view
# i.e. a single line containing all three of: cp, work-view.sh, .work/bin/work-view
RAW_CP_RE='cp.*work-view\.sh.*\.work/bin/work-view'

# ---------------------------------------------------------------------------
# Test group 1: blocks were located and are non-empty
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 1: phase blocks located ==="
assert_true "Phase 4 block is non-empty" "[ -n \"\$PHASE4_BLOCK\" ]"
assert_true "Phase 4 block starts at its heading" \
  "printf '%s' \"\$PHASE4_BLOCK\" | head -n1 | grep -q '^### Phase 4: Create substrate skeleton$'"
assert_true "Phase S3 block is non-empty" "[ -n \"\$PHASES3_BLOCK\" ]"
assert_true "Phase S3 block starts at its heading" \
  "printf '%s' \"\$PHASES3_BLOCK\" | head -n1 | grep -q '^### Phase S3: Apply refreshes$'"

# ---------------------------------------------------------------------------
# Test group 2: both blocks route through install-work-view.sh
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 2: install routing present ==="
assert_true "Phase 4 references install-work-view.sh" \
  "printf '%s' \"\$PHASE4_BLOCK\" | grep -q 'install-work-view\.sh'"
assert_true "Phase S3 references install-work-view.sh" \
  "printf '%s' \"\$PHASES3_BLOCK\" | grep -q 'install-work-view\.sh'"

# ---------------------------------------------------------------------------
# Test group 3: neither block contains a raw fallback cp regression
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 3: no raw 'cp ... work-view.sh ... .work/bin/work-view' regression ==="
assert_false "Phase 4 has no raw cp fallback" \
  "printf '%s' \"\$PHASE4_BLOCK\" | grep -Eq '$RAW_CP_RE'"
assert_false "Phase S3 has no raw cp fallback" \
  "printf '%s' \"\$PHASES3_BLOCK\" | grep -Eq '$RAW_CP_RE'"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "============================================================"
echo "Results: ${PASS} passed, ${FAIL} failed"
if [ ${#ERRORS[@]} -gt 0 ]; then
  echo "Failed tests:"
  for e in "${ERRORS[@]}"; do
    echo "  - $e"
  done
fi
echo "============================================================"

[ "$FAIL" -eq 0 ] || exit 1
