---
id: epic-substrate-board-host-assets
kind: story
stage: implementing
tags: [tooling]
parent: epic-substrate-board-host
depends_on: [epic-substrate-board-host-server]
release_binding: null
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

- [ ] `GET /` and `GET /index.html` return embedded HTML.
- [ ] CSS and JS routes return correct content types.
- [ ] The stub fetches `/api/substrate` and renders a visible count without a
      build step.
- [ ] Copying only the compiled `work-view` binary to `.work/bin/` is enough for
      the stub board to load.

