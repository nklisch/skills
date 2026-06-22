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

for role in designer implementor reviewer scanner; do
  shared="${PLUGIN_ROOT}/agents/shared/${role}.md"
  claude="${PLUGIN_ROOT}/agents/claude/${role}.md"
  pi="${PLUGIN_ROOT}/agents/pi/${role}.md"

  assert_true "Shared ${role} agent exists" "[ -f '$shared' ]"
  assert_true "Claude ${role} agent exists" "[ -f '$claude' ]"
  assert_true "Pi ${role} agent exists" "[ -f '$pi' ]"
  assert_true "Claude ${role} is symlinked to shared" "[ -L '$claude' ]"
  assert_true "Pi ${role} is symlinked to shared" "[ -L '$pi' ]"
  assert_eq "Claude ${role} symlink target" "../shared/${role}.md" "$(readlink "$claude")"
  assert_eq "Pi ${role} symlink target" "../shared/${role}.md" "$(readlink "$pi")"
  assert_true "Shared ${role} has Claude-compatible name" "grep -q '^name: ${role}$' '$shared'"
  assert_true "Shared ${role} has description" "grep -q '^description: >$' '$shared'"
  assert_true "Shared ${role} description is caller-facing" "python3 - '$shared' <<'PY'
import re, sys
text = open(sys.argv[1], encoding='utf-8').read()
match = re.search(r'description: >\n((?:  .+\n)+)', text)
desc = ' '.join(line.strip() for line in match.group(1).splitlines()) if match else ''
raise SystemExit(0 if desc.startswith('Use for ') and len(desc) <= 1024 else 1)
PY"
  assert_true "Shared ${role} loads principles" "grep -q '/agile-workflow:principles' '$shared'"
  assert_true "Shared ${role} grounds on VISION in body" "grep -q 'docs/VISION.md' '$shared'"
  assert_true "Shared ${role} omits tool pinning" "! grep -q '^tools:' '$shared'"
  assert_true "Shared ${role} omits Pi-only prompt_mode" "! grep -q '^prompt_mode:' '$shared'"
done

assert_true "Claude/Pi shared agents do not pin tools" \
  "! grep -H '^tools:' '${PLUGIN_ROOT}'/agents/shared/*.md '${PLUGIN_ROOT}'/agents/claude/*.md '${PLUGIN_ROOT}'/agents/pi/*.md >/dev/null"

for role in aw-designer aw-implementor aw-reviewer aw-scanner; do
  file="${PLUGIN_ROOT}/agents/codex/${role}.toml"
  assert_true "Codex ${role} template exists" "[ -f '$file' ]"
  assert_true "Codex ${role} has name" "grep -q '^name = \"${role}\"$' '$file'"
  assert_true "Codex ${role} has description" "grep -q '^description = ' '$file'"
  assert_true "Codex ${role} has developer instructions" "grep -q '^developer_instructions = \"\"\"$' '$file'"
  assert_true "Codex ${role} description is caller-facing" "python3 - '$file' <<'PY'
import sys, tomllib
data = tomllib.loads(open(sys.argv[1], encoding='utf-8').read())
desc = data.get('description', '')
raise SystemExit(0 if desc.startswith('Use for ') and len(desc) <= 1024 else 1)
PY"
  assert_true "Codex ${role} loads principles" "grep -q '/agile-workflow:principles' '$file'"
  assert_true "Codex ${role} grounds on VISION in developer instructions" "grep -q 'docs/VISION.md' '$file'"
done

assert_eq "Claude manifest agents list" \
  '["./agents/shared/designer.md","./agents/shared/implementor.md","./agents/shared/reviewer.md","./agents/shared/scanner.md"]' \
  "$(jq -c '.agents' "${PLUGIN_ROOT}/.claude-plugin/plugin.json")"
assert_eq "Pi package explicitly supports @gotgenes/pi-subagents" "@gotgenes/pi-subagents" \
  "$(jq -r '.pi.subagents.provider' "${PLUGIN_ROOT}/package.json")"
assert_eq "Pi package points at shared agent directory" '["./agents/shared"]' \
  "$(jq -c '.pi.subagents.agents' "${PLUGIN_ROOT}/package.json")"

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
