#!/usr/bin/env bash
# install-work-view.test.sh — unit tests for install-work-view.sh
#
# Self-contained: builds a temp PLUGIN_ROOT with stub binaries and drives the
# helper with WORK_VIEW_UNAME_S/M overrides and a temp working directory.
#
# Runnable locally and from CI. Exits non-zero if any assertion fails.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HELPER="${SCRIPT_DIR}/../install-work-view.sh"

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
  "${PLUGIN_ROOT_DIR}/scripts" \
  "${PLUGIN_ROOT_DIR}/work-view/dist/x86_64-unknown-linux-musl" \
  "${PLUGIN_ROOT_DIR}/work-view/dist/aarch64-unknown-linux-musl" \
  "${PLUGIN_ROOT_DIR}/work-view/dist/x86_64-apple-darwin" \
  "${PLUGIN_ROOT_DIR}/work-view/dist/aarch64-apple-darwin"

# --- good bash fallback ---
cat > "${PLUGIN_ROOT_DIR}/scripts/work-view.sh" <<'EOF'
#!/usr/bin/env bash
# stub work-view.sh — prints help and exits 0
if [[ "${1:-}" == "--help" ]]; then
  echo "work-view (bash stub)"
  exit 0
fi
echo "work-view (bash stub)"
EOF
chmod +x "${PLUGIN_ROOT_DIR}/scripts/work-view.sh"

# --- good prebuilt stubs (print their triple on --help) ---
make_good_stub() {
  local triple="$1"
  local out="${PLUGIN_ROOT_DIR}/work-view/dist/${triple}/work-view"
  cat > "$out" <<EOF
#!/usr/bin/env bash
# stub prebuilt for ${triple}
if [[ "\${1:-}" == "--help" ]]; then
  echo "work-view prebuilt stub ${triple}"
  exit 0
fi
echo "work-view prebuilt stub ${triple}"
EOF
  chmod +x "$out"
}

make_good_stub "x86_64-unknown-linux-musl"
make_good_stub "aarch64-unknown-linux-musl"
make_good_stub "x86_64-apple-darwin"
make_good_stub "aarch64-apple-darwin"

# --- broken prebuilt stub (exits non-zero on --help) ---
BROKEN_TRIPLE="x86_64-unknown-linux-musl"
BROKEN_STUB="${PLUGIN_ROOT_DIR}/work-view/dist/${BROKEN_TRIPLE}/work-view.broken"
cat > "$BROKEN_STUB" <<'EOF'
#!/usr/bin/env bash
# stub prebuilt that always fails (simulates wrong-arch/bad binary)
exit 1
EOF
chmod +x "$BROKEN_STUB"

# ---------------------------------------------------------------------------
# Helper: run install helper in a fresh temp working dir
# Returns the stdout output in $INSTALL_OUT and exit code in $INSTALL_RC
# ---------------------------------------------------------------------------
run_install() {
  local uname_s="$1" uname_m="$2"
  local workdir
  workdir="$(mktemp -d)"
  # shellcheck disable=SC2155
  INSTALL_OUT=$(
    cd "$workdir" &&
    PLUGIN_ROOT="$PLUGIN_ROOT_DIR" \
    WORK_VIEW_UNAME_S="$uname_s" \
    WORK_VIEW_UNAME_M="$uname_m" \
    bash "$HELPER" 2>/dev/null
  )
  INSTALL_RC=$?
  INSTALL_WORKDIR="$workdir"
}

# ---------------------------------------------------------------------------
# Test 1: Linux x86_64 → x86_64-unknown-linux-musl (good stub)
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 1: triple mapping (good stubs) ==="

run_install "Linux" "x86_64"
assert_eq "Linux x86_64 exit 0" "0" "$INSTALL_RC"
assert_eq "Linux x86_64 output" "installed prebuilt x86_64-unknown-linux-musl" "$INSTALL_OUT"
assert_true "Linux x86_64 work-view exists" "[ -f '${INSTALL_WORKDIR}/.work/bin/work-view' ]"
assert_true "Linux x86_64 work-view executable" "[ -x '${INSTALL_WORKDIR}/.work/bin/work-view' ]"
assert_false "Linux x86_64 no .tmp left" "[ -f '${INSTALL_WORKDIR}/.work/bin/work-view.tmp' ]"
assert_true "Linux x86_64 --help works" "'${INSTALL_WORKDIR}/.work/bin/work-view' --help >/dev/null 2>&1"
assert_true "Linux x86_64 correct stub content" \
  "'${INSTALL_WORKDIR}/.work/bin/work-view' --help 2>/dev/null | grep -q 'x86_64-unknown-linux-musl'"
rm -rf "$INSTALL_WORKDIR"

run_install "Linux" "aarch64"
assert_eq "Linux aarch64 exit 0" "0" "$INSTALL_RC"
assert_eq "Linux aarch64 output" "installed prebuilt aarch64-unknown-linux-musl" "$INSTALL_OUT"
assert_true "Linux aarch64 correct stub content" \
  "'${INSTALL_WORKDIR}/.work/bin/work-view' --help 2>/dev/null | grep -q 'aarch64-unknown-linux-musl'"
