---
id: epic-substrate-board-shell-card
kind: story
stage: done
tags: [tooling]
parent: epic-substrate-board-shell
depends_on: [epic-substrate-board-shell-frame]
release_binding: 0.9.0
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Board shell safe markdown and shared item card

Implements Unit 3 of `epic-substrate-board-shell`.

## Scope

Create the reusable item-card renderer and safe markdown subset every board view
uses for item summaries and detail content.

## Work

- Add `assets/markdown.js` with escaped/sanitized rendering for the selected
  markdown subset.
- Add `assets/card.js` with `renderCard(item, options)`.
- Keep card summaries compact; reserve full markdown rendering for detail.
- Render frontmatter chips, status badges, dependency metadata, tags, parent,
  release binding, and body summary from the real feed item shape.
- Ensure card activation is keyboard-accessible and delegates to shell detail
  opening by item id.

## Acceptance Criteria

- [x] Item bodies containing `<script>`, event attributes, or `javascript:`
      links do not execute and render as safe text.
- [x] Cards render kind/status chips and dependency metadata from real feed
      fields.
- [x] Cards are keyboard-focusable and can open detail via Enter/Space.
- [x] Compact card mode fits kanban/dependency nodes without layout shift.

## Implementation notes

- Added `assets/markdown.js` with DOM-built rendering for headings,
  paragraphs, unordered lists, blockquotes, fenced and inline code, strong text,
  and safe `http`/`https`/`mailto` links. Unsafe links are emitted as text.
- Added `assets/card.js` with `renderCard(item, options)`, stable
  `item-card`/`ic-*` classes, frontmatter metadata, status badges, dependency
  counts, compact summaries, and click/Enter/Space activation through
  `onOpen(id)` or a context `openDetail(id)` hook.
- Wired the shell preview to render real compact cards from `visibleItems()` so
  the shared card component is exercised before the dedicated view stories.
- Added embedded routes and integration/static checks for the new JS assets and
  unsafe rendering patterns.

## Review

Approved on 2026-05-31 after host review.

- Confirmed markdown rendering builds DOM nodes with text APIs and does not
  ship raw HTML insertion sinks for substrate body content.
- Confirmed `renderCard(item, options)` renders feed metadata, compact cards,
  and keyboard activation through item-id callbacks rather than reading details
  back from DOM attributes.
- Verification passed: `TMPDIR=/home/nathan/.cache/silas/tmp cargo test -p
  work-view-cli` and `TMPDIR=/home/nathan/.cache/silas/tmp cargo build
  --release -p work-view-cli`.
