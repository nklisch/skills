#!/usr/bin/env bash
# work-board-shim.test.sh — routing tests for scripts/work-board.sh.
#
# work-board.sh is a decision shim with three routing branches:
#   1. No `.work/CONVENTIONS.md` in CWD or any ancestor  -> exit 2 (no substrate)
#   2. `.work/bin/work-view` missing or not executable    -> exit 1 (compiled
#      work-view binary required)
#   3. work-view present but FAILS `board --help`         -> exit 1, does NOT
#      exec the board
#   4. work-view present and PASSES `board --help`         -> exec'd as
#      `work-view board "$@"`
#
# Self-contained: builds temp substrate roots and stub `work-view` binaries,
# following the harness pattern from install-work-view.test.sh. Runnable locally
# and from CI. Exits non-zero if any assertion fails.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHIM="${SCRIPT_DIR}/../work-board.sh"

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
# Preflight
# ---------------------------------------------------------------------------
echo ""
echo "=== Preflight: work-board.sh present ==="
assert_true "work-board.sh exists" "[ -f '$SHIM' ]"
if [ ! -f "$SHIM" ]; then
  echo "ERROR: cannot locate work-board.sh at $SHIM" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# new_substrate <with-conventions?> — temp dir; if first arg is "yes", seeds
# .work/CONVENTIONS.md so it reads as a substrate root.
# ---------------------------------------------------------------------------
new_substrate() {
  local with_conv="${1:-yes}"
  local root
  root="$(mktemp -d)"
  mkdir -p "${root}/.work"
  if [ "$with_conv" = "yes" ]; then
    printf '# Conventions\n' > "${root}/.work/CONVENTIONS.md"
  fi
  printf '%s' "$root"
}

# write_work_view <root> <board-help-rc> <arglog-path>
# Installs an executable .work/bin/work-view stub that:
#   * exits <board-help-rc> for `board --help`
#   * for any other `board ...` invocation, appends "$@" to <arglog-path> and
#     exits 0 (lets us prove it was exec'd with `board "$@"`).
write_work_view() {
  local root="$1" help_rc="$2" arglog="$3"
  local bin="${root}/.work/bin/work-view"
  mkdir -p "${root}/.work/bin"
  cat > "$bin" <<EOF
#!/usr/bin/env bash
if [[ "\${1:-}" == "board" && "\${2:-}" == "--help" ]]; then
  exit ${help_rc}
fi
if [[ "\${1:-}" == "board" ]]; then
  shift
  printf 'board %s\n' "\$*" >> "${arglog}"
  exit 0
fi
exit 0
EOF
  chmod +x "$bin"
}

# run_board <root> [args...] — invoke the shim from inside <root>.
# Captures stdout in $BOARD_OUT, stderr file in $BOARD_ERR, rc in $BOARD_RC.
run_board() {
  local root="$1"; shift
  BOARD_ERR="${root}/.board.err"
  BOARD_OUT=$(
    cd "$root" &&
    bash "$SHIM" "$@" 2>"$BOARD_ERR"
  )
  BOARD_RC=$?
}

# ---------------------------------------------------------------------------
# Test group 1: no substrate ancestor -> exit 2, stderr mentions no substrate
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 1: no .work/CONVENTIONS.md ancestor -> exit 2 ==="

# A directory with NO .work/CONVENTIONS.md anywhere up to root. mktemp -d lands
# under TMPDIR; we additionally guard by removing any .work it might inherit.
NOSUB="$(mktemp -d)"
run_board "$NOSUB"
assert_eq "no-substrate exits 2" "2" "$BOARD_RC"
assert_true "no-substrate stderr mentions no substrate" \
  "grep -qi 'no substrate' '$BOARD_ERR'"
rm -rf "$NOSUB"

# ---------------------------------------------------------------------------
# Test group 2: substrate present but work-view missing -> exit 1
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 2: missing/non-exec work-view -> exit 1 ==="

