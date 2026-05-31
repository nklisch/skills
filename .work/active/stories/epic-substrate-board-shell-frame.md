---
id: epic-substrate-board-shell-frame
kind: story
stage: review
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

- [x] `/`, `/index.html`, local CSS assets, JS module assets, and any font assets
      return correct content types.
- [x] Shipped CSS contains no remote `@import`, no `fonts.googleapis`, and no
      `https://` asset references.
- [x] The first viewport shows the board app frame, not the old metrics stub.
- [x] Theme picker controls are present and use the locked accent/mode tokens.

## Implementation notes

- Files changed: `plugins/agile-workflow/work-view/crates/cli/src/board/assets.rs`,
  `plugins/agile-workflow/work-view/crates/cli/src/board/assets/index.html`,
  `plugins/agile-workflow/work-view/crates/cli/src/board/assets/tokens.css`,
  `plugins/agile-workflow/work-view/crates/cli/src/board/assets/components.css`,
  `plugins/agile-workflow/work-view/crates/cli/src/board/assets/motion.css`,
  `plugins/agile-workflow/work-view/crates/cli/src/board/assets/board.css`,
  `plugins/agile-workflow/work-view/crates/cli/src/board/assets/board.js`,
  `plugins/agile-workflow/work-view/crates/cli/tests/integration.rs`.
- Tests added: `board::assets::tests::shipped_css_has_no_remote_dependencies`;
  expanded `board::assets::tests::css_and_js_return_expected_types` and
  `board_embedded_assets_return_expected_content_types` to cover the new CSS
  asset routes and app shell HTML.
- Discrepancies from design: no font routes were added because no local font
  files with license provenance are present; shipped tokens use system font
  fallbacks instead. `board.js` is intentionally only a shell control bootstrap;
  feed refresh/status wiring remains in the Unit 2 story.
- Adjacent issues parked: none.

## Verification

- `cargo fmt -p work-view-cli`
- `TMPDIR=/home/nathan/.cache/silas/tmp cargo test -p work-view-cli`
- `TMPDIR=/home/nathan/.cache/silas/tmp cargo build --release -p work-view-cli`
  produced `/home/nathan/.cache/silas/target/release/work-view` at 603K.
