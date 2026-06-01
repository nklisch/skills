#!/usr/bin/env bash
# work-view-dist-version.test.sh — guard committed prebuilt version stamps.
#
# The installer trusts supported-platform prebuilts only after their --version
# matches the plugin manifest. This test keeps the committed dist/ tree in that
# same state so a version bump cannot publish stale board-capable binaries.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
PLUGIN_JSON="${PLUGIN_ROOT}/.claude-plugin/plugin.json"

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

plugin_version() {
  sed -n 's/^[[:space:]]*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$PLUGIN_JSON" | head -n 1
}

echo ""
echo "=== Preflight: plugin manifest and dist binaries ==="
assert_true "plugin manifest exists" "[ -f '$PLUGIN_JSON' ]"
VERSION="$(plugin_version)"
assert_true "plugin version is readable" "[ -n '$VERSION' ]"

TRIPLES=(
  x86_64-unknown-linux-musl
  aarch64-unknown-linux-musl
  x86_64-apple-darwin
  aarch64-apple-darwin
)

echo ""
echo "=== Test group 1: all supported prebuilts embed plugin version ==="
for triple in "${TRIPLES[@]}"; do
  bin="${PLUGIN_ROOT}/work-view/dist/${triple}/work-view"
  assert_true "${triple} binary exists" "[ -f '$bin' ]"
  assert_true "${triple} binary executable" "[ -x '$bin' ]"
  assert_true "${triple} embeds work-view ${VERSION}" \
    "LC_ALL=C grep -a -q 'work-view ${VERSION}\\|${VERSION}' '$bin'"
done

echo ""
echo "=== Test group 2: native Linux x86_64 binary reports version and board help ==="
HOST_S="$(uname -s 2>/dev/null || printf unknown)"
HOST_M="$(uname -m 2>/dev/null || printf unknown)"
if [ "$HOST_S" = "Linux" ] && { [ "$HOST_M" = "x86_64" ] || [ "$HOST_M" = "amd64" ]; }; then
  native="${PLUGIN_ROOT}/work-view/dist/x86_64-unknown-linux-musl/work-view"
  assert_eq "native --version matches plugin" "work-view ${VERSION}" "$("$native" --version)"
  assert_true "native supports board --help" "'$native' board --help >/dev/null 2>&1"
else
  echo "  SKIP: native execution check requires Linux x86_64 host (got ${HOST_S}/${HOST_M})"
fi

echo ""
echo "=== Test group 3: repo dogfood work-view install matches plugin ==="
DOGFOOD_BIN="${PLUGIN_ROOT}/../../.work/bin/work-view"
if [ -e "$DOGFOOD_BIN" ]; then
  assert_true "dogfood work-view executable" "[ -x '$DOGFOOD_BIN' ]"
  assert_eq "dogfood --version matches plugin" "work-view ${VERSION}" "$("$DOGFOOD_BIN" --version)"
else
  echo "  SKIP: no repo dogfood .work/bin/work-view install present"
fi

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
