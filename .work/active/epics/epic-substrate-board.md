---
id: epic-substrate-board
kind: epic
stage: done
tags: [tooling]
parent: null
depends_on: [epic-substrate-cli]
release_binding: null
gate_origin: null
created: 2026-05-30
updated: 2026-05-31
---

# Substrate Board — interactive human surface over `.work/`

## Brief

Supersede the static-HTML `work-board` (a bash script that emits a one-shot page)
with an **interactive** web board served by the same compiled binary from
`epic-substrate-cli`, reusing its `.work/` query core. This is the human-facing
surface: where the agent CLI optimizes for parseable terseness, the board
optimizes for human cognition — seeing the whole substrate at a glance and
steering by it.

Scope is the rich exploration surface the current board lacks: an interactive
**kanban** by stage, a **dependency view** that makes `depends_on` chains and
blockers visible, a **table view** with sortable/filterable columns, **better
rendering of item card bodies** (the markdown body, not just frontmatter),
automatic **hiding of released/archived items** so active work stays in focus,
and **filter knobs** (by tag, kind, parent, stage, release) that compose the way
the CLI's flags do. It reads the same substrate the CLI reads — one source of
truth, two adapters.

This epic depends on `epic-substrate-cli` because the shared query core and the
binary host are delivered there. It does NOT cover the agent CLI or the core
itself.

## Foundation references

- `docs/ARCHITECTURE.md` — "The substrate-access model" (the human-surface half).
- `docs/VISION.md` — the dogfooding thesis: the board's first real dataset is the
  set of items describing its own construction.
- `plugins/agile-workflow/docs/ARCHITECTURE.md` — current board behavior and the
  `work-board` script + template it replaces.

## Design decisions
- **UI gating** — UI-bearing features under this epic are gated on a full
  `ux-ui-design` pass before implementation: `palette → components → motion →
  screens → flows` (ux-ui-principles dependency order). `adopt` is N/A (net-new
  surface); `ux-ui-principles` is the always-on reference, not a step. Mocks are
  deferred for now — run the pass at this epic's `epic-design` (or
  `epic-design --only-questions`) before its UI features implement.
- **Data freshness — live local server** (epic-design 2026-05-31): the board
  runs as a live local server off the `work-view` binary and re-reads `.work/`
  on refresh, not a one-shot static snapshot. A steering surface must not go
  stale the moment the agent edits an item. Shapes `epic-substrate-board-host`.
- **Mutation — read-only this epic** (epic-design 2026-05-31): the board is
  view/filter/explore only. Write-back (drag-to-restage, inline edit) is a
  future epic — kept out to avoid concurrent-edit collisions with the agent and
  the `updated:` auto-bump hook, and to hold this epic to its six listed view
  capabilities. Every child is designed as read-only.
- **Frontend tech — vanilla HTML/CSS/JS, no build** (epic-design 2026-05-31):
  hand-written assets served/embedded by the binary, no framework or bundler.
  Preserves the single-static-binary distribution from `epic-substrate-cli`
  (musl-static, `opt-level=z`, bash fallback) and matches the single-file format
  the `ux-ui-design` mocks produce. Constrains the dependency view away from a
  heavy graph-layout library (see `epic-substrate-board-dependency`).
- **ux-ui pass timing — dedicated session after decomposition** (epic-design
  2026-05-31): the full `palette → components → motion → screens → flows`
  pipeline runs in a dedicated session against the now-created feature ids
  (`epic-substrate-board-{shell,kanban,dependency,table}`), before those UI
  features implement. This epic-design pass stays focused on structure. The UI
  gate from the first decision still holds — mocks land before implementation.

## Decomposition

Split into one backend foundation, one shared frontend foundation, and three
parallel views — capability shapes, not layers. The pure "split by layer" trap
(backend / API / UI as three sibling features) is avoided: the **host** is a
genuine independent deliverable (the data feed + live server the whole surface
needs), and the **shell** is the shared substrate-presentation layer (item-card,
markdown body, filters, auto-hide) that exists so the three views don't each
re-invent it. The two provisional capabilities that were really cross-cutting
properties — **card-body rendering** and **filters + auto-hide** — fold into the
shell rather than standing as thin features. With the shell carrying the shared
card + filter-state store, the three views (**kanban**, **dependency**, **table**)
are genuinely independent and parallelize after it.

Critical path: `host → shell → {any view}`. The three views fan out in parallel
once the shell lands.

### Child features

- `epic-substrate-board-host` — backend: a `board`/`serve` entry on the
  `work-view` binary, a live local HTTP server + JSON substrate-feed over
  `work-view-core`, static-asset serving, root detection, browser-open, and
  retiring the legacy `work-board.sh`. Read-only. — depends on: `[]`
