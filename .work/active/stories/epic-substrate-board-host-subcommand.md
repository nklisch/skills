---
id: epic-substrate-board-host-subcommand
kind: story
stage: done
tags: [tooling]
parent: epic-substrate-board-host
depends_on: []
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Board host subcommand dispatch

Implements Unit 1 of `epic-substrate-board-host`.

## Scope

Add the `work-view board` primary entry and `work-view serve` alias to the
existing binary without changing the current query-mode parser or output
contract.

## Work

- Add a `board` module under
  `plugins/agile-workflow/work-view/crates/cli/src/board/`.
- In `main.rs`, split on the first argument before the existing `parse_args`
  path. `board` and `serve` dispatch to `board::run_board`; all other invocations
  use the existing query behavior.
- Implement board options:
  - `--port <n>` default `8181`
  - `--no-open`
  - `--print` alias for `--no-open`
  - `--once` for integration-test one-request mode
  - `--help` / `-h`

## Acceptance Criteria

- [x] `work-view board --help` and `work-view serve --help` print board help and
      exit 0.
- [x] Existing `work-view --help`, query filters, output modes, and exit codes
      remain unchanged.
- [x] Unknown board flags return usage error exit 1.
- [x] Board parsing has unit coverage for aliases, missing values, and unknown
      flags.

## Implementation notes

- Files changed:
  `plugins/agile-workflow/work-view/crates/cli/src/main.rs`,
  `plugins/agile-workflow/work-view/crates/cli/src/board/mod.rs`,
  `plugins/agile-workflow/work-view/crates/cli/tests/integration.rs`.
- Tests added: board parser unit tests for defaults, aliases, missing/invalid
  `--port`, unknown flags, help, `--once`, and positionals; integration tests
  for `board --help`, `serve --help`, unknown board flags, and board no-substrate
  exit code.
- Discrepancies from design: none. `run_board` is the designed Unit 1
  placeholder; it validates substrate root discovery, reports that the server is
  not implemented yet, and returns nonzero without claiming a server exists.
- Adjacent issues parked: none.
- Verification: `cargo test -p work-view-cli` passed. Full workspace
  `cargo test` passed crate unit/integration tests but failed during unrelated
  `work-view-core` doctest linking with `ld terminated with signal 7 [Bus
  error]`; retrying `cargo test -p work-view-core --doc` reproduced the same
  linker crash before test code ran.

## Review (2026-05-31)

**Verdict**: Approve

**Blockers**: none
**Important**: none
**Nits**: none

**Notes**: Fast-lane story review under autopilot. Implementation notes recorded
green scoped verification (`cargo test -p work-view-cli`); host reran the same
scoped command successfully. Full workspace doctest linker crash is unrelated to
this story and was not treated as a blocker for the subcommand slice.
