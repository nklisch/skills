---
id: epic-substrate-cli-freshness-versioning-bump-lockstep
kind: story
stage: implementing
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

- [ ] After `./scripts/bump-version.sh agile-workflow patch`,
      `.work-view-version` holds the new semver (no trailing newline), staged
      and committed.
- [ ] `work-view.sh`'s `WORK_VIEW_VERSION` literal equals the new semver, staged
      and committed.
- [ ] The final commit includes both work-view files plus both `plugin.json`s.
- [ ] The dist-refresh NOTE prints only for `agile-workflow` and states the
      POST-bump rebuild ordering (rebuild from the bumped commit, not before it).
- [ ] Bumping a different plugin leaves work-view files untouched.

## Notes

- `bump-version.sh` auto-commits AND pushes. Do NOT run it as a live "test" —
  validate the `printf`/`sed` projection block against a scratch copy of the
  files first, confirm the resulting contents, then let the next real bump
  exercise it.
- Verify `sed -i.bak` behavior on the implementing platform (GNU vs BSD sed);
  the `-i.bak ... && rm .bak` form is portable across both.
