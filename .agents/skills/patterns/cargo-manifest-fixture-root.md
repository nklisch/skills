# Compile-Time Fixture-Root Resolver

Resolve a committed test fixture (or sibling script) to an absolute path at compile
time with `concat!(env!("CARGO_MANIFEST_DIR"), "/relative/path")`, wrapped in a small
`fn …_root() -> &'static Path` accessor.

## Rationale
Integration tests run with an unspecified working directory, so fixtures must be
addressed absolutely. `CARGO_MANIFEST_DIR` is the one anchor Cargo guarantees at compile
time, and `concat!` keeps the result a `&'static str` (no allocation, no runtime
`Path::join`). Naming each as a tiny `_root()` function gives every test one canonical,
typo-proof handle to a fixture tree, and makes the "where do fixtures live" convention
discoverable. The same construct anchors the bash script for the parity suite — proving
its reach beyond fixtures.

## Examples

### Example 1: golden fixture root (core integration)
**File**: `plugins/agile-workflow/work-view/crates/core/tests/integration.rs:16`
```rust
fn golden_root() -> &'static Path {
    Path::new(concat!(env!("CARGO_MANIFEST_DIR"), "/tests/fixtures/golden"))
}
```

### Example 2: precedence fixture root (core integration)
**File**: `plugins/agile-workflow/work-view/crates/core/tests/integration.rs:27`
```rust
fn precedence_root() -> &'static Path {
    Path::new(concat!(env!("CARGO_MANIFEST_DIR"), "/tests/fixtures/precedence"))
}
```

### Example 3: bash script path for parity suite (cli integration)
**File**: `plugins/agile-workflow/work-view/crates/cli/tests/integration.rs:1787`
```rust
const BASH_SCRIPT: &str =
    concat!(env!("CARGO_MANIFEST_DIR"), "/../../../scripts/work-view.sh");
```

Also `fixture_root()` at `crates/cli/tests/integration.rs:24` and
`malformed_fixture_root()` at `:35` — five occurrences total.

## When to Use
- Any integration test (or the future board adapter's tests) that reads a committed
  fixture tree or a sibling repo artifact, since the test's CWD is not guaranteed.
- Wrap the literal in a named `_root()` accessor (or `const` for non-`Path` strings) so
  every reference goes through one place.

## When NOT to Use
- Throwaway substrates built at runtime — use the substrate-test-fixture-builder
  `TempDir` helper instead.
- Paths that must survive being moved between crates — a long `../../../` chain (as in
  `BASH_SCRIPT`) is brittle; the suite mitigates this with a hard-failure assertion that
  the resolved path exists rather than silently skipping (see subprocess-cli-harness).

## Common Violations
- Using a relative path or `std::env::current_dir()` to find a fixture — passes when run
  via `cargo test` from the crate dir, breaks under other working directories or test
  runners.
- Silently skipping a test when a `CARGO_MANIFEST_DIR`-relative path is missing instead
  of failing loudly: a path-constant regression then disables coverage invisibly. The
  bundle's `bash_run` explicitly `assert!`s the script exists when bash is present.
