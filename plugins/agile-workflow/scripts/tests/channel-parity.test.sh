#!/usr/bin/env bash
# channel-parity.test.sh — guard agile-workflow's Claude/Codex/Pi behavior parity.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"
PLUGIN_ROOT="${REPO_ROOT}/plugins/agile-workflow"
ROOT_PACKAGE="${REPO_ROOT}/package.json"

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

json_value() {
  jq -r "$1" "$2"
}

echo ""
echo "=== Agile-workflow channel parity ==="
assert_true "jq is available" "command -v jq >/dev/null 2>&1"

HOOKS_JSON="${PLUGIN_ROOT}/hooks/hooks.json"
PROMPT_CONTEXT="${PLUGIN_ROOT}/hooks/scripts/prompt-context.py"
MAINTAINER="${PLUGIN_ROOT}/hooks/scripts/substrate-maintainer.py"
PI_EXTENSION="${PLUGIN_ROOT}/extensions/agile-workflow.ts"
PI_TEST="${PLUGIN_ROOT}/extensions/agile-workflow.test.ts"

assert_true "shared hooks manifest exists" "[ -f '${HOOKS_JSON}' ]"
assert_true "shared prompt-context hook exists" "[ -f '${PROMPT_CONTEXT}' ]"
assert_true "shared substrate-maintainer hook exists" "[ -f '${MAINTAINER}' ]"

assert_eq "Codex manifest points at shared hooks" "./hooks/hooks.json" \
  "$(json_value '.hooks // empty' "${PLUGIN_ROOT}/.codex-plugin/plugin.json")"
assert_true "Claude plugin relies on hooks auto-discovery" \
  "[ -f '${PLUGIN_ROOT}/.claude-plugin/plugin.json' ] && [ -f '${HOOKS_JSON}' ]"
assert_eq "Pi package loads agile extension directory" "[\"./extensions\"]" \
  "$(jq -c '.pi.extensions' "${PLUGIN_ROOT}/package.json")"
assert_true "root Pi package includes agile-workflow extension" \
  "jq -e '.pi.extensions | index(\"./plugins/agile-workflow/extensions/agile-workflow.ts\")' '${ROOT_PACKAGE}' >/dev/null"

assert_true "hooks manifest has SessionStart" "jq -e '.hooks.SessionStart' '${HOOKS_JSON}' >/dev/null"
assert_true "hooks manifest has UserPromptSubmit" "jq -e '.hooks.UserPromptSubmit' '${HOOKS_JSON}' >/dev/null"
assert_true "hooks manifest has PostCompact" "jq -e '.hooks.PostCompact' '${HOOKS_JSON}' >/dev/null"
assert_true "hooks manifest has PostToolUse" "jq -e '.hooks.PostToolUse' '${HOOKS_JSON}' >/dev/null"

assert_true "Pi extension invokes prompt-context shared script" \
  "grep -q 'prompt-context.py' '${PI_EXTENSION}'"
assert_true "Pi extension invokes substrate-maintainer shared script" \
  "grep -q 'substrate-maintainer.py' '${PI_EXTENSION}'"
assert_true "Pi extension maps before_agent_start" \
  "grep -q 'before_agent_start' '${PI_EXTENSION}'"
assert_true "Pi extension maps session_start" \
  "grep -q 'session_start' '${PI_EXTENSION}'"
assert_true "Pi extension maps session_compact" \
  "grep -q 'session_compact' '${PI_EXTENSION}'"
assert_true "Pi extension maps tool_result" \
  "grep -q 'tool_result' '${PI_EXTENSION}'"
assert_true "Pi extension uses synthetic PiBeforeAgentStart rules path" \
  "grep -q 'PiBeforeAgentStart' '${PI_EXTENSION}' && grep -q 'PiBeforeAgentStart' '${PROMPT_CONTEXT}'"
assert_true "prompt-context supports forced rules for Pi rebuilt prompts" \
  "grep -q 'force_rules_context' '${PI_EXTENSION}' && grep -q 'force: bool = False' '${PROMPT_CONTEXT}'"
assert_true "Pi extension injects principles as visible hook-context message" \
  "grep -q 'agile-workflow-principles' '${PI_EXTENSION}'"

assert_true "Pi tests cover before_agent_start parity" \
  "grep -q 'before_agent_start' '${PI_TEST}' && grep -q 'shared .agents/rules content' '${PI_TEST}'"
assert_true "Pi tests cover substrate maintenance parity" \
  "grep -q 'runs substrate maintenance after mutating tools' '${PI_TEST}'"

assert_true "AGENTS states channel parity posture" \
  "grep -q 'Channel parity posture' '${REPO_ROOT}/AGENTS.md'"

assert_true "SPEC documents Pi hook parity adapter" \
  "grep -q 'Pi hook parity adapter' '${PLUGIN_ROOT}/docs/SPEC.md'"
assert_true "ARCHITECTURE documents Pi hook parity adapter" \
  "grep -q 'Pi hook parity adapter' '${PLUGIN_ROOT}/docs/ARCHITECTURE.md'"

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
