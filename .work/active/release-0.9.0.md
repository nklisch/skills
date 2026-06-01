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

- **gate-tests** (2026-05-31) — 12 findings (2 critical, 3 high, 5 medium, 2 low)
  over a green ~386-test baseline (Rust 294, bash install 41, bash convert 12,
  python 39). 1 tautological test flagged. Two systemic gaps: (1) no behavioral
  JS test harness for ~70KB of board frontend logic (explicitly deferred during
  the shell-filters review) underlies 6 findings; (2) `bump-version.sh`'s
  lockstep projection — load-bearing for the freshness epic — has no test.
  Disposition: 5 bound to 0.9.0 (drain now, existing harnesses); JS-harness
  cluster (6 findings) + concurrency interleave → backlog (unbound).
  Bound (implementing):
  - `gate-tests-bump-version-lockstep` (critical) — bash test for the projection block
  - `gate-tests-work-board-shim-routing` (medium) — shim routing branches
  - `gate-tests-self-heal-version-probe-timeout` (medium) — version-probe timeout fail-open
  - `gate-tests-tmpdir-root-isolation` (low/integrity) — make find-root test $TMPDIR-invariant
  - `gate-tests-convert-content-integrity-guard` (low) — structural grep guard
  Backlog (unbound):
  - `gate-tests-board-js-harness` (feature) — harness + 6 deferred board-view suites
    (Critical XSS control verified SOUND during gate — test-only gap)
  - `gate-tests-hook-concurrency-interleave` (medium) — deterministic interleave test
- **gate-cruft** (2026-05-31) — 3 findings (3 high, 0 medium, 0 low), near-clean
  as expected. `cargo build` clean; clippy exit 0 (2 cosmetic style lints, NOT
  debris); python unittest 39 pass + AST unused check clean; bash read manually
  (shellcheck/ruff/vulture unavailable). All 3 are one coherent dead-board-view
  scaffolding removal, consolidated into a single surgical cleanup story:
  - `gate-cruft-dead-board-view-scaffolding` (high, implementing) — drop
    `placeholderView`, dead `registeredViews()` export, and orphaned `.view-preview` CSS
- **gate-docs** (2026-05-31) — 7 findings (6 high, 1 medium). Board API JSON
  shape, server flags/port/loopback guard, `--version` lockstep+parity, shim
  behavior, and `.agents/rules/` injection contract all verified ACCURATE
  (several items had already rolled docs forward). Remaining drift in 3 items:
  - `gate-docs-spec-kanban-column-model` (high, implementing) — SPEC stage→column
    mapping describes a fixed 5-column collapse; board uses raw-stage columns + parent swimlanes
  - `gate-docs-pattern-line-refs` (high, implementing) — 5 pattern skills cite
    drifted `file:line` examples (board work shifted positions in integration.rs/actionable.rs)
  - `gate-docs-spec-plugin-layout-work-view` (medium, drafting) — SPEC source-layout
    tree omits the `work-view/` crate tree
- **gate-patterns** (2026-05-31) — 4 new patterns extracted (3+ occurrences each),
  0 inconsistencies. First emission of `.agents/rules/patterns.md` in this repo
  (exercises the new patterns-digest capability shipping in 0.9.0). Tracking item
  `gate-patterns-0.9.0` at stage:done (the gate's deliverable IS the pattern files).
  - `board-view-module-contract`, `dom-text-element-builder`,
    `fail-open-subprocess-probe`, `manual-error-display`
  - Index regenerated to 9 patterns; digest src-sha256 stamped.
