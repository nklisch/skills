---
id: gate-tests-board-js-harness
kind: feature
stage: drafting
tags: [testing]
parent: null
depends_on: []
release_binding: null
gate_origin: tests
created: 2026-05-31
updated: 2026-06-01
---

# Board-asset behavioral JS test harness + view suites

Deferred from the **gate-tests 0.9.0** run. The board ships ~70KB of behavioral
frontend logic (`work-view/crates/cli/src/board/assets/*.js`) verified today
only by Rust *static-grep* proxies and manual checks. A real behavioral JS test
harness was **explicitly deferred** during the `epic-substrate-board-shell-filters`
review; this item tracks that decision and the six behavioral suites that depend
on it. Unbound (does not block 0.9.0) — the board epic shipped with this gap as a
known, accepted state.

## Blocker (the deferred decision)
Choose a no-build, DOM-capable JS test approach for the board assets (e.g.
node + a tiny DOM shim, or jsdom) wired into `build-work-view.yml`. The assets
are plain ES modules served by the Rust binary; the harness must exercise them
without a bundler.

## Deferred findings (gate-tests 0.9.0)

1. **(Critical) Safe-markdown XSS contract** — `epic-substrate-board-shell-card`.
   "Item bodies containing `<script>`, event attributes, or `javascript:` links
   do not execute and render as safe text." The control (`markdown.js` `safeHref`
   allow-listing `http(s):`/`mailto:` via regex + `URL.protocol`, all output via
   `createTextNode`/`textContent`) was **verified sound during the gate** — this
   is a test-only gap, NOT a live XSS. Add behavioral tests feeding adversarial
   markdown through `renderMarkdown` and asserting inert output. Reworks the
   tautological Rust grep test `board_renderer_assets_do_not_ship_raw_html_injection_patterns`
   (blind to the `setAttribute("href")` sink).
3. **(High) Filter composition** — `epic-substrate-board-shell-filters`. Decision
   table over `matchesFilters`: OR within scalar knobs, AND across knobs, tag-AND,
   null parent/release sentinel, auto-hide on tier (not `is_terminal`).
4. **(High) Dependency cycle guard** — `epic-substrate-board-dependency-model`.
   Feed a cyclic graph; assert bounded-time layering (no hang), `cycleIds` =
   cycle members, missing/filtered dep renders a stub not a throw.
5. **(High) Table sort comparators** — `epic-substrate-board-table-sort`.
   Deterministic + stable sort; stage order follows shell vocabulary (not alpha);
   empty `updated` sorts to a defined end, no NaN throw.
6. **(Medium) Kanban swimlanes** — `epic-substrate-board-kanban-swimlanes`.
   Parent/epic lane grouping + `(no parent)` lane, per-lane total/done progress,
   and lane focus that does NOT mutate `ctx.getState().filters`.
7. **(Medium) Detail presentation** — `epic-substrate-board-shell-contract`.
   `detectDetailPresentation(item, viewportWidth)` boundary partitions
   (modal/narrow/wide by width × body length) and "selected id survives refresh
   only if the item still exists."

## Scope on pickup
Stand up the harness (the blocker), then implement the six suites as child
stories. Sized as a feature, not a single story.

## Scope record

- Promoted from backlog during batch scope for found release/test-gate work.
- Size: medium feature; design should choose the no-build DOM-capable harness
  and split the behavioral suites into implementable child stories.
- Dependencies: none.
