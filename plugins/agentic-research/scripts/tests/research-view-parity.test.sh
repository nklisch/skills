#!/usr/bin/env bash
# research-view-parity.test.sh — byte-parity test: bash fallback vs Rust binary.
#
# For every representative query we run BOTH the binary and the bash fallback
# (with CWD set to the temp substrate root) and assert that stdout is
# byte-identical.  A real mismatch is a HARD FAIL; the only skip path is when
# the reference binary cannot be obtained.
#
# Convention mirrors plugins/agile-workflow/scripts/tests/ (bump-version.test.sh,
# work-view-dist-version.test.sh): PASS/FAIL counters, assert_eq / assert_true,
# summary block, exit 1 on any failure.

set -uo pipefail

# ── Paths ────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# tests/ -> scripts/ -> agentic-research plugin root
SCRIPTS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPTS_DIR}/.." && pwd)"

FALLBACK_SH="${SCRIPTS_DIR}/research-view.sh"
BINARY="${PLUGIN_ROOT}/research-view/target/release/research-view"
CARGO_MANIFEST="${PLUGIN_ROOT}/research-view/Cargo.toml"

# ── Counters ──────────────────────────────────────────────────────────────────

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

# parity_assert <label> <binary> <fallback_sh> <substrate_root> [args...]
# Runs both tools with the same args from <substrate_root>, compares stdout.
parity_assert() {
  local label="$1"
  local binary="$2"
  local fallback="$3"
  local substrate="$4"
  shift 4
  local args=("$@")

  local bin_out sh_out
  bin_out="$( cd "$substrate" && "$binary" "${args[@]}" 2>/dev/null )"
  sh_out="$(  cd "$substrate" && bash "$fallback" "${args[@]}" 2>/dev/null )"

  if [ "$bin_out" = "$sh_out" ]; then
    echo "  PASS: parity — $label"
    ((PASS++))
  else
    echo "  FAIL: parity — $label"
    echo "  ---- binary stdout ----"
    printf '%s\n' "$bin_out" | head -20
    echo "  ---- fallback stdout ----"
    printf '%s\n' "$sh_out" | head -20
    echo "  ---- diff ----"
    diff <(printf '%s\n' "$bin_out") <(printf '%s\n' "$sh_out") | head -30
    ((FAIL++))
    ERRORS+=("parity — $label")
  fi
}

# ── Preflight: obtain the binary ──────────────────────────────────────────────

echo ""
echo "=== Preflight: binary acquisition ==="

if [ ! -x "$BINARY" ]; then
  echo "  INFO: prebuilt binary not found at $BINARY"
  if command -v cargo >/dev/null 2>&1 && [ -f "$CARGO_MANIFEST" ]; then
    echo "  INFO: attempting cargo build --release ..."
    if cargo build --release --manifest-path "$CARGO_MANIFEST" 2>/dev/null; then
      echo "  INFO: cargo build succeeded"
    else
      echo "SKIP: cargo build failed (offline? missing toolchain?) — parity test skipped"
      exit 0
    fi
  else
    echo "SKIP: no prebuilt binary and no cargo available — parity test skipped"
    exit 0
  fi
fi

if [ ! -x "$BINARY" ]; then
  echo "SKIP: binary still absent after attempted build — parity test skipped"
  exit 0
fi

echo "  OK: binary found at $BINARY"
assert_true "fallback script exists and is readable" "[ -f '$FALLBACK_SH' ]"

# ── Fixture: build a temp .research/ substrate ────────────────────────────────

echo ""
echo "=== Fixture: building temp substrate ==="

TMPROOT="$(mktemp -d)"
trap 'rm -rf "$TMPROOT"' EXIT

RESEARCH="$TMPROOT/.research"

mkdir -p \
  "$RESEARCH" \
  "$RESEARCH/attestation" \
  "$RESEARCH/precis" \
  "$RESEARCH/analysis/positions" \
  "$RESEARCH/analysis/briefs" \
  "$RESEARCH/analysis/campaigns/my-campaign" \
  "$RESEARCH/analysis/hypothesis" \
  "$RESEARCH/reference/rust-binary-size" \
  "$RESEARCH/reference/rust-binary-size/raw"

