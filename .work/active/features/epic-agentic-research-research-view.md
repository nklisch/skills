---
id: epic-agentic-research-research-view
kind: feature
stage: done
tags: [tooling]
parent: epic-agentic-research
depends_on: [epic-agentic-research-substrate-tier]
release_binding: null
gate_origin: null
created: 2026-06-03
updated: 2026-06-04
---

# `research-view` query binary

## Brief
Build `research-view`, a thin read-only query tool over the `.research/` tier —
the research-tier analog of `.work/bin/work-view`. Per the epic's design
decision, it ships as a **Rust prebuilt binary** following the `substrate-binary`
reference-skill pattern (Rust source + prebuilt dist binaries + checksum +
version-freshness gating). It offers read-only queries over the tier — by
`source_handle`, `status`, `temporal_contract`, corpus, and `provenance`; list
attestations / positions / campaigns — and deliberately imposes NO stages on
items (the tier has none), surfacing ARD's native lifecycle fields instead.

It mirrors work-view's build/distribution machinery; the recent work-view
version-freshness story is the precedent for keeping the tracked binary in
lockstep with plugin metadata. As a CLI binary it works in all three channels.

Does NOT cover: any write/mutation of the substrate, or citation linting (that
floor belongs to substrate-tier).

## Epic context
- Parent epic: `epic-agentic-research`
- Position in epic: consumer of `epic-agentic-research-substrate-tier`; the
  ergonomics-parity deliverable. Parallel with `work-handoff`.

## Foundation references
- `plugins/agile-workflow/work-view/` (Rust crate + `Cargo.toml` + `dist/`) and
  `plugins/agile-workflow/scripts/{install-work-view,work-view}.sh` — the binary +
  cross-compiled dist + bash-fallback pattern to mirror; `.work/bin/work-view` is
  the installed result
- `.agents/skills/substrate-binary/` — build/dist + version-freshness pattern
- `epic-agentic-research-substrate-tier` — the schema/layout it queries

## Design inputs (carried forward)
- **Extend `scripts/bump-version.sh` for this binary.** Its version-projection
  block is hardcoded `if [[ "$plugin" == "agile-workflow" ]]` — it stamps the
  semver into work-view's Rust `.work-view-version` + bash fallback. This binary
  needs an analogous block, or its self-reported version will drift from the
  plugin manifests (the failure the work-view freshness story fixed). Surfaced
  during `epic-agentic-research-scaffold` design.

## Design decisions
Resolved at feature-design (user-confirmed via `AskUserQuestion`).
- **Full distribution parity in this feature** — ship the Rust crate + tests, a
  `build-research-view.yml` CI workflow (mirroring `build-work-view.yml`), an
  `install-research-view.sh` with version-freshness gating, the bash fallback,
  and the `bump-version.sh` projection block. The 4 cross-compiled committed
  `dist/<triple>/research-view` binaries land via the **post-merge CI run**
  (exactly how work-view's binaries are built — `bump-version.sh` writes the
  version stamp into source, CI compiles dist FROM that stamp on the post-bump
  commit). This *closes the epic* rather than leaving a prebuilt-binary follow-on.
- **Bash fallback parity** — ship `plugins/agentic-research/scripts/research-view.sh`
  mirroring `work-view.sh`'s read-only query surface, doubling as the installer's
  fallback for unsupported platforms. A parity-diff test keeps it behavior-synced
  with the Rust core (the `subprocess-cli-harness` graceful-parity-skip pattern).
- **Flat filters for v1; typed-edge graph deferred** — v1 queries the flat
  frontmatter dimensions only (`source_handle` / `status` / `temporal_contract` /
  `provenance` / `corpus` / tier). The optional `related:` typed-edge graph
  (ARD SPEC §10.5) and its traversal/reverse-derivation are a **named follow-on**
  (parked), NOT parsed or exposed here — keeps research-view's shape parallel to
  work-view's flat-query model.
- **Install vector: standalone `install-research-view.sh` + README docs** —
  `agentic-research` has no `convert` skill (work-view rides on
  `agile-workflow:convert`). For v1 the install script is the vector, documented
  in the plugin README, installing to `.research/bin/research-view`. Auto-wiring
  (a `convert`-equivalent bootstrap or first-use install in `research-orchestrator`)
  is a small follow-on, noted in Risks — not built here.
