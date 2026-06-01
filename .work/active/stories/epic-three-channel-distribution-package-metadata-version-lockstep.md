---
id: epic-three-channel-distribution-package-metadata-version-lockstep
kind: story
stage: implementing
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

- [ ] `scripts/bump-version.sh` refuses to bump a plugin when its existing
  `package.json` version differs from `.claude-plugin/plugin.json`.
- [ ] `scripts/bump-version.sh` updates and stages `plugins/<plugin>/package.json`
  when it exists.
- [ ] Existing agile-workflow work-view version projection behavior remains
  unchanged.
- [ ] `plugins/agile-workflow/scripts/tests/bump-version.test.sh` covers package
  version bumping for agile-workflow and a non-agile-workflow plugin.
- [ ] The bump-version shell test passes locally.
