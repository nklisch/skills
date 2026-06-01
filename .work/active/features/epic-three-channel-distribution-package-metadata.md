---
id: epic-three-channel-distribution-package-metadata
kind: feature
stage: drafting
tags: [plugin, tooling]
parent: epic-three-channel-distribution
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-01
updated: 2026-05-31
---

# Pi Package Metadata And Version Lockstep

## Brief

Add Pi package metadata for each supported plugin so `agile-workflow`,
`ux-ui-design`, and `nates-toolkit` ship to Pi from the same plugin roots that
already serve Claude Code and OpenAI Codex. This feature covers the mechanical
package surface: `package.json` identity, `pi` manifest resource pointers,
gallery/discoverability metadata, and any minimal package files needed for Pi to
load shared skills.

It also extends the version gate so Claude manifests, Codex manifests, and Pi
package metadata stay in lockstep. It does not implement Pi-native
agile-workflow commands or subagent delegation policy; those are separate
features that consume the package surface created here.

## Epic context

- Parent epic: `epic-three-channel-distribution`
- Position in epic: foundation feature — Pi packages need stable metadata before
  native extensions or install docs can be wired around them.

## Foundation references

- `docs/SPEC.md` — plugin manifests and package metadata
- `docs/ARCHITECTURE.md` — plugin anatomy and distribution wiring
- `docs/research/pi-package-format.md` — current Pi package contract