- **New query core, not a work-view fork** — `.research/` artifacts have NO `id`
  and NO stage; frontmatter is heterogeneous across tiers (attestation vs precis
  vs position differ). The core is a net-new model (`Artifact` + `ResearchTier`),
  mirroring work-view's *machinery* (frontmatter split, byte-sorted load, the
  `substrate-borrowing-query` filter pattern, `manual-error-display`) but not its
  `Item`/stage/graph semantics.

## Architectural choice
A new two-crate Rust workspace at `plugins/agentic-research/research-view/`
(`crates/core` = `research-view-core`, `crates/cli` = `research-view-cli`, binary
`research-view`), mirroring `plugins/agile-workflow/work-view/`'s Ports & Adapters
shape (one query core, a terse CLI adapter) — but with NO board surface (work-view
has `board/`; research-view is read-only CLI only). Chosen over: (a) a single-crate
binary (the core/cli split is the house pattern and lets the bash fallback mirror a
clean contract); (b) extending work-view with a `.research/` mode (wrong substrate,
wrong model, wrong plugin — violates the tier/plugin cleavage); (c) a zero-dep
shell-only tool (the epic fixed Rust prebuilt parity with work-view).

Reuse these existing patterns (from `.agents/rules/patterns.md`):
`substrate-borrowing-query` (read-only borrowing filters, byte-sorted load order),
`manual-error-display` (hand-written `Display`; core never `process::exit`s — the
CLI adapter maps errors to exit codes), `subprocess-cli-harness` (CLI + parity
tests), `cargo-manifest-fixture-root` (fixture resolver), `substrate-test-fixture-builder`
/ `test-item-builders` (in-memory fixtures).

## Implementation Units
Four child stories: a Rust core, the CLI adapter, the bash fallback, and the
distribution/CI/install bundle. Dependency chain S1 → S2 → {S3, S4}; S4 also
needs S3.

### Unit 1 / Story `…-research-view-core` — the `.research/` query core
**Crate**: `plugins/agentic-research/research-view/crates/core/` (`research-view-core`)
**Files**: `src/{lib,model,parse,index,filter,error}.rs`

```rust
// model.rs
/// Down-gradient tier an artifact was loaded from (derived from the load dir,
/// NOT frontmatter). Order encodes the read-gradient reference→attestation→
/// precis→analysis.
pub enum ResearchTier {
    ReferenceIndex, // reference/<corpus>/INDEX.md
    Attestation,    // attestation/<handle>.md
    Precis,         // precis/<slug>.md
    Position,       // analysis/positions/<slug>.md
    Brief,          // analysis/briefs/<slug>.md
    Campaign,       // analysis/campaigns/<slug>/**
    Hypothesis,     // analysis/hypothesis/<slug>.md
}

/// A single parsed research artifact. Frontmatter is heterogeneous across tiers,
/// so every domain field is optional and normalized (missing/null/"" → None),
/// matching work-view's normalization. There is no `id`/`stage`.
pub struct Artifact {
    pub identity: String,            // source_handle ∥ slug ∥ file stem (never empty)
    pub tier: ResearchTier,          // from load dir
    pub source_handle: Option<String>,
    pub slug: Option<String>,
    pub status: Option<String>,
    pub temporal_contract: Option<String>,
    pub provenance: Option<String>,
    pub fetched: Option<String>,
    pub authored: Option<String>,
    pub source_url: Option<String>,
    pub source_path: Option<String>,
    pub corpus: Option<String>,      // derived from reference/<corpus>/ path
    pub path: PathBuf,
    pub rel_path: PathBuf,
    pub raw_text: String,            // for --cat parity
    pub body: String,
}
```
**Implementation notes**:
- `parse.rs` reuses work-view's `split_frontmatter` logic verbatim-in-spirit
  (the `---`/`---` split + serde-yaml). RawFrontmatter has ALL fields optional —
  parse must NOT require `id` (research artifacts have none). `identity` falls
  back to the file stem when neither `source_handle` nor `slug` is present.
- Parse errors are **non-fatal**: a malformed in-progress artifact is collected
  as a skip + warning, never aborts the load (a query tool must tolerate
  half-authored files). Mirror work-view's `ParseError` collection.
- `index.rs` walks `.research/` in byte-sorted order per tier dir, deriving
  `tier` (and `corpus` for reference-tier) from the relative path. No-substrate
  signal: absence of `.research/CONVENTIONS.md` → a typed "no substrate" condition
  the CLI maps to exit 2.
- `filter.rs` exposes the `substrate-borrowing-query` shape: `pub fn …<'a>(&'a self,
  …) -> Vec<&'a Artifact>` over `self.artifacts()`, preserving load order, never
  mutating/cloning. Filter dimensions: tier, source_handle, status,
  temporal_contract, provenance, corpus (all `Match::{Any,Equals,IsNull}` like
  work-view).
