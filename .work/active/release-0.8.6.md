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

## Distribution caveat (carried from epic review)

The four prebuilt binaries are CI-produced; `dist/` ships empty until the manual
refresh job runs, so installs fall back to `work-view.sh` until then (no regression).
Mapping is `none`: release-deploy binds, gates, and archives — it does NOT tag/bump.
Publishing is the separate `bump-version.sh agile-workflow` step, run after `dist/`
is populated.
