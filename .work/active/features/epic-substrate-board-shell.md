---
id: epic-substrate-board-shell
kind: feature
stage: done
tags: [tooling]
parent: epic-substrate-board
depends_on: [epic-substrate-board-host]
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Board shell — shared app frame, item-card, filters, and auto-hide

## Brief

Deliver the shared frontend foundation that all three views render into: the app
shell and the substrate-presentation layer the kanban, dependency, and table
views reuse. Without this, each view would re-invent how an item looks and how
the visible set is scoped — so it lands once, here, and the views consume it.

This feature owns: the app layout/chrome and a **view-switcher** (tabs between
kanban / dependency / table); the shared **item-card** component (frontmatter
chips — id, kind, stage, tags, parent, release binding — plus the dependency
signals from the feed); **card-body rendering** that renders an item's markdown
`body` (the core already exposes `Item.body` separately from frontmatter), not
just its metadata; the composable **global filter bar** with knobs for tag,
kind, parent, stage, and release that compose the way the CLI's flags do; and
**auto-hide of released/archived items** by default (driven by the feed's
`tier`/bucket, with a toggle to reveal them) so active work stays in focus. It
also defines the **client-side filter-state store** that the three views read,
so a filter set in the shell scopes every view consistently.

All of this is **vanilla HTML/CSS/JS with no build step** (see Design
decisions), consuming the JSON feed from `epic-substrate-board-host`. This
feature is the home of the ux-ui-design "components" tier (item-card, filter
controls, view-switcher) and the visual system the views inherit. It does NOT
implement the per-view layouts themselves — kanban columns, the dependency
graph/tree, and the sortable table are their own features; the shell gives them
the card, the filtered item set, and the frame to mount in.

## Epic context
- Parent epic: `epic-substrate-board`
- Position in epic: shared client foundation — the critical-path hinge between
  the host and the three views. Built once; kanban, dependency, and table all
  depend on it and run in parallel afterward.