# CONVENTIONS.md — required for substrate root detection
cat > "$RESEARCH/CONVENTIONS.md" <<'EOF'
# Research Conventions
EOF

# Two attestation artifacts
cat > "$RESEARCH/attestation/work-view-dist.md" <<'EOF'
---
source_handle: work-view-dist
fetched: 2026-06-03
source_path: plugins/agile-workflow/work-view/dist
provenance: source-direct
---

# work-view dist binaries

Some body.
EOF

cat > "$RESEARCH/attestation/cargo-book.md" <<'EOF'
---
source_handle: cargo-book
fetched: 2026-01-01
source_url: https://doc.rust-lang.org/cargo/
provenance: source-direct
---

# Cargo Book

Reference attestation.
EOF

# One precis
cat > "$RESEARCH/precis/work-view-dist.md" <<'EOF'
---
source_handle: work-view-dist
authored: 2026-06-03
provenance: agent-authored-from-raw
---

# work-view dist binaries — précis

Summary of findings.
EOF

# One position
cat > "$RESEARCH/analysis/positions/rust-binary-distribution-viable.md" <<'EOF'
---
slug: rust-binary-distribution-viable
status: settled
authored: 2026-06-03
provenance: agent-synthesis
temporal_contract: extend-on-source-rev
---

# rust binary distribution is viable

Position body.
EOF

# One brief
cat > "$RESEARCH/analysis/briefs/semver-pre-1.0-stability.md" <<'EOF'
---
slug: semver-pre-1.0-stability
provenance: agent-synthesis
authored: 2026-06-04
temporal_contract: write-once-on-converge
---

# semver pre-1.0 stability

Brief body.
EOF

# One campaign artifact
cat > "$RESEARCH/analysis/campaigns/my-campaign/overview.md" <<'EOF'
---
slug: my-campaign
provenance: agent-synthesis
authored: 2026-06-04
---

# my-campaign — overview

Campaign body.
EOF

# One hypothesis
cat > "$RESEARCH/analysis/hypothesis/cost-model.md" <<'EOF'
---
slug: cost-model
provenance: agent-synthesis
authored: 2026-06-04
---

# cost-model hypothesis

Hypothesis body.
EOF

# One reference with frontmatter
cat > "$RESEARCH/reference/rust-binary-size/entry.md" <<'EOF'
---
source_handle: rust-binary-size-entry
fetched: 2026-01-01
provenance: source-direct
---

# Reference entry

Entry body.
EOF

# One reference BIBLIOGRAPHY without frontmatter (the lenient rule)
# This one has NO Themes lines — used to test empty-themes handling.
cat > "$RESEARCH/reference/rust-binary-size/BIBLIOGRAPHY.md" <<'EOF'
# rust-binary-size — corpus BIBLIOGRAPHY

A numbered bibliography.

### 1. Foo Bar — `foo-bar`

- **Source class:** paper
- **Author:** Foo

### 2. Baz Qux — `baz-qux`

- **Source class:** paper
- **Author:** Baz
EOF

# ── Extended fixture for --tag / --tags parity testing ────────────────────────
#
# Two new corpora:
#   alpha-corpus: 3 entries, overlapping + repeated tags, a [NEW]-marked tag
#   beta-corpus:  2 entries, disjoint tags from alpha-corpus
# rust-binary-size/BIBLIOGRAPHY.md: no Themes lines (tests empty-themes artifacts)

mkdir -p "$RESEARCH/reference/alpha-corpus"
mkdir -p "$RESEARCH/reference/beta-corpus"

# alpha-corpus BIBLIOGRAPHY: 3 entries, overlapping themes, a [NEW]-marked tag
cat > "$RESEARCH/reference/alpha-corpus/BIBLIOGRAPHY.md" <<'EOF'
# alpha-corpus — corpus BIBLIOGRAPHY

### 1. Paper One — `alpha-one`

- **Source class:** paper
- **Themes:** retrieval, knowledge-graphs, overview

### 2. Paper Two — `alpha-two`

- **Source class:** paper
- **Themes:** retrieval, dense-retrieval, overview

### 3. Survey — `alpha-three`

- **Source class:** paper
- **Themes:** retrieval, rag, survey-topic [NEW]
EOF

