---
id: epic-substrate-board-host-server
kind: story
stage: done
tags: [tooling]
parent: epic-substrate-board-host
depends_on: [epic-substrate-board-host-subcommand]
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Board host localhost server

Implements Unit 2 of `epic-substrate-board-host`.

## Scope

Add the local HTTP server behind `work-view board`, with localhost-only binding,
port selection, route dispatch, and panic-safe request handling.

## Work

- Add the minimal synchronous HTTP dependency chosen during implementation plus
  any required direct dependency declarations in
  `plugins/agile-workflow/work-view/crates/cli/Cargo.toml`.
- Implement `board::server` with `127.0.0.1:<port>` binding, upward port scan
  from the requested port, route dispatch, and `--once` test mode.
- Provide routes for `/healthz`, `/`, `/index.html`, `/api/substrate`, and
  embedded asset paths. Feed/assets can return placeholders until their stories
  land, but route status and content-type behavior should be stable.
- Avoid `unwrap`, indexing, and panic-prone request parsing. Under the release
  profile, `panic = "abort"` terminates the process.

## Acceptance Criteria

- [x] Server binds to `127.0.0.1`, never `0.0.0.0`.
- [x] `GET /healthz` returns 200.
- [x] Unknown route returns 404.
- [x] Busy default port scans upward and prints the actual bound URL.
- [x] Existing cargo tests pass.
- [x] Release-size impact is recorded in implementation notes and the binary
      still has room under the CI size guard.

## Implementation notes

- Files changed:
  - `plugins/agile-workflow/work-view/crates/cli/src/board/mod.rs`
  - `plugins/agile-workflow/work-view/crates/cli/src/board/server.rs`
  - `plugins/agile-workflow/work-view/crates/cli/tests/integration.rs`
- Tests added:
  - `board_healthz_binds_localhost_and_exits_after_once`
  - `board_unknown_route_returns_404`
  - `board_busy_default_port_scans_upward_and_prints_bound_url`
  - `board_busy_requested_port_scans_upward_and_prints_bound_url`
- Discrepancies from design:
  - Used a std-only `TcpListener` GET/HEAD server instead of adding a tiny HTTP
    crate, because the required route contract is small and this avoids
    dependency and `Cargo.lock` churn.
  - `/`, `/index.html`, `/assets/board.css`, `/assets/board.js`, and
    `/api/substrate` return stable placeholders until the shell/assets/feed
    stories land.
  - Browser opening remains unimplemented in this story; the command prints the
    bound URL and honors `--once`/`--port`/substrate detection.
- Adjacent issues parked: none.
- Verification:
  - `cargo test -p work-view-cli` initially failed because `/tmp` was full
    (`No space left on device`) while tempdir-based unit tests were creating
    fixtures.
  - `TMPDIR=/home/nathan/.cache/silas/tmp cargo test -p work-view-cli` passed:
    89 unit tests and 86 integration tests.
  - `TMPDIR=/home/nathan/.cache/silas/tmp cargo build --release -p work-view-cli`
    passed.
  - Release binary size: 495,256 bytes at
    `/home/nathan/.cache/silas/target/release/work-view`, under the 8,388,608
    byte CI guard.

## Review (2026-05-31)

**Verdict**: Approve

**Blockers**: none
**Important**: none
**Nits**: none

**Notes**: Fast-lane story review under autopilot. Implementation notes recorded
green scoped verification with `TMPDIR=/home/nathan/.cache/silas/tmp cargo test
-p work-view-cli`; host reran the same command successfully. Host also reran
`TMPDIR=/home/nathan/.cache/silas/tmp cargo build --release -p work-view-cli`
and confirmed the release binary size remained 495,256 bytes, below the
8,388,608 byte CI guard.