rm -rf "$INSTALL_WORKDIR"

run_install "Linux" "arm64"
assert_eq "Linux arm64 exit 0" "0" "$INSTALL_RC"
assert_eq "Linux arm64 output" "installed prebuilt aarch64-unknown-linux-musl" "$INSTALL_OUT"
assert_true "Linux arm64 correct stub content" \
  "'${INSTALL_WORKDIR}/.work/bin/work-view' --help 2>/dev/null | grep -q 'aarch64-unknown-linux-musl'"
rm -rf "$INSTALL_WORKDIR"

run_install "Darwin" "x86_64"
assert_eq "Darwin x86_64 exit 0" "0" "$INSTALL_RC"
assert_eq "Darwin x86_64 output" "installed prebuilt x86_64-apple-darwin" "$INSTALL_OUT"
assert_true "Darwin x86_64 correct stub content" \
  "'${INSTALL_WORKDIR}/.work/bin/work-view' --help 2>/dev/null | grep -q 'x86_64-apple-darwin'"
rm -rf "$INSTALL_WORKDIR"

run_install "Darwin" "arm64"
assert_eq "Darwin arm64 exit 0" "0" "$INSTALL_RC"
assert_eq "Darwin arm64 output" "installed prebuilt aarch64-apple-darwin" "$INSTALL_OUT"
assert_true "Darwin arm64 correct stub content" \
  "'${INSTALL_WORKDIR}/.work/bin/work-view' --help 2>/dev/null | grep -q 'aarch64-apple-darwin'"
rm -rf "$INSTALL_WORKDIR"

# ---------------------------------------------------------------------------
# Test 2: Unknown platform → bash fallback
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 2: unknown platform → bash fallback ==="

run_install "FreeBSD" "x86_64"
assert_eq "FreeBSD x86_64 exit 0" "0" "$INSTALL_RC"
assert_eq "FreeBSD x86_64 output" "installed bash fallback" "$INSTALL_OUT"
assert_true "FreeBSD x86_64 work-view exists" "[ -f '${INSTALL_WORKDIR}/.work/bin/work-view' ]"
assert_true "FreeBSD x86_64 work-view executable" "[ -x '${INSTALL_WORKDIR}/.work/bin/work-view' ]"
assert_false "FreeBSD x86_64 no .tmp left" "[ -f '${INSTALL_WORKDIR}/.work/bin/work-view.tmp' ]"
assert_true "FreeBSD x86_64 --help works" "'${INSTALL_WORKDIR}/.work/bin/work-view' --help >/dev/null 2>&1"
rm -rf "$INSTALL_WORKDIR"

run_install "Windows_NT" "AMD64"
assert_eq "Windows_NT exit 0" "0" "$INSTALL_RC"
assert_eq "Windows_NT output" "installed bash fallback" "$INSTALL_OUT"
rm -rf "$INSTALL_WORKDIR"

# ---------------------------------------------------------------------------
# Test 3: Broken prebuilt (exits non-zero on --help) → falls back to bash
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 3: broken prebuilt → bash fallback ==="

# Temporarily replace the good x86_64 linux stub with the broken one
GOOD_STUB="${PLUGIN_ROOT_DIR}/work-view/dist/x86_64-unknown-linux-musl/work-view"
mv "$GOOD_STUB" "${GOOD_STUB}.bak"
cp "$BROKEN_STUB" "$GOOD_STUB"
# Note: BROKEN_STUB is already chmod +x, but cp may not preserve; ensure executable
chmod +x "$GOOD_STUB"

run_install "Linux" "x86_64"
assert_eq "broken prebuilt exit 0" "0" "$INSTALL_RC"
assert_eq "broken prebuilt falls back" "installed bash fallback" "$INSTALL_OUT"
assert_true "broken prebuilt work-view exists" "[ -f '${INSTALL_WORKDIR}/.work/bin/work-view' ]"
assert_true "broken prebuilt work-view executable" "[ -x '${INSTALL_WORKDIR}/.work/bin/work-view' ]"
assert_false "broken prebuilt no .tmp left" "[ -f '${INSTALL_WORKDIR}/.work/bin/work-view.tmp' ]"
assert_true "broken prebuilt --help works (fallback)" "'${INSTALL_WORKDIR}/.work/bin/work-view' --help >/dev/null 2>&1"
rm -rf "$INSTALL_WORKDIR"

# Restore good stub
mv "${GOOD_STUB}.bak" "$GOOD_STUB"

# ---------------------------------------------------------------------------
# Test 4: Empty dist directory → bash fallback
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 4: empty dist → bash fallback ==="

# Temporarily hide all dist binaries
DIST_DIR="${PLUGIN_ROOT_DIR}/work-view/dist"
DIST_BACKUP="$(mktemp -d)"
for triple_dir in x86_64-unknown-linux-musl aarch64-unknown-linux-musl x86_64-apple-darwin aarch64-apple-darwin; do
  if [ -f "${DIST_DIR}/${triple_dir}/work-view" ]; then
    mv "${DIST_DIR}/${triple_dir}/work-view" "${DIST_BACKUP}/${triple_dir}"
  fi