**Acceptance**:
- [ ] Parses each tier's real seed artifact in `.research/` (attestation, position,
  brief) into an `Artifact` with correct `tier` + normalized fields; no `id` required.
- [ ] `identity` = handle for attestations, slug for positions/briefs, file stem as fallback.
- [ ] Filters compose (AND) and return borrowed slices in byte-sorted load order.
- [ ] Malformed frontmatter is skipped non-fatally, not a crash.
- [ ] No-`.research/` is a typed condition (not a panic). Core never `process::exit`s.

### Unit 2 / Story `…-research-view-cli` — the CLI adapter
**Crate**: `plugins/agentic-research/research-view/crates/cli/` (`research-view-cli`, bin `research-view`)
**Files**: `src/{main,args,render}.rs`, `crates/cli/.research-view-version`
**Depends on**: Story `…-core`.

CLI surface (hand-rolled parser mirroring `work-view`'s `args.rs` conventions:
last-wins scalars, AND tags-style accumulation where relevant, `--`/unknown-flag
handling, `--help`/`-h`, `--version`/`-V`):
```
research-view [FILTERS...] [OUTPUT]
Filters (AND):
  --tier <t>                attestation|precis|position|brief|campaign|hypothesis|reference
  --handle <h>              source_handle == <h>
  --status <s>              status == <s>
  --temporal-contract <tc>  temporal_contract == <tc>
  --provenance <p>          provenance == <p>
  --corpus <c>              reference-tier artifacts under reference/<c>/
Sugar (sets --tier):
  --attestations --positions --precis --briefs --campaigns --hypotheses
Output (default table):
  --paths --cat --count
Other: --version  --help
```
**Implementation notes**:
- `render.rs` table columns (research-shaped, NOT work-view's ID/KIND/STAGE/TAGS/
  PARENT): `IDENTITY  TIER  STATUS  TEMPORAL_CONTRACT  PROVENANCE`. Empty result
  → print nothing (no header), matching work-view. `--paths`/`--cat`/`--count`
  byte-semantics identical to work-view's render.
- Version stamp: `pub const RESEARCH_VIEW_VERSION: &str = include_str!("../.research-view-version");`
  written with NO trailing newline (byte-parity with the bash fallback); `--version`
  prints `research-view <semver>`.
- Exit codes mirror work-view: `0` ok, `1` usage/error, `2` no `.research/`
  substrate (`no .research/CONVENTIONS.md`), `3` I/O (BrokenPipe → 0).
**Acceptance**:
- [ ] All filters + sugar flags + output modes parse and map to core filters; unknown
  flag / missing value → exit 1 with a `research-view:`-prefixed usage error.
- [ ] `--version` prints `research-view <plugin-semver>` with no trailing blank line.
- [ ] Run against the live `.research/`: `--positions` lists the seed position;
  `--handle work-view-dist` finds the attestation; exit 2 when run with no `.research/`.
- [ ] Integration-tested via the `subprocess-cli-harness` pattern (real binary →
  (stdout, stderr, exit) tuple).

### Unit 3 / Story `…-research-view-fallback` — bash fallback
**File**: `plugins/agentic-research/scripts/research-view.sh`
**Depends on**: Story `…-cli` (mirrors the finalized CLI contract).
**Implementation notes**: mirror `work-view.sh`'s read-only query surface over
`.research/`; carry a `RESEARCH_VIEW_VERSION="x.y.z"` literal (projected by
bump-version.sh). No board, no write paths.
**Acceptance**:
- [ ] Same filters/output/exit-codes as the binary for the covered surface.
- [ ] Parity-diff test vs the binary using the `subprocess-cli-harness` graceful
  parity-skip (hard-fail on a path/behaviour regression; skip only if a tool is absent).
- [ ] `research-view.sh --version` byte-matches `research-view --version`.

### Unit 4 / Story `…-research-view-dist` — distribution, install, bump, CI
**Files**: `plugins/agentic-research/research-view/dist/.gitattributes` + the
`dist/<triple>/` skeleton; `plugins/agentic-research/scripts/install-research-view.sh`;
the `bump-version.sh` projection-block generalization; `.github/workflows/build-research-view.yml`;
README install section.
**Depends on**: Stories `…-cli` + `…-fallback` (installs/gates both).
**Implementation notes**:
- `install-research-view.sh` mirrors `install-work-view.sh`: `uname`→target-triple,
  copy `research-view/dist/<triple>/research-view` → `.research/bin/research-view`,
  `--help` smoke + `candidate_is_current` version-freshness gate, bash-fallback
  path for unsupported triples. (No `board --help` check — there is no board.)
