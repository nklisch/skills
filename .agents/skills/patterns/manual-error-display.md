# Hand-written error type with manual Display

Errors are declared as a plain `enum`/`struct FooError` (no `thiserror`/
`derive_more`) with a hand-written `impl std::fmt::Display` that matches each
variant to a `write!`, leaving process-exit mapping to the adapter; the core
crate never calls `process::exit`.

## Rationale

`work-view` has explicit binary-size and zero-extra-dependency goals (`args.rs`
notes the arg parser is "Hand-rolled to preserve binary-size goals"). No
error-derive proc-macro crate is pulled in; every error type writes its own
`Display` by matching variants. The split is deliberate: the core crate's
`error.rs` documents that it never calls `process::exit` and the *adapter* (CLI)
owns exit-code mapping — so error types carry message + cause only, and `Display`
is the single rendering surface. Consistency means any new fallible subsystem
(the board added two: `FeedError`, `BoardServerError`) follows the same
hand-rolled shape rather than reaching for a dependency.

## Examples

### Example 1: Core LoadError — manual Display + Error::source, no derive
**File**: `plugins/agile-workflow/work-view/crates/core/src/error.rs:47`
```rust
impl std::fmt::Display for LoadError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LoadError::Io(e) => write!(f, "substrate I/O error: {e}"),
        }
    }
}
```

### Example 2: Board FeedError — same shape, new subsystem
**File**: `plugins/agile-workflow/work-view/crates/cli/src/board/feed.rs:20`
```rust
impl fmt::Display for FeedError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            FeedError::Load(e) => write!(f, "could not load substrate: {e}"),
            FeedError::Json(e) => write!(f, "could not serialize substrate feed: {e}"),
        }
    }
}
```

### Example 3: Board BoardServerError — same shape
**File**: `plugins/agile-workflow/work-view/crates/cli/src/board/server.rs:32`
```rust
impl fmt::Display for BoardServerError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            BoardServerError::Bind { start, message } => write!(
                f, "could not bind 127.0.0.1:{start} or any higher port: {message}"),
            BoardServerError::LocalAddr(e) => write!(f, "could not inspect bound address: {e}"),
            BoardServerError::Serve(e) => write!(f, "server error: {e}"),
        }
    }
}
```

Also `ParseError` at `core/src/error.rs:28` and `UsageError` at `args.rs:91` — 5
occurrences across 3 files; `Cargo.lock`/manifests carry no
`thiserror`/`derive_more`.

## When to Use
- Introducing a fallible subsystem in `work-view`: declare a dedicated `FooError`
  enum/struct and hand-write `impl Display`.
- When the error has a wrapped cause, also implement `std::error::Error::source`
  (see `LoadError`).

## When NOT to Use
- Outside this crate, or in any project that has accepted an error-derive
  dependency — this pattern is specifically about preserving `work-view`'s
  no-extra-dep / small-binary posture.

## Common Violations
- Adding `thiserror`/`#[derive(Error)]` to get `Display` for free (breaks the
  zero-extra-dependency goal).
- Calling `process::exit` from the core crate instead of returning the error for
  the adapter to map to an exit code.
