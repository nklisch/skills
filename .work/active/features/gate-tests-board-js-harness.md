---
id: gate-tests-board-js-harness
kind: feature
stage: implementing
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

## Design decisions

- **Harness dependency model**: use Node's built-in `node:test` runner plus a
  local tiny DOM shim instead of adding `jsdom` or a package manager dependency
  — the board assets are dependency-free ES modules and the release CI already
  runs on GitHub-hosted Ubuntu with Node available.
- **Module loading**: copy board asset modules to a temporary test directory and
  rewrite `/assets/*.js` imports to relative `./*.js` imports before dynamic
  import — this preserves the shipped module graph without introducing a
  bundler.
- **CI placement**: run the JS behavioral suites in
  `.github/workflows/build-work-view.yml`'s `test-install-helper` job beside the
  prompt-context and script tests — this gate is about shipped assets, not
  target-specific Rust binary compilation.

## Architectural choice

Use a committed no-build Node harness under
`plugins/agile-workflow/work-view/crates/cli/tests/board-js/`.

Other options considered:
- Keep extending Rust static-grep integration tests. This is cheap but it is
  the gap this feature exists to close: static checks cannot execute event
  handlers, DOM mutations, sort comparators, or markdown rendering behavior.
- Add `jsdom` and a package manifest. That would provide a broad DOM but would
  introduce dependency installation and lockfile management for a plugin that
  otherwise ships dependency-free board assets.
- Use browser e2e only. That catches integrated rendering, but it is slower and
  too coarse for the six targeted logic contracts.

The chosen harness keeps the asset tests fast, dependency-free, and close to
the files they verify. It deliberately implements only the DOM surface the board
modules need; missing DOM APIs fail loudly in tests and can be added as the
behavioral surface grows.

## Implementation Units

### Unit 1: No-build board JS runner
**File**: `plugins/agile-workflow/work-view/crates/cli/tests/board-js/harness.mjs`
**File**: `.github/workflows/build-work-view.yml`
**Story**: `gate-tests-board-js-harness-runner`

```javascript
export async function loadBoardModule(name) { /* rewrites /assets imports into a temp module graph */ }
export function installDomGlobals() { /* installs document, window, Event, KeyboardEvent */ }
export function makeItem(overrides = {}) { /* shared board item fixture */ }
```

**Implementation Notes**:
- Use only Node stdlib modules: `node:test`, `node:assert/strict`, `node:fs`,
  `node:path`, `node:os`, and `node:url`.
- `loadBoardModule` writes transformed copies of all files in
  `src/board/assets/*.js` to a per-process temp directory. Rewrite static import
  specifiers from `/assets/<name>.js` to `./<name>.js`.
- The DOM shim must support the board asset behaviors under test:
  `createElement`, `createTextNode`, `append`, `replaceChildren`,
  `querySelector`, `querySelectorAll`, `closest`, `className`, `classList`,
  `dataset`, attributes, event listeners, focus, and text content.
- Add the CI step:
  `node --test plugins/agile-workflow/work-view/crates/cli/tests/board-js/*.test.mjs`.

**Acceptance Criteria**:
- [ ] A trivial module import through `loadBoardModule("filters.js")` executes
  without a browser or bundler.
- [ ] A DOM event listener attached by a loaded module can be dispatched in a
  test and mutate DOM/state.
- [ ] `build-work-view.yml` runs the board JS suites.

---

### Unit 2: Markdown and filter behavior suites
**File**: `plugins/agile-workflow/work-view/crates/cli/tests/board-js/markdown-filter.test.mjs`
**Story**: `gate-tests-board-js-harness-markdown-filter`

```javascript
test("markdown renderer keeps adversarial html inert", () => {});
test("filters compose OR within scalar groups and AND across groups/tags", () => {});
```

**Implementation Notes**:
- Feed adversarial markdown containing script tags, event attributes, and
  `javascript:` links through `renderMarkdown` and assert output is DOM text or
  safe anchors only.
- Exercise `createDefaultFilters`, `matchesFilters`, and `deriveFilterOptions`
  directly with synthetic items. Verify tag AND semantics, scalar OR semantics,
  null parent handling, search text matching, and auto-hide based on tier.

**Acceptance Criteria**:
- [ ] Unsafe markdown text does not create executable elements or unsafe hrefs.
- [ ] Filter composition matches the gate finding's decision table.

---

### Unit 3: Dependency and table behavior suites
**File**: `plugins/agile-workflow/work-view/crates/cli/tests/board-js/dependency-table.test.mjs`
**Story**: `gate-tests-board-js-harness-dependency-table`

```javascript
test("dependency graph cycle members are bounded and explicit", () => {});
test("table sort comparators are deterministic and stage-aware", () => {});
```

**Implementation Notes**:
- Export small pure helpers from `dependency.js` and `table.js` only when needed
  for tests; keep view modules self-registered and dependency-free.
- For dependency cycles, feed a cyclic graph into the model/layering helpers and
  assert `cycleIds` contains the cycle members, missing dependencies render as
  external stubs, and the operation completes synchronously.
- For table sorting, assert stage order follows `deriveFilterOptions`, empty
  `updated` values sort to a defined end, and equal keys remain stable via the
  final id tie-breaker.

**Acceptance Criteria**:
- [ ] Dependency model tests cover cycles, missing deps, filtered deps, and
  bounded execution.
- [ ] Table tests cover stable deterministic sort behavior and no `NaN`/throw
  path for empty metadata.

---

### Unit 4: Kanban and detail behavior suites
**File**: `plugins/agile-workflow/work-view/crates/cli/tests/board-js/kanban-detail.test.mjs`
**Story**: `gate-tests-board-js-harness-kanban-detail`

```javascript
test("kanban lanes group by parent without mutating global filters", () => {});
test("detail presentation boundaries and refresh survival are deterministic", () => {});
```

**Implementation Notes**:
- Exercise `groupItemsByLane`, `laneProgress`, and mounted lane focus behavior
  with synthetic board context. Assert lane focus does not call `ctx.setFilter`
  and does not mutate `ctx.getState().filters`.
- Exercise `detectDetailPresentation` across viewport widths and body lengths.
  Exercise `createBoardStore.refresh` with a selected item id that survives or
  disappears between snapshots.

**Acceptance Criteria**:
- [ ] Kanban tests cover parent/epic/no-parent lanes and progress counts.
- [ ] Detail/store tests cover modal/narrow/wide presentation boundaries and
  selected-id refresh survival.

## Implementation Order

1. `gate-tests-board-js-harness-runner`
2. `gate-tests-board-js-harness-markdown-filter`
3. `gate-tests-board-js-harness-dependency-table`
4. `gate-tests-board-js-harness-kanban-detail`

## Testing

- Run `node --test plugins/agile-workflow/work-view/crates/cli/tests/board-js/*.test.mjs`.
- Run `cargo test` in `plugins/agile-workflow/work-view` to keep the Rust asset
  and CLI tests green.
- Run `python3 -m unittest test_prompt_context` in
  `plugins/agile-workflow/hooks/scripts` because the CI job touched by this
  feature also owns hook tests.

## Risks

- The tiny DOM shim can accidentally grow into an incomplete browser clone.
  Keep it test-driven: add only APIs needed by committed board behavior.
- Exporting helper functions for tests can leak module internals. Prefer pure
  helper exports that are already stable board contracts, and keep DOM view
  modules self-registered through the existing `registerView` path.
