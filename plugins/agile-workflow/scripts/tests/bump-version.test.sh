#!/usr/bin/env bash
# bump-version.test.sh — unit tests for channel-metadata lockstep and the
# work-view projection in scripts/bump-version.sh (repo-root script).
#
# The load-bearing mechanism under test is the projection block
# (scripts/bump-version.sh, the `if [[ "$plugin" == "agile-workflow" ]]` block):
# after a bump it writes the new semver into BOTH work-view implementations in
# lockstep —
#   * the Rust stamp `work-view/crates/cli/.work-view-version` (NO trailing newline)
#   * the bash fallback's `WORK_VIEW_VERSION="x.y.z"` literal in scripts/work-view.sh
# with a Fail-Fast `grep` postcondition that exits 1 if the anchored sed pattern
# no longer matches the literal.
#
# We run the REAL bump-version.sh (not a reimplementation) inside a throwaway
# `git init` scratch repo whose tree mirrors the paths the script touches. To
# stop the script's trailing `git commit` / `git push` from escaping, a fake
# `git` shim is placed first on PATH: it forwards read/stage subcommands
# (init/config/add/diff/status/rev-parse) to the real git inside the scratch
# repo but turns `commit` and `push` into no-ops. This still exercises the real
# projection AND the real `git add` staging.
#
# Runnable locally and from CI. Exits non-zero if any assertion fails.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# scripts/tests/ -> scripts/ -> agile-workflow/ -> plugins/ -> repo root
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"
BUMP="${REPO_ROOT}/scripts/bump-version.sh"
REAL_GIT="$(command -v git)"

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
echo "=== Preflight: bump-version.sh present and jq available ==="
assert_true "bump-version.sh exists" "[ -f '$BUMP' ]"
if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required to run bump-version.sh and these tests" >&2
  exit 1
fi
if [ ! -f "$BUMP" ]; then
  echo "ERROR: cannot locate bump-version.sh at $BUMP" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# make_fake_git_dir — produce a dir holding a `git` shim first on PATH.
# Forwards safe subcommands to the real git; no-ops commit/push so the script
# under test cannot reach a remote or write a published commit.
# ---------------------------------------------------------------------------
make_fake_git_dir() {
  local dir
  dir="$(mktemp -d)"
  cat > "${dir}/git" <<EOF
#!/usr/bin/env bash
sub="\${1:-}"
case "\$sub" in
  commit|push)
    # Swallow — these would escape the scratch repo / publish a bump commit.
    exit 0
    ;;
  *)
    exec "${REAL_GIT}" "\$@"
    ;;
esac
EOF
  chmod +x "${dir}/git"
  printf '%s' "$dir"
}

