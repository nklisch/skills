---
id: release-0.8.6
kind: release
stage: quality-gate
tags: []
parent: null
depends_on: []
release_binding: 0.8.6
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Release 0.8.6

## Bound items

Bound 2026-05-31. The `epic-substrate-cli` arc — compiled `work-view` binary +
shared Rust query core + stage-aware `--ready`/`--blocked` fix, shipped per-platform
with a bash fallback.

- `epic-substrate-cli` (epic) — Substrate CLI: compiled agent surface over `.work/`
- `epic-substrate-cli-runtime-research` (feature) — runtime/distribution decision (Rust; prebuilt musl binaries + bash fallback)
- `epic-substrate-cli-query-core` (feature) — `work-view-core` lib crate (parse, model, index, graph, filter)
- `epic-substrate-cli-adapter` (feature) — `work-view` binary: full flag/output parity over the core
- `epic-substrate-cli-next-actionable` (feature) — stage-aware `--ready`/`--blocked` (the headline fix), binary + bash in lockstep
- `epic-substrate-cli-install-path` (feature) — `install-work-view.sh` platform selector wired into `convert`; CI cross-compile workflow

## Gate runs

Gate order (CONVENTIONS.md): tests → cruft → docs → patterns. Each gate produces
items, not pass/fail. Findings recorded below as gates run.

- **gate-tests** (2026-05-31) — 8 findings (0 critical, 2 high, 4 medium, 2 low);
  0 tautological tests, 0 test-integrity violations. ~286 existing tests confirmed.
  6 items: 5 bound to 0.8.6 (2 implementing, 3 drafting), 2 low → backlog (unbound).
  Gaps cluster on (1) the headline `--ready` drafting-fix proven only in-memory, not
  through the binary; (2) the two non-Rust surfaces (prompt-context.py hook dedup,
  convert install routing) lacking automated guards; plus exit-3 and `--blocked`
  review decision-table cells.
  - `gate-tests-ready-drafting-binary` (high, implementing)
  - `gate-tests-hook-review-dedup` (high, implementing)
  - `gate-tests-blocked-review-unmet-dep` (medium, drafting)
  - `gate-tests-convert-install-routing` (medium, drafting)
  - `gate-tests-exit3-fatal-io` (medium, drafting)
  - `gate-tests-ci-actionlint` (low, backlog)
  - `gate-tests-parity-empty-results` (low, backlog)
- **gate-cruft** (2026-05-31) — 3 findings (0 high, 3 medium, 0 low). Near-clean as
  expected: cargo build / clippy `-D warnings` / test all confirmed clean by the
  sub-agent; ruff/shellcheck unavailable (Python hook + bash read manually). All 3 are
  small surgical removals bound to 0.8.6 (drafting):
  - `gate-cruft-unused-report-param` (medium) — dead `_report` param on `collect_sorted_paths`
  - `gate-cruft-dead-loaderror-from-impl` (medium) — unused `From<io::Error> for LoadError`
  - `gate-cruft-vestigial-tier-dir-noop` (medium) — dead `let _ = tier_dir;` no-op in test helper
- **gate-docs** (2026-05-31) — 4 findings (3 high, 1 medium), all foundation-doc-assertion.
  Sub-agent verified the `dist/`-empty distinction: `dist/` ships only README + .gitattributes
  (no binaries), so README.md + agile-workflow-guide.md "script"/"copied by convert" language
  is ACCURATE and was correctly NOT flagged (rolls forward only once CI populates binaries).
  ROADMAP.md (transient build-plan) and repo-root docs/ARCHITECTURE.md need no change;
  substrate-binary SKILL.md core-vs-CLI correction confirmed accurate. 4 items bound to 0.8.6:
  - `gate-docs-vision-bash-to-binary` (high, implementing) — VISION.md "bash script" → binary
  - `gate-docs-spec-ready-blocked-semantic` (high, implementing) — SPEC.md `--ready`/`--blocked` rows
  - `gate-docs-architecture-ready-rule` (high, implementing) — ARCHITECTURE.md ready-rule + AGENTS embed
  - `gate-docs-spec-bash-tooling-line` (medium, drafting) — SPEC.md "bash for work-view" → fallback framing
- **gate-patterns** (2026-05-31) — 5 patterns extracted (3+ occurrences each), 0
  inconsistencies. First pattern catalog in the repo (`.agents/skills/patterns/`). All
  net-new; 6 candidates rejected as idiomatic/style/single-use. Tracking item
  `gate-patterns-0.8.6` at stage:done (the gate's deliverable IS the pattern files).
  - `substrate-borrowing-query` — core read-API shape the board reuses
  - `substrate-test-fixture-builder` — `setup_substrate(&[..]) -> (TempDir, Substrate)`
  - `test-item-builders` — positional frontmatter-string + struct item builders
  - `subprocess-cli-harness` — real-binary subprocess + bash parity graceful skip
  - `cargo-manifest-fixture-root` — `CARGO_MANIFEST_DIR` fixture-root resolver

## Drain (autopilot, 2026-05-31)

User ran `/agile-workflow:autopilot` to drain all gate-produced items (and scope the 2
Low backlog items in). All 14 follow-up items driven to `stage: done`. Two genuine
design questions resolved via cross-model consult (Codex via peeragent). Test work
delegated to two parallel sub-agents with non-overlapping write ownership (Rust vs
non-Rust artifacts). Final verification: `cargo fmt`/`clippy -D warnings` clean, 237
cargo tests (was 230, +7), Python hook test 2/2, convert-routing test 9/9, install test
51/51 (no regression).

- **cruft (3):** dropped unused `_report` param; removed dead `From<io::Error>`;
  deleted vestigial `let _ = tier_dir;`.
- **docs (4):** VISION/SPEC/ARCHITECTURE rolled forward (bash-script→binary,
  stage-aware `--ready`/`--blocked`). README + guide intentionally NOT rolled (dist/
  empty → "script" language accurate until binaries ship).
- **tests (5 + 2 scoped-in):**
  - `ready_surfaces_drafting_item_with_satisfied_deps` + `ready_stage_drafting_returns_design_ready_items` (new `ready-drafting` fixture; headline fix proven at binary level)
  - `blocked_includes_review_with_unmet_dep` (actionable.rs)
  - `load_unreadable_tier_dir_returns_io_error` (core) + `exit_3_on_unreadable_substrate_traversal` (cli; root-guarded)
  - `test_prompt_context.py` (hook review-dedup; stdlib unittest)
  - `convert-install-routing.test.sh` (SKILL.md Phase 4 + S3 route through install-work-view.sh; negative-control verified)
  - `.github/workflows/lint-github-actions.yml` (actionlint on workflow changes — CI-only, YAML-validated locally)
  - `parity_parent_with_no_children_empty_matches_bash` + `parity_blocking_with_no_dependents_empty_matches_bash`
- Added root `.gitignore` (`__pycache__/`, `*.pyc`, `.peeragent/`).

## Distribution caveat (carried from epic review)

The four prebuilt binaries are CI-produced; `dist/` ships empty until the manual
refresh job runs, so installs fall back to `work-view.sh` until then (no regression).
Mapping is `none`: release-deploy binds, gates, and archives — it does NOT tag/bump.
Publishing is the separate `bump-version.sh agile-workflow` step, run after `dist/`
is populated.
