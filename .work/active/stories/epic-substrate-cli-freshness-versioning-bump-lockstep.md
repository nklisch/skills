---
id: epic-substrate-cli-freshness-versioning-bump-lockstep
kind: story
stage: done
tags: [tooling]
parent: epic-substrate-cli-freshness-versioning
depends_on: [epic-substrate-cli-freshness-versioning-rust-version, epic-substrate-cli-freshness-versioning-bash-version]
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# `bump-version.sh` lockstep + dist-refresh ordering guard

Implements **Unit 3** of `epic-substrate-cli-freshness-versioning`. See the
feature body for full design and rationale.

Depends on the rust-version and bash-version stories because it edits the
version-projection targets they create (`.work-view-version`, the
`WORK_VIEW_VERSION=` literal) — sequencing avoids editing literals that don't
exist yet.

## Scope

Extend `scripts/bump-version.sh` (repo root) so that when bumping the
`agile-workflow` plugin it also projects the new semver into both work-view
implementations in lockstep, and reminds the operator that the 4 dist binaries
are refreshed by CI (not by this script).

## Work

- In `scripts/bump-version.sh`, after `$new` is computed, guarded by
  `[[ "$plugin" == "agile-workflow" ]]`:
  - `printf '%s' "$new" > plugins/agile-workflow/work-view/crates/cli/.work-view-version`
    then `git add` it (no trailing newline).
  - `sed -i.bak -E 's/^WORK_VIEW_VERSION="[^"]*"/WORK_VIEW_VERSION="'"$new"'"/'`
    on `plugins/agile-workflow/scripts/work-view.sh`, `rm -f` the `.bak`,
    `git add` the script.
- Add a stderr NOTE (also guarded to `agile-workflow`) about dist-binary
  ordering. **CORRECTED ORDERING (cross-model review finding P0#2):** the
  version stamp is written into source BY THIS SCRIPT, and CI builds the dist
  binaries FROM source — so the dist rebuild must run on the **POST-bump**
  commit, not before it. A pre-bump CI run compiles the OLD `.work-view-version`
  and ships version-mismatched binaries. The NOTE must therefore instruct: let
  this script stamp + commit + push the bump, THEN trigger the "Build work-view
  binaries" workflow (`workflow_dispatch`, `commit_binaries=true`) against the
  bumped commit so rebuilt binaries self-report the new semver. There is an
  unavoidable window between the bump commit and the CI binary commit where the
  committed dist binaries lag the stamped version — acceptable ONLY because the
  project-side entrypoint is the source-stamped bash implementation (see the
  self-heal feature) and install selection is version-aware; the prebuilt is
  never blindly trusted when its `--version` mismatches the plugin.
- The existing single `git commit` at the end captures the staged files
  alongside the two `plugin.json`s (the script already relies on staged-then-
  commit for `bump_json`). The existing dirty-plugin-dir guard already covers
  these paths (they live under `plugins/agile-workflow/`).

## Acceptance criteria

- [x] After `./scripts/bump-version.sh agile-workflow patch`,
      `.work-view-version` holds the new semver (no trailing newline), staged
      and committed. (Validated via scratch-copy dry run, NOT a live bump.)
- [x] `work-view.sh`'s `WORK_VIEW_VERSION` literal equals the new semver, staged
      and committed. (Scratch-copy dry run; surgical anchored sed.)
- [x] The final commit includes both work-view files plus both `plugin.json`s.
      (`git add` of both work-view paths precedes the existing unrestricted
      `git commit` at line 118.)
- [x] The dist-refresh NOTE prints only for `agile-workflow` and states the
      POST-bump rebuild ordering (rebuild from the bumped commit, not before it).
- [x] Bumping a different plugin leaves work-view files untouched. (Both the
      projection and the NOTE are guarded by `[[ "$plugin" == "agile-workflow" ]]`.)

## Notes

- `bump-version.sh` auto-commits AND pushes. Do NOT run it as a live "test" —
  validate the `printf`/`sed` projection block against a scratch copy of the
  files first, confirm the resulting contents, then let the next real bump
  exercise it.
- Verify `sed -i.bak` behavior on the implementing platform (GNU vs BSD sed);
  the `-i.bak ... && rm .bak` form is portable across both.

## Implementation notes

- **Files changed**: `scripts/bump-version.sh` (repo root) only.
  - After the existing `bump_json` calls (and before the `echo` summary), added a
    `[[ "$plugin" == "agile-workflow" ]]`-guarded projection block:
    `printf '%s' "$new" > .../crates/cli/.work-view-version` (NO trailing
    newline) + `git add`; then a surgical anchored
    `sed -i.bak -E 's/^WORK_VIEW_VERSION="[^"]*"/WORK_VIEW_VERSION="'"$new"'"/'`
    on `scripts/work-view.sh` + `rm -f` the `.bak` + `git add`.
  - After the existing `git commit` and before `git push`, added a second
    `agile-workflow`-guarded stderr NOTE stating the **POST-bump** dist-rebuild
    ordering (cross-model review P0#2): the stamp is written into source by this
    script, CI builds dist binaries FROM that source, so the
    `workflow_dispatch`/`commit_binaries=true` rebuild must run on the bumped
    commit — never before it. The NOTE explains the interim lag window is
    acceptable because the project entrypoint is the source-stamped bash impl and
    install selection is version-aware.
- **Tests added**: none (shell script; no unit harness). Validated by:
  - `bash -n scripts/bump-version.sh` — syntax OK.
  - **Scratch-copy dry run** (never ran the live script — it commits + pushes):
    seeded copies of `.work-view-version` (`0.8.7`) and `work-view.sh`, ran the
    exact `printf`/`sed` block with `new=0.8.8`. Result: `.work-view-version` =
    bare `0.8.8` (5 bytes, no newline, `xxd`-confirmed); `WORK_VIEW_VERSION="0.8.8"`
    in the scratch bash script; `.bak` removed; scratch script `--version`
    reports `0.8.8`.
  - `sed` surgicality: `diff` shows ONLY the anchored assignment line (17)
    changes; the two `"$WORK_VIEW_VERSION"` printf-arm usages (lines 31, 268) are
    untouched.
  - Guard logic: both the projection and the NOTE sit inside
    `[[ "$plugin" == "agile-workflow" ]]` (2 such guards in the script); a
    non-agile-workflow bump touches no work-view files and prints no NOTE.
  - Commit capture: the existing `git commit` (line 118) has no path restriction
    and follows all four `git add`s (2x plugin.json via `bump_json`, plus the two
    work-view paths), so the single bump commit captures everything.
  - The pre-existing dirty-plugin-dir guard (checks `plugins/$plugin/` BEFORE any
    write) still protects these paths since they live under
    `plugins/agile-workflow/`.
- **Discrepancies from design**: none of substance. The story/feature snippet
  put the NOTE "before/around git push"; implemented it AFTER the commit and
  BEFORE the push, which matches the "after the bump" intent and the corrected
  POST-bump ordering. `sed -i.bak ... && rm` verified portable on this GNU-sed
  host; the `-i.bak` form also satisfies BSD/macOS sed.
- **Adjacent issues parked**: none.
- **Scope discipline**: did NOT change the install path or entrypoint shape
  (self-heal feature's job). bump-version.sh was NOT run live; no push.
