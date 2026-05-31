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

<!-- populated in Phase 4 -->

## Distribution caveat (carried from epic review)

The four prebuilt binaries are CI-produced; `dist/` ships empty until the manual
refresh job runs, so installs fall back to `work-view.sh` until then (no regression).
Mapping is `none`: release-deploy binds, gates, and archives — it does NOT tag/bump.
Publishing is the separate `bump-version.sh agile-workflow` step, run after `dist/`
is populated.