# beta-corpus BIBLIOGRAPHY: 2 entries, disjoint from alpha-corpus (no overlap with retrieval)
cat > "$RESEARCH/reference/beta-corpus/BIBLIOGRAPHY.md" <<'EOF'
# beta-corpus — corpus BIBLIOGRAPHY

### 1. Agent One — `beta-one`

- **Source class:** paper
- **Themes:** agents, tool-use

### 2. Agent Two — `beta-two`

- **Source class:** blog-post
- **Themes:** agents, orchestration
EOF

# One raw/ file that MUST NOT be indexed
cat > "$RESEARCH/reference/rust-binary-size/raw/fetched-page.md" <<'EOF'
# Raw fetched page
This should not be indexed.
EOF

# Tier-root skip files
cat > "$RESEARCH/attestation/README.md" <<'EOF'
# Attestation README — should not be indexed
EOF

# ── Parser alignment fixtures ─────────────────────────────────────────────────
#
# I1(a): hr-corpus — frontmatter-less BIBLIOGRAPHY with a markdown horizontal rule
#         between two Themes lines. Both before-hr and after-hr tags must be
#         parsed by both impls (the `---` HR must not be mistaken for a
#         frontmatter opener).
# I1(b): no-space-corpus — bullet without space (`-**Themes:** tag`) must NOT
#         be parsed as a themes line by either impl; a well-formed control tag
#         in the same file confirms parsing is otherwise active.

mkdir -p "$RESEARCH/reference/hr-corpus"
mkdir -p "$RESEARCH/reference/no-space-corpus"

cat > "$RESEARCH/reference/hr-corpus/BIBLIOGRAPHY.md" <<'EOF'
# hr-corpus — corpus BIBLIOGRAPHY

### 1. Paper One — `hr-one`

- **Source class:** paper
- **Themes:** before-hr

---

### 2. Paper Two — `hr-two`

- **Source class:** paper
- **Themes:** after-hr
EOF

cat > "$RESEARCH/reference/no-space-corpus/BIBLIOGRAPHY.md" <<'EOF'
# no-space-corpus — corpus BIBLIOGRAPHY

### 1. Paper One — `nospace-one`

- **Source class:** paper
-**Themes:** no-space-tag

### 2. Paper Two — `nospace-two`

- **Source class:** paper
- **Themes:** control-tag
EOF

echo "  OK: fixture written to $TMPROOT"

# ── Parity tests ──────────────────────────────────────────────────────────────

echo ""
echo "=== Parity tests: bash fallback vs binary ==="

