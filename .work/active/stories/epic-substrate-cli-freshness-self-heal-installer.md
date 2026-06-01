---
id: epic-substrate-cli-freshness-self-heal-installer
kind: story
stage: done
tags: [tooling]
parent: epic-substrate-cli-freshness-self-heal
depends_on: []
release_binding: 0.9.0
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Version-aware installer that writes the source-stamped bash entrypoint

## Scope

Unit 1 of `epic-substrate-cli-freshness-self-heal` — the foundation the hook and
convert call. Two BINDING constraints from the feature's `## Cross-model review
findings`:

- **(P1) Install the source-stamped bash (`scripts/work-view.sh`) as the tracked
  `.work/bin/work-view`** — NOT the platform prebuilt. Portable, version-stamped,
  clean overwrite-in-place diffs.
- **(P0) Make installation version-aware** — compare a candidate's `--version`
  last token to `plugin.json`'s version before trusting it; unrecognized
  `--version` == pre-versioning == stale. Closes the stale-prebuilt reinstall
  loop.

See the parent feature body for the full design (Unit 1), the exact
`plugin_version` / `candidate_is_current` helper sketches, and the dead-prebuilt
removal decision.

## File

`plugins/agile-workflow/scripts/install-work-view.sh`

## Key points

- Add `plugin_version()` (reads `${PLUGIN_ROOT}/.claude-plugin/plugin.json`
  `version` via `sed`, no jq/yq dep) and `candidate_is_current()` (runs
  `<cand> --version`, compares last token to the plugin version; non-zero exit /
  empty / mismatch => not current).
- Install `${PLUGIN_ROOT}/scripts/work-view.sh` → `.work/bin/work-view` via the
  existing atomic `install_and_verify` (tmp + chmod + `--help` smoke + atomic mv
  + dir-guard).
- Fail-Fast postcondition: after install, assert the installed copy's
  `--version` == plugin version; surface loudly if the source stamp drifted.
- Default behavior installs bash on ALL platforms (Linux/Darwin/unknown). Prefer
  removing the project-side prebuilt selection with a comment pointing at the
  shim feature (cruft gate will flag dead code); if judged premature, gate it
  behind an unset-by-default `WORK_VIEW_PREFER_PREBUILT` — but the default MUST
  install bash.
- Update the single stdout status line to a bash-centric form (e.g.
  `installed bash entrypoint (work-view <semver>)`).

## Acceptance criteria

- [x] Installs the bash implementation into `.work/bin/work-view` by default —
      not a platform prebuilt — on every tested platform.
- [x] Installed `.work/bin/work-view --version` reports `plugin.json`'s version
      (post-install Fail-Fast postcondition asserted).
- [x] `plugin_version` reads the version with no jq/yq dependency.
- [x] `candidate_is_current` returns false for non-zero `--version` exit, empty
      output, or a different semver.
- [x] Install stays atomic + idempotent (tmp cleanup, dir-guard, clean
      overwrite-in-place on a second run).

## Tests

Extend `plugins/agile-workflow/scripts/tests/install-work-view.test.sh` (same
assert helpers, temp PLUGIN_ROOT with a `.claude-plugin/plugin.json` fixture and
a stamped `work-view.sh` stub). Cases: version extraction; bash-is-installed (not
prebuilt) across uname overrides; `candidate_is_current` negatives; Fail-Fast
postcondition; existing atomicity/idempotency still pass (update expected status
strings). This file already runs in CI (`build-work-view.yml`
`test-install-helper`).

## Implementation notes

- Files changed: `plugins/agile-workflow/scripts/install-work-view.sh`,
  `plugins/agile-workflow/scripts/tests/install-work-view.test.sh`.
- Tests added/updated: install helper fixture now includes
  `.claude-plugin/plugin.json`; covers `plugin_version`, `candidate_is_current`
  negative cases, bash-not-prebuilt installs across Linux/Darwin/unknown uname
  overrides, postcondition failure, atomic smoke failure, idempotency, and
  destination-directory guard.
- Discrepancies from design: none. Removed the project-side prebuilt selection
  rather than keeping an opt-in path; rationale is that the tracked entrypoint is
  now intentionally bash-only and the shim feature owns any future plugin-side
  prebuilt deference.
- Verification: `bash plugins/agile-workflow/scripts/tests/install-work-view.test.sh`
  (41 passed); real-plugin temp install smoke reported `work-view 0.8.7`;
  `cargo test version` in `plugins/agile-workflow/work-view` passed 11
  version-focused tests.
- Adjacent issues parked: none.

## Review (2026-05-31)

**Verdict**: Approve

**Blockers**: none
**Important**: none
**Nits**: none

**Notes**: Fast-lane story review. Implementation notes include green focused
verification from the implement worker, including the install helper suite,
real-plugin temp install smoke, and version-focused Rust tests.