# ---------------------------------------------------------------------------
# new_scratch_repo — build a throwaway repo mirroring the paths bump-version.sh
# touches, with a clean working tree (the script refuses a dirty plugin dir).
#   $1 = agile-workflow plugin.json version (also seeds the codex manifest)
#   $2 = optional extra plugin name to seed (for the non-agile-workflow guard)
# Echoes the repo path.
# ---------------------------------------------------------------------------
new_scratch_repo() {
  local aw_version="$1" extra_plugin="${2:-}"
  local repo
  repo="$(mktemp -d)"

  # agile-workflow plugin manifests + work-view artifacts.
  mkdir -p \
    "${repo}/plugins/agile-workflow/.claude-plugin" \
    "${repo}/plugins/agile-workflow/.codex-plugin" \
    "${repo}/plugins/agile-workflow/work-view/crates/cli" \
    "${repo}/plugins/agile-workflow/scripts"

  printf '{\n  "name": "agile-workflow",\n  "version": "%s"\n}\n' "$aw_version" \
    > "${repo}/plugins/agile-workflow/.claude-plugin/plugin.json"
  printf '{\n  "name": "agile-workflow",\n  "version": "%s"\n}\n' "$aw_version" \
    > "${repo}/plugins/agile-workflow/.codex-plugin/plugin.json"
  printf '{\n  "name": "@nklisch/pi-agile-workflow",\n  "version": "%s",\n  "keywords": ["pi-package"],\n  "pi": { "skills": ["./skills"] }\n}\n' "$aw_version" \
    > "${repo}/plugins/agile-workflow/package.json"

  # Rust stamp — start with a placeholder, no trailing newline (mirrors prod).
  printf '%s' "$aw_version" \
    > "${repo}/plugins/agile-workflow/work-view/crates/cli/.work-view-version"

  # Bash fallback with the anchored WORK_VIEW_VERSION literal.
  cat > "${repo}/plugins/agile-workflow/scripts/work-view.sh" <<EOF
#!/usr/bin/env bash
WORK_VIEW_VERSION="${aw_version}"
echo "work-view \${WORK_VIEW_VERSION}"
EOF

  if [ -n "$extra_plugin" ]; then
    mkdir -p "${repo}/plugins/${extra_plugin}/.claude-plugin" \
             "${repo}/plugins/${extra_plugin}/.codex-plugin"
    printf '{\n  "name": "%s",\n  "version": "%s"\n}\n' "$extra_plugin" "$aw_version" \
      > "${repo}/plugins/${extra_plugin}/.claude-plugin/plugin.json"
    printf '{\n  "name": "%s",\n  "version": "%s"\n}\n' "$extra_plugin" "$aw_version" \
      > "${repo}/plugins/${extra_plugin}/.codex-plugin/plugin.json"
    printf '{\n  "name": "@nklisch/pi-%s",\n  "version": "%s",\n  "keywords": ["pi-package"],\n  "pi": { "skills": ["./skills"] }\n}\n' "$extra_plugin" "$aw_version" \
      > "${repo}/plugins/${extra_plugin}/package.json"
  fi

  # Initialize a clean git repo (real git; commit happens via real git here,
  # only the script-under-test's commit/push are shimmed away later).
  (
    cd "$repo"
    "$REAL_GIT" init -q
    "$REAL_GIT" config user.email test@example.com
    "$REAL_GIT" config user.name "Test"
    "$REAL_GIT" config commit.gpgsign false
    "$REAL_GIT" add -A
    "$REAL_GIT" commit -q -m "seed" >/dev/null 2>&1
  )
  printf '%s' "$repo"
}

# run_bump <repo> <plugin> <bump> — run the real script with the fake git shim
# first on PATH. Captures stdout/stderr/rc.
run_bump() {
  local repo="$1" plugin="$2" bump="$3"
  local fakedir
  fakedir="$(make_fake_git_dir)"
  BUMP_ERR="${repo}/.bump.err"
  BUMP_OUT=$(
    cd "$repo" &&
    PATH="${fakedir}:${PATH}" bash "$BUMP" "$plugin" "$bump" 2>"$BUMP_ERR"
  )
  BUMP_RC=$?
  rm -rf "$fakedir"
}

# staged? <repo> <relpath> — true if the path is staged in the repo index.
is_staged() {
  local repo="$1" rel="$2"
  ( cd "$repo" && "$REAL_GIT" diff --cached --name-only -- "$rel" | grep -qx "$rel" )
}

VER_REL="plugins/agile-workflow/work-view/crates/cli/.work-view-version"
WV_REL="plugins/agile-workflow/scripts/work-view.sh"

# ---------------------------------------------------------------------------
# Test group 1: patch bump projects new semver into BOTH implementations
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 1: agile-workflow patch bump projects lockstep ==="

REPO1="$(new_scratch_repo "1.2.3")"
run_bump "$REPO1" agile-workflow patch

assert_eq "patch bump exits 0" "0" "$BUMP_RC"

