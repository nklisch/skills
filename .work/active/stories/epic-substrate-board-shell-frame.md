---
id: epic-substrate-board-shell-frame
kind: story
stage: implementing
tags: [tooling]
parent: epic-substrate-board-shell
depends_on: []
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Board shell app frame and design-system assets

Implements Unit 1 of `epic-substrate-board-shell`.

## Scope

Replace the host metrics stub with the real board app frame and embed the
locked design-system CSS/assets without introducing a build step or CDN
dependency.

## Work

- Update `assets.rs` to serve the shell's local CSS, JS module, and optional
  local font routes with explicit MIME types.
- Replace `assets/index.html` with the app frame: app bar, view tabs, theme
  picker, global filter container, refresh/status/diagnostics region, and
  `<main id="view-root">`.
- Copy/adapt `tokens.css`, `components.css`, and `motion.css` into embedded
  board assets, including modal/detail markdown styles that are only local in
  the mock pages.
- Remove all remote imports. Self-host local `.woff2` fonts only if the files
  and license provenance are added locally; otherwise use the system fallback.

## Acceptance Criteria

- [ ] `/`, `/index.html`, local CSS assets, JS module assets, and any font assets
      return correct content types.
- [ ] Shipped CSS contains no remote `@import`, no `fonts.googleapis`, and no
      `https://` asset references.
- [ ] The first viewport shows the board app frame, not the old metrics stub.
- [ ] Theme picker controls are present and use the locked accent/mode tokens.
