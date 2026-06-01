---
id: epic-three-channel-distribution-pi-agile-extension
kind: feature
stage: drafting
tags: [plugin, tooling]
parent: epic-three-channel-distribution
depends_on: [epic-three-channel-distribution-package-metadata]
release_binding: null
gate_origin: null
created: 2026-06-01
updated: 2026-05-31
---

# Agile Workflow Pi Extension

## Brief

Give the Pi package for `agile-workflow` a native extension layer around the
existing `.work/` substrate. The extension should detect a substrate, surface a
compact queue snapshot, expose `/aw` commands for common work-view operations,
and make the board/queue/autopilot path discoverable from inside Pi.

The extension wraps the existing `work-view` and skill-driven workflow rather
than replacing them. It should stay small and auditable because Pi extensions can
execute code with full system access. This feature does not define the
autopilot subagent policy itself; it should provide the package command surface
that the policy and docs can reference.

## Epic context

- Parent epic: `epic-three-channel-distribution`
- Position in epic: consumer of `epic-three-channel-distribution-package-metadata`.
  It adds Pi-native runtime ergonomics once the package root exists.

## Foundation references

- `plugins/agile-workflow/docs/VISION.md` — portable substrate with
  harness-native ergonomics
- `plugins/agile-workflow/docs/SPEC.md` — distribution and `.work/` contracts
- `docs/research/pi-package-format.md` — Pi extension and package surfaces
