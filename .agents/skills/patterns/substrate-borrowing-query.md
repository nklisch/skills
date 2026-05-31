# Borrowing Read-Only Query Methods on `Substrate`

Read operations over the loaded index are methods on `Substrate` that iterate
`self.items()`, filter, and `collect()` into a `Vec<&'a Item>` (or a bool / `Vec<&'a
str>`), always preserving load order and never mutating or cloning items.

## Rationale
`Substrate` is the Single-Source-of-Truth that both adapters (CLI now, board later) read
through. To keep adapters thin and the core allocation-light, every query returns
*borrows* into the owned `items` vector rather than owned copies, ties the output
lifetime to `&'a self`, and preserves the stable byte-sorted load order so output is
deterministic across adapters. New read capabilities are added as more methods in this
exact shape (some via `impl Substrate` blocks in separate modules — `filter.rs` and
`graph.rs` both extend the same type), which is how the board adapter is expected to
grow the read API without touching load/parse.

## Examples

### Example 1: `query` — structural filter
**File**: `plugins/agile-workflow/work-view/crates/core/src/filter.rs:73`
```rust
pub fn query<'a>(&'a self, f: &Filter) -> Vec<&'a Item> {
    self.items().iter().filter(|item| item_matches(item, f)).collect()
}
```

### Example 2: `dependents_of` — reverse-dependency lookup
**File**: `plugins/agile-workflow/work-view/crates/core/src/graph.rs:50`
```rust
pub fn dependents_of<'a>(&'a self, id: &str) -> Vec<&'a Item> {
    self.items().iter()
        .filter(|item| item.depends_on.iter().any(|d| d == id))
        .collect()
}
```

### Example 3: `children_of` — hierarchy lookup
**File**: `plugins/agile-workflow/work-view/crates/core/src/graph.rs:61`
```rust
pub fn children_of<'a>(&'a self, id: &str) -> Vec<&'a Item> {
    self.items().iter()
        .filter(|item| item.parent.as_deref() == Some(id))
        .collect()
}
```

`unmet_deps` at `graph.rs:33` follows the same shape returning `Vec<&'a str>`;
`deps_satisfied` at `graph.rs:21` is the boolean sibling. The CLI's
`apply_dependency_view` at `actionable.rs:51` is the adapter-side post-filter built in
the same borrow-preserving, order-preserving shape over a `Vec<&'a Item>`.

## When to Use
- Adding any new read/query/traversal capability to the core (e.g. board needs "all
  items in release X grouped by stage"). Add a `pub fn …<'a>(&'a self, …) -> Vec<&'a
  Item>` that filters `self.items()` and preserves load order.
- Adapter-side post-filters that further narrow a `Vec<&'a Item>` — take and return the
  borrowed vec, preserve input order.

## When NOT to Use
- Operations that must mutate the substrate or persist changes — the core is
  deliberately read-only (no `&mut self` query methods; the bundle has none). Mutation
  belongs to skills/scripts that edit `.md` files, not this crate.
- Returning owned `Vec<Item>` (clones) from a query — defeats the borrow design and the
  "load once, query many" model.

## Common Violations
- Sorting or otherwise reordering results inside a query method — breaks the load-order
  guarantee that adapters and golden tests depend on. Order is fixed once, at load
  (byte-sort in `collect_sorted_paths`).
- Cloning items to dodge a lifetime annotation — annotate `<'a>(&'a self, …) -> Vec<&'a
  Item>` instead.
