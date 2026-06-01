# Local text-element DOM builder

Each board ES-module that constructs DOM defines a private, identically-shaped
`textElement(tag, className, text)` helper that creates an element, conditionally
sets `className`, sets `textContent`, and returns the node — never a shared
import, always a per-module local.

## Rationale

The board ships as dependency-free browser ES modules served by an embedded Rust
host (`assets.rs` `include_bytes!`), with a hard test guard that the CSS/JS
reference no remote assets (`assets.rs` `shipped_css_has_no_remote_dependencies`).
There is no framework and no shared util bundle. Rather than thread one helper
import through every module (and pay the cross-module coupling), each
view/render module re-declares the same tiny builder. Using `textContent` (never
`innerHTML`) is also the XSS-safe default for untrusted substrate item bodies —
it pairs with the safe-DOM markdown renderer in `markdown.js`. The shape is small
enough that duplication is cheaper than coupling, and consistency keeps every
module's DOM construction reading identically.

## Examples

### Example 1: Kanban view
**File**: `plugins/agile-workflow/work-view/crates/cli/src/board/assets/kanban.js:8`
```js
function textElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  element.textContent = text;
  return element;
}
```

### Example 2: Card renderer — same shape, param renamed `value`
**File**: `plugins/agile-workflow/work-view/crates/cli/src/board/assets/card.js:3`
```js
function text(tag, className, value) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  node.textContent = value;
  return node;
}
```

### Example 3: Table view
**File**: `plugins/agile-workflow/work-view/crates/cli/src/board/assets/table.js:19`
```js
function textElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  element.textContent = text;
  return element;
}
```

Also appears in `board.js:41`, `dependency.js:14`, `detail.js:6`,
`filters.js:171`, and `views.js` — 8 occurrences total. `markdown.js:3` defines a
2-arg `el(tag, className)` variant that omits text because it builds
inline-markdown trees node-by-node.

## When to Use
- Adding a new board ES module that builds DOM nodes: declare a local
  `textElement(tag, className, text)` at the top rather than importing one.
- Any element whose full content is a single text string and an optional class.

## When NOT to Use
- When the element needs children, attributes, or event handlers beyond
  text+class — build it inline with `document.createElement` + `.append(...)`.
- When rendering user/substrate-controlled markup — route through `markdown.js`'s
  safe renderer; never reach for `innerHTML`.

## Common Violations
- Using `innerHTML` / template-string HTML to set element content (defeats the
  no-remote / XSS-safe posture).
- Importing a "shared dom util" module — the board deliberately avoids a util
  bundle so each file stays independently servable and readable.
