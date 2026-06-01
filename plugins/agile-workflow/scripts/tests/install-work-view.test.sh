#!/usr/bin/env bash
# install-work-view.test.sh — unit tests for install-work-view.sh
#
# Self-contained: builds a temp PLUGIN_ROOT with stub artifacts and drives the
# helper with WORK_VIEW_UNAME_S/M overrides and a temp working directory.
#
# Runnable locally and from CI. Exits non-zero if any assertion fails.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HELPER="${SCRIPT_DIR}/../install-work-view.sh"
TEST_VERSION="9.8.7"
STATUS_PREBUILT_X64="installed prebuilt x86_64-unknown-linux-musl (work-view ${TEST_VERSION})"
STATUS_PREBUILT_DARWIN_ARM64="installed prebuilt aarch64-apple-darwin (work-view ${TEST_VERSION})"
STATUS_FALLBACK="installed bash fallback (work-view ${TEST_VERSION})"

# ---------------------------------------------------------------------------
# Counters
# ---------------------------------------------------------------------------
PASS=0
FAIL=0
ERRORS=()

# ---------------------------------------------------------------------------
# assert helpers
# ---------------------------------------------------------------------------
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
# Setup: build a temp PLUGIN_ROOT with stub artifacts
# ---------------------------------------------------------------------------
PLUGIN_ROOT_DIR="$(mktemp -d)"
trap 'rm -rf "$PLUGIN_ROOT_DIR"' EXIT

mkdir -p \
  "${PLUGIN_ROOT_DIR}/.claude-plugin" \
  "${PLUGIN_ROOT_DIR}/scripts" \
  "${PLUGIN_ROOT_DIR}/work-view/dist/x86_64-unknown-linux-musl" \
  "${PLUGIN_ROOT_DIR}/work-view/dist/aarch64-unknown-linux-musl" \
  "${PLUGIN_ROOT_DIR}/work-view/dist/x86_64-apple-darwin" \
  "${PLUGIN_ROOT_DIR}/work-view/dist/aarch64-apple-darwin"

write_plugin_json() {
  local version="$1"
  cat > "${PLUGIN_ROOT_DIR}/.claude-plugin/plugin.json" <<EOF
{
  "name": "agile-workflow",
  "version": "${version}",
  "description": "fixture"
}
EOF
}

write_bash_stub() {
  local version="$1"
  cat > "${PLUGIN_ROOT_DIR}/scripts/work-view.sh" <<EOF
#!/usr/bin/env bash
if [[ "\${1:-}" == "--version" ]]; then
  echo "work-view ${version}"
  exit 0
fi
if [[ "\${1:-}" == "--help" ]]; then
  echo "work-view bash stub ${version}"
  exit 0
fi
echo "work-view bash stub ${version}"
EOF
  chmod +x "${PLUGIN_ROOT_DIR}/scripts/work-view.sh"
}

write_prebuilt_stub() {
  local triple="$1"
  local version="${2:-$TEST_VERSION}"
  local out="${PLUGIN_ROOT_DIR}/work-view/dist/${triple}/work-view"
  cat > "$out" <<EOF
#!/usr/bin/env bash
if [[ "\${1:-}" == "--version" ]]; then
  echo "work-view ${version}"
  exit 0
fi
if [[ "\${1:-}" == "--help" ]]; then
  echo "work-view prebuilt stub ${triple}"
  exit 0
fi
if [[ "\${1:-}" == "board" ]]; then
  echo "work-view board prebuilt stub ${triple}"
  exit 0
fi
echo "work-view prebuilt stub ${triple}"
EOF
  chmod +x "$out"
}

write_bad_prebuilt_stub() {
  local triple="$1"
  local out="${PLUGIN_ROOT_DIR}/work-view/dist/${triple}/work-view"
  cat > "$out" <<EOF
#!/usr/bin/env bash
if [[ "\${1:-}" == "--version" ]]; then
  echo "work-view ${TEST_VERSION}"
  exit 0
fi
exit 1
EOF
  chmod +x "$out"
}

