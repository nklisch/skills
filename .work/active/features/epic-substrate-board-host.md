---
id: epic-substrate-board-host
kind: feature
stage: drafting
tags: [tooling]
parent: epic-substrate-board
depends_on: []
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Board host — serve the interactive board off the `work-view` binary

## Brief

Deliver the backend half of the board: a way to launch a **live local server**
from the existing `work-view` binary that serves the substrate to a browser and
re-reads `.work/` on refresh. This is the foundation every view sits on — the
data pipe and delivery mechanism, with no real UI of its own.

Concretely this feature owns: a new entry point on the binary (a `board` /
`serve` subcommand, or a sibling binary in the same Cargo workspace — a
feature-design call), a small embedded HTTP server, a JSON substrate-feed
endpoint that serializes `work_view_core::model::Item`s plus the graph-derived
`ready` / `blocked` / `unmet_deps` signals and the `tier`/bucket, static-asset
serving for the frontend bundle, substrate-root detection (reuse
`work_view_core::index::find_substrate_root`), live re-read of `.work/` on each
feed request, and browser-open behavior. It also rewires the human entry points:
`commands/board.md` and the `agile-workflow:board` skill point at the live
server, and the legacy one-shot `work-board.sh` + `work-board.template.html`
(pure bash/awk static generator with a `python3 -m http.server` fallback) are
retired or reduced to a thin shim.

The board is **read-only this epic** (see Design decisions) — the host exposes
query endpoints only, never mutation. Because the feed re-reads a live substrate
that the agent may be writing concurrently, the host surfaces
`work_view_core::index::{LoadReport, Diagnostic}` for items that fail to parse
mid-write rather than crashing the server. This feature does NOT build the
kanban/dependency/table views or the shared card/filter chrome — it serves
whatever asset bundle the shell feature produces and exposes the data they
render.

## Epic context
- Parent epic: `epic-substrate-board`
- Position in epic: foundation feature — the data feed + delivery host every
  other child depends on. No intra-epic dependencies; the epic itself depends on
  `epic-substrate-cli`, which delivered the binary + core this reuses.

## Foundation references
- `docs/ARCHITECTURE.md` — "The substrate-access model": the human-surface half
  (one substrate, two adapters). This feature is the human adapter's host.
- `plugins/agile-workflow/docs/ARCHITECTURE.md` — current `work-board` behavior +
  the `work-board.sh` / template this supersedes.
- `plugins/agile-workflow/work-view/crates/core/src/{lib,index,model,graph}.rs` —
  the reused engine: `Substrate::load`, `find_substrate_root`, `Item` (carries
  `body`, `rel_path`, `tier`), `LoadReport`/`Diagnostic`, and the dependency
  graph. `Item.body`, `rel_path`, and `Tier`-as-bucket were built explicitly for
  this board.
- `plugins/agile-workflow/work-view/crates/cli/src/main.rs` — how the existing
  binary wires args → core → render, for the subcommand-vs-sibling-binary call.

## Mockups
<!-- Backend/host feature — no UI surface of its own. No mocks. -->
- N/A — host serves the asset bundle owned by `epic-substrate-board-shell`.

## Design decisions (inherited from parent epic)
- **Live local server** — re-reads `.work/` on refresh, not a one-shot snapshot.
- **Read-only this epic** — query endpoints only; no write-back to `.work/`.
- **Vanilla HTML/CSS/JS, no build** — host serves static assets / embeds them in
  the binary; no JS bundler in the release pipeline (keeps the single-static-
  binary distribution from `epic-substrate-cli`).

<!-- feature-design fills in: subcommand vs sibling binary, HTTP server choice
(std-only vs minimal crate, weighed against the musl-static / opt-level=z /
panic=abort release profile), the feed JSON schema, asset embedding strategy,
and the work-board.sh retirement/shim plan. -->
