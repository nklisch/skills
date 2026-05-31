---
id: epic-substrate-cli-freshness-versioning-tests-docs
kind: story
stage: done
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
  binaries are rebuilt by CI from the bumped source AFTER the bump (not before —
  see the bump-lockstep story's P0#2 ordering correction) so shipped artifacts
  self-report the new version.

## Acceptance criteria

- [x] `cargo test` in `plugins/agile-workflow/work-view` passes, including the
      new `--version` integration cases and the version-equals-file assertion.
- [x] The bash-vs-Rust `--version` parity test passes when bash is available
      (skips cleanly when bash is absent).
- [x] `.work-view-version` equals `plugin.json`'s version at landing time.
- [x] SPEC "Version strategy" documents the `--version` lockstep contract.

## Notes

- ARCHITECTURE.md's `bin/` description is rolled forward by the self-heal
  feature per the epic, NOT here. This story touches only the SPEC "Version
  strategy" section, whose contract this feature creates.
- The current committed dist binaries predate `--version` and will return
  "unknown flag" until CI rebuilds them — per the epic that is meaningfully
  "definitely-stale" and is acceptable interim behavior, not a test failure to
  chase. Do not try to local-cross-build the dist binaries.

## Implementation notes

- **Files changed**:
  - `plugins/agile-workflow/work-view/crates/cli/tests/integration.rs` — added a
    `--version` test section (6 tests) plus a `VERSION_STAMP` const read via
    `include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/.work-view-version"))`:
    - `version_long_prints_stamp_and_exits_zero` — `run(["--version"])` →
      `work-view <stamp>\n`, exit 0.
    - `version_short_matches_long` — `-V` byte-identical to `--version`, exit 0.
    - `version_stamp_has_no_trailing_newline` — integration-level pin of the
      no-newline contract.
    - `version_stamp_equals_plugin_json_version` — reads
      `../../../.claude-plugin/plugin.json` via `include_str!`, extracts the
      `"version"` value with a tiny dependency-free string parse, asserts it
      equals the stamp (fails loudly on drift).
    - `parity_version_matches_bash` / `parity_version_short_matches_bash` —
      extend the existing `bash_run` parity suite; byte-identical stdout + exit
      code, skip-if-no-bash like the other parity cases.
  - `plugins/agile-workflow/docs/SPEC.md` — rolled the "Version strategy" section
    forward with a new "work-view `--version` lockstep" subsection documenting:
    both implementations report the plugin semver via `--version`/`-V`
    (byte-identical, bash POSIX prelude works on 3.2); `bump-version.sh` projects
    `plugin.json` into `.work-view-version` and the `work-view.sh` literal in
    lockstep with a `cargo test` drift guard; and dist binaries are rebuilt by CI
    FROM the bumped source on the POST-bump commit (P0#2 ordering correction).
- **`.work-view-version`**: not re-created here — it was seeded to `0.8.7` in the
  rust-version story. The new equality test confirms it matches `plugin.json`
  (`0.8.7`) at landing time.
- **Tests added**: the 6 integration tests above (no new unit tests — the arg
  unit tests live in the rust-version story).
- **Verification**: `cargo test` across the whole `work-view` workspace — 247
  tests pass, 0 failures (cli unit 75, cli integration 78 incl. the 6 new,
  core 59 + 31, doc-tests 4). The two `--version` parity tests ran (bash 5.3
  available) and passed — byte-identical to the Rust binary, exit 0.
- **Discrepancies from design**: none.
- **Adjacent issues parked**: none. **Flagged for the driver / docs gate (NOT
  fixed here, out of this story's scope):** SPEC.md's separate "## work-view
  binary" section still says dist binaries are committed "before each
  `bump-version.sh` call" — that contradicts the corrected POST-bump ordering.
  Per the story spec I touched ONLY the "Version strategy" section; that
  install/dist-binary description is owned by the self-heal feature's
  roll-forward, so the stale "before" phrasing is left for it (or a docs gate)
  to reconcile.
- **Scope discipline**: ARCHITECTURE.md untouched (self-heal's job). No dist
  cross-build attempted; the committed dist binaries still predate `--version`
  (return "unknown flag" until CI rebuilds) — expected/acceptable, not a failure.