## Foundation references
- `docs/ARCHITECTURE.md` — "The substrate-access model": the human surface
  optimizes for human cognition (the inverse of the CLI's terseness).
- `docs/VISION.md` — the dogfooding thesis: the board's first real dataset is the
  set of items describing its own construction.
- `plugins/agile-workflow/work-view/crates/core/src/model.rs` — `Item.body`
  (markdown after the frontmatter, for card-body rendering), `Tier` (auto-hide
  bucketing), and the frontmatter fields the card chips render.
- `plugins/agile-workflow/work-view/crates/core/src/filter.rs` — the CLI's
  composable `Filter`/`Match` model; the board's filter bar should mirror its
  knobs (tag/kind/parent/stage/release) so the two adapters feel like one tool.

## Mockups

The parent epic's ux-ui gate is satisfied; this feature inherits the locked
design system and flow behavior.

- Design system: `.mockups/design-system/tokens.css`,
  `.mockups/design-system/components.css`,
  `.mockups/design-system/motion.css`
- Cross-view flow: `.mockups/flows/board-views/`
- Kanban selected shell/frame direction:
  `.mockups/screens/epic-substrate-board-kanban/option-hybrid.html`
- Shared item-detail behavior:
  `.mockups/screens/epic-substrate-board-kanban/item-detail.html`

## Other agent review

Claude Opus xhigh reviewed the shell design space during this autopilot pass.
Accepted points:

- Do not copy `tokens.css` verbatim while it imports Google Fonts. The shipped
  board must have no CDN dependencies.
- Use a single-page app topology instead of the mock flow's multi-document
  pages, so the board fetches the substrate once, keeps an in-memory snapshot,
  and switches views without losing state.
- Pin the filter-state store as the downstream contract. Views should consume
  `visibleItems()` / `matches(item)`, not reimplement filtering.
- Auto-hide must key off `tier in {releases, archive}`, not `is_terminal`, so
  active `stage: done` items can still appear in the kanban Done column.
- Markdown rendering is an XSS boundary. The shell must escape/sanitize item
  bodies and must not inject raw markdown with `innerHTML`.
- Detail views should open by item id from the snapshot, not from truncated DOM
  `data-*` attributes.

Host judgment:

- Accept the SPA recommendation; it is the cleanest way to make filters, theme,
  and selected item state shared across kanban/dependency/table.
- Self-host Geist/Geist Mono as local `.woff2` assets if implementation can add
  the font files with license provenance. If that cannot be done in the story,
  strip the Google import and ship the system fallback rather than retaining a
  CDN dependency.
- Use a hand-rolled safe markdown subset for this epic. A vendored markdown
  library can be introduced later only if the subset is insufficient and remains
  embedded/no-build.

## Design decisions

- **App topology**: one `index.html` SPA with a persistent app shell and a
  swappable `<main id="view-root">`. The view-switcher changes in-memory view
  state; it does not navigate to separate documents.
- **Asset topology**: keep the no-build constraint by embedding explicit files
  under `plugins/agile-workflow/work-view/crates/cli/src/board/assets/`.
  `index.html` links local CSS and ES modules. `assets.rs` exposes every shipped
  route with an explicit MIME type.
- **No CDN**: shipped CSS must not contain `@import url(...)` or remote fonts.
  Self-host local `.woff2` files when available; otherwise rely on system font
  fallbacks.
- **Theme persistence**: `localStorage` only in this read-only epic. The
  "mirrored to board config" idea requires a write endpoint and is future work.
- **Refresh model**: manual refresh button for the first shell. Refresh fetches
  `/api/substrate` again, preserves theme/filter/view state, and preserves the
  selected item when its id still exists.
- **Filter semantics**: board filters are a documented superset of the CLI.
  Values OR within one scalar knob (`kind`, `stage`, `parent`, `release`) and
  compose with AND across knobs. Selected tags use CLI-like AND semantics.
  Search text additionally matches id/title/body-ish text client-side.
- **Auto-hide semantics**: default hide only `tier: releases` and
  `tier: archive`. Never hide active `stage: done` solely because
  `is_terminal` is true.
- **Markdown rendering**: cards render an escaped first-paragraph summary.
  Detail renders a safe subset: headings, paragraphs, unordered lists,
  blockquotes, fenced/inline code, strong text, and safe http/https/mailto
  links. All text nodes are escaped; unsafe links render as plain text.

## Public Shell Contract

Downstream views consume the shell through an in-browser context, not through
globals they mutate directly.

```js
/**
 * FeedSnapshot is the JSON shape returned by GET /api/substrate.
 * BoardItem is one entry from FeedSnapshot.items.
 */
type BoardState = {
  snapshot: FeedSnapshot | null,
  loading: boolean,
  error: string | null,
  view: "kanban" | "dependency" | "table",
  selectedItemId: string | null,
  filters: {
    search: string,
    kinds: Set<string>,
    stages: Set<string>,
    parents: Set<string>,
    releases: Set<string>,
    tags: Set<string>,
    autoHideReleased: boolean,
  },
  theme: {
    accent: "teal" | "amber" | "violet" | "azure" | "lime" | "candy",
    mode: "system" | "light" | "dark",
  },
}

type BoardContext = {
  getState(): BoardState,
  subscribe(fn: (state: BoardState) => void): () => void,
  refresh(): Promise<void>,
  setView(id: BoardState["view"]): void,
  setTheme(partial: Partial<BoardState["theme"]>): void,
  setFilter<K extends keyof BoardState["filters"]>(
    key: K,
    value: BoardState["filters"][K],
  ): void,
  visibleItems(): BoardItem[],
  matches(item: BoardItem): boolean,
  getItemById(id: string): BoardItem | null,
  renderCard(item: BoardItem, opts?: CardOptions): HTMLElement,
  openDetail(id: string): void,
  closeDetail(): void,
}

type BoardView = {
  id: "kanban" | "dependency" | "table",
  label: string,
  mount(root: HTMLElement, ctx: BoardContext): void,
  unmount?(): void,
}
```

## Architectural choice

Options considered:

1. **Single-page shell with registered view modules (chosen).** One substrate
   fetch, one in-memory store, one detail surface, one filter evaluator. Later
   view features add or replace modules behind the same `BoardView` contract.
2. **Multi-document pages like the mock flow.** Easier to hand-write, but every
   tab switch refetches and reinitializes state. This demotes the shell contract
   to a `localStorage` schema and makes downstream view behavior driftier.
3. **One large script with no module seams.** Smallest route table, but hard to
   split across stories and encourages the views to couple to private helpers.

The chosen approach keeps the host as a static asset server and makes the shell
the single owner of state, chrome, cards, filters, theme, and detail. It also
keeps the view features parallelizable: they implement `BoardView` modules and
call the context.

## Implementation Units

### Unit 1: Design-system assets and app frame
**Files**:
- `plugins/agile-workflow/work-view/crates/cli/src/board/assets.rs`
- `plugins/agile-workflow/work-view/crates/cli/src/board/assets/index.html`
- `plugins/agile-workflow/work-view/crates/cli/src/board/assets/tokens.css`
- `plugins/agile-workflow/work-view/crates/cli/src/board/assets/components.css`
- `plugins/agile-workflow/work-view/crates/cli/src/board/assets/motion.css`
- `plugins/agile-workflow/work-view/crates/cli/src/board/assets/board.css`
- optional `plugins/agile-workflow/work-view/crates/cli/src/board/assets/fonts/*.woff2`

**Story**: `epic-substrate-board-shell-frame`

```rust
pub(crate) fn asset_for_path(path: &str) -> Option<Asset>;
```

**Implementation Notes**:
- Replace the host stub HTML with the app frame: sticky app bar, view tabs,
  theme picker, global filter bar container, diagnostics area, refresh control,
  and `<main id="view-root">`.
- Copy the locked design-system CSS into shipped assets, promoting modal and
  markdown-detail styles that only exist in mock page-local CSS.
- Remove any CDN import. Add local font assets and `font/woff2` route support
  only if the implementation can include the font files locally with license
  provenance; otherwise keep the system fallback.
- Keep all dimensions stable for tabs, toolbar controls, counters, and the view
  root so dynamic data cannot shift the app chrome.

**Acceptance Criteria**:
- [ ] `/`, `/index.html`, local CSS assets, JS module assets, and any font assets
      return correct content types.
- [ ] Shipped CSS contains no remote `@import`, no `fonts.googleapis`, and no
      `https://` asset references.
- [ ] The first viewport shows the board app frame, not the old metrics stub.
- [ ] Theme picker controls are present and use the locked accent/mode tokens.

### Unit 2: Snapshot store, refresh, and diagnostics
**Files**:
- `plugins/agile-workflow/work-view/crates/cli/src/board/assets/board.js`
- `plugins/agile-workflow/work-view/crates/cli/src/board/assets/state.js`
- `plugins/agile-workflow/work-view/crates/cli/src/board/assets/index.html`
- `plugins/agile-workflow/work-view/crates/cli/tests/integration.rs`

**Story**: `epic-substrate-board-shell-data`

```js
export function createBoardStore({ storage, fetchJson, root }) {
  return {
    getState,
    subscribe,
    refresh,
    setView,
    setTheme,
    setFilter,
    visibleItems,
    matches,
    getItemById,
  };
}
```

**Implementation Notes**:
- Fetch `/api/substrate` once on load and on manual refresh. Do not poll yet.
- Render loading, error, empty, and diagnostics states using `.spinner`,
  `.empty`, and `.alert`.
- Preserve filter/theme/view/selected-item state across refresh. If the selected
  item disappears, close detail.
- Persist only theme, current view, filters, and auto-hide to localStorage. Do
  not persist the full substrate snapshot.

**Acceptance Criteria**:
- [ ] Initial load fetches `/api/substrate` and renders project/version/count
      status.
- [ ] Manual refresh refetches the feed without clearing filters/theme/view.
- [ ] Parse errors, validation warnings, and duplicate ids surface visibly.
- [ ] A failed feed request renders a non-crashing error state.

### Unit 3: Safe markdown and shared item card
**Files**:
- `plugins/agile-workflow/work-view/crates/cli/src/board/assets/markdown.js`
- `plugins/agile-workflow/work-view/crates/cli/src/board/assets/card.js`
- `plugins/agile-workflow/work-view/crates/cli/src/board/assets/components.css`
- `plugins/agile-workflow/work-view/crates/cli/src/board/assets/board.css`
- `plugins/agile-workflow/work-view/crates/cli/tests/integration.rs`

**Story**: `epic-substrate-board-shell-card`

```js
export function renderMarkdown(markdown, options = { mode: "detail" }) {}
export function markdownSummary(markdown, maxChars = 220) {}
export function renderCard(item, options = {}) {}
```

**Implementation Notes**:
- Build DOM nodes directly or escape text before controlled insertion. Never
  pass raw item `body` to `innerHTML`.
- Card summary uses the first body paragraph with inline code/strong rendered
  safely or as escaped text. Full markdown is reserved for detail.
- Card shows id, kind, stage, tags, parent, release binding, ready/blocked/done
  badge, dependency counts, and a compact body summary.
- Card click/keyboard activation calls `openDetail(item.id)` through context.

**Acceptance Criteria**:
- [ ] Item bodies containing `<script>`, event attributes, or `javascript:`
      links do not execute and render as safe text.
- [ ] Cards render kind/status chips and dependency metadata from real feed
      fields.
- [ ] Cards are keyboard-focusable and can open detail via Enter/Space.
- [ ] Compact card mode fits kanban/dependency nodes without layout shift.

### Unit 4: Filter-state store and global controls
**Files**:
- `plugins/agile-workflow/work-view/crates/cli/src/board/assets/filters.js`
- `plugins/agile-workflow/work-view/crates/cli/src/board/assets/state.js`
- `plugins/agile-workflow/work-view/crates/cli/src/board/assets/board.js`
- `plugins/agile-workflow/work-view/crates/cli/tests/integration.rs`

**Story**: `epic-substrate-board-shell-filters`

```js
export function createDefaultFilters() {}
export function matchesFilters(item, filters) {}
export function renderFilterBar(root, ctx) {}
```

**Implementation Notes**:
- Global controls cover search, tag, kind, parent, stage, release, and auto-hide.
- Values OR within scalar knobs and AND across knobs. Tags are AND to preserve
  CLI repeat-`--tag` semantics.
- Parent/release controls derive option sets from the loaded snapshot; use a
  stable `"(none)"` sentinel for null values.
- Auto-hide default is true and filters only `tier: releases` / `archive`.

**Acceptance Criteria**:
- [ ] `visibleItems()` changes consistently when any filter control changes.
- [ ] Auto-hide true hides only releases/archive tier items, not active
      `stage: done` items.
- [ ] Filter state persists across reload and view switches.
- [ ] Empty filter results render an explicit empty state.

### Unit 5: View registry, detail surface, and shell capstone
**Files**:
- `plugins/agile-workflow/work-view/crates/cli/src/board/assets/views.js`
- `plugins/agile-workflow/work-view/crates/cli/src/board/assets/detail.js`
- `plugins/agile-workflow/work-view/crates/cli/src/board/assets/board.js`
- `plugins/agile-workflow/work-view/crates/cli/src/board/assets/board.css`
- `plugins/agile-workflow/work-view/crates/cli/tests/integration.rs`

**Story**: `epic-substrate-board-shell-contract`

```js
export function registerView(view) {}
export function mountCurrentView(root, ctx) {}
export function openDetail(id, ctx) {}
export function detectDetailPresentation(item, viewportWidth) {}
```

**Implementation Notes**:
- Ship placeholder `kanban`, `dependency`, and `table` views that mount through
  the real `BoardView` contract and show enough live data to prove the shell.
  Later view features replace those modules without changing shell state.
- Detail source is always `ctx.getItemById(id)`, never DOM `data-*` copies.
- Size detection: viewport `< 760px` => modal; short bodies => 380px drawer;
  medium bodies => 560px drawer; long bodies => modal capped at readable width.
- Escape closes detail; refresh keeps it open only if the item id still exists.

**Acceptance Criteria**:
- [ ] View-switcher changes the mounted view without full page navigation.
- [ ] All three placeholder views receive the same filtered item set.
- [ ] Detail opens from a card/id, renders frontmatter and full safe markdown,
      and chooses the expected presentation by body length and viewport.
- [ ] Theme and filters survive switching views and browser reload.

## Implementation Order

1. `epic-substrate-board-shell-frame`
2. `epic-substrate-board-shell-data`
3. `epic-substrate-board-shell-card`
4. `epic-substrate-board-shell-filters`
5. `epic-substrate-board-shell-contract`

## Testing

### Unit Tests
- JS pure-function tests can run through browser-level integration by serving
  assets and exercising the page; no separate JS test runner is introduced.
- Rust asset tests cover every new route and MIME type.
- Markdown sanitizer fixtures cover script tags, event attributes,
  `javascript:` links, fenced code, inline code, strong text, lists, and
  headings.
- Filter fixtures cover OR-within-scalar, AND-across-knobs, tag AND, null
  parent/release sentinels, and tier-based auto-hide.

### Integration Tests
- Spawn `work-view board --once --no-open` and fetch every embedded asset.
- Fetch `/`, assert the app frame includes the view root, filter controls,
  theme picker, and module script.
- Use static asset text checks for no remote imports/URLs.
- For shell behavior that needs a browser DOM, prefer a small checked-in HTML
  harness route if needed; otherwise keep behavior in pure DOM functions that
  can be inspected by integration tests.

### Manual Verification
- Run `work-view board --no-open`, open the URL, and confirm:
  theme persists, filter state persists, refresh preserves view/filter state,
  details open from cards, and all three placeholder views mount.

## Risks

- **CDN drift from mockups**: the locked tokens currently import Google Fonts.
  Implementation must strip or self-host before shipping.
- **Filter semantics churn**: downstream views depend on `visibleItems()`; keep
  all filter logic in the shell store and prohibit per-view reimplementation.
- **XSS through item bodies**: body markdown is project-authored but still must
  be rendered as untrusted input.
- **Overbuilding the placeholder views**: shell should prove the contract, not
  implement kanban/dependency/table layouts ahead of their stories.
- **Mockup CSS drift**: `.mockups/` is not a shipped source tree. The shell story
  must explicitly copy and adapt the committed design-system files into the
  embedded asset directory.

## Implementation Summary

Completed on 2026-05-31 through child stories:

- `epic-substrate-board-shell-frame` shipped the app frame, local no-CDN design
  assets, theme controls, filter container, diagnostics area, and embedded asset
  routes.
- `epic-substrate-board-shell-data` shipped the in-browser substrate snapshot
  store, manual refresh, diagnostics rendering, localStorage persistence for
  view/theme/filter state, and feed error/empty/loading states.
- `epic-substrate-board-shell-card` shipped safe markdown rendering and the
  shared keyboard-accessible item card.
- `epic-substrate-board-shell-filters` shipped `filters.js`, the global filter
  controls, null-sentinel handling, OR/AND/tag semantics, tier-based auto-hide,
  and a three-pass Opus review loop for the filter boundary.
- `epic-substrate-board-shell-contract` shipped `views.js`, `detail.js`, the
  downstream `BoardContext`/`BoardView` surface, placeholder views, id-sourced
  full-body safe detail rendering, focus-managed modal/drawer behavior, and a
  three-pass Opus review loop for the shell capstone.

Verification:

- `cargo fmt -p work-view-cli`
- `TMPDIR=/home/nathan/.cache/silas/tmp cargo test -p work-view-cli`
- `TMPDIR=/home/nathan/.cache/silas/tmp cargo build --release -p work-view-cli`

Last verified release binary size: 659552 bytes.

## Review

Approved on 2026-05-31.

- All child stories reached `stage: done`.
- Host review confirmed the shell owns state, filtering, cards, detail, and
  placeholder view mounting without implementing the downstream view layouts.
- Opus peer-review loops were run on the filter boundary and shell capstone.
  Accepted findings were fixed and committed; remaining items were either
  deliberate contract choices or deferred low-priority polish.
- Verification remained green after the accepted fixes:
  `TMPDIR=/home/nathan/.cache/silas/tmp cargo test -p work-view-cli` and
  `TMPDIR=/home/nathan/.cache/silas/tmp cargo build --release -p
  work-view-cli`.
