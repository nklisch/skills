#!/usr/bin/env bash
# convert-content-integrity.test.sh — structural regression guards for two
# markdown-skill invariants that are cheaply machine-checkable:
#
#  (a) convert/SKILL.md DEFINES the content-integrity gate once, the gate
#      enumerates the destructive ops it governs, and the document's destructive
#      verb sites (git rm / git mv / shim / symlink / managed-section overwrite /
#      mirror replacement) each sit near a content-integrity reference. A future
#      edit could silently strip the gate or perform a destructive op without
#      routing through it.
#
#  (b) Each enumerated design/implement/review-family SKILL.md grounds on
#      `.agents/rules/*.md` (the project's force-loaded agent rules) in its
#      grounding phase. A future edit could silently drop one.
#
# These are structural tests on SKILL.md prose, mirroring
# convert-install-routing.test.sh. Runnable locally and from CI. Exits non-zero
# if any assertion fails.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_DIR="${SCRIPT_DIR}/../../skills"
CONVERT_MD="${SKILLS_DIR}/convert/SKILL.md"

# ---------------------------------------------------------------------------
# Counters
# ---------------------------------------------------------------------------
PASS=0
FAIL=0
ERRORS=()

assert_eq() {
  local label="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    echo "  PASS: $label"
    ((PASS++))
  else
    echo "  FAIL: $label"
    echo "        expected: $(printf '%q' "$expected")"
    echo "        actual:   $(printf '%q' "$actual")"
    ((FAIL++))
    ERRORS+=("$label")
  fi
}

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

# ---------------------------------------------------------------------------
# Preflight: convert/SKILL.md present
# ---------------------------------------------------------------------------
echo ""
echo "=== Preflight: convert/SKILL.md present ==="
assert_true "convert/SKILL.md exists" "[ -f '$CONVERT_MD' ]"
if [ ! -f "$CONVERT_MD" ]; then
  echo "ERROR: cannot locate convert/SKILL.md at $CONVERT_MD" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Test group 1: content-integrity gate is defined exactly once
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 1: content-integrity gate defined ==="

# The canonical gate-definition line (a blockquote bold lead-in). Use a
# fixed-string match so the literal parentheses are not interpreted as regex.
GATE_DEF_LITERAL='Content-integrity gate (before any destructive op)'
GATE_DEF_COUNT="$(grep -cF "$GATE_DEF_LITERAL" "$CONVERT_MD")"
assert_eq "content-integrity gate defined exactly once" "1" "$GATE_DEF_COUNT"

# The gate must describe itself as a hard precondition, not advice.
assert_true "gate is stated as a hard precondition (not advice)" \
  "grep -q 'hard precondition, not advice' '$CONVERT_MD'"

# ---------------------------------------------------------------------------
# Test group 2: the gate enumerates each destructive op kind it governs
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 2: gate enumerates the destructive op kinds ==="

# Extract the gate's definition block: from the gate-definition line up to the
# blank-quote separator line (`>` alone) that closes the enumeration.
GATE_BLOCK="$(awk -v needle="$GATE_DEF_LITERAL" '
  index($0, needle) { collecting = 1 }
  collecting && $0 == ">" { print; exit }
  collecting { print }
' "$CONVERT_MD")"

assert_true "gate block is non-empty" "[ -n \"\$GATE_BLOCK\" ]"
assert_true "gate enumerates git rm / delete" \
  "printf '%s' \"\$GATE_BLOCK\" | grep -qE 'git rm.*delete|delete'"
assert_true "gate enumerates git mv / move" \
  "printf '%s' \"\$GATE_BLOCK\" | grep -qE 'git mv.*move|move'"
assert_true "gate enumerates replace-with-symlink" \
  "printf '%s' \"\$GATE_BLOCK\" | grep -q 'replace-with-symlink'"
assert_true "gate enumerates replace-with-shim" \
  "printf '%s' \"\$GATE_BLOCK\" | grep -q 'replace-with-shim'"
assert_true "gate enumerates managed-section overwrite" \
  "printf '%s' \"\$GATE_BLOCK\" | grep -q 'managed-section'"
assert_true "gate enumerates mirror replacement" \
  "printf '%s' \"\$GATE_BLOCK\" | grep -q 'mirror replacement'"

# ---------------------------------------------------------------------------
# Test group 3: the Hard-rules summary restates the precondition
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 3: Hard-rules summary restates content integrity first ==="

assert_true "summary: content integrity mandatory before every destructive op" \
  "grep -q 'Content integrity is mandatory before every destructive op' '$CONVERT_MD'"