- **`bump-version.sh`**: generalize the `if [[ "$plugin" == "agile-workflow" ]]`
  projection block to a small per-plugin mapping — keep the agile-workflow path
  byte-identical, add an `agentic-research` branch projecting into
  `research-view/crates/cli/.research-view-version` + the `research-view.sh`
  literal, with the SAME Fail-Fast grep-verify and the same "dist not rebuilt
  here — trigger CI on the post-bump commit" operator note.
- `build-research-view.yml` mirrors `build-work-view.yml`: `workflow_dispatch`
  (`commit_binaries`) + path-scoped `push`/`pull_request`; cross-compile
  x86_64/aarch64-unknown-linux-musl via `cargo-zigbuild`, darwin targets on a
  macOS runner; `strip`/`opt-level=z`/`lto`/`panic=abort`; an 8 MB size budget;
  the install-helper + bump-lockstep bash tests.
**Acceptance**:
- [ ] `install-research-view.sh` installs the right triple to `.research/bin/research-view`,
  passing the version gate; falls back to `research-view.sh` on unsupported platforms.
- [ ] `bump-version.sh agentic-research patch` projects the new semver into BOTH the
  `.research-view-version` stamp and the `research-view.sh` literal (Fail-Fast verified),
  and does NOT disturb the agile-workflow/work-view projection.
- [ ] `build-research-view.yml` is path-scoped, cross-compiles the 4 triples, enforces
  the size budget, and (on `workflow_dispatch commit_binaries=true`) commits
  `dist/<triple>/research-view`. (Binary production/verification is CI-side, post-merge.)
- [ ] README documents `install-research-view.sh` and the `.research/bin/research-view` path.

## Implementation Order
1. `…-research-view-core` (the query model — everything hangs off it)
2. `…-research-view-cli` (adapter over the core; defines the contract)
3. `…-research-view-fallback` and `…-research-view-dist` can start once the CLI
   contract is fixed; `…-dist` integrates last (it installs/gates both the binary
   and the fallback). In practice: 3 then 4, or 3 ∥ (4 minus the install-gate step).

## Testing
- **core**: unit tests for parse (each tier, lenient no-`id` fallback, normalization),
  filter (each dimension + AND composition + load-order), index (byte-sorted,
  corpus derivation, no-substrate condition). Fixtures via `substrate-test-fixture-builder`
  + `cargo-manifest-fixture-root`.
- **cli**: `subprocess-cli-harness` integration tests (table/paths/cat/count, exit
  0/1/2, `--version` no-trailing-newline) against a temp `.research/`.
