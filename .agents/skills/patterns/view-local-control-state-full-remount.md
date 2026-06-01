# View-local control state with full remount

Interactive board controls keep transient view state in the module, update it
in event handlers, then remount the owning view through the existing
`{ mount(root, ctx) }` contract.

## Rationale

Board views own their render root and commit with `root.replaceChildren(...)`.
For sort mode, lane focus, graph layout/tool/zoom, and terminal-branch toggles,
the consistent update path is to mutate module-local view state and call the
same view mount again instead of introducing partial DOM patching or global
store fields.

## Examples

### Example 1: Kanban lane focus
**File**: `plugins/agile-workflow/work-view/crates/cli/src/board/assets/kanban.js:120`
```js
button.addEventListener("click", () => {
  focusedLane = focusedLane === laneKey ? "" : laneKey;
  pendingFocusLane = laneKey;
  kanbanView.mount(root, ctx);
});
```

### Example 2: Table column filters
**File**: `plugins/agile-workflow/work-view/crates/cli/src/board/assets/table.js:157`
```js
input.addEventListener("input", () => {
  if (input.value.trim() === "") {
    columnFilters.delete(column.id);
  } else {
    columnFilters.set(column.id, input.value);
  }
  pendingFilterFocus = column.id;
  tableView.mount(root, ctx);
});
```

### Example 3: Dependency layout controls
**File**: `plugins/agile-workflow/work-view/crates/cli/src/board/assets/dependency.js:1049`
```js
button.addEventListener("click", () => {
  activeLayoutId = layout.id;
  dependencyView.mount(root, ctx);
});
```

## When to Use
- Transient, view-owned controls whose state does not need to survive app reloads
  or coordinate with other views.
- Controls that already live inside a registered board view and can re-render
  by calling that same view's `mount(root, ctx)`.

## When NOT to Use
- Global board state such as selected item, persisted filters, theme, or active
  top-level view; those belong in `createBoardStore`.
- Cross-view coordination where one view's event needs to change another view's
  state.

## Common Violations
- Adding view-local controls to the persisted store just to force a render.
- Mutating individual rendered nodes after state changes instead of remounting
  through the view contract.
- Calling another view's mount from inside a view-local control.
