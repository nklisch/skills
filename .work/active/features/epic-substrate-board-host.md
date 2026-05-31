---
id: epic-substrate-board-host
kind: feature
stage: done
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

## Other agent review

Opus xhigh reviewed the host design space during this autopilot pass. Useful
accepted points:
- Keep the board as a `work-view board` subcommand so distribution stays one
  installed binary and the host can reuse CLI-crate actionability logic.
- Treat `panic = "abort"` as a server-design constraint: request handlers must
  be total and return HTTP errors instead of relying on panic recovery.
- Serialize through adapter DTOs instead of deriving wire contracts directly on
  `work_view_core::model::Item`.
- Bind only to `127.0.0.1`; the feed exposes item bodies and paths.
- Exclude absolute `path` and `raw_text` from the feed; use `rel_path` and
  structured fields instead.

Points adjusted by host judgment and user direction:
- Opus said the existing slash command effectively was the "board skill". The
  user clarified that a cross-vendor `plugins/agile-workflow/skills/board/`
  skill should exist. This feature therefore creates that skill and deletes the
  Claude-only `/agile-workflow:board` command as legacy instead of rewriting it.
- Opus was neutral on delete-vs-shim for `work-board.sh`. This design keeps a
  thin compatibility shim rather than deleting the script in the first host
  feature, because old cached command copies and direct script callers may still
  exist; the shim exits with an actionable message when only the bash fallback is
  installed. The static template can be deleted.

## Design decisions

- **Entry shape**: `work-view board` is the primary entry; `work-view serve` is
  an alias. A sibling binary would double the dist artifact and installer
  surface for no useful separation.
- **HTTP implementation**: use a tiny synchronous HTTP dependency plus
  `serde_json`, not an async stack. The implementation must verify the exact
  crate API and the CI size guard at implementation time. If the dependency
  threatens the 8 MB artifact budget, fall back to a small `std::net` GET-only
  server with the same route contract.
- **Security boundary**: bind only to `127.0.0.1` by default. Do not expose
  board content on `0.0.0.0`; item bodies may contain project-private context.
- **Feed shape**: serve one whole-substrate snapshot from `GET /api/substrate`
  and let the shell filter client-side. The shell's global filter-state store
  remains the single frontend source of truth.
- **Partial load failures**: malformed or half-written item files are HTTP 200
  diagnostics, not server failures. Only root discovery, bind, and root-level
  substrate I/O failures are process errors.
- **Ready/blocked parity**: the feed reuses the same active-tier
  drafting/implementing/review actionability semantics as `work-view --ready`
  and `--blocked`; do not copy the legacy `work-board.sh` implementing-only
  rule.
- **Asset strategy**: embed a stub asset set with `include_str!`/`include_bytes!`
  so the installed binary is self-contained. The shell later owns the real
  shipped assets in the same embed directory.
- **Fonts**: no CDN in shipped assets. The host stub uses system fallback fonts;
  the shell can either self-host Geist/Geist Mono `.woff2` files in the embedded
  assets or intentionally degrade to the system stack.
- **Human invocation surface**: create `plugins/agile-workflow/skills/board/SKILL.md`
  as the cross-vendor user-invocable surface. Remove
  `plugins/agile-workflow/commands/board.md` entirely as legacy Claude-only
  surface.

## Architectural choice

Three entry approaches were considered:

1. **Subcommand on the existing binary (chosen).** Add `work-view board` and
   `work-view serve` dispatch before the current query parser. This preserves
   the one-file install contract, keeps `dist/<triple>/work-view` unchanged, and
   lets the board adapter reuse the CLI crate's actionability code.
2. **Sibling binary in the workspace.** Rejected because it adds another
   platform matrix artifact, another installer decision, another versioned
   binary, and would force hoisting actionability logic before the host can share
   it.
3. **Keep the bash static generator.** Rejected for the primary board because it
   cannot live-refresh and already duplicates parsing and dependency logic the
   Rust core owns. It remains only as a compatibility shim.

The chosen module shape keeps Ports & Adapters clear:

```text
plugins/agile-workflow/work-view/crates/cli/src/
  main.rs              # verb split: board/serve vs existing query mode
  args.rs              # existing query parser unchanged for non-board invocations
  actionable.rs        # exposes crate-local actionability helpers for the feed
  board/
    mod.rs             # BoardOptions, run_board()
    server.rs          # localhost HTTP accept loop + route dispatch
    feed.rs            # FeedSnapshot DTO assembly from work_view_core
    assets.rs          # embedded route table + MIME map
    open.rs            # xdg-open/open/wslview launcher
```

## Implementation Units

