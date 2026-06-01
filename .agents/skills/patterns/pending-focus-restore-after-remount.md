# Pending focus restore after remount

Before a full remount, event handlers record the control that should regain
focus; after `root.replaceChildren(...)`, the mount restores focus with
`preventScroll`.

## Rationale

The board's full-remount rendering model destroys and recreates controls.
Without an explicit pending-focus handoff, keyboard users lose focus after sort,
filter, and lane-focus interactions. The pattern keeps the render model simple
while preserving interaction continuity.

## Examples

### Example 1: Remember and restore kanban lane focus
**File**: `plugins/agile-workflow/work-view/crates/cli/src/board/assets/kanban.js:183`
```js
function restoreLaneFocus(root) {
  if (!pendingFocusLane) {
    return;
  }
  const target = root.querySelector(`[data-lane="${pendingFocusLane}"]`);
  pendingFocusLane = "";
  target?.focus?.({ preventScroll: true });
}
```

### Example 2: Run restore after replacing the view
**File**: `plugins/agile-workflow/work-view/crates/cli/src/board/assets/kanban.js:229`
```js
root.replaceChildren(view);
restoreLaneFocus(root);
```

### Example 3: Restore table filter focus and caret
**File**: `plugins/agile-workflow/work-view/crates/cli/src/board/assets/table.js:265`
```js
function restoreFilterFocus(root) {
  if (!pendingFilterFocus) {
    return;
  }
  const focusColumn = pendingFilterFocus;
  pendingFilterFocus = null;
  for (const input of root.querySelectorAll(".table-filter-row input")) {
    if (input.dataset.column === focusColumn) {
      input.focus({ preventScroll: true });
      if (typeof input.setSelectionRange === "function") {
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }
  }
}
```

## When to Use
- A control triggers a full remount and the same logical control should remain
  focused afterward.
- The focused DOM node is destroyed by `replaceChildren(...)`.

## When NOT to Use
- The interaction intentionally changes focus destination, opens a modal that
  owns focus, or updates DOM without replacing the focused node.
- There is no keyboard/user focus involved.

## Common Violations
- Calling `root.replaceChildren(...)` from an event handler without recording
  focus first.
- Restoring focus before replacement instead of after it.
- Focusing without checking the recreated target still exists.