- `epic-substrate-board-shell` — shared frontend foundation: app frame +
  view-switcher, the shared item-card, markdown body rendering, the composable
  global filter bar (tag/kind/parent/stage/release), auto-hide of
  released/archived, and the client-side filter-state store the views read.
  Home of the ux-ui "components" tier. — depends on: `[epic-substrate-board-host]`
- `epic-substrate-board-kanban` — kanban view: columns by stage, shell cards in
  columns. — depends on: `[epic-substrate-board-shell]`
- `epic-substrate-board-dependency` — dependency view: `depends_on` chains,
  blockers, and what each item unblocks, over `work-view-core::graph`. Carries
  an open list/tree-vs-graph-canvas choice constrained by the no-build decision.
  — depends on: `[epic-substrate-board-shell]`
- `epic-substrate-board-table` — table view: sortable columns + per-column
  filtering layered on the shell's global filter set. — depends on:
  `[epic-substrate-board-shell]`

### Decomposition risks

- **The shell is the critical-path hinge.** All three views and the
  card/filter/auto-hide capabilities sit behind it; if its filter-state store
  contract or card API is wrong, all three views churn. Mitigation:
  feature-design the shell first and pin the filter-state shape + card contract
  as the explicit interface the views consume before any view is designed.
- **Host/shell ownership of the frontend entry.** To avoid a tug-of-war over
  `index.html`, host owns zero real UI — it serves whatever asset bundle the
  shell produces (plus a stub entry just to prove the feed end-to-end); the
  shell owns all human-visible frontend. feature-design should encode this split.
- **The dependency view could pull a heavy graph-layout library**, which fights
  the vanilla/no-build decision. Constrain it to the core's adjacency rendered
  with hand-rolled DOM/SVG (list/tree first); a graph canvas is a later
  enhancement, not in-scope assumption.
- **Live-server staleness while the agent writes.** The feed re-reads a substrate
  the agent may be mid-write on; a half-written file can fail to parse. Read-only
  removes write-collisions, and the core's `LoadReport`/`Diagnostic` already
  degrades per-item gracefully — the host must surface diagnostics, not crash.

## Mockups

Design system locked via `/ux-ui-design:palette` (2026-05-31). Style:
**data-dense terminal**. Delivered as a **multi-theme system**, not a single
palette:

- **Tokens**: `.mockups/design-system/tokens.css` — base (type/space/radius) +
  **six swappable accent themes** (`teal` default, `amber`, `violet`, `azure`,
  `lime`, `candy`) selected via `[data-accent]` on `<html>`, each fully
  designed in light **and** dark. Mode **follows system preference** by default
  with an explicit `[data-theme="light"|"dark"]` override (wins over the media
  query). `candy` is a multi-color theme (hot-pink primary + rainbow kind
  chips); the other five share categorical `--kind-*` / `--status-*` palettes.
  Every accent × mode pairing is WCAG AA verified (text, muted, on-accent,
  link). Type: **Geist + Geist Mono**.
- **Theme selector is a shipped board control**: the board sets `data-accent` +
  `data-theme` and persists them (localStorage, mirrored to board config). The
  shell feature owns the selector UI + persistence; the host serves `tokens.css`.
- **Interactive preview**: `.mockups/design-system/palette.html` — live accent
  dropdown + Sys/Light/Dark toggle over a realistic board, reading `tokens.css`.
- **Typography preview**: `.mockups/design-system/typography.html` (Geist, locked).
- **Components** (locked 2026-05-31): `.mockups/design-system/components.css` +
  `components.html` showcase. Token-only (themes across all 6 accents × modes
  automatically). Covers: `.btn` (primary/ghost), `.input`/`.input-search`,
  `.select`, `.tabs` (view-switcher), `.seg` (mode toggle), `.filter-bar`/
  `.filter-chip`, `.toggle` (auto-hide), `.theme-picker` (composite shipped
  control), `.chip` (kind, outline ×5), `.badge` (status ×3), `.count`,
  `.table`, `.alert` (diagnostics), `.empty`, `.spinner`, and the project-unique
  `.item-card` (variants + states, rendered md body), `.kanban-col-head`,
  `.dep-node` (dependency edges), `.detail-drawer` (read-only item detail).
  Screens/flows link both `tokens.css` and `components.css`.
- **Motion** (locked 2026-05-31): `.mockups/design-system/motion.css` +
  `motion.html` showcase. Attitude **restrained + productive**; token-only,
  compositor-cheap (transform/opacity only). Named easings (`--motion-standard`
  / `-productive` / `-emphasized` / `-linear`; overshoot deliberately omitted),
  Doherty-coupled durations (`--dur-instant` 100 / `--dur-theme` 140 /
  `--dur-quick` 180 input-gating, `--dur-ambient` 600 background-only),
  `--hold-beat` 120ms (drawer→focus). Board motions: theme crossfade
  (no layout shift), card hover/selected, filter reflow (capped stagger),
  view-switch crossfade, detail-drawer slide, feed spinner. No springs
  (read-only, no gestures). **prefers-reduced-motion required** (transforms cut,
  opacity/color kept). Screens/flows link `motion.css` as the third stylesheet.