### Unit 1: Board subcommand dispatch and options
**Files**:
- `plugins/agile-workflow/work-view/crates/cli/src/main.rs`
- `plugins/agile-workflow/work-view/crates/cli/src/board/mod.rs`
- `plugins/agile-workflow/work-view/crates/cli/tests/integration.rs`
**Story**: `epic-substrate-board-host-subcommand`

```rust
pub(crate) struct BoardOptions {
    pub port: u16,
    pub no_open: bool,
    pub once: bool,
}

pub(crate) enum BoardParseOutcome {
    Help,
    Run(BoardOptions),
}

pub(crate) fn parse_board_args<I: Iterator<Item = String>>(
    args: I,
) -> Result<BoardParseOutcome, UsageError>;

pub(crate) fn run_board(opts: BoardOptions) -> u8;
```

**Implementation Notes**:
- In `main.rs`, collect `env::args().skip(1)` once. If the first token is
  `board` or `serve`, call `board::parse_board_args` on the remaining args and
  dispatch to `board::run_board`.
- Preserve the current query path byte-for-byte for all non-board invocations.
- Board flags: `--port <n>` default `8181`, `--no-open`, `--print` alias for
  `--no-open`, `--once` test mode that serves one request then returns.

**Acceptance Criteria**:
- [x] `work-view board --help` and `work-view serve --help` print board help and
      exit 0.
- [x] Existing `work-view --help`, query filters, output modes, and exit codes
      remain unchanged.
- [x] Unknown board flags return usage error exit 1.
- [x] `--once` is test-only-visible help text or documented as internal, and is
      used only by integration tests.

### Unit 2: Localhost HTTP server
**Files**:
- `plugins/agile-workflow/work-view/crates/cli/Cargo.toml`
- `plugins/agile-workflow/work-view/crates/cli/src/board/server.rs`
- `plugins/agile-workflow/work-view/crates/cli/src/board/mod.rs`
- `plugins/agile-workflow/work-view/crates/cli/tests/integration.rs`
**Story**: `epic-substrate-board-host-server`

```rust
pub(crate) struct BoundBoard {
    pub url: String,
    pub port: u16,
}

pub(crate) fn serve_board(
    root: std::path::PathBuf,
    opts: BoardOptions,
) -> Result<BoundBoard, BoardServerError>;
```

**Implementation Notes**:
- Bind `127.0.0.1:<port>`, scanning upward from the requested port if busy.
- Route only `GET` and `HEAD` for `/`, `/index.html`, `/healthz`,
  `/api/substrate`, and embedded asset paths.
- Every request path must be handled without `unwrap`, indexing, or panic-prone
  assumptions. Under `panic = "abort"`, a panic terminates the process.
- Map bad requests to 400, missing assets to 404, and internal I/O failures to
  500 while keeping the server alive where possible.

**Acceptance Criteria**:
- [x] Server binds to `127.0.0.1`, never `0.0.0.0`.
- [x] `GET /healthz` returns 200.
- [x] Unknown route returns 404.
- [x] Busy default port scans upward and prints the actual bound URL.
- [x] Existing cargo tests pass; first implementation run records binary-size
      impact and confirms the CI size guard still has room.

### Unit 3: Live substrate JSON feed
**Files**:
- `plugins/agile-workflow/work-view/crates/cli/Cargo.toml`
- `plugins/agile-workflow/work-view/crates/cli/src/actionable.rs`
- `plugins/agile-workflow/work-view/crates/cli/src/board/feed.rs`
- `plugins/agile-workflow/work-view/crates/cli/src/board/server.rs`
- `plugins/agile-workflow/work-view/crates/cli/tests/integration.rs`
**Story**: `epic-substrate-board-host-feed`

```rust
#[derive(serde::Serialize)]
pub(crate) struct FeedSnapshot {
    pub work_view_version: &'static str,
    pub project: String,
    pub root_rel: String,
    pub items: Vec<FeedItem>,
    pub diagnostics: FeedDiagnostics,
}

#[derive(serde::Serialize)]
pub(crate) struct FeedItem {
    pub id: String,
    pub kind: Option<String>,
    pub stage: Option<String>,
    pub tags: Vec<String>,
    pub parent: Option<String>,
    pub depends_on: Vec<String>,
    pub release_binding: Option<String>,
    pub gate_origin: Option<String>,
    pub created: Option<String>,
    pub updated: Option<String>,
    pub tier: String,
    pub rel_path: String,
    pub body: String,
    pub is_terminal: bool,
    pub ready: bool,
    pub blocked: bool,
    pub unmet_deps: Vec<String>,
    pub dependents: Vec<String>,
    pub children: Vec<String>,
}

pub(crate) fn build_feed(root: &std::path::Path) -> Result<String, FeedError>;
```

