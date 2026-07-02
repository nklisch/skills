---
id: idea-cross-extension-capability-handshake-pattern
kind: story
stage: backlog
tags: [patterns, plugin]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-01
---

# Document the cross-extension capability handshake as a named pattern

## Source

Surfaced in the full-surface adversarial review (repo conventions & cohesion
lens) of the pi-sandbox + background-tasks extension surface. Filed as
important (non-blocking); the PR ships without it.

## Problem

The `@nklisch/pi-sandbox` + `@nklisch/pi-background-tasks` integration
introduced a new recurring extension-communication shape: a **versioned runtime
capability handshake over a shared `Symbol.for(...)` `globalThis` key**, where
the consumer extension publishes its resolved optional-peer state and the
provider extension reads it to decide whether to relax a policy. This shape is
currently duplicated across the two plugins with slight drift:

- `plugins/background-tasks/extensions/sandbox-bridge.ts:23-28` (publisher)
- `plugins/pi-sandbox/extensions/sandbox-config.ts:164-169` (reader)

The published-value shape already drifts between sides (the reader makes
`bridgeState` optional; the publisher requires it). It is not covered by
`.agents/skills/patterns/`, so future extensions adopting the same shape will
copy-and-drift rather than follow a named contract.

## Proposed direction

Add a named pattern to `.agents/skills/patterns/` (and the
`.agents/rules/patterns.md` digest) describing the cross-extension optional-peer
capability handshake: the `Symbol.for` global-key contract, the
publisher/reader responsibilities, the published-value shape, and the
fail-closed-when-unproven rule. Then centralize the two plugins' symbol/shape
definitions against the pattern (a shared contract module or at least identical
inline definitions) so the drift is eliminated.

## Acceptance (when scoped)

- A `.agents/skills/patterns/<name>/SKILL.md` documents the handshake pattern
  with concrete file:line examples from both plugins.
- The `.agents/rules/patterns.md` digest indexes it.
- The two plugins' symbol description + published-value shape are identical
  (no drift), or they import from a shared contract module.
