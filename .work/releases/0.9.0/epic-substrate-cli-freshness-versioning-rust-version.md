---
id: epic-substrate-cli-freshness-versioning-rust-version
kind: story
stage: done
tags: [tooling]
parent: epic-substrate-cli-freshness-versioning
depends_on: []
release_binding: 0.9.0
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Rust work-view `--version` flag + compiled-in version stamp

Implements **Unit 1** of `epic-substrate-cli-freshness-versioning`. See the
feature body for full design and rationale.

## Scope

Give the Rust CLI a `--version` / `-V` flag that prints the agile-workflow
**plugin** version (single line `work-view <semver>`, exit 0). The version is
compiled in from a committed generated file so every build path (CI cross-build,
local `cargo test`) gets the right value with no env wiring.

## Work

- Create `plugins/agile-workflow/work-view/crates/cli/.work-view-version`,
  seeded with the **current** plugin.json version (re-read at implement time;
  `0.8.7` at design time). Write it with **no trailing newline**.
- In `crates/cli/src/args.rs`:
  - Add `pub const WORK_VIEW_VERSION: &str = include_str!("../.work-view-version");`
    (relative to `src/args.rs`, so `../` reaches the crate root).
  - Add a `Version` variant to `ParseOutcome`.
  - Add a `"--version" | "-V" => return Ok(ParseOutcome::Version)` arm BEFORE
    the generic `flag.starts_with('-')` unknown-flag arm. Comment that `-v`
    (lowercase) is deliberately reserved for a possible future `--verbose`.
- In `crates/cli/src/main.rs`, handle `ParseOutcome::Version` by
  `println!("work-view {}", args::WORK_VIEW_VERSION); return 0;`.
- Add a `--version` line to the `HELP` const so help/usage stays discoverable
  (kept identical with the bash `usage()` in the sibling bash story).
- Add `args.rs` unit tests: `parse_args(["--version"])` and `["-V"]` →
  `ParseOutcome::Version`; `--version` is NOT a `UsageError`.

## Acceptance criteria

- [x] `work-view --version` → stdout `work-view <semver>`, exit 0.
- [x] `work-view -V` identical.
- [x] Reported `<semver>` equals `.work-view-version` contents (no stray blank
      line — verify single trailing newline only).
- [x] `--version` no longer returns exit 1 / "unknown flag".
- [x] `--help` / `-h` unchanged; HELP lists `--version`.
- [x] `cargo test -p work-view-cli` passes (new arg unit tests included).
- [x] `.work-view-version` contains the bare semver with NO trailing newline; a
      test asserts `!include_str!("../.work-view-version").ends_with('\n')`. This
      pins the single approach (raw `include_str!`, no `.trim()`) and resolves
      the cross-model review's P2#1 (the feature body's `.trim()`-vs-raw
      ambiguity) — the no-newline write contract makes `.trim()` unnecessary.

## Notes

- Do NOT attempt to rebuild the 4 cross-compiled `dist/<triple>/work-view`
  binaries — the cross toolchain (cargo-zigbuild/zig for musl, macOS runners
  for darwin) is not present locally; that refresh is a CI `workflow_dispatch`
  action handled separately. Local `cargo build`/`cargo test` for the host
  target is sufficient to validate this story.

## Implementation notes

- **Files changed**:
  - `plugins/agile-workflow/work-view/crates/cli/.work-view-version` (new) —
    seeded with `0.8.7` (re-read from plugin.json at implement time; unchanged
    from design time). Written with `printf '%s'` so it has NO trailing newline
    (verified: 5 bytes, `xxd` confirms last byte is `0x37`/`7`, not `0x0a`).
  - `plugins/agile-workflow/work-view/crates/cli/src/args.rs` — added
    `pub const WORK_VIEW_VERSION: &str = include_str!("../.work-view-version");`
    (raw `include_str!`, NO `.trim()`, per the cross-model review fix that pins
    the no-newline write contract); added `Version` variant to `ParseOutcome`;
    added `"--version" | "-V" => return Ok(ParseOutcome::Version)` arm placed
    BEFORE the generic `flag.starts_with('-')` unknown-flag arm, with a comment
    reserving lowercase `-v` for a future `--verbose`; added `--version` line to
    the `HELP` const; updated parser doc comment.
  - `plugins/agile-workflow/work-view/crates/cli/src/main.rs` — handle
    `ParseOutcome::Version` with `println!("work-view {}", args::WORK_VIEW_VERSION); return 0;`;
    updated module doc pipeline comment.
- **Tests added** (in `args.rs` `#[cfg(test)] mod tests`):
  - `version_long_returns_version_outcome` — `parse_args(["--version"])` → `Version`.
  - `version_short_returns_version_outcome` — `parse_args(["-V"])` → `Version`.
  - `version_is_not_a_usage_error` — regression guard (both parse `Ok`, not `UsageError`).
  - `version_stamp_has_no_trailing_newline` — asserts
    `!WORK_VIEW_VERSION.ends_with('\n')`, pinning the raw-`include_str!` approach.
  - Also extended the `run()` test helper's match to handle the new `Version`
    arm (exhaustiveness).
- **Verification**:
  - `cargo build -p work-view-cli` — clean.
  - `cargo test -p work-view-cli` — 75 passed, 0 failed (was 72 + 3 new arg
    tests; the no-newline test is the 4th new one — net +4 = 75... counted: 71
    prior arg/integration → 75 total, all green).
  - Live binary smoke test: `work-view --version` → `work-view 0.8.7` exit 0;
    `-V` identical; `xxd` of stdout = `work-view 0.8.7\n` (single trailing
    newline, no blank line); `--help` lists the `--version` line.
- **Discrepancies from design**: none. The crate has no lib target, so the
  story's `cargo test -p work-view-cli` runs the binary + integration tests
  together (75 total) rather than a separate `--lib` pass — same coverage.
- **Adjacent issues parked**: none.
- **Out of scope (left for sibling stories / self-heal feature)**: the 4 dist
  `<triple>/work-view` binaries still predate `--version` and will return
  "unknown flag" until CI rebuilds — expected/acceptable per the epic, NOT a
  failure. No cross-build attempted (toolchain absent). Install-path /
  entrypoint shape untouched (self-heal feature's job).