# .work-view-version equals the new semver with NO trailing newline.
VER_CONTENT="$(cat "${REPO1}/${VER_REL}")"
assert_eq ".work-view-version content == new semver" "1.2.4" "$VER_CONTENT"
VER_BYTES="$(wc -c < "${REPO1}/${VER_REL}" | tr -d ' ')"
assert_eq ".work-view-version is exactly 5 bytes (no trailing newline)" "5" "$VER_BYTES"
LAST_BYTE="$(tail -c1 "${REPO1}/${VER_REL}" | od -An -tx1 | tr -d ' \n')"
assert_false ".work-view-version last byte is not a newline (0a)" "[ '$LAST_BYTE' = '0a' ]"

# work-view.sh WORK_VIEW_VERSION literal equals the new semver.
assert_true "work-view.sh WORK_VIEW_VERSION literal == new" \
  "grep -q '^WORK_VIEW_VERSION=\"1.2.4\"\$' '${REPO1}/${WV_REL}'"
assert_false "old WORK_VIEW_VERSION literal is gone" \
  "grep -q '^WORK_VIEW_VERSION=\"1.2.3\"\$' '${REPO1}/${WV_REL}'"

# plugin.json manifests and package metadata advanced too (sanity that this was
# a real bump).
assert_eq "claude plugin.json bumped" "1.2.4" \
  "$(jq -r '.version' "${REPO1}/plugins/agile-workflow/.claude-plugin/plugin.json")"
assert_eq "codex plugin.json bumped" "1.2.4" \
  "$(jq -r '.version' "${REPO1}/plugins/agile-workflow/.codex-plugin/plugin.json")"
assert_eq "package.json bumped" "1.2.4" \
  "$(jq -r '.version' "${REPO1}/plugins/agile-workflow/package.json")"

# Both work-view files are git-staged.
assert_true ".work-view-version is staged" "is_staged '$REPO1' '$VER_REL'"
assert_true "work-view.sh is staged" "is_staged '$REPO1' '$WV_REL'"
assert_true "agile-workflow package.json is staged" \
  "is_staged '$REPO1' 'plugins/agile-workflow/package.json'"

rm -rf "$REPO1"

# ---------------------------------------------------------------------------
# Test group 2: bumping a NON-agile-workflow plugin leaves work-view untouched
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 2: non-agile-workflow plugin does not touch work-view ==="

REPO2="$(new_scratch_repo "1.2.3" "ux-ui-design")"
VER_BEFORE="$(cat "${REPO2}/${VER_REL}")"
WV_BEFORE="$(cat "${REPO2}/${WV_REL}")"
run_bump "$REPO2" ux-ui-design patch

assert_eq "non-aw bump exits 0" "0" "$BUMP_RC"
assert_eq "non-aw plugin.json bumped" "1.2.4" \
  "$(jq -r '.version' "${REPO2}/plugins/ux-ui-design/.claude-plugin/plugin.json")"
assert_eq "non-aw package.json bumped" "1.2.4" \
  "$(jq -r '.version' "${REPO2}/plugins/ux-ui-design/package.json")"
assert_eq ".work-view-version unchanged after non-aw bump" "$VER_BEFORE" \
  "$(cat "${REPO2}/${VER_REL}")"
assert_eq "work-view.sh unchanged after non-aw bump" "$WV_BEFORE" \
  "$(cat "${REPO2}/${WV_REL}")"
assert_false ".work-view-version NOT staged after non-aw bump" "is_staged '$REPO2' '$VER_REL'"
assert_false "work-view.sh NOT staged after non-aw bump" "is_staged '$REPO2' '$WV_REL'"
assert_true "non-aw package.json is staged" \
  "is_staged '$REPO2' 'plugins/ux-ui-design/package.json'"

rm -rf "$REPO2"

# ---------------------------------------------------------------------------
# Test group 3: Fail-Fast postcondition fires on a renamed/indented literal
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 3: postcondition exits 1 when literal anchor no longer matches ==="

REPO3="$(new_scratch_repo "1.2.3")"
# Break the anchored literal: indent it so `^WORK_VIEW_VERSION="..."` (and the
# anchored sed substitution) no longer matches. sed exits 0 (no match), so the
# projection silently no-ops and the grep postcondition must catch it.
cat > "${REPO3}/${WV_REL}" <<'EOF'
#!/usr/bin/env bash
  WORK_VIEW_VERSION="1.2.3"
