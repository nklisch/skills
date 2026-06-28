#!/usr/bin/env bash
# agent-metadata.test.sh - guard agile-workflow's no-shipped-agents posture.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"
PLUGIN_ROOT="${REPO_ROOT}/plugins/agile-workflow"

PASS=0
FAIL=0
ERRORS=()

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

echo ""
echo "=== Agile-workflow agent metadata ==="

assert_true "Agile-workflow ships no custom agent directory" \
  "[ ! -d '${PLUGIN_ROOT}/agents' ]"
assert_eq "Claude manifest agents absent" "null" \
  "$(jq -c '.agents // null' "${PLUGIN_ROOT}/.claude-plugin/plugin.json")"
assert_eq "Pi package subagents absent" "null" \
  "$(jq -c '.pi.subagents // null' "${PLUGIN_ROOT}/package.json")"
assert_eq "Codex manifest agents absent" "null" \
  "$(jq -c '.agents // null' "${PLUGIN_ROOT}/.codex-plugin/plugin.json")"
assert_true "Dynamic subagent reference exists" \
  "[ -f '${PLUGIN_ROOT}/skills/principles/references/subagents.md' ]"
assert_true "Dynamic subagent reference names general-purpose posture" \
  "grep -q 'generic/general-purpose subagent' '${PLUGIN_ROOT}/skills/principles/references/subagents.md'"
assert_true "Dynamic subagent reference rejects shipped role names" \
  "grep -Eq 'does .{0,8}not.{0,8} ship custom subagent definitions' '${PLUGIN_ROOT}/skills/principles/references/subagents.md'"

assert_true "Skills do not reference removed shipped scanner role" \
  "! grep -R 'shipped agile-workflow.*scanner' '${PLUGIN_ROOT}/skills' >/dev/null"
assert_true "Skills do not reference removed role definitions" \
  "! grep -R 'role definitions are available' '${PLUGIN_ROOT}/skills' >/dev/null"

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