ROOT_MISSING="$(new_substrate yes)"
run_board "$ROOT_MISSING"
assert_eq "missing work-view exits 1" "1" "$BOARD_RC"
assert_true "missing work-view message names the compiled work-view binary" \
  "grep -qi 'compiled work-view binary' '$BOARD_ERR'"
rm -rf "$ROOT_MISSING"

# Present but NOT executable (file exists, mode 0644) -> still exit 1.
ROOT_NOEXEC="$(new_substrate yes)"
mkdir -p "${ROOT_NOEXEC}/.work/bin"
printf '#!/usr/bin/env bash\nexit 0\n' > "${ROOT_NOEXEC}/.work/bin/work-view"
chmod 0644 "${ROOT_NOEXEC}/.work/bin/work-view"
run_board "$ROOT_NOEXEC"
assert_eq "non-executable work-view exits 1" "1" "$BOARD_RC"
assert_true "non-executable work-view message names the compiled work-view binary" \
  "grep -qi 'compiled work-view binary' '$BOARD_ERR'"
rm -rf "$ROOT_NOEXEC"

# ---------------------------------------------------------------------------
# Test group 3: work-view fails `board --help` -> exit 1, does NOT exec board
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 3: work-view fails 'board --help' -> exit 1, no exec ==="

ROOT_FAIL="$(new_substrate yes)"
ARGLOG_FAIL="${ROOT_FAIL}/.board-args.log"
write_work_view "$ROOT_FAIL" 1 "$ARGLOG_FAIL"
run_board "$ROOT_FAIL" --port 9999
assert_eq "board-incapable work-view exits 1" "1" "$BOARD_RC"
assert_true "board-incapable message says board unsupported / refresh" \
  "grep -qiE 'does not support the interactive board|refresh' '$BOARD_ERR'"
assert_false "board-incapable did NOT exec board (no arglog written)" \
  "[ -f '$ARGLOG_FAIL' ]"
rm -rf "$ROOT_FAIL"

# ---------------------------------------------------------------------------
# Test group 4: work-view passes `board --help` -> exec'd as board "$@"
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 4: board-capable work-view -> exec board \"\$@\" ==="

ROOT_OK="$(new_substrate yes)"
ARGLOG_OK="${ROOT_OK}/.board-args.log"
write_work_view "$ROOT_OK" 0 "$ARGLOG_OK"
run_board "$ROOT_OK" --port 8181 --no-open
assert_eq "board-capable work-view exits 0" "0" "$BOARD_RC"
assert_true "board-capable exec'd board with forwarded args" \
  "[ -f '$ARGLOG_OK' ] && grep -qx 'board --port 8181 --no-open' '$ARGLOG_OK'"
rm -rf "$ROOT_OK"

# Board-capable with NO extra args -> exec'd as `board` (empty arg tail).
ROOT_OK2="$(new_substrate yes)"
ARGLOG_OK2="${ROOT_OK2}/.board-args.log"
write_work_view "$ROOT_OK2" 0 "$ARGLOG_OK2"
run_board "$ROOT_OK2"
assert_eq "board-capable (no args) exits 0" "0" "$BOARD_RC"
assert_true "board-capable (no args) exec'd plain board" \
  "[ -f '$ARGLOG_OK2' ] && grep -qx 'board ' '$ARGLOG_OK2'"
rm -rf "$ROOT_OK2"

# ---------------------------------------------------------------------------
# Test group 5: --help short-circuits before any substrate/binary check
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 5: --help prints usage, exit 0, no substrate needed ==="

NOSUB_HELP="$(mktemp -d)"
run_board "$NOSUB_HELP" --help
assert_eq "--help exits 0 even with no substrate" "0" "$BOARD_RC"
assert_true "--help prints usage" \
  "printf '%s' \"\$BOARD_OUT\" | grep -qi 'launch the agile-workflow live substrate board'"
rm -rf "$NOSUB_HELP"

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
