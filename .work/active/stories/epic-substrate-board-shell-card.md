---
id: epic-substrate-board-shell-card
kind: story
stage: implementing
tags: [tooling]
parent: epic-substrate-board-shell
depends_on: [epic-substrate-board-shell-frame]
release_binding: null
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

- [ ] Item bodies containing `<script>`, event attributes, or `javascript:`
      links do not execute and render as safe text.
- [ ] Cards render kind/status chips and dependency metadata from real feed
      fields.
- [ ] Cards are keyboard-focusable and can open detail via Enter/Space.
- [ ] Compact card mode fits kanban/dependency nodes without layout shift.