# --version
parity_assert "--version"           "$BINARY" "$FALLBACK_SH" "$TMPROOT" --version
# -V (short form)
parity_assert "-V (short form)"     "$BINARY" "$FALLBACK_SH" "$TMPROOT" -V
# default table (no flags)
parity_assert "default table"       "$BINARY" "$FALLBACK_SH" "$TMPROOT"
# --count
parity_assert "--count"             "$BINARY" "$FALLBACK_SH" "$TMPROOT" --count
# --paths
parity_assert "--paths"             "$BINARY" "$FALLBACK_SH" "$TMPROOT" --paths
# --cat (two-artifact separator test requires same order)
parity_assert "--attestations --cat" "$BINARY" "$FALLBACK_SH" "$TMPROOT" --attestations --cat
# --attestations
parity_assert "--attestations"      "$BINARY" "$FALLBACK_SH" "$TMPROOT" --attestations
# --positions
parity_assert "--positions"         "$BINARY" "$FALLBACK_SH" "$TMPROOT" --positions
# --briefs
parity_assert "--briefs"            "$BINARY" "$FALLBACK_SH" "$TMPROOT" --briefs
# --campaigns
parity_assert "--campaigns"         "$BINARY" "$FALLBACK_SH" "$TMPROOT" --campaigns
# --hypotheses
parity_assert "--hypotheses"        "$BINARY" "$FALLBACK_SH" "$TMPROOT" --hypotheses
# --precis
parity_assert "--precis"            "$BINARY" "$FALLBACK_SH" "$TMPROOT" --precis
# --reference (tier sugar)
parity_assert "--reference"         "$BINARY" "$FALLBACK_SH" "$TMPROOT" --reference
# --tier reference (explicit)
parity_assert "--tier reference"    "$BINARY" "$FALLBACK_SH" "$TMPROOT" --tier reference
# --handle <h> (exact match)
parity_assert "--handle work-view-dist" "$BINARY" "$FALLBACK_SH" "$TMPROOT" --handle work-view-dist
# --status settled
parity_assert "--status settled"    "$BINARY" "$FALLBACK_SH" "$TMPROOT" --status settled
# --status null (IsNull: artifacts without status)
parity_assert "--status null"       "$BINARY" "$FALLBACK_SH" "$TMPROOT" --status null
# --provenance source-direct
parity_assert "--provenance source-direct" "$BINARY" "$FALLBACK_SH" "$TMPROOT" --provenance source-direct
# --temporal-contract write-once-on-converge
parity_assert "--temporal-contract write-once-on-converge" "$BINARY" "$FALLBACK_SH" "$TMPROOT" --temporal-contract write-once-on-converge
# --corpus rust-binary-size
parity_assert "--corpus rust-binary-size" "$BINARY" "$FALLBACK_SH" "$TMPROOT" --corpus rust-binary-size
# --reference --count
parity_assert "--reference --count" "$BINARY" "$FALLBACK_SH" "$TMPROOT" --reference --count
# --reference --paths
parity_assert "--reference --paths" "$BINARY" "$FALLBACK_SH" "$TMPROOT" --reference --paths
# empty result (no matches → prints nothing, exit 0)
parity_assert "--status nonexistent (no matches)" "$BINARY" "$FALLBACK_SH" "$TMPROOT" --status nonexistent
# --tag hit: retrieval appears in alpha-corpus
parity_assert "--tag retrieval (hit)"        "$BINARY" "$FALLBACK_SH" "$TMPROOT" --tag retrieval
# --tag miss: disjoint tag not in alpha-corpus
parity_assert "--tag agents (hit, beta-corpus only)" "$BINARY" "$FALLBACK_SH" "$TMPROOT" --tag agents
# --tag miss: tag not in any corpus
parity_assert "--tag nonexistent-tag (miss)" "$BINARY" "$FALLBACK_SH" "$TMPROOT" --tag nonexistent-tag
# --tag + --corpus composition: only alpha-corpus should match
parity_assert "--corpus alpha-corpus --tag retrieval" "$BINARY" "$FALLBACK_SH" "$TMPROOT" --corpus alpha-corpus --tag retrieval
# --tag + --corpus miss: beta-corpus has no 'retrieval' tag
parity_assert "--corpus beta-corpus --tag retrieval (miss)" "$BINARY" "$FALLBACK_SH" "$TMPROOT" --corpus beta-corpus --tag retrieval
# --tags global projection (all corpora)
parity_assert "--tags (global)"              "$BINARY" "$FALLBACK_SH" "$TMPROOT" --tags
# --tags scoped to one corpus
parity_assert "--corpus alpha-corpus --tags" "$BINARY" "$FALLBACK_SH" "$TMPROOT" --corpus alpha-corpus --tags
parity_assert "--corpus beta-corpus --tags"  "$BINARY" "$FALLBACK_SH" "$TMPROOT" --corpus beta-corpus --tags
# --tags with no matches prints nothing
parity_assert "--corpus nonexistent --tags (no matches)" "$BINARY" "$FALLBACK_SH" "$TMPROOT" --corpus nonexistent --tags
# --tag composed with another filter (--provenance)
parity_assert "--tag retrieval --provenance source-direct" "$BINARY" "$FALLBACK_SH" "$TMPROOT" --tag retrieval --provenance source-direct

# ── Parser alignment cases (I1a, I1b, N6) ─────────────────────────────────────

# I1(a): HR in frontmatter-less BIBLIOGRAPHY — both before-hr and after-hr tags must
#         appear on both sides (--tags projects the tag vocabulary for hr-corpus).
parity_assert "I1a: hr-corpus --tags (before-hr and after-hr both parsed)" \
  "$BINARY" "$FALLBACK_SH" "$TMPROOT" --corpus hr-corpus --tags
# Verify that both tags are reachable via --tag filter on each side.
parity_assert "I1a: --tag before-hr (hit, hr-corpus)" \
  "$BINARY" "$FALLBACK_SH" "$TMPROOT" --corpus hr-corpus --tag before-hr
