# Registered board view module

Each board view is an object literal `export const xView = { id, label, mount(root, ctx) }`
whose `mount` reads everything it needs from a passed-in `ctx`, builds a detached
subtree, and commits it with a single `root.replaceChildren(...)`; views
self-register through `registerView` and are dispatched by id.

## Rationale

The board renders one of several interchangeable visualizations (kanban,
dependency graph, table) over the same substrate feed. A uniform
`{id, label, mount(root, ctx)}` contract lets the shell (`board.js`) and registry
(`views.js`) treat every view identically — tab label from `label`, dispatch by
`id`, mount by handing over a DOM root plus a `ctx` capability object — so adding
a fourth view is purely additive (write the module, `registerView` it).
`registerView` enforces the contract at registration time (throws if `id`/`mount`
are missing). The single trailing `root.replaceChildren(...)` makes each mount
idempotent and side-effect-isolated: re-mounting fully replaces prior output with
no diffing or leftover nodes. `ctx` is the only coupling surface, decoupling
views from the store internals.

## Examples

### Example 1: The contract and its enforcing registrar
**File**: `plugins/agile-workflow/work-view/crates/cli/src/board/assets/views.js:16`
```js
export function registerView(view) {
  if (!view || typeof view.id !== "string" || typeof view.mount !== "function") {
    throw new Error("Board views must provide string id and mount(root, ctx)");
  }
  registry.set(view.id, view);
  return view;
}
// ...
registerView(kanbanView);
registerView(dependencyView);
registerView(tableView);
```

### Example 2: kanbanView — read from ctx, build subtree, commit once
**File**: `plugins/agile-workflow/work-view/crates/cli/src/board/assets/kanban.js:196`
```js
export const kanbanView = {
  id: "kanban",
  label: "Kanban",
  mount(root, ctx) {
    const items = ctx.visibleItems();
    const snapshot = ctx.getState().snapshot;
    // ...build `view`...
    root.replaceChildren(view);
    restoreLaneFocus(root);
  },
};
```

### Example 3: tableView, same shape
**File**: `plugins/agile-workflow/work-view/crates/cli/src/board/assets/table.js:282`
```js
export const tableView = {
  id: "table",
  label: "Table",
  mount(root, ctx) {
    const state = ctx.getState();
    const items = sortedItems(filterItems(ctx.visibleItems()), state.snapshot);
    // ...build `view`...
    root.replaceChildren(view);
  },
};
```

Also `dependencyView` at `dependency.js:416`. The `ctx` capability object is
assembled once in `board.js` by spreading the store and adding
`renderCard`/`openDetail`/`closeDetail`; views consume only `ctx.*`.

## When to Use
- Adding any new top-level board visualization: export
  `{ id, label, mount(root, ctx) }` and `registerView(it)` in `views.js`.
- Whenever a render routine fully owns a container's contents and should be
  re-runnable — end it with one `root.replaceChildren(...)`.

## When NOT to Use
- Sub-components within a view (lanes, rows, cards) — those are plain builder
  functions returning a node, not registered views.
- Partial in-place updates where you intentionally want to preserve sibling nodes
  (e.g. focus-restore helpers run *after* `replaceChildren`).

## Common Violations
- A view reaching into the store directly (importing `createBoardStore` or
  `window.boardContext`) instead of using its `ctx` parameter.
- Mutating `root` incrementally across a mount instead of building a detached
  subtree and committing with one `replaceChildren` — risks half-rendered states
  and stale nodes.
- Registering a view object missing `id` or `mount` (caught by `registerView`,
  but should never be written).