write_plugin_json "$TEST_VERSION"
write_bash_stub "$TEST_VERSION"
write_prebuilt_stub "x86_64-unknown-linux-musl"
write_prebuilt_stub "aarch64-unknown-linux-musl"
write_prebuilt_stub "x86_64-apple-darwin"
write_prebuilt_stub "aarch64-apple-darwin"

# ---------------------------------------------------------------------------
# Helper: run install helper in a fresh temp working dir
# Returns stdout in $INSTALL_OUT, stderr in $INSTALL_ERR, rc in $INSTALL_RC.
# ---------------------------------------------------------------------------
run_install() {
  local uname_s="$1" uname_m="$2"
  local workdir
  workdir="$(mktemp -d)"
  INSTALL_ERR="${workdir}/install.err"
  INSTALL_OUT=$(
    cd "$workdir" &&
    PLUGIN_ROOT="$PLUGIN_ROOT_DIR" \
    WORK_VIEW_UNAME_S="$uname_s" \
    WORK_VIEW_UNAME_M="$uname_m" \
    bash "$HELPER" 2>"$INSTALL_ERR"
  )
  INSTALL_RC=$?
  INSTALL_WORKDIR="$workdir"
}

helper_plugin_version() {
  PLUGIN_ROOT="$PLUGIN_ROOT_DIR" bash -c 'source "$1"; plugin_version' _ "$HELPER"
}

helper_candidate_rc() {
  local candidate="$1"
  PLUGIN_ROOT="$PLUGIN_ROOT_DIR" bash -c 'source "$1"; candidate_is_current "$2" "$3"' _ "$HELPER" "$candidate" "$TEST_VERSION"
}

make_candidate() {
  local body="$1"
  local candidate
  candidate="$(mktemp "${PLUGIN_ROOT_DIR}/candidate.XXXXXX")"
  cat > "$candidate" <<EOF
#!/usr/bin/env bash
${body}
EOF
  chmod +x "$candidate"
  echo "$candidate"
}

# ---------------------------------------------------------------------------
# Test 1: plugin_version reads plugin.json without jq/yq
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 1: plugin_version ==="

PV="$(helper_plugin_version)"
assert_eq "plugin_version extracts fixture version" "$TEST_VERSION" "$PV"

# ---------------------------------------------------------------------------
# Test 2: candidate_is_current version cases
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 2: candidate_is_current ==="

CURRENT_CANDIDATE="$(make_candidate 'echo "work-view 9.8.7"; exit 0')"
NONZERO_CANDIDATE="$(make_candidate 'exit 42')"
EMPTY_CANDIDATE="$(make_candidate 'exit 0')"
MISMATCH_CANDIDATE="$(make_candidate 'echo "work-view 9.8.6"; exit 0')"

helper_candidate_rc "$CURRENT_CANDIDATE"
assert_eq "candidate_is_current accepts matching last token" "0" "$?"
helper_candidate_rc "$NONZERO_CANDIDATE"
assert_eq "candidate_is_current rejects non-zero --version" "1" "$?"
helper_candidate_rc "$EMPTY_CANDIDATE"
assert_eq "candidate_is_current rejects empty --version" "1" "$?"
helper_candidate_rc "$MISMATCH_CANDIDATE"
assert_eq "candidate_is_current rejects mismatched semver" "1" "$?"

# ---------------------------------------------------------------------------
# Test 3: Default install writes prebuilt binaries on supported platforms,
# falling back to bash only for unsupported platforms.
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 3: prebuilt first, bash fallback only when unsupported ==="

