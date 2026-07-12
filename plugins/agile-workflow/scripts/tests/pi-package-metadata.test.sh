#!/usr/bin/env bash
# pi-package-metadata.test.sh — guard every independently published Pi package.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"

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

assert_package() {
  local plugin="$1" expected_name="$2" expect_extensions="$3" expect_channels="$4"
  local plugin_dir="${REPO_ROOT}/plugins/${plugin}"
  local package_json="${plugin_dir}/package.json"
  local readme="${plugin_dir}/README.md"
  local claude_json="${plugin_dir}/.claude-plugin/plugin.json"
  local codex_json="${plugin_dir}/.codex-plugin/plugin.json"

  echo ""
  echo "=== Plugin: ${plugin} ==="
  assert_true "${plugin} package.json exists" "[ -f '$package_json' ]"
  assert_true "${plugin} README exists" "[ -f '$readme' ]"

  local package_version
  package_version="$(json_value '.version' "$package_json")"
  assert_eq "${plugin} package name" "$expected_name" "$(json_value '.name' "$package_json")"
  assert_true "${plugin} package version is non-empty semver" \
    "printf '%s' '$package_version' | grep -Eq '^[0-9]+[.][0-9]+[.][0-9]+([-+][0-9A-Za-z.-]+)?\$'"
  assert_true "${plugin} has pi-package keyword" \
    "jq -e '.keywords | index(\"pi-package\")' '$package_json' >/dev/null"
  assert_eq "${plugin} publish access is public" "public" "$(json_value '.publishConfig.access' "$package_json")"
  assert_eq "${plugin} repository directory" "plugins/${plugin}" "$(json_value '.repository.directory' "$package_json")"
  assert_eq "${plugin} pi.skills" "[\"./skills\"]" "$(jq -c '.pi.skills' "$package_json")"
  assert_true "${plugin} skills directory exists" "[ -d '${plugin_dir}/skills' ]"

  if [ "$expect_extensions" = "yes" ]; then
    assert_eq "${plugin} pi.extensions" "[\"./extensions\"]" "$(jq -c '.pi.extensions' "$package_json")"
    assert_true "${plugin} extensions directory exists" "[ -d '${plugin_dir}/extensions' ]"
  else
    assert_eq "${plugin} pi.extensions absent" "null" "$(jq -c '.pi.extensions // null' "$package_json")"
  fi

  if [ "$expect_channels" = "yes" ]; then
    assert_true "${plugin} claude plugin.json exists" "[ -f '$claude_json' ]"
    assert_true "${plugin} codex plugin.json exists" "[ -f '$codex_json' ]"
    assert_eq "${plugin} claude/package version lockstep" "$package_version" "$(json_value '.version' "$claude_json")"
    assert_eq "${plugin} codex/package version lockstep" "$package_version" "$(json_value '.version' "$codex_json")"
  else
    assert_true "${plugin} is intentionally Pi-only" "[ ! -f '$claude_json' ] && [ ! -f '$codex_json' ]"
  fi

  assert_eq "${plugin} pi.subagents absent" "null" "$(jq -c '.pi.subagents // null' "$package_json")"
}

echo ""
echo "=== Preflight: jq and Pi package metadata ==="
assert_true "jq is available" "command -v jq >/dev/null 2>&1"

# Runtime-extension packages.
assert_package "agile-workflow" "@nklisch/pi-agile-workflow" "yes" "yes"
assert_package "background-tasks" "@nklisch/pi-background-tasks" "yes" "no"
assert_package "nates-toolkit" "@nklisch/pi-nates-toolkit" "yes" "yes"
assert_package "zai-research" "@nklisch/pi-zai-research" "yes" "yes"

# Skills-only packages.
assert_package "agent-coordination" "@nklisch/pi-agent-coordination" "no" "yes"
assert_package "agentic-research" "@nklisch/pi-agentic-research" "no" "yes"
assert_package "code-audit" "@nklisch/pi-code-audit" "no" "yes"
assert_package "ux-ui-design" "@nklisch/pi-ux-ui-design" "no" "yes"

# The deprecated workflow plugin remains intentionally absent from Pi packages.
assert_true "deprecated workflow plugin has no Pi package manifest" \
  "[ ! -f '${REPO_ROOT}/plugins/workflow/package.json' ]"

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
