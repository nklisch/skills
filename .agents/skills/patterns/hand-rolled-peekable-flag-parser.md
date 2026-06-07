# Hand-rolled peekable-iterator flag parser

A dependency-free CLI flag parser: a generic
`parse_args<I: Iterator<Item = String>>(args: I) -> Result<Outcome, UsageError>`
that consumes a `peekable()` iterator in a `while let Some(arg) = iter.next()`
loop with a `flags_done` terminator bool, matches `arg.as_str()` arm-by-arm, and
pulls every flag's value through one shared `next_value(flag, &mut iter)` helper
that peeks and rejects a following `-`-prefixed token as a missing value.

## Rationale

The substrate binaries (`work-view`, `research-view`) hold an explicit
binary-size / zero-extra-dependency posture (`args.rs`: "Hand-rolled to preserve
binary-size goals") and so refuse `clap`/`argh`. The shared replacement is a
deterministic parser, generic over `Iterator<Item = String>`, that returns an
`Outcome` enum (`Help` / `Version` / `Run(opts)`) or a `UsageError` — it never
calls `process::exit` (the adapter's `main` maps the outcome to an exit code,
consistent with `manual-error-display`). The load-bearing structural piece is the
`next_value` peek-reject contract: it is the intentional tightening over bash's
blind `shift 2` — a missing value followed by another flag becomes a `UsageError`
instead of silently consuming the next flag as the value. Making this one shape
recur means a new subcommand parser or a new sibling CLI reuses the exact loop +
helper rather than reaching for a parser crate.

## Examples

All three are byte-identical in signature and body.

### Example 1: work-view main parser
**File**: `plugins/agile-workflow/work-view/crates/cli/src/args.rs:157`
```rust
fn next_value<I: Iterator<Item = String>>(
    flag: &str,
    iter: &mut std::iter::Peekable<I>,
) -> Result<String, UsageError> {
    match iter.peek() {
        None => Err(UsageError(format!("missing value for {flag}"))),
        Some(next) if next.starts_with('-') => Err(UsageError(format!("missing value for {flag}"))),
        Some(_) => Ok(iter.next().expect("peeked Some")),
    }
}
```
Driven by `parse_args` (`args.rs:188`):
`let mut iter = args.peekable(); let mut flags_done = false; while let Some(arg) = iter.next() { ... match arg.as_str() { ... } }`.

### Example 2: work-view board subcommand parser (separate parser, same shape)
**File**: `plugins/agile-workflow/work-view/crates/cli/src/board/mod.rs:51`
```rust
fn next_value<I: Iterator<Item = String>>(
    flag: &str,
    iter: &mut std::iter::Peekable<I>,
) -> Result<String, UsageError> {
    match iter.peek() {
        None => Err(UsageError(format!("missing value for {flag}"))),
        Some(next) if next.starts_with('-') => Err(UsageError(format!("missing value for {flag}"))),
        Some(_) => Ok(iter.next().expect("peeked Some")),
    }
}
```
Driven by `parse_board_args` (`board/mod.rs:62`) with the same `peekable()` +
`flags_done` loop.

### Example 3: research-view parser (the 3rd instance — crosses the crate boundary)
**File**: `plugins/agentic-research/research-view/crates/cli/src/args.rs:153`
```rust
fn next_value<I: Iterator<Item = String>>(
    flag: &str,
    iter: &mut std::iter::Peekable<I>,
) -> Result<String, UsageError> {
    match iter.peek() {
        None => Err(UsageError(format!("missing value for {flag}"))),
        Some(next) if next.starts_with('-') => Err(UsageError(format!("missing value for {flag}"))),
        Some(_) => Ok(iter.next().expect("peeked Some")),
    }
}
```
Driven by `research-view`'s `parse_args` (`args.rs:188`), same `peekable()` +
`flags_done` + `while let Some(arg) = iter.next()` + `match arg.as_str()` shape,
returning `ParseOutcome::{Help, Version, Run}`.

## When to Use

Adding a new flag-driven CLI or subcommand to a `work-view`-style binary that
holds the small-binary / no-parser-dep posture. Copy the `parse_*args` loop and
the `next_value` helper verbatim; add one `match` arm per flag; pull every
value-taking flag's value through `next_value` so missing-value handling stays
uniform. Return an `Outcome` enum (`Help`/`Version`/`Run`) and let `main` own
exit codes.

## When NOT to Use

- A project that has accepted `clap`/`argh` — this pattern exists specifically to
  avoid that dependency.
- Sub-component value extraction inside a single arm — `next_value` is the only
  value-pull seam; don't hand-roll an ad-hoc `iter.next().ok_or(...)` beside it.

## Common Violations

- Using `iter.next().ok_or(...)` directly instead of `next_value`, which silently
  accepts a following `--flag` as the value (the exact bash `shift 2` footgun this
  pattern was built to close).
- Calling `process::exit` from inside the parser instead of returning an
  `Outcome`/`UsageError` for `main` to map.
- Letting a value-taking flag skip the leading-`-` rejection, so `--tier --status`
  consumes `--status` as the tier value.