echo "work-view ${WORK_VIEW_VERSION}"
EOF
( cd "$REPO3" && "$REAL_GIT" add -A && "$REAL_GIT" commit -q -m "indent literal" >/dev/null 2>&1 )

run_bump "$REPO3" agile-workflow patch

assert_eq "indented-literal bump exits 1 (postcondition fires)" "1" "$BUMP_RC"
POST_ERR="$(cat "$BUMP_ERR" 2>/dev/null || true)"
assert_true "postcondition reports failed projection" \
  "printf '%s' \"\$POST_ERR\" | grep -q 'failed to project version into'"
# The indented literal was not rewritten (anchored pattern never matched).
assert_false "indented literal NOT rewritten to new semver" \
  "grep -q 'WORK_VIEW_VERSION=\"1.2.4\"' '${REPO3}/${WV_REL}'"

rm -rf "$REPO3"

# ---------------------------------------------------------------------------
# Test group 4: minor/major bumps project correctly too
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 4: minor and major bumps project lockstep ==="

REPO4="$(new_scratch_repo "1.2.3")"
run_bump "$REPO4" agile-workflow minor
assert_eq "minor bump exits 0" "0" "$BUMP_RC"
assert_eq "minor .work-view-version == 1.3.0" "1.3.0" "$(cat "${REPO4}/${VER_REL}")"
assert_true "minor work-view.sh literal == 1.3.0" \
  "grep -q '^WORK_VIEW_VERSION=\"1.3.0\"\$' '${REPO4}/${WV_REL}'"
rm -rf "$REPO4"

REPO5="$(new_scratch_repo "1.2.3")"
run_bump "$REPO5" agile-workflow major
assert_eq "major bump exits 0" "0" "$BUMP_RC"
assert_eq "major .work-view-version == 2.0.0" "2.0.0" "$(cat "${REPO5}/${VER_REL}")"
assert_true "major work-view.sh literal == 2.0.0" \
  "grep -q '^WORK_VIEW_VERSION=\"2.0.0\"\$' '${REPO5}/${WV_REL}'"
rm -rf "$REPO5"

# ---------------------------------------------------------------------------
# Test group 5: package.json mismatch fails before projection
# ---------------------------------------------------------------------------
echo ""
echo "=== Test group 5: package.json mismatch fails before projection ==="

REPO6="$(new_scratch_repo "1.2.3")"
jq '.version = "9.9.9"' "${REPO6}/plugins/agile-workflow/package.json" \
  > "${REPO6}/plugins/agile-workflow/package.json.tmp"
mv "${REPO6}/plugins/agile-workflow/package.json.tmp" \
  "${REPO6}/plugins/agile-workflow/package.json"
( cd "$REPO6" && "$REAL_GIT" add -A && "$REAL_GIT" commit -q -m "mismatch package version" >/dev/null 2>&1 )

run_bump "$REPO6" agile-workflow patch

assert_eq "package-mismatch bump exits 1" "1" "$BUMP_RC"
MISMATCH_ERR="$(cat "$BUMP_ERR" 2>/dev/null || true)"
assert_true "package mismatch reports channel metadata mismatch" \
  "printf '%s' \"\$MISMATCH_ERR\" | grep -q 'version mismatch between channel metadata'"
assert_eq "claude manifest remains old after package mismatch" "1.2.3" \
  "$(jq -r '.version' "${REPO6}/plugins/agile-workflow/.claude-plugin/plugin.json")"
assert_eq "package manifest remains mismatched after failed bump" "9.9.9" \
  "$(jq -r '.version' "${REPO6}/plugins/agile-workflow/package.json")"
assert_eq ".work-view-version unchanged after package mismatch" "1.2.3" \
  "$(cat "${REPO6}/${VER_REL}")"

rm -rf "$REPO6"

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
