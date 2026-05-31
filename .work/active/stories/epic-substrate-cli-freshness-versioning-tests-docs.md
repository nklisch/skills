---
id: epic-substrate-cli-freshness-versioning-tests-docs
kind: story
stage: implementing
tags: [tooling]
parent: epic-substrate-cli-freshness-versioning
depends_on: [epic-substrate-cli-freshness-versioning-rust-version, epic-substrate-cli-freshness-versioning-bash-version, epic-substrate-cli-freshness-versioning-bump-lockstep]
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# `--version` integration + parity tests, SPEC roll-forward

Implements **Unit 4** of `epic-substrate-cli-freshness-versioning`. See the
feature body for full design and rationale.

Depends on all three sibling stories: it tests the Rust flag, the bash flag,
and documents the lockstep contract that `bump-version.sh` maintains.

## Scope

Add integration + parity tests for `--version` across both implementations, and
roll the SPEC "Version strategy" section forward to document the lockstep
contract.

## Work

- In `plugins/agile-workflow/work-view/crates/cli/tests/integration.rs`:
  - `run(["--version"])` → stdout `work-view <ver>\n`, exit 0; `["-V"]` identical.
  - Assert the reported version equals the `.work-view-version` file contents
    (read via `concat!(env!("CARGO_MANIFEST_DIR"), "/.work-view-version")`).
  - Extend the existing bash-vs-Rust parity suite with a `--version` case:
    `bash_run(["--version"])` byte-identical stdout + exit code to the Rust
    binary; skip-if-no-bash like the other parity tests.
- Confirm `.work-view-version` (created in the rust-version story) equals the
  current `plugin.json` version; the equality test fails loudly on drift.
- Roll `plugins/agile-workflow/docs/SPEC.md` "Version strategy" section forward:
  document that both work-view implementations report the plugin semver via
  `--version`; that `bump-version.sh` projects `plugin.json`'s version into
  `.work-view-version` and the `work-view.sh` literal in lockstep; and that dist
  binaries are refreshed by CI before the bump so shipped artifacts self-report.

## Acceptance criteria

- [ ] `cargo test` in `plugins/agile-workflow/work-view` passes, including the
      new `--version` integration cases and the version-equals-file assertion.
- [ ] The bash-vs-Rust `--version` parity test passes when bash is available
      (skips cleanly when bash is absent).
- [ ] `.work-view-version` equals `plugin.json`'s version at landing time.
- [ ] SPEC "Version strategy" documents the `--version` lockstep contract.

## Notes

- ARCHITECTURE.md's `bin/` description is rolled forward by the self-heal
  feature per the epic, NOT here. This story touches only the SPEC "Version
  strategy" section, whose contract this feature creates.
- The current committed dist binaries predate `--version` and will return
  "unknown flag" until CI rebuilds them — per the epic that is meaningfully
  "definitely-stale" and is acceptable interim behavior, not a test failure to
  chase. Do not try to local-cross-build the dist binaries.