- Explored and set aside (recoverable from git history): neubrutalist
  (highlighter / risograph / acid), Swiss/typographic, cassette futurism,
  editorial, vaporwave, aurora glass; and the single-lock terminal-teal /
  IBM Plex iteration that preceded the multi-theme system.

- **Screens** (locked 2026-05-31), one per UI view, each recorded on its feature:
  - `epic-substrate-board-kanban` → **hybrid** (left rail + epic swimlanes) +
    size-detected item-detail surface.
  - `epic-substrate-board-dependency` → **graph canvas** (hand-rolled SVG, no
    lib) — resolved the epic's open list/tree-vs-graph choice.
  - `epic-substrate-board-table` → **flat sortable grid** (sort + per-column
    free-text filter row + global filter chips).
- **Flow** (locked 2026-05-31): `.mockups/flows/board-views/` — hub-and-spoke
  cross-view journey. Three peer pages (Kanban / Dependency / Table) sharing the
  view-switcher as nav; **theme + filter state persist across the switch**
  (localStorage, via shared `board-state.js`); the **size-detected item-detail
  overlay** opens from any view. Index navigator visualizes the topology. This is
  the connective behavior the `shell` feature owns.

**ux-ui gate SATISFIED** (palette ✓ · components ✓ · motion ✓ · screens ✓ ·
flows ✓). The epic's UI features (`shell`, `kanban`, `dependency`, `table`) are
unblocked to implement against the locked design system + mocks; `-host` has no
UI surface.

## Foundation docs to roll forward

When this epic ships:

- `plugins/agile-workflow/docs/ARCHITECTURE.md` — replace the static `work-board`
  description with the interactive board served by the binary.
- `docs/ARCHITECTURE.md` (this repo) — the human-surface half of the
  substrate-access model (no longer "static HTML").
- The `agile-workflow:board` skill — update to launch/point at the interactive
  board rather than generating a one-shot page.

<!-- The design pass on each child feature will fill in real specifics. -->

## Completion Summary

- Delivered `work-view board` / `work-view serve` as the live localhost board
  host with `/healthz`, `/api/substrate`, embedded assets, loopback Host header
  hardening, busy-port scanning, and browser-open handling.
- Replaced the static board generator path with a compatibility
  `work-board.sh` shim that delegates to `.work/bin/work-view board`.
- Added the user-invocable `agile-workflow:board` skill and removed the legacy
  Claude `/board` command file from `plugins/agile-workflow/commands/`.
- Delivered the shared board shell: app frame, view switching, filter state,
  auto-hide for terminal work, safe markdown rendering, shared cards, shared
  detail surface, diagnostics, theme/accent controls, and static asset checks.
- Delivered the three board views: kanban stage grid with epic swimlanes,
  dependency graph with trace/collapse controls, and sortable/filterable table.
- Rolled forward current docs so `plugins/agile-workflow/docs/SPEC.md`,
  `plugins/agile-workflow/docs/ARCHITECTURE.md`, `docs/ARCHITECTURE.md`, and
  `plugins/agile-workflow/CHANGELOG.md` describe the live `work-view board`
  surface.
- Final verification passed: `TMPDIR=/home/nathan/.cache/silas/tmp cargo test
  -p work-view-cli`, `TMPDIR=/home/nathan/.cache/silas/tmp cargo build
  --release -p work-view-cli`, and release binary size `697680` bytes.

## Peer Review Notes

- Opus design advisory was used during view design and accepted where it matched
  local judgment: stage ordering comes from shared filter options, view-local
  state stays module-scoped, and the three views reuse shell cards/filters/detail
  instead of reimplementing them. A suggested extra shared prep story was
  rejected because the registration stories already sequenced that integration.
- Scoped Opus implementation/review attempts during the work stalled without
  output or worktree changes, so those item reviews used local audit instead.
- Final Opus checkpoint on 2026-05-31 was invoked through peeragent with
  `--agent claude --model opus --effort xhigh` and recursion disabled. It
  timed out after five minutes with no output, so there were no peer findings to
  accept or reject. Local final audit confirmed the legacy `/board` command file
  is absent, child features are done, docs are current, and only the unrelated
  `.mockups/design-system/components.css` worktree change remains dirty.
- A continuation retry of the final Opus checkpoint on 2026-05-31 succeeded
  with the same `opus`/`xhigh` peeragent route and no recursive delegation. It
  found no blocking completion issue. Accepted finding: add the missing v0.8.8
  changelog entry. Rejected/deferrable findings: the tracked `.work/bin/work-view`
  remains the documented bash entrypoint while board-capable prebuilts are CI
  generated, and the reported `collapsible_if` is cosmetic.
