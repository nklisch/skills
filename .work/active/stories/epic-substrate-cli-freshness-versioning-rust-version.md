---
id: epic-substrate-cli-freshness-versioning-rust-version
kind: story
stage: implementing
tags: [tooling]
parent: epic-substrate-cli-freshness-versioning
depends_on: []
release_binding: null
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

- [ ] `work-view --version` → stdout `work-view <semver>`, exit 0.
- [ ] `work-view -V` identical.
- [ ] Reported `<semver>` equals `.work-view-version` contents (no stray blank
      line — verify single trailing newline only).
- [ ] `--version` no longer returns exit 1 / "unknown flag".
- [ ] `--help` / `-h` unchanged; HELP lists `--version`.
- [ ] `cargo test -p work-view-cli` passes (new arg unit tests included).

## Notes

- Do NOT attempt to rebuild the 4 cross-compiled `dist/<triple>/work-view`
  binaries — the cross toolchain (cargo-zigbuild/zig for musl, macOS runners
  for darwin) is not present locally; that refresh is a CI `workflow_dispatch`
  action handled separately. Local `cargo build`/`cargo test` for the host
  target is sufficient to validate this story.