**Implementation Notes**:
- Add `serde_json` to the CLI crate. Keep `work_view_core` wire-agnostic; no
  `Serialize` derive is required on `Item`.
- Make actionability helpers crate-visible or add a small crate-visible helper
  returning ready/blocked booleans from `Substrate` + `Item`.
- Re-load `Substrate::load(root)` on every feed request.
- Include `LoadReport.parse_errors`, `validation_warnings`, and
  `duplicate_ids` as structured diagnostics with relative paths.
- Do not serialize absolute `path` or `raw_text`.

**Acceptance Criteria**:
- [x] `GET /api/substrate` returns 200 JSON with items, diagnostics, and
      `work_view_version`.
- [x] A malformed item file appears in `diagnostics.parse_errors` while valid
      siblings remain in `items`.
- [x] Feed ready/blocked ids match `work-view --ready` and `work-view --blocked`
      over the same fixture.
- [x] Feed includes `body`, `rel_path`, `tier`, `unmet_deps`, `dependents`, and
      `children`.
- [x] Feed excludes absolute `path` and `raw_text`.

### Unit 4: Embedded assets and stub board
**Files**:
- `plugins/agile-workflow/work-view/crates/cli/src/board/assets.rs`
- `plugins/agile-workflow/work-view/crates/cli/src/board/assets/index.html`
- `plugins/agile-workflow/work-view/crates/cli/src/board/assets/board.css`
- `plugins/agile-workflow/work-view/crates/cli/src/board/assets/board.js`
- `plugins/agile-workflow/work-view/crates/cli/tests/integration.rs`
**Story**: `epic-substrate-board-host-assets`

```rust
pub(crate) struct Asset {
    pub bytes: &'static [u8],
    pub content_type: &'static str,
}

pub(crate) fn asset_for_path(path: &str) -> Option<Asset>;
```

**Implementation Notes**:
- The host stub is intentionally minimal: load `/api/substrate`, show project
  name, item counts, and diagnostic count. The shell feature replaces this with
  the locked design-system implementation.
- Keep shipped assets local and embedded. No CDN. If fonts are introduced later,
  include `.woff2` MIME support.
- Optional development convenience may serve from `WORK_VIEW_ASSET_DIR`, but the
  release path must be embedded.

**Acceptance Criteria**:
- [x] `GET /` and `GET /index.html` return the embedded stub HTML.
- [x] CSS and JS routes return correct content types.
- [x] The stub fetches `/api/substrate` and renders a visible count without a
      build step.
- [x] Copying only the compiled `work-view` binary to `.work/bin/` is enough for
      the stub board to load.

### Unit 5: Human surface, board skill, and legacy retirement
**Files**:
- `plugins/agile-workflow/skills/board/SKILL.md`
- `plugins/agile-workflow/commands/board.md` (delete)
- `plugins/agile-workflow/scripts/work-board.sh`
- `plugins/agile-workflow/scripts/work-board.template.html` (delete)
- `plugins/agile-workflow/README.md`
- `plugins/agile-workflow/docs/SPEC.md`
- `plugins/agile-workflow/docs/ARCHITECTURE.md`
- `docs/ARCHITECTURE.md`
**Story**: `epic-substrate-board-host-surface`

```markdown
---
name: board
description: >
  Launch the agile-workflow interactive board over the current project's
  .work/ substrate. Use when the user asks to open, serve, view, inspect, or
  browse the substrate board in a browser. Runs the installed work-view binary's
  board subcommand and reports the local URL.
user-invocable: true
allowed-tools: Bash
---
```

**Implementation Notes**:
- The new cross-vendor skill is the primary surface. It resolves `.work/bin/work-view`
  from the current substrate and runs `work-view board "$ARGUMENTS"`.
- Delete the Claude-only command file; do not keep two user-facing board
  surfaces in this plugin.
- Replace `work-board.sh` with a small shim or remove it after checking direct
  references. Chosen path: thin shim for one release window, because external
  cached command copies may still call it. The shim must not generate static
  HTML; it should exec `.work/bin/work-view board` when available and otherwise
  print an actionable "compiled work-view required for the board" message.
- Delete `work-board.template.html`; the static generator is retired.
- Roll foundation docs forward in place. No "legacy" prose in foundation docs;
  git history carries the old static-board behavior.

**Acceptance Criteria**:
- [x] `plugins/agile-workflow/skills/board/SKILL.md` exists and launches the
      live board.