- **fallback**: parity-diff vs the binary (graceful parity-skip).
- **dist/bump/CI**: bump-lockstep bash test (projection lands in both stamps,
  agile-workflow untouched) + install-helper test; the cross-compile + committed
  binaries are CI-gated post-merge (same as work-view — can't be produced locally).

## Risks
- **Can't produce/verify the 4 dist binaries locally.** Cross-compile + commit is
  a CI step; this branch ships the workflow + install gating, and the committed
  binaries + green install land via the post-merge CI run (work-view's exact
  process). Until that run lands, the installer's version gate intentionally fails
  on supported platforms — do not cut a release before the binary-refresh commit.
- **`bump-version.sh` is a guarded shared script.** Generalizing the
  agile-workflow-only block risks regressing work-view's projection. Mitigation:
  keep the existing branch byte-identical, add agentic-research as a parallel
  branch, cover both with the Fail-Fast grep-verify + the bump-lockstep test.
- **Heterogeneous, id-less frontmatter.** Naively copying work-view's `id`-required
  parse would reject every research artifact. Mitigation: all-optional RawFrontmatter,
  `identity` fallback, non-fatal parse-skip — pinned in core acceptance.
- **No install auto-wiring.** Unlike work-view (installed by `convert`),
  research-view's v1 install is manual via the script + README. Acceptable for the
  proposal; auto-bootstrap is a noted follow-on, not silently assumed.
- **bash/binary drift.** The parity-diff test is the guard; a path/behaviour
  regression hard-fails (only a missing tool skips).

## UI
No UI surface (read-only CLI binary). `ux-ui-design` Phase 4.6 N/A.

## Implementation summary (4 stories → review)
Implemented via implement-orchestrator across 4 sequential single-bundle waves
(strict `core → cli → {fallback, dist}` dependency chain — no parallelism
possible). All four child stories at `stage: review`:
- **`…-core`** (done→review) — `research-view-core` crate: `Artifact`/`ResearchTier`
  model (no id/stage; heterogeneous per-tier frontmatter), lenient parse, byte-sorted
  index, borrowing filters. 53 tests.
- **`…-cli`** (review) — `research-view-cli` crate, binary `research-view`: hand-rolled
  arg parser, table/paths/cat/count render, exit codes 0/1/2/3, version stamp via
  `include_str!`. 53 unit + 17 subprocess integration tests.
- **`…-fallback`** (review) — `research-view.sh` bash fallback; 31/31 byte-parity vs
  the binary.
- **`…-dist`** (review) — `install-research-view.sh`, generalized `bump-version.sh`
  projection (work-view branch kept byte-identical; bump-lockstep 77/77),
  `build-research-view.yml` CI, dist skeleton + README. Installer test 45/45.

**Mid-flight fix (orchestrator Phase-7 finding):** reference-tier `INDEX.md`
bibliographies legitimately carry no frontmatter — the core now loads them
leniently instead of emitting a spurious parse-error warning on every run
(`fix(research-view-core): lenient parse…`). +2 core tests.

**Verification:** full workspace `cargo test` green (127 tests: 53 core + 53 cli +
17 integration + 4 doc); install + bump-lockstep + parity bash suites green; binary
smoke against the live `.research/` correct. **The 4 committed `dist/<triple>/`
binaries are produced by `build-research-view.yml` post-merge** (work-view's exact
ordering) — until that CI run lands the installer version gate intentionally fails
on supported platforms; do not cut a release before the binary-refresh commit.

**Open review nits (for the review pass, non-blocking):** (a) the installer reuses
`WORK_VIEW_UNAME_S/M` env-override names rather than `RESEARCH_VIEW_*` (test-only,
mirrors work-view's harness); (b) the bash fallback treats `--handle null` as a
literal rather than `IsNull` (other nullable filters mirror the binary; no stdout
parity impact in tested cases).

## Review (2026-06-04)

**Verdict**: Approve with comments

**Mode/depth**: substrate, deep lane — 3 fresh-context reviewers (Rust core+CLI;
installer+bump+CI; bash parity+docs) over the ~6k-line diff, plus a deterministic
host check that the shared `bump-version.sh` agile-workflow branch is byte-identical
to `main` (confirmed — only a comment above it was reworded; the new
`agentic-research` branch is a clean parallel `if`). No correctness bugs found in
core/cli; the bump generalization and its lockstep test are sound; bash/binary
parity is real.

**Blockers**: none remaining — one found and **fixed inline**:
- Foundation-doc drift: `README.md` adoption-status listed `research-view` as
  *Pending* after this PR ships it → moved to *Landed* (dist binaries via post-merge CI).

**Important** (3 fixed inline, 2 filed):
- Fixed: weak `--count` integration assertion (`>= 1` → `== 5`); parity test's
  hardcoded `0.1.0` version string → derived from the script literal
  (bump-safe); vacuous `raw/`-exclusion assertion (`-le 20`) → asserts no
  `/raw/` path is emitted.
- Filed `idea-research-view-fallback-flat-maxdepth` (backlog): the fallback's
  `find` is recursive for the flat tiers where the binary is not — latent (flat
  tiers carry no subdirs by convention) but a real fidelity gap; the misleading
  "matches exactly" comment was corrected inline.
- Filed `idea-research-view-dist-version-guard` (backlog): CI lacks work-view's
  dist-version skew guard; should land before the first `commit_binaries` CI run.

**Nits** (recorded, no items): installer reuses `WORK_VIEW_UNAME_*` test-override
names; installer-test groups 7/8 don't pin uname; bump-test group 2 omits a
research-view-clean assertion; CI path filter doesn't watch
`agile-workflow/scripts/tests/**`; integration suite doesn't exercise
`--version`/`--help` with no substrate present; `--handle null` is literal (story's
"asymmetry" note overstates — both sides yield zero matches).

**Notes**: Re-verified after the inline fixes — `cargo test` workspace green
(integration 17/17), parity 31/31, installer 45/45, bump-lockstep 77/77. The 4
committed `dist/<triple>/research-view` binaries remain a post-merge CI artifact
(`build-research-view.yml`); the installer version gate intentionally fails on
supported platforms until that run lands. All 4 child stories covered by this deep
review → advanced to done.
