---
id: story-work-view-scope-bash
kind: story
stage: drafting
tags: [tooling]
parent: feature-work-view-scope
depends_on: [story-work-view-scope-cli]
release_binding: null
gate_origin: null
created: 2026-06-03
updated: 2026-06-03
---

# Bash parity: mirror `--scope` + implicit-widen into work-view.sh

## Scope

Keep `scripts/work-view.sh` byte-parity with the Rust binary for `--scope`. Bash
already tier-classifies items (`*/.work/active/*` cases at lines 228, 356), so
this reuses that pattern.

## Changes

- `scripts/work-view.sh`:
  - `want_scope=""` var; parse `--scope) want_scope="$2"; shift 2`.
  - Validate against `active|backlog|releases|archive|all`; unknown → exit 1.
  - Implicit-widen: after arg loop, if `want_scope` empty and
    (`want_release` or `want_gate` non-empty), set `want_scope=all`.
  - In the match loop, add a tier gate derived from the file path
    (`*/.work/releases/*` / `*/.work/archive/*` = terminal; else non-terminal):
    default (empty `want_scope`) keeps non-terminal; `active`/`backlog`/
    `releases`/`archive` keep only that tier; `all` keeps everything.
  - Add `--scope` to `usage()` so `--help` matches the Rust `HELP`.

## Acceptance criteria

- `diff <(work-view ...) <(work-view.sh ...)` identical for: default,
  `--scope all`, `--scope archive`, `--release X`, `--gate Y` (paths + count
  modes; table excluded per existing parity note).
- New parity test cases in `crates/cli/tests/integration.rs` covering
  default-excludes-terminal, `--scope all`, and implicit-widen, following the
  existing `parity_*_matches_bash` harness (skip-if-bash-absent, hard-fail on
  path regression).
- `usage()` and Rust `HELP` `--scope` lines are byte-identical.
