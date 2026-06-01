# No-build board asset test harness

Board JS behavior tests install a lightweight DOM shim, load rewritten board
asset modules directly, and build substrate-like items with overrides.

## Rationale

The board ships dependency-free browser ES modules, so behavior tests need to
exercise those modules without a bundler or browser runtime. The harness creates
enough DOM/event surface for assets to run, rewrites `/assets/...` imports into
a temp module graph, cache-busts imports, and gives tests a small `makeItem`
builder for focused fixtures.

## Examples

### Example 1: Install DOM globals
**File**: `plugins/agile-workflow/work-view/crates/cli/tests/board-js/harness.mjs:322`
```js
export function installDomGlobals({ width = 1024 } = {}) {
  const document = new TestDocument();
  const listeners = new Map();
  const window = {
    document,
    innerWidth: width,
    localStorage: null,
    // ...
  };
  globalThis.window = window;
  globalThis.document = document;
  globalThis.Event = TestEvent;
  globalThis.KeyboardEvent = TestEvent;
  globalThis.URL = URL;
  return { document, window };
}
```

### Example 2: Load rewritten asset modules
**File**: `plugins/agile-workflow/work-view/crates/cli/tests/board-js/harness.mjs:356`
```js
export async function loadBoardModule(name) {
  const dir = await ensureModuleGraph();
  return import(`${pathToFileURL(join(dir, name)).href}?v=${Date.now()}-${Math.random()}`);
}
```

### Example 3: Build focused item fixtures
**File**: `plugins/agile-workflow/work-view/crates/cli/tests/board-js/harness.mjs:361`
```js
export function makeItem(overrides = {}) {
  return {
    id: "story-alpha",
    kind: "story",
    stage: "implementing",
    parent: null,
    tags: [],
    depends_on: [],
    unmet_deps: [],
    // ...
    ...overrides,
  };
}
```

## When to Use
- Testing board asset behavior that needs real ES modules and DOM interaction.
- Verifying dependency, filter, table, kanban, detail, or markdown behavior
  without adding a browser or bundler dependency.

## When NOT to Use
- Rust CLI/server behavior, HTTP integration, or `work-view` query behavior.
- Visual layout assertions that require an actual browser engine.

## Common Violations
- Importing board assets directly while they still contain `/assets/...`
  imports.
- Hand-rolling item objects inline instead of using `makeItem(overrides)`.
- Depending on browser APIs not implemented by the harness without extending the
  shim deliberately.
