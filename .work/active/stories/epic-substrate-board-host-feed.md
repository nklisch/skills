---
id: epic-substrate-board-host-feed
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

# Board host live substrate JSON feed

Implements Unit 3 of `epic-substrate-board-host`.

## Scope

Serve a whole-substrate JSON snapshot from `GET /api/substrate`, re-reading
`.work/` on every request and surfacing per-item parse/validation diagnostics
without crashing the server.

## Work

- Add `serde_json` to the CLI crate if it is not already present from the server
  story.
- Implement adapter DTOs in `board::feed`; do not derive a wire contract on
  `work_view_core::model::Item`.
- Include item frontmatter fields, `tier`, `rel_path`, `body`, `is_terminal`,
  `ready`, `blocked`, `unmet_deps`, `dependents`, and `children`.
- Reuse the CLI actionability semantics for `ready` and `blocked`:
  active-tier items at `drafting`, `implementing`, or `review` with dependencies
  satisfied or unmet.
- Include structured `LoadReport` diagnostics with relative paths.
- Exclude absolute filesystem paths and `raw_text`.

## Acceptance Criteria

- [ ] `GET /api/substrate` returns 200 JSON with items, diagnostics, and
      `work_view_version`.
- [ ] A malformed item file appears in `diagnostics.parse_errors` while valid
      siblings remain in `items`.
- [ ] Feed ready/blocked ids match `work-view --ready` and `work-view --blocked`
      over the same fixture.
- [ ] Feed includes `body`, `rel_path`, `tier`, `unmet_deps`, `dependents`, and
      `children`.
- [ ] Feed excludes absolute `path` and `raw_text`.

