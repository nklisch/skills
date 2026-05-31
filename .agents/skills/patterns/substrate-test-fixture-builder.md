# In-Memory Substrate Test Fixture Builder

A test-local helper that materializes a throwaway `.work/` substrate in a `TempDir`
from a slice of `(relative_path, file_contents)` pairs, loads it, and hands back both
the guard and the `Substrate`.

## Rationale
Almost every core/adapter unit test needs a real loaded `Substrate` to exercise
(`load`, `query`, `deps_satisfied`, `apply_dependency_view`). Constructing one requires
the same boilerplate every time: a `TempDir`, a `.work/CONVENTIONS.md` sentinel (so
`find_substrate_root`/`load` recognize the root), `create_dir_all` for each item's
parent, `fs::write`, then `Substrate::load`. The repo standardized on one signature so
a test author writes only the items they care about and never re-derives the directory
dance. Returning the `TempDir` alongside the `Substrate` keeps the temp tree alive for
the test's lifetime (dropping it early would delete the files the `Substrate` paths
point at).

## Examples

### Example 1: graph.rs test module
**File**: `plugins/agile-workflow/work-view/crates/core/src/graph.rs:75`
```rust
fn setup_substrate(items: &[(&str, &str)]) -> (TempDir, Substrate) {
    let tmp = TempDir::new().unwrap();
    let root = tmp.path().to_path_buf();
    fs::create_dir_all(root.join(".work")).unwrap();
    fs::write(root.join(".work/CONVENTIONS.md"), "# Conventions\n").unwrap();
    for (filename, content) in items {
        let path = root.join(".work").join(filename);
        if let Some(p) = path.parent() { fs::create_dir_all(p).unwrap(); }
        fs::write(&path, content).unwrap();
    }
    let (sub, _) = Substrate::load(&root).unwrap();
    (tmp, sub)
}
```

### Example 2: filter.rs test module (verbatim copy)
**File**: `plugins/agile-workflow/work-view/crates/core/src/filter.rs:124`
```rust
fn setup_substrate(items: &[(&str, &str)]) -> (TempDir, Substrate) {
    let tmp = TempDir::new().unwrap();
    let root = tmp.path().to_path_buf();
    fs::create_dir_all(root.join(".work")).unwrap();
    fs::write(root.join(".work/CONVENTIONS.md"), "# Conventions\n").unwrap();
    // ...same body...
    let (sub, _) = Substrate::load(&root).unwrap();
    (tmp, sub)
}
```

### Example 3: actionable.rs test module (CLI crate)
**File**: `plugins/agile-workflow/work-view/crates/cli/src/actionable.rs:84`
```rust
fn setup_substrate(items: &[(&str, &str)]) -> (TempDir, Substrate) {
    let tmp = TempDir::new().unwrap();
    let root = tmp.path().to_path_buf();
    fs::create_dir_all(root.join(".work")).unwrap();
    fs::write(root.join(".work/CONVENTIONS.md"), "# Conventions\n").unwrap();
    for (rel_path, content) in items { /* ...same dance... */ }
    let (sub, _) = Substrate::load(&root).unwrap();
    (tmp, sub)
}
```

A fourth, decomposed variant — `create_substrate(tmp)` + `write_item(dir, filename,
content)` — lives in `crates/core/src/index.rs:299-312`; same intent, split into two
functions because index tests need finer control over the root.

## When to Use
- Any unit test in `work-view-core` or the CLI crate that needs a loaded `Substrate`
  from more than a single hand-rolled file.
- New core modules / the future board adapter: copy this helper into the new
  `#[cfg(test)] mod tests` rather than inventing a different shape.

## When NOT to Use
- Tests that exercise `Substrate::load` error/edge behavior directly (root I/O failure,
  missing tier dirs) — those need the lower-level `write_item`/`create_substrate` split
  so they can omit `CONVENTIONS.md` or a tier dir deliberately (see index.rs).
- Integration tests against the committed golden fixtures — those use the on-disk
  `tests/fixtures/` tree, not a `TempDir` (see cargo-manifest-fixture-root).

## Common Violations
- Returning only the `Substrate` and dropping the `TempDir`: the temp dir is deleted at
  end of statement and every `item.path` dangles. Always return `(TempDir, Substrate)`
  and bind the guard (`let (_tmp, sub) = ...`).
- Forgetting the `.work/CONVENTIONS.md` sentinel: `load` will still scan, but
  `find_substrate_root` won't anchor there, so root-detection tests silently pass
  against the wrong dir.
