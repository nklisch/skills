---
id: release-0.9.0
kind: release
stage: quality-gate
tags: []
parent: null
depends_on: []
release_binding: 0.9.0
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Release 0.9.0

## Bound items

Bound 2026-05-31. Three completed epics accumulated since 0.8.6: the
`.agents/rules/` cross-vendor auto-load mechanism, the interactive Substrate
Board over `.work/`, and the work-view freshness / anti-drift install lifecycle.
47 items (3 epics, 15 features, 29 stories).

### epic-agents-rules-autoload — Cross-vendor `.agents/rules/` auto-load mechanism
- `epic-agents-rules-autoload` (epic)
- `epic-agents-rules-autoload-convert-extract` (feature) — convert extracts dense rules into `.agents/rules/agile-workflow.md`
- `epic-agents-rules-autoload-convert-safety` (feature) — convert legacy-cleanup data-safety (content-integrity gate)
- `epic-agents-rules-autoload-docs` (feature) — foundation-doc + guide sync for `.agents/rules/`
- `epic-agents-rules-autoload-hook` (feature) — generic `.agents/rules/` hook loader
- `epic-agents-rules-autoload-patterns-digest` (feature) — gate-patterns writes the `.agents/rules/patterns.md` digest
- `epic-agents-rules-autoload-skill-grounding` (feature) — design/implement/review skills read `.agents/rules/*.md` in grounding
- `epic-agents-rules-autoload-state-concurrency` (story) — harden hook state-file concurrency/atomicity

### epic-substrate-board — Substrate Board (interactive human surface over `.work/`)
- `epic-substrate-board` (epic)
- `epic-substrate-board-shell` (feature) — shared app frame, item-card, filters, auto-hide
  - `epic-substrate-board-shell-frame` (story) — app frame and design-system assets
  - `epic-substrate-board-shell-card` (story) — safe markdown and shared item card
  - `epic-substrate-board-shell-contract` (story) — view registry, detail surface, downstream contract
  - `epic-substrate-board-shell-data` (story) — snapshot store, refresh, diagnostics
  - `epic-substrate-board-shell-filters` (story) — filter-state store and controls
- `epic-substrate-board-table` (feature) — sortable, filterable columns
  - `epic-substrate-board-table-render` (story) — registered render
  - `epic-substrate-board-table-sort` (story) — sort controls
  - `epic-substrate-board-table-filters` (story) — column filters and responsive polish
- `epic-substrate-board-kanban` (feature) — columns by stage
  - `epic-substrate-board-kanban-stage-grid` (story) — registered view and stage grid
  - `epic-substrate-board-kanban-swimlanes` (story) — epic swimlanes and focus strip
  - `epic-substrate-board-kanban-polish` (story) — responsive polish and verification
- `epic-substrate-board-dependency` (feature) — chains, blockers, and what each item unblocks
  - `epic-substrate-board-dependency-model` (story) — graph model and layered-list view
  - `epic-substrate-board-dependency-canvas` (story) — dependency SVG canvas
  - `epic-substrate-board-dependency-interactions` (story) — traversal interactions and fallback
- `epic-substrate-board-host` (feature) — serve the interactive board off the `work-view` binary
  - `epic-substrate-board-host-subcommand` (story) — subcommand dispatch
  - `epic-substrate-board-host-server` (story) — localhost server
  - `epic-substrate-board-host-feed` (story) — live substrate JSON feed
  - `epic-substrate-board-host-assets` (story) — embedded assets and stub board
  - `epic-substrate-board-host-surface` (story) — human surface and legacy retirement

### epic-substrate-cli-freshness — work-view freshness & anti-drift install lifecycle
- `epic-substrate-cli-freshness` (epic)
- `epic-substrate-cli-freshness-discovery` (feature) — plugin-root discovery spike
  - `epic-substrate-cli-freshness-discovery-investigate` (story) — research spike (Claude Code + Codex)
- `epic-substrate-cli-freshness-versioning` (feature) — work-view self-versioning
  - `epic-substrate-cli-freshness-versioning-rust-version` (story) — Rust `--version` flag + compiled-in stamp
  - `epic-substrate-cli-freshness-versioning-bash-version` (story) — bash fallback `--version` + lockstep literal
  - `epic-substrate-cli-freshness-versioning-bump-lockstep` (story) — `bump-version.sh` lockstep + dist-refresh ordering guard
  - `epic-substrate-cli-freshness-versioning-tests-docs` (story) — `--version` integration + parity tests, SPEC roll-forward
- `epic-substrate-cli-freshness-self-heal` (feature) — freshness self-heal (hook + convert)
  - `epic-substrate-cli-freshness-self-heal-installer` (story) — version-aware installer writing the source-stamped bash entrypoint
  - `epic-substrate-cli-freshness-self-heal-hook` (story) — hook self-heal step (reinstall-if-stale / install-if-missing)
  - `epic-substrate-cli-freshness-self-heal-convert` (story) — convert version-aware doctor + one-time migration
  - `epic-substrate-cli-freshness-self-heal-docs` (story) — foundation-doc roll-forward (ARCHITECTURE.md + SPEC.md reconcile)
- `epic-substrate-cli-freshness-shim` (feature) — shim launcher entrypoint

## Gate runs

Gate order (CONVENTIONS.md): tests → cruft → docs → patterns. Each gate produces
items, not pass/fail. Findings recorded below as gates run.

<!-- populated in Phase 4 -->