run_install "Linux" "x86_64"
assert_eq "Linux x86_64 exit 0" "0" "$INSTALL_RC"
assert_eq "Linux x86_64 output" "$STATUS_PREBUILT_X64" "$INSTALL_OUT"
assert_true "Linux x86_64 work-view exists" "[ -f '${INSTALL_WORKDIR}/.work/bin/work-view' ]"
assert_true "Linux x86_64 work-view executable" "[ -x '${INSTALL_WORKDIR}/.work/bin/work-view' ]"
assert_false "Linux x86_64 no .tmp left" "[ -f '${INSTALL_WORKDIR}/.work/bin/work-view.tmp' ]"
assert_true "Linux x86_64 --version matches plugin" "[ \"\$('${INSTALL_WORKDIR}/.work/bin/work-view' --version)\" = 'work-view ${TEST_VERSION}' ]"
assert_true "Linux x86_64 installed prebuilt" "'${INSTALL_WORKDIR}/.work/bin/work-view' --help 2>/dev/null | grep -q 'prebuilt'"
assert_true "Linux x86_64 board-capable command installed" "'${INSTALL_WORKDIR}/.work/bin/work-view' board --help 2>/dev/null | grep -q 'board prebuilt'"
assert_false "Linux x86_64 did not install bash fallback" "'${INSTALL_WORKDIR}/.work/bin/work-view' --help 2>/dev/null | grep -q 'bash stub'"
rm -rf "$INSTALL_WORKDIR"

run_install "Darwin" "arm64"
assert_eq "Darwin arm64 exit 0" "0" "$INSTALL_RC"
assert_eq "Darwin arm64 output" "$STATUS_PREBUILT_DARWIN_ARM64" "$INSTALL_OUT"
assert_true "Darwin arm64 installed prebuilt" "'${INSTALL_WORKDIR}/.work/bin/work-view' --help 2>/dev/null | grep -q 'prebuilt'"
assert_false "Darwin arm64 did not install bash fallback" "'${INSTALL_WORKDIR}/.work/bin/work-view' --help 2>/dev/null | grep -q 'bash stub'"
rm -rf "$INSTALL_WORKDIR"

run_install "FreeBSD" "x86_64"
assert_eq "FreeBSD x86_64 exit 0" "0" "$INSTALL_RC"
assert_eq "FreeBSD x86_64 output" "$STATUS_FALLBACK" "$INSTALL_OUT"
assert_true "FreeBSD x86_64 installed bash fallback" "'${INSTALL_WORKDIR}/.work/bin/work-view' --help 2>/dev/null | grep -q 'bash stub'"
assert_false "FreeBSD x86_64 prebuilt not installed" "'${INSTALL_WORKDIR}/.work/bin/work-view' --help 2>/dev/null | grep -q 'prebuilt'"
rm -rf "$INSTALL_WORKDIR"

# ---------------------------------------------------------------------------
# Test 4: Fail-fast postcondition catches source-stamp drift
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 4: postcondition failure ==="

write_plugin_json "9.8.8"
write_bash_stub "$TEST_VERSION"
run_install "Linux" "x86_64"
POST_ERR="$(cat "$INSTALL_ERR" 2>/dev/null || true)"
assert_eq "postcondition drift exits 1" "1" "$INSTALL_RC"
assert_eq "postcondition drift prints no success status" "" "$INSTALL_OUT"
assert_true "postcondition drift reports version mismatch" "printf '%s' \"\$POST_ERR\" | grep -q 'does not report plugin version 9.8.8'"
assert_false "postcondition drift no .tmp left" "[ -f '${INSTALL_WORKDIR}/.work/bin/work-view.tmp' ]"
assert_false "postcondition drift no final work-view" "[ -f '${INSTALL_WORKDIR}/.work/bin/work-view' ]"
rm -rf "$INSTALL_WORKDIR"
write_plugin_json "$TEST_VERSION"
write_bash_stub "$TEST_VERSION"

# ---------------------------------------------------------------------------
# Test 5: Atomicity — failing --help leaves no partial install or tmp
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 5: atomicity ==="

