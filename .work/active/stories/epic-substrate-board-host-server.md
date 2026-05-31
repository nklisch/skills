---
id: epic-substrate-board-host-server
kind: story
stage: implementing
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

- [ ] Server binds to `127.0.0.1`, never `0.0.0.0`.
- [ ] `GET /healthz` returns 200.
- [ ] Unknown route returns 404.
- [ ] Busy default port scans upward and prints the actual bound URL.
- [ ] Existing cargo tests pass.
- [ ] Release-size impact is recorded in implementation notes and the binary
      still has room under the CI size guard.