parity_assert "I1a: --tag after-hr (hit, hr-corpus)" \
  "$BINARY" "$FALLBACK_SH" "$TMPROOT" --corpus hr-corpus --tag after-hr

# I1(b): Bullet without space — no-space-tag must NOT appear in --tags output;
#         control-tag (well-formed bullet) must appear on both sides.
parity_assert "I1b: no-space-corpus --tags (no-space-tag absent, control-tag present)" \
  "$BINARY" "$FALLBACK_SH" "$TMPROOT" --corpus no-space-corpus --tags
parity_assert "I1b: --tag no-space-tag (miss — bullet without space)" \
  "$BINARY" "$FALLBACK_SH" "$TMPROOT" --corpus no-space-corpus --tag no-space-tag
parity_assert "I1b: --tag control-tag (hit — well-formed bullet present)" \
  "$BINARY" "$FALLBACK_SH" "$TMPROOT" --corpus no-space-corpus --tag control-tag

# N6: output-mode precedence — last flag wins (both impls agree).
parity_assert "N6: --tags --count last-wins (count mode)" \
  "$BINARY" "$FALLBACK_SH" "$TMPROOT" --tags --count
parity_assert "N6: --count --tags last-wins (tags mode)" \
  "$BINARY" "$FALLBACK_SH" "$TMPROOT" --count --tags

# ── Additional structural checks on the fallback ──────────────────────────────

echo ""
echo "=== Structural checks on bash fallback ==="

# --version outside substrate (no .research/ in parent chain of /)
OUTSIDE_DIR="$(mktemp -d)"
trap 'rm -rf "$OUTSIDE_DIR"' EXIT
SH_VER="$( cd "$OUTSIDE_DIR" && bash "$FALLBACK_SH" --version 2>/dev/null )"
# Derive the expected version from the script's own literal so a legitimate
# bump-version.sh bump (which projects into this literal) does not break the test.
EXPECTED_VER="research-view $(sed -n 's/^RESEARCH_VIEW_VERSION="\([^"]*\)".*/\1/p' "$FALLBACK_SH" | head -1)"
assert_eq "--version outside substrate returns correct line" \
  "$EXPECTED_VER" "$SH_VER"
rm -rf "$OUTSIDE_DIR"

# exit 2 when no substrate
NO_SUBSTRATE="$(mktemp -d)"
trap 'rm -rf "$NO_SUBSTRATE"' EXIT
( cd "$NO_SUBSTRATE" && bash "$FALLBACK_SH" > /dev/null 2>&1 ) ; RC=$?
assert_eq "exit code 2 when no substrate found" "2" "$RC"
rm -rf "$NO_SUBSTRATE"

# exit 1 on unknown flag
( cd "$TMPROOT" && bash "$FALLBACK_SH" --no-such-flag > /dev/null 2>&1 ) ; RC=$?
assert_eq "exit code 1 on unknown flag" "1" "$RC"

# exit 1 on unexpected positional
( cd "$TMPROOT" && bash "$FALLBACK_SH" somefile.md > /dev/null 2>&1 ) ; RC=$?
assert_eq "exit code 1 on unexpected positional" "1" "$RC"

# raw/ subtree not indexed — assert directly that NO path under a raw/ dir is
# emitted (an upper-bound on the count would pass even if raw/ leaked in).
RAW_PATHS="$( cd "$TMPROOT" && bash "$FALLBACK_SH" --paths 2>/dev/null | grep -c '/raw/' || true )"
assert_eq "raw/ subtree files not indexed (no /raw/ paths emitted)" "0" "$RAW_PATHS"

# README.md at tier root not indexed
TOTAL_COUNT="$( cd "$TMPROOT" && bash "$FALLBACK_SH" --count 2>/dev/null )"
ATTEST_COUNT="$( cd "$TMPROOT" && bash "$FALLBACK_SH" --attestations --count 2>/dev/null )"
assert_eq "attestation README.md not indexed (2 real attestations)" "2" "$ATTEST_COUNT"

# RESEARCH_VIEW_VERSION literal in the fallback script
assert_true "fallback carries anchored RESEARCH_VIEW_VERSION= literal" \
  "grep -q '^RESEARCH_VIEW_VERSION=\"[0-9]' '$FALLBACK_SH'"

# ── Summary ───────────────────────────────────────────────────────────────────

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
