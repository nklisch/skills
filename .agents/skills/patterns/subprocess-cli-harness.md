# Subprocess CLI Test Harness with Graceful Parity Skip

Drive the compiled binary (and, for parity, the bash reference) as a real subprocess
through a `fn run(args: &[&str]) -> (String, String, i32)`-shaped helper that returns
`(stdout, stderr, exit_code)`; comparison tests fetch the reference output through an
`Option`-returning runner and skip cleanly when the reference is unavailable.

## Rationale
The CLI's contract is its *observable* behavior — stdout bytes, stderr diagnostics, and
exit code — and `work-view` exists specifically to be byte-for-byte compatible with the
legacy `work-view.sh`. The only faithful way to test that is to launch the actual binary
(`CARGO_BIN_EXE_work-view`) and the actual script as processes and diff their three
observable outputs. The codebase standardized one tuple shape `(stdout, stderr,
exit_code)` for every runner so assertions read uniformly, and made the bash reference
runner return `Option<(String, i32)>` so a platform without bash degrades to a clean
skip — while still hard-failing if bash exists but the script path regressed.

## Examples

### Example 1: primary binary runner
**File**: `plugins/agile-workflow/work-view/crates/cli/tests/integration.rs:37`
```rust
fn run(args: &[&str]) -> (String, String, i32) {
    let out = Command::new(bin!()).args(args).current_dir(fixture_root())
        .output().expect("failed to run work-view");
    (String::from_utf8_lossy(&out.stdout).into_owned(),
     String::from_utf8_lossy(&out.stderr).into_owned(),
     out.status.code().unwrap_or(-1))
}
```

### Example 2: second runner for a different fixture (same tuple shape)
**File**: `plugins/agile-workflow/work-view/crates/cli/tests/integration.rs:51`
```rust
fn run_malformed(args: &[&str]) -> (String, String, i32) {
    let out = Command::new(bin!()).args(args).current_dir(malformed_fixture_root())
        .output().expect("failed to run work-view in malformed fixture");
    (/* stdout */, /* stderr */, out.status.code().unwrap_or(-1))
}
```

### Example 3: bash reference runner with graceful skip + hard-fail-on-regression
**File**: `plugins/agile-workflow/work-view/crates/cli/tests/integration.rs:853`
```rust
fn bash_run(args: &[&str]) -> Option<(String, i32)> {
    let bash_check = std::process::Command::new("bash").arg("--version").output().ok()?;
    if !bash_check.status.success() { return None; }              // skip: no bash
    let script = std::path::Path::new(BASH_SCRIPT);
    assert!(script.is_file(), "bash is available but the parity script is MISSING ...");  // hard fail
    let out = std::process::Command::new("bash").arg(script).args(args)
        .current_dir(fixture_root()).output().ok()?;
    Some((String::from_utf8_lossy(&out.stdout).into_owned(), out.status.code().unwrap_or(-1)))
}
```

The skip side is then applied at ~18 call sites via a uniform `let-else`:
```rust
let Some((bash_stdout, bash_code)) = bash_run(&["--ready", "--paths"]) else {
    eprintln!("skipping bash parity: bash unavailable on this platform");
    return;
};
assert_eq!(bin_code, bash_code, ...);
assert_eq!(bin_stdout, bash_stdout, ...);
```
(See `parity_ready_paths_matches_bash` and the full parity matrix at `:889`–`:1218`.)

## When to Use
- Testing the CLI's exit codes, stdout/stderr separation, BrokenPipe handling, or any
  externally observable contract — drive the real binary, don't call internal functions.
- Asserting byte-parity against an external reference implementation — return its output
  as an `Option` and skip via `let-else` when the reference tool genuinely isn't
  installed.

## When NOT to Use
- Pure logic (arg parsing, filtering, rendering to a buffer). Those are faster and
  clearer as in-crate unit tests against `parse_args`, `query`, and `render(_, _, &mut
  Vec<u8>)` — the bundle keeps those out of the subprocess harness.

## Common Violations
- Silently `return`ing (skipping) when the *reference path* is missing rather than the
  *reference tool* — that lets a path regression disable the parity suite invisibly.
  Skip only on genuine tool absence; `assert!` otherwise.
- Letting each runner return a different tuple/struct shape, forcing per-test
  destructuring. Keep `(stdout, stderr, exit_code)` (binary) and `(stdout, exit_code)`
  (reference) uniform.
