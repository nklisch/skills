---
id: epic-substrate-board-host-subcommand
kind: story
stage: implementing
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

- [ ] `work-view board --help` and `work-view serve --help` print board help and
      exit 0.
- [ ] Existing `work-view --help`, query filters, output modes, and exit codes
      remain unchanged.
- [ ] Unknown board flags return usage error exit 1.
- [ ] Board parsing has unit coverage for aliases, missing values, and unknown
      flags.

