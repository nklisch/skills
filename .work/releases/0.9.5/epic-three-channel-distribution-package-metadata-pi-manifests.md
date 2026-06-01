---
id: epic-three-channel-distribution-package-metadata-pi-manifests
kind: story
stage: done
tags: [plugin, tooling]
parent: epic-three-channel-distribution-package-metadata
depends_on: []
release_binding: 0.9.5
gate_origin: null
created: 2026-06-01
updated: 2026-06-01
---

# Add Pi Package Manifests

## Scope

Add `package.json` files for the supported plugins: `agile-workflow`,
`ux-ui-design`, and `nates-toolkit`. Each package should expose the existing
`skills/` directory through the Pi manifest and carry npm-compatible metadata
that matches the plugin's Claude/Codex identity.

## Acceptance criteria

- [x] `plugins/agile-workflow/package.json` exists with name
  `@nklisch/pi-agile-workflow`, version `0.9.3`, `keywords` including
  `pi-package`, and `pi.skills: ["./skills"]`.
- [x] `plugins/ux-ui-design/package.json` exists with name
  `@nklisch/pi-ux-ui-design`, version `0.4.1`, `keywords` including
  `pi-package`, and `pi.skills: ["./skills"]`.
- [x] `plugins/nates-toolkit/package.json` exists with name
  `@nklisch/pi-nates-toolkit`, version `0.1.1`, `keywords` including
  `pi-package`, and `pi.skills: ["./skills"]`.
- [x] Deprecated `plugins/workflow/` is not given a Pi package in this story.
  It remains present only for existing Claude/Codex installs.

## Implementation notes

- Added Pi package manifests for the three supported plugins only.
- Each manifest uses the scoped package name `@nklisch/pi-<plugin>`, mirrors the
  plugin version, declares `pi-package`, and exposes the shared `./skills`
  directory.
- Left `plugins/workflow/` without Pi package metadata because the plugin is
  deprecated and frozen.

## Verification

- Parsed all three package manifests with `jq`.
- Checked each package version against the corresponding Claude and Codex
  manifest version.
- Confirmed `plugins/workflow/package.json` does not exist.

## Review (2026-06-01)

**Verdict**: Approve

**Blockers**: none
**Important**: none
**Nits**: none

**Notes**: Fast-lane story review. Implementation verification is present and
green; story verified by implement and advanced to `stage: done`.
