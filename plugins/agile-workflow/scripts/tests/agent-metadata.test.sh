#!/usr/bin/env bash
# agent-metadata.test.sh - guard agile-workflow harness-specific agent metadata.

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

for role in designer implementor reviewer; do
  assert_true "Pi ${role} agent exists" "[ -f '${PLUGIN_ROOT}/agents/pi/${role}.md' ]"
  assert_true "Claude ${role} agent exists" "[ -f '${PLUGIN_ROOT}/agents/claude/${role}.md' ]"
  assert_true "Pi ${role} uses @gotgenes prompt_mode format" \
    "grep -q '^prompt_mode: append$' '${PLUGIN_ROOT}/agents/pi/${role}.md'"
done

assert_true "Pi agents do not use broken tools: all shorthand" \
  "! grep -R '^tools: all$' '${PLUGIN_ROOT}/agents/pi' >/dev/null"

for role in aw-designer aw-implementor aw-reviewer; do
  file="${PLUGIN_ROOT}/agents/codex/${role}.toml"
  assert_true "Codex ${role} template exists" "[ -f '$file' ]"
  assert_true "Codex ${role} has name" "grep -q '^name = \"${role}\"$' '$file'"
  assert_true "Codex ${role} has description" "grep -q '^description = ' '$file'"
  assert_true "Codex ${role} has developer instructions" "grep -q '^developer_instructions = \"\"\"$' '$file'"
done

assert_eq "Claude manifest agents pointer" "./agents/claude/" \
  "$(jq -r '.agents' "${PLUGIN_ROOT}/.claude-plugin/plugin.json")"
assert_eq "Pi package explicitly supports @gotgenes/pi-subagents" "@gotgenes/pi-subagents" \
  "$(jq -r '.pi.subagents.provider' "${PLUGIN_ROOT}/package.json")"

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
