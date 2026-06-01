---
id: epic-three-channel-distribution-package-metadata-version-lockstep
kind: story
stage: done
tags: [tooling]
parent: epic-three-channel-distribution-package-metadata
depends_on: [epic-three-channel-distribution-package-metadata-pi-manifests]
release_binding: null
gate_origin: null
created: 2026-06-01
updated: 2026-05-31
---

# Extend Version Lockstep To Pi Packages

## Scope

Update `scripts/bump-version.sh` and its tests so plugin bumps validate and
update the Pi `package.json` version whenever a package manifest exists. The
script should continue to support deprecated or external plugin roots that do
not have Pi package metadata.

## Acceptance criteria

- [x] `scripts/bump-version.sh` refuses to bump a plugin when its existing
  `package.json` version differs from `.claude-plugin/plugin.json`.
- [x] `scripts/bump-version.sh` updates and stages `plugins/<plugin>/package.json`
  when it exists.
- [x] Existing agile-workflow work-view version projection behavior remains
  unchanged.
- [x] `plugins/agile-workflow/scripts/tests/bump-version.test.sh` covers package
  version bumping for agile-workflow and a non-agile-workflow plugin.
- [x] The bump-version shell test passes locally.

## Implementation notes

- Extended `scripts/bump-version.sh` to treat `plugins/<plugin>/package.json`
  as lockstep channel metadata when it exists.
- Added a pre-bump package version mismatch guard before any metadata is
  modified.
- Reused the existing `bump_json` projection so package metadata is updated and
  staged with the Claude/Codex manifests.
- Expanded the bump-version shell test fixtures and assertions to cover package
  version updates for agile-workflow and a non-agile-workflow plugin, a package
  mismatch failure case, and a no-package plugin compatibility path.

## Verification

- `bash plugins/agile-workflow/scripts/tests/bump-version.test.sh` passed:
  39 assertions, 0 failures.

## Review (2026-06-01)

**Verdict**: Approve

**Blockers**: none
**Important**: none
**Nits**: none

**Notes**: Fast-lane story review. Implementation verification is present and
green; story verified by implement and advanced to `stage: done`.
