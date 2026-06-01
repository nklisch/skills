---
id: epic-substrate-cli-freshness-versioning-bash-version
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

# bash fallback work-view `--version` flag + lockstep literal

Implements **Unit 2** of `epic-substrate-cli-freshness-versioning`. See the
feature body for full design and rationale.

## Scope

Give the bash fallback (`scripts/work-view.sh`) a `--version` / `-V` flag whose
output is byte-identical to the Rust binary's: `work-view <semver>`, exit 0.
The semver is a literal kept in lockstep with `plugin.json` by
`bump-version.sh` (sibling story).

## Work

- In `plugins/agile-workflow/scripts/work-view.sh`:
  - Add a top-level literal near the usage section:
    `WORK_VIEW_VERSION="0.8.7"` (current plugin version at design time; comment
    "Kept in lockstep with plugin.json by scripts/bump-version.sh. Do not
    hand-edit.").
  - Add a `--version|-V) printf 'work-view %s\n' "$WORK_VIEW_VERSION"; exit 0 ;;`
    arm to the `while`/`case` loop, BEFORE the generic `-*` unknown-flag arm.
    It must short-circuit BEFORE substrate detection (like `--help` does), so
    `--version` works outside a substrate.
  - **POSIX-safe `--version` prelude BEFORE the Bash-4 guard / re-exec block
    (cross-model review finding P2#2).** The script currently enforces Bash 4
    (and tries to re-exec under a modern bash) near the top, before arg parsing.
    On a host with only macOS system bash 3.2 and no modern bash to re-exec
    into, `work-view --version` would hit the "requires bash 4" error and exit
    non-zero — so the self-heal hook would read a failure instead of a version
    and treat the tool as broken/stale. Add a minimal POSIX-safe check at the
    very top (before the Bash-4 guard) that, if the first arg is `--version`/`-V`,
    prints `work-view $WORK_VIEW_VERSION` and exits 0. Keep `WORK_VIEW_VERSION`
    defined above that prelude. This matters specifically because self-heal makes
    the bash implementation the load-bearing portable entrypoint (see the
    self-heal feature).
  - Add a `--version` line to `usage()` so the help text stays identical with
    the Rust `HELP` const.

## Acceptance criteria

- [x] `bash work-view.sh --version` → `work-view <semver>`, exit 0.
- [x] `-V` identical.
- [x] Works from a cwd with no `.work/CONVENTIONS.md` (no exit 2).
- [x] `--version` works under bash 3.2 (POSIX prelude runs before the Bash-4
      guard) — exit 0, correct output, no "requires bash 4" error.
- [x] `WORK_VIEW_VERSION` equals the current `plugin.json` version.
- [x] `usage()` lists `--version`.
- [x] Output is byte-identical to the Rust binary (`work-view <semver>\n`) —
      validated by the parity test in the tests-docs story.

## Notes

- Output format must exactly match the Rust binary so the existing
  bash-vs-Rust parity suite (and the new `--version` parity case) stays green.

## Implementation notes

- **Files changed**: `plugins/agile-workflow/scripts/work-view.sh` only.
  - Added `WORK_VIEW_VERSION="0.8.7"` literal at the top (right after
    `set -euo pipefail`, line 17), with the lockstep comment "Kept in lockstep
    with plugin.json by scripts/bump-version.sh. Do not hand-edit."
  - Added a **POSIX-safe `--version` prelude BEFORE the Bash-4 guard** (line 31,
    guard is line 39): `case "${1:-}" in --version|-V) printf 'work-view %s\n'
    "$WORK_VIEW_VERSION"; exit 0 ;; esac`. This honors cross-model review P2#2:
    on a host with only macOS system bash 3.2 and no modern bash to re-exec
    into, `--version` short-circuits and exits 0 instead of hitting the
    "requires bash 4" error (which would make a self-heal probe read the tool as
    broken). `WORK_VIEW_VERSION` is defined above the prelude as required.
  - Added a `--version|-V) printf 'work-view %s\n' "$WORK_VIEW_VERSION"; exit 0 ;;`
    arm to the main `while`/`case` loop (line 268), placed right after the
    `--help|-h` arm and BEFORE the generic `-*` unknown-flag arm. Short-circuits
    before substrate detection (like `--help`), and covers `--version` in any
    arg position once running under bash 4+. Comment reserves lowercase `-v` for
    a future `--verbose`.
  - Added a `--version` line to `usage()`, byte-identical wording to the Rust
    `HELP` const's new line (`  --version            Print the work-view version and exit`).
- **Tests added**: none in this story — the `--version` parity / integration
  tests are the tests-docs story's scope. Verification here was manual + the
  existing Rust parity suite (which runs this bash script) staying green.
- **Verification**:
  - `bash -n work-view.sh` — syntax OK.
  - `--version` and `-V` from a non-substrate cwd (`/tmp`) → `work-view 0.8.7`,
    exit 0 (no exit-2, no substrate needed).
  - `xxd` of stdout = `work-view 0.8.7\n`; `diff` against the Rust binary's
    `--version` stdout = identical (byte-parity confirmed), both exit 0.
  - `usage()` lists `--version`.
  - Bash-3.2 safety: no real 3.2 available locally (host bash is 5.3), so
    validated the prelude's constructs under `bash --posix` and `sh` (POSIX
    mode) — assignment, `${1:-}`, `case`/`esac`, `printf` all work, none are
    bash-4-only. Prelude precedes the guard by line number (17/31 vs 39), so it
    exits before `BASH_VERSINFO` is ever checked. `cargo test -p work-view-cli`
    (which exercises the bash script via the parity harness): 75 + 72 pass.
- **Discrepancies from design**: none. The design's snippet placed only the
  loop arm; the cross-model review fix (already folded into this story's spec)
  additionally required the top-of-file POSIX prelude, which is implemented.
- **Adjacent issues parked**: none.
- **Out of scope**: install-work-view.sh selection logic and `.work/bin/work-view`
  entrypoint shape untouched (self-heal feature's job). Did not run
  bump-version.sh. The `0.8.7` literal will be kept current by the
  bump-lockstep story going forward.