done

run_install "Linux" "x86_64"
assert_eq "empty dist exit 0" "0" "$INSTALL_RC"
assert_eq "empty dist output" "installed bash fallback" "$INSTALL_OUT"
assert_true "empty dist work-view exists" "[ -f '${INSTALL_WORKDIR}/.work/bin/work-view' ]"
assert_false "empty dist no .tmp left" "[ -f '${INSTALL_WORKDIR}/.work/bin/work-view.tmp' ]"
rm -rf "$INSTALL_WORKDIR"

# Restore dist binaries
for triple_dir in x86_64-unknown-linux-musl aarch64-unknown-linux-musl x86_64-apple-darwin aarch64-apple-darwin; do
  if [ -f "${DIST_BACKUP}/${triple_dir}" ]; then
    mv "${DIST_BACKUP}/${triple_dir}" "${DIST_DIR}/${triple_dir}/work-view"
  fi
done
rm -rf "$DIST_BACKUP"

# ---------------------------------------------------------------------------
# Test 5: Atomicity — no partial .work/bin/work-view; .tmp always cleaned up
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 5: atomicity ==="

# A broken stub with no matching triple should leave no .tmp
mv "${PLUGIN_ROOT_DIR}/work-view/dist/x86_64-unknown-linux-musl/work-view" \
   "${PLUGIN_ROOT_DIR}/work-view/dist/x86_64-unknown-linux-musl/work-view.bak2"
cp "$BROKEN_STUB" "${PLUGIN_ROOT_DIR}/work-view/dist/x86_64-unknown-linux-musl/work-view"
chmod +x "${PLUGIN_ROOT_DIR}/work-view/dist/x86_64-unknown-linux-musl/work-view"

WORKDIR2="$(mktemp -d)"
( cd "$WORKDIR2" &&
  PLUGIN_ROOT="$PLUGIN_ROOT_DIR" \
  WORK_VIEW_UNAME_S="Linux" \
  WORK_VIEW_UNAME_M="x86_64" \
  bash "$HELPER" >/dev/null 2>&1 )
# Whether it fell back or succeeded, .tmp must be gone
assert_false "atomicity: no .tmp after broken prebuilt" "[ -f '${WORKDIR2}/.work/bin/work-view.tmp' ]"
assert_true "atomicity: work-view installed (fallback)" "[ -f '${WORKDIR2}/.work/bin/work-view' ]"
rm -rf "$WORKDIR2"

mv "${PLUGIN_ROOT_DIR}/work-view/dist/x86_64-unknown-linux-musl/work-view.bak2" \
   "${PLUGIN_ROOT_DIR}/work-view/dist/x86_64-unknown-linux-musl/work-view"

# ---------------------------------------------------------------------------
# Test 6: Update path — second run overwrites cleanly
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 6: update (run twice) ==="

WORKDIR3="$(mktemp -d)"

# First run: installs prebuilt
(cd "$WORKDIR3" &&
 PLUGIN_ROOT="$PLUGIN_ROOT_DIR" \
 WORK_VIEW_UNAME_S="Linux" \
 WORK_VIEW_UNAME_M="x86_64" \
 bash "$HELPER" >/dev/null 2>&1)

FIRST_INODE=$(stat -c '%i' "${WORKDIR3}/.work/bin/work-view" 2>/dev/null || stat -f '%i' "${WORKDIR3}/.work/bin/work-view")

# Second run: should overwrite cleanly
OUT2=$(cd "$WORKDIR3" &&
 PLUGIN_ROOT="$PLUGIN_ROOT_DIR" \
 WORK_VIEW_UNAME_S="Linux" \
 WORK_VIEW_UNAME_M="x86_64" \
 bash "$HELPER" 2>/dev/null)
RC2=$?

assert_eq "update: second run exit 0" "0" "$RC2"
assert_eq "update: second run output" "installed prebuilt x86_64-unknown-linux-musl" "$OUT2"
assert_true "update: work-view still exists" "[ -f '${WORKDIR3}/.work/bin/work-view' ]"
assert_true "update: work-view still executable" "[ -x '${WORKDIR3}/.work/bin/work-view' ]"
assert_false "update: no .tmp left" "[ -f '${WORKDIR3}/.work/bin/work-view.tmp' ]"
assert_true "update: --help works after second run" "'${WORKDIR3}/.work/bin/work-view' --help >/dev/null 2>&1"
rm -rf "$WORKDIR3"

# ---------------------------------------------------------------------------
# Test 7: Darwin arm64 architecture alias coverage
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 7: Darwin arm64 → aarch64-apple-darwin ==="

run_install "Darwin" "arm64"
assert_eq "Darwin arm64 maps to aarch64-apple-darwin" "installed prebuilt aarch64-apple-darwin" "$INSTALL_OUT"
assert_true "Darwin arm64 --help works" "'${INSTALL_WORKDIR}/.work/bin/work-view' --help >/dev/null 2>&1"
rm -rf "$INSTALL_WORKDIR"

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
