#!/usr/bin/env bash
# pi-package-metadata.test.sh — guard real Pi package metadata for supported plugins.

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
  local plugin="$1" expected_name="$2" expected_version="$3" expect_extensions="$4"
  local package_json="${REPO_ROOT}/plugins/${plugin}/package.json"
  local claude_json="${REPO_ROOT}/plugins/${plugin}/.claude-plugin/plugin.json"
  local codex_json="${REPO_ROOT}/plugins/${plugin}/.codex-plugin/plugin.json"

  echo ""
  echo "=== Plugin: ${plugin} ==="
  assert_true "${plugin} package.json exists" "[ -f '$package_json' ]"
  assert_true "${plugin} claude plugin.json exists" "[ -f '$claude_json' ]"
  assert_true "${plugin} codex plugin.json exists" "[ -f '$codex_json' ]"

  local package_version claude_version codex_version
  package_version="$(json_value '.version' "$package_json")"
  claude_version="$(json_value '.version' "$claude_json")"
  codex_version="$(json_value '.version' "$codex_json")"

  assert_eq "${plugin} package name" "$expected_name" "$(json_value '.name' "$package_json")"
  assert_eq "${plugin} package version" "$expected_version" "$package_version"
  assert_eq "${plugin} claude/package version lockstep" "$claude_version" "$package_version"
  assert_eq "${plugin} codex/package version lockstep" "$codex_version" "$package_version"
  assert_true "${plugin} has pi-package keyword" \
    "jq -e '.keywords | index(\"pi-package\")' '$package_json' >/dev/null"
  assert_eq "${plugin} pi.skills" "[\"./skills\"]" "$(jq -c '.pi.skills' "$package_json")"

  if [ "$expect_extensions" = "yes" ]; then
    assert_eq "${plugin} pi.extensions" "[\"./extensions\"]" "$(jq -c '.pi.extensions' "$package_json")"
  else
    assert_eq "${plugin} pi.extensions absent" "null" "$(jq -c '.pi.extensions // null' "$package_json")"
  fi
}

echo ""
echo "=== Preflight: jq and plugin package metadata ==="
assert_true "jq is available" "command -v jq >/dev/null 2>&1"

assert_package "agile-workflow" "@nklisch/pi-agile-workflow" "0.9.5" "yes"
assert_package "nates-toolkit" "@nklisch/pi-nates-toolkit" "0.1.1" "no"
assert_package "ux-ui-design" "@nklisch/pi-ux-ui-design" "0.4.1" "no"

echo ""
echo "=== Deprecated workflow plugin ==="
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