write_bad_prebuilt_stub "x86_64-unknown-linux-musl"

run_install "Linux" "x86_64"
assert_eq "atomicity: failed smoke exits 1" "1" "$INSTALL_RC"
assert_false "atomicity: no .tmp after failed smoke" "[ -f '${INSTALL_WORKDIR}/.work/bin/work-view.tmp' ]"
assert_false "atomicity: no final work-view after failed smoke" "[ -f '${INSTALL_WORKDIR}/.work/bin/work-view' ]"
rm -rf "$INSTALL_WORKDIR"
write_prebuilt_stub "x86_64-unknown-linux-musl"

# ---------------------------------------------------------------------------
# Test 6: Idempotency — second run overwrites cleanly
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 6: idempotency ==="

WORKDIR_IDEM="$(mktemp -d)"
mkdir -p "${WORKDIR_IDEM}/.work/bin"
cat > "${WORKDIR_IDEM}/.work/bin/work-view" <<'EOF'
#!/usr/bin/env bash
echo stale
EOF
chmod +x "${WORKDIR_IDEM}/.work/bin/work-view"

OUT1=$(cd "$WORKDIR_IDEM" && PLUGIN_ROOT="$PLUGIN_ROOT_DIR" WORK_VIEW_UNAME_S=Linux WORK_VIEW_UNAME_M=x86_64 bash "$HELPER" 2>/dev/null)
RC1=$?
OUT2=$(cd "$WORKDIR_IDEM" && PLUGIN_ROOT="$PLUGIN_ROOT_DIR" WORK_VIEW_UNAME_S=Linux WORK_VIEW_UNAME_M=x86_64 bash "$HELPER" 2>/dev/null)
RC2=$?

assert_eq "idempotency: first run exit 0" "0" "$RC1"
assert_eq "idempotency: first run output" "$STATUS_PREBUILT_X64" "$OUT1"
assert_eq "idempotency: second run exit 0" "0" "$RC2"
assert_eq "idempotency: second run output" "$STATUS_PREBUILT_X64" "$OUT2"
assert_true "idempotency: work-view still exists" "[ -f '${WORKDIR_IDEM}/.work/bin/work-view' ]"
assert_true "idempotency: work-view still executable" "[ -x '${WORKDIR_IDEM}/.work/bin/work-view' ]"
assert_false "idempotency: no .tmp left" "[ -f '${WORKDIR_IDEM}/.work/bin/work-view.tmp' ]"
assert_true "idempotency: overwritten with prebuilt stub" "'${WORKDIR_IDEM}/.work/bin/work-view' --help 2>/dev/null | grep -q 'prebuilt'"
assert_true "idempotency: --version works after second run" "[ \"\$('${WORKDIR_IDEM}/.work/bin/work-view' --version)\" = 'work-view ${TEST_VERSION}' ]"
rm -rf "$WORKDIR_IDEM"

# ---------------------------------------------------------------------------
# Test 7: Destination is a pre-existing directory → installer fails
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 7: dest is a pre-existing directory ==="

WORKDIR_DIR="$(mktemp -d)"
mkdir -p "${WORKDIR_DIR}/.work/bin/work-view"

DIR_OUT=$(
  cd "$WORKDIR_DIR" &&
  PLUGIN_ROOT="$PLUGIN_ROOT_DIR" \
  bash "$HELPER" 2>/dev/null
)
DIR_RC=$?

assert_eq "dest-is-dir: installer exits 1" "1" "$DIR_RC"
assert_eq "dest-is-dir: no success output" "" "$DIR_OUT"
assert_true "dest-is-dir: destination remains directory" "[ -d '${WORKDIR_DIR}/.work/bin/work-view' ]"
assert_false "dest-is-dir: no .tmp left" "[ -f '${WORKDIR_DIR}/.work/bin/work-view.tmp' ]"
rm -rf "$WORKDIR_DIR"

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