- [x] `plugins/agile-workflow/commands/board.md` is removed.
- [x] `work-board.template.html` is removed.
- [x] `work-board.sh` no longer renders static HTML; it only shims or reports
      the compiled-board requirement.
- [x] README and foundation docs describe the live local board, not a one-shot
      generated page.
- [x] Headless use prints the URL; desktop use attempts browser open after the
      server binds.

## Implementation Order

1. `epic-substrate-board-host-subcommand`
2. `epic-substrate-board-host-server`
3. `epic-substrate-board-host-feed`
4. `epic-substrate-board-host-assets`
5. `epic-substrate-board-host-surface`

## Testing

### Unit Tests
- `board::parse_board_args` covers help, aliases, missing port values, unknown
  flags, and `--no-open` / `--print` equivalence.
- `board::assets::asset_for_path` covers `/`, `/index.html`, MIME mapping, and
  missing assets.
- Feed DTO tests cover tier string mapping, absence of absolute paths, and
  actionability booleans.

### Integration Tests
- Spawn `work-view board --once --no-open --port <test-port>` against fixture
  substrates and fetch `/healthz`, `/`, and `/api/substrate`.
- Verify malformed-item fixtures return HTTP 200 with diagnostics.
- Compare feed ready/blocked ids against CLI `--ready` / `--blocked` output.
- Verify no-substrate exits 2 before binding.

### Manual Verification
- Run the board in this repo and open the printed localhost URL.
- Confirm refresh sees a changed `.work/` item without restarting the server.
- Confirm the binary still fits the existing dist size guard after new deps.

## Implementation Summary

All five child stories reached `done`:

- `epic-substrate-board-host-subcommand` added `work-view board` / `serve`
  dispatch while preserving existing query behavior.
- `epic-substrate-board-host-server` added the localhost HTTP server, port
  scanning, health route, and non-panicking request handling.
- `epic-substrate-board-host-feed` added `GET /api/substrate` from
  `Substrate::load`, including diagnostics and dependency graph fields without
  absolute paths or raw frontmatter text.
- `epic-substrate-board-host-assets` embedded no-build HTML/CSS/JS stub assets
  into the binary.
- `epic-substrate-board-host-surface` added the cross-vendor board skill,
  removed the Claude-only `/board` command and static template, replaced
  `work-board.sh` with a shim, added post-bind browser launching, and rolled
  docs forward.

Verification:
- `TMPDIR=/home/nathan/.cache/silas/tmp cargo test -p work-view-cli`
- `TMPDIR=/home/nathan/.cache/silas/tmp cargo build --release -p work-view-cli`
- Release binary size: 568,400 bytes.
- `bash -n plugins/agile-workflow/scripts/work-board.sh`

## Peer Review

Claude Opus xhigh reviewed the host feature after implementation. Accepted and
fixed findings:

- Added loopback `Host` validation for all board HTTP requests to close the
  DNS-rebinding privacy gap against `/api/substrate`.
- Added tests for non-loopback Host rejection, missing Host rejection, HEAD
  responses without bodies, and unsupported methods returning `405` with
  `Allow: GET, HEAD`.
- Added top-level `work-view --help` discovery for the `board` / `serve`
  subcommands.
- Updated the blocked kanban feature's foundation references so it no longer
  points at the deleted `work-board.template.html`.
- Cleaned up two low-risk nits: `handle_connection` now takes `&Path`, and the
  browser opener child process is waited in a background thread.

Rejected or deferred peer points:

- IPv6 bind support remains out of scope for this feature because the served
  URL is intentionally `127.0.0.1` and the design only committed to localhost
  IPv4 binding.
- The single-threaded server and whole-substrate reserialization remain accepted
  tradeoffs for a first local-only board host; performance work can be scoped
  after real project-size usage exposes a bottleneck.

## Review Result

Approved after three Claude Opus xhigh peer-review passes.

- Pass 1 found the Host-header/DNS-rebinding gap and an orphaned kanban
  reference. Both were fixed, with additional HEAD/405 coverage and top-level
  help discovery.
- Pass 2 confirmed the accepted fixes were correct and left only non-blocking
  nits.
- Pass 3 found no remaining substantive blocker, no lying docs, and no unmet
  acceptance criteria.

## Risks

- **Handler panic under `panic = "abort"`**: any panic aborts the server. Keep
  route parsing and DTO assembly total and covered by malformed-input tests.
- **Binary-size regression**: the first implementation with HTTP/JSON deps must
  measure release size and keep the CI guard green.
- **Surface drift**: `--ready` and the board feed must agree on actionability.
  Test parity directly.
- **Legacy callers**: deleting the slash command is intentional, but old cached
  command copies may call `work-board.sh`; keep the shim actionable for one
  release window.
