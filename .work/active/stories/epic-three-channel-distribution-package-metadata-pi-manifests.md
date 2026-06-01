---
id: epic-three-channel-distribution-package-metadata-pi-manifests
kind: story
stage: implementing
tags: [plugin, tooling]
parent: epic-three-channel-distribution-package-metadata
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-01
updated: 2026-05-31
---

# Add Pi Package Manifests

## Scope

Add `package.json` files for the supported plugins: `agile-workflow`,
`ux-ui-design`, and `nates-toolkit`. Each package should expose the existing
`skills/` directory through the Pi manifest and carry npm-compatible metadata
that matches the plugin's Claude/Codex identity.

## Acceptance criteria

- [ ] `plugins/agile-workflow/package.json` exists with name
  `@nklisch/pi-agile-workflow`, version `0.9.3`, `keywords` including
  `pi-package`, and `pi.skills: ["./skills"]`.
- [ ] `plugins/ux-ui-design/package.json` exists with name
  `@nklisch/pi-ux-ui-design`, version `0.4.1`, `keywords` including
  `pi-package`, and `pi.skills: ["./skills"]`.
- [ ] `plugins/nates-toolkit/package.json` exists with name
  `@nklisch/pi-nates-toolkit`, version `0.1.1`, `keywords` including
  `pi-package`, and `pi.skills: ["./skills"]`.
- [ ] Deprecated `plugins/workflow/` is not given a Pi package in this story.
  It remains present only for existing Claude/Codex installs.
