---
id: story-pi-sandbox-pi-only-foundation-doc-forward
kind: story
stage: done
tags: [security, sandbox, plugin, documentation]
parent: feature-pi-sandbox-credential-isolation-boundary
depends_on: []
release_binding: null
gate_origin: null
research_refs: []
research_origin: null
created: 2026-07-11
updated: 2026-07-11
---

# Roll canonical foundation docs forward with the Pi-only plugin exception

## Scope

Review blocker B3 (foundation-doc drift). The first rework correctly aligned
`docs/SPEC.md` and `docs/ARCHITECTURE.md` with canonical `AGENTS.md`, but left
`docs/VISION.md` claiming that every supported plugin ships, installs, and
behaves in Claude Code, Codex, and Pi. That still contradicts the supported
Pi-only `background-tasks` and `pi-sandbox` packages.

## Fix

Roll `docs/VISION.md` forward without removing channel parity as a success
criterion:

1. In **What this is**, state that supported cross-channel plugins ship through
   all three channels, while capabilities that exist only in Pi's runtime ship
   as supported Pi-only packages by design. Name `background-tasks` and
   `pi-sandbox` as the current examples and state that they carry
   `package.json` but no Claude Code or Codex manifests.
2. In **What success looks like**, qualify channel parity the same way:
   cross-channel plugins install and behave in all three; Pi-only runtime
   packages intentionally target Pi.
3. Qualify lockstep metadata and the plugin-doc pointer so neither implies that
   Pi-only packages must carry inapplicable Claude/Codex manifests.
4. Keep wording aligned with `AGENTS.md`, `docs/SPEC.md`, and
   `docs/ARCHITECTURE.md`.

## Acceptance criteria

- [x] `docs/VISION.md` no longer says every supported plugin ships to or installs
  in all three harnesses.
- [x] Channel parity remains a success criterion for supported cross-channel
  plugins.
- [x] Supported Pi-only packages are explicitly recognized as intentional and
  `background-tasks` / `pi-sandbox` are named as current examples.
- [x] The Vision says Pi-only packages ship `package.json` without Claude Code
  or Codex plugin manifests.
- [x] Lockstep-metadata and plugin-doc wording do not reintroduce the same
  contradiction.
- [x] VISION, SPEC, ARCHITECTURE, and AGENTS agree on the exception.

## Implementation notes

- Files changed: `docs/VISION.md`.
- Qualified both the catalog description and channel-parity success criterion:
  supported cross-channel plugins target Claude Code, Codex, and Pi; supported
  Pi-runtime-only packages intentionally target Pi.
- Named `background-tasks` and `pi-sandbox` as the current Pi-only examples and
  recorded their `package.json`-only channel metadata shape.
- Also narrowed lockstep metadata to files a plugin actually ships and made the
  docs pointer resolve to `package.json` for Pi-only packages.
- Verification: searched VISION/SPEC/ARCHITECTURE for unconditional
  every-supported-plugin/all-three claims and compared the resulting exception
  wording with canonical `AGENTS.md`; no contradiction remains.
- Discrepancies from design: the second rework adds VISION to the original
  SPEC/ARCHITECTURE rollforward because fresh review found the remaining drift.
- Adjacent issues parked: none.
