---
id: epic-substrate-board-host-assets
kind: story
stage: done
tags: [tooling]
parent: epic-substrate-board-host
depends_on: [epic-substrate-board-host-server]
release_binding: 0.9.0
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Board host embedded assets and stub board

Implements Unit 4 of `epic-substrate-board-host`.

## Scope

Embed a minimal no-build board asset set into the `work-view` binary so the host
is self-contained before the shell feature replaces the stub with the locked UI
system.

## Work

- Add an embedded asset module with a route-to-bytes table and MIME map.
- Add stub `index.html`, CSS, and JS under the board asset directory.
- The stub should fetch `/api/substrate` and render visible project, item count,
  and diagnostic count output.
- Keep shipped assets local and embedded. No CDN. If fonts are introduced later,
  include `.woff2` MIME support.
- Optional development serving from `WORK_VIEW_ASSET_DIR` is allowed, but release
  behavior must use embedded assets.

## Acceptance Criteria

- [x] `GET /` and `GET /index.html` return embedded HTML.
- [x] CSS and JS routes return correct content types.
- [x] The stub fetches `/api/substrate` and renders a visible count without a
      build step.
- [x] Copying only the compiled `work-view` binary to `.work/bin/` is enough for
      the stub board to load.

## Implementation Notes

- Added `board::assets` with an embedded route table for `/`, `/index.html`,
  `/assets/board.css`, and `/assets/board.js`.
- Moved the placeholder HTML/CSS/JS out of `server.rs`; asset routes now resolve
  through `assets::asset_for_path`.
- Added no-build stub assets under `board/assets/`. The stub fetches
  `/api/substrate` and renders project, item, ready, blocked, diagnostic, and
  tier counts using system fonts and local assets only.
- Added unit coverage for the asset route table and integration coverage for
  served content types and stub feed-fetch behavior.

Verification:
- `TMPDIR=/home/nathan/.cache/silas/tmp cargo test -p work-view-cli`
- `TMPDIR=/home/nathan/.cache/silas/tmp cargo build --release -p work-view-cli`
- Release binary size: `515448` bytes (`504K`) at
  `/home/nathan/.cache/silas/target/release/work-view`

## Review (2026-05-31)

**Verdict**: Approve

**Blockers**: none
**Important**: none
**Nits**: none

**Notes**: Fast-lane story review under autopilot. Implementation notes recorded
green scoped verification; host reran
`TMPDIR=/home/nathan/.cache/silas/tmp cargo test -p work-view-cli` successfully.
Host also reran the release build and confirmed the binary remained 515,448
bytes, below the 8,388,608 byte CI guard.
