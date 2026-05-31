---
id: epic-substrate-cli-freshness-versioning-bash-version
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

- [ ] `bash work-view.sh --version` → `work-view <semver>`, exit 0.
- [ ] `-V` identical.
- [ ] Works from a cwd with no `.work/CONVENTIONS.md` (no exit 2).
- [ ] `--version` works under bash 3.2 (POSIX prelude runs before the Bash-4
      guard) — exit 0, correct output, no "requires bash 4" error.
- [ ] `WORK_VIEW_VERSION` equals the current `plugin.json` version.
- [ ] `usage()` lists `--version`.
- [ ] Output is byte-identical to the Rust binary (`work-view <semver>\n`) —
      validated by the parity test in the tests-docs story.

## Notes

- Output format must exactly match the Rust binary so the existing
  bash-vs-Rust parity suite (and the new `--version` parity case) stays green.