# ---------------------------------------------------------------------------
# Test group 4: destructive verb sites each sit near a content-integrity ref
#
# Invariant: every line that performs/names a destructive op must be authored in
# proximity to the gate. A site is satisfied if EITHER
#   * a 'content-integrity' reference appears within +/- WINDOW lines, OR
#   * the site lies inside the gate's own defining section (Phase 1.8 through its
#     manifest sub-sections) — those lines describe the ops the gate governs and
#     ARE the gate, so they need no separate nearby reference.
# This catches a future destructive instruction added in isolation from the gate
# (e.g. a new shim/removal step in a migration path with no gate routing).
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 4: destructive verb sites reference content-integrity nearby ==="

WINDOW=8
TOTAL_LINES="$(wc -l < "$CONVERT_MD")"

# Bounds of the content-integrity gate's defining section: from the "### Phase
# 1.8" heading to the line before the next top-level "### Phase 2" heading.
GATE_SECTION_START="$(grep -nE '^### Phase 1\.8' "$CONVERT_MD" | head -n1 | cut -d: -f1)"
GATE_SECTION_END="$(grep -nE '^### Phase 2' "$CONVERT_MD" | head -n1 | cut -d: -f1)"
assert_true "Phase 1.8 gate section start located" "[ -n '$GATE_SECTION_START' ]"
assert_true "Phase 2 boundary (gate section end) located" "[ -n '$GATE_SECTION_END' ]"

# Lines naming a destructive op via this skill's operative phrasings.
mapfile -t DESTRUCTIVE_LINES < <(
  grep -nE 'shim/removal|managed-section overwrite|mirror replacement|source-eliminating op|replace the file with the .* shim|replace-with-symlink / replace-with-shim' "$CONVERT_MD" \
    | cut -d: -f1
)

assert_true "found destructive-op sites to check" "[ \"\${#DESTRUCTIVE_LINES[@]}\" -gt 0 ]"

in_gate_section() {
  local line="$1"
  [ "$line" -ge "$GATE_SECTION_START" ] && [ "$line" -lt "$GATE_SECTION_END" ]
}

near_content_integrity() {
  local line="$1"
  local lo=$(( line - WINDOW )); [ "$lo" -lt 1 ] && lo=1
  local hi=$(( line + WINDOW )); [ "$hi" -gt "$TOTAL_LINES" ] && hi="$TOTAL_LINES"
  sed -n "${lo},${hi}p" "$CONVERT_MD" | grep -qiE 'content[- ]integrity'
}

ALL_GUARDED=1
for ln in "${DESTRUCTIVE_LINES[@]}"; do
  if in_gate_section "$ln" || near_content_integrity "$ln"; then
    continue
  fi
  ALL_GUARDED=0
  echo "        destructive-op site at line $ln is neither inside the gate section nor within +/- ${WINDOW} lines of a content-integrity reference" >&2
done
assert_true "every destructive-op site is gate-guarded (in gate section or near a content-integrity ref)" \
  "[ '$ALL_GUARDED' -eq 1 ]"

# ---------------------------------------------------------------------------
# Test group 5: family skills ground on .agents/rules/*.md
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 5: design/implement/review-family skills ground on .agents/rules ==="

# The enumerated family skills whose grounding phase must read the project's
# force-loaded agent rules.
FAMILY_SKILLS=(
  feature-design
  epic-design
  refactor-design
  perf-design
  e2e-test-design
  implement
  implement-orchestrator
  review
  fix
)

# grounds_on_rules <skill-md> — true iff the file references the
# `.agents/rules/*.md` path AND a "force-loaded" grounding descriptor appears
# within +/- GROUND_WINDOW lines of that path. Window-based so it tolerates the
# line-wrapping some skills use ("...the project's force-loaded" / "agent rules"
# on the next line) without weakening to a bare path match.
GROUND_WINDOW=2
grounds_on_rules() {
  local md="$1"
  local total; total="$(wc -l < "$md")"
  local ln lo hi
  while IFS=: read -r ln _; do
    [ -z "$ln" ] && continue
    lo=$(( ln - GROUND_WINDOW )); [ "$lo" -lt 1 ] && lo=1
    hi=$(( ln + GROUND_WINDOW )); [ "$hi" -gt "$total" ] && hi="$total"
    if sed -n "${lo},${hi}p" "$md" | grep -qi 'force-loaded'; then
      return 0
    fi
  done < <(grep -n '\.agents/rules/\*\.md' "$md")
  return 1
}

for skill in "${FAMILY_SKILLS[@]}"; do
  md="${SKILLS_DIR}/${skill}/SKILL.md"
  assert_true "${skill}/SKILL.md exists" "[ -f '$md' ]"
  # Grounding context: the .agents/rules/*.md path paired with the recurring
  # "force-loaded [agent rules]" grounding descriptor near that path.
  assert_true "${skill} references .agents/rules/*.md path" \
    "grep -q '\.agents/rules/\*\.md' '$md'"
  assert_true "${skill} grounds .agents/rules as force-loaded agent rules" \
    "grounds_on_rules '$md'"
done

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
