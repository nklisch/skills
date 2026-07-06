---
id: idea-pi-sandbox-v010-config-and-policy-hardening
kind: story
stage: backlog
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-06
updated: 2026-07-06
---

# v0.1.0 config + policy hardening (Mediums from readiness review)

## Source

Surfaced in the 2026-07-06 v0.1.0 readiness adversarial review (multiple
reviewers). CONFIRMED mediums, not blockers but worth fixing for v0.1.0 polish.

## Problems (consolidated — share the config/policy surface)

- **M1. Global config replaces default deny lists** (`sandbox-config.ts:535,699`):
  `deepMerge(DEFAULT_CONFIG, globalConfig)` replaces filesystem arrays. An
  existing global config with `denyRead:["~/.ssh"]` silently drops the new
  `auth.json` default. Fix: union default + global by default, or require an
  explicit escape hatch. Warn when global omits known built-in sensitive defaults.

- **M2. Unknown config fields silently ignored** (`sandbox-config.ts:575-642`):
  README claims "ignored with warnings" but most unknown fields are silent. A
  typo (`"mdoe":"block"`) leaves `mode:"open"`. Fix: warn on ALL unknown keys
  at every object level, or fail-closed. Security config should not silently
  accept typos.

- **M3. `isSafeRegex` misses known ReDoS shapes** (`sandbox-config.ts:346,350`):
  rejects `(a+)+` but not `(a{1,2})+` or `(a|aa)+` — the heuristic only checks
  inner `+*?`, not counted quantifiers or overlapping alternation. The comment
  overclaims. Fix: extend detection for `{m,n}` inside quantified groups and
  overlapping alternations; fix the comment.

- **M4. Redact-before-block shape ordering** (`sandbox-config.ts:439,477`):
  shapes processed sequentially; an earlier `redact` can erase text a later
  `block` needs. Fix: two-pass — collect all block matches against the original
  text first; if any block matches, return block before applying redactions.

- **M5. `--no-sandbox` skips the tool-egress gate entirely** (`sandbox.ts:379-380`):
  the flag description says "disable OS-level bash sandboxing" but it also
  disables the in-process egress/inspector gate. Fix: rename/document the
  bypass as "disable all pi-sandbox protections," or split into separate flags
  (OS bwrap bypass vs in-process gates).

- **M6. Broken installed pi-sandbox misclassified as absent**
  (`sandbox-bridge.ts:52`): `Cannot find module` with a `node_modules/...` path
  classifies as absent (unsandboxed fallback) instead of broken (fail-closed).
  Fix: only root package absence classifies as absent; missing files inside an
  installed package are broken.

- **M7. First background/monitor call blocked by handshake race** (no-UI
  sessions): the background-tasks session probe is fire-and-forget; pi-sandbox
  gates before the probe publishes. Fix: make background-tasks session_start
  async-await the probe, or publish before tool calls can be gated.

## Fix direction

These are independent but share `sandbox-config.ts` / `sandbox-bridge.ts`. M1,
M2, M3, M4 are config/policy fixes; M5 is a flag/docs fix; M6, M7 are
integration fixes. Could be one story or split — the orchestrator decides
based on parallelism vs cohesion. M3 and M4 have design ambiguities (how strict
is the safe-regex analyzer? two-pass redact semantics?) worth surfacing.

## Acceptance (when scoped)

- [ ] M1: global config with `denyRead:["~/.ssh"]` still gets `auth.json` denied
- [ ] M2: unknown config field produces a warning naming the field
- [ ] M3: `(a{1,2})+` and `(a|aa)+` rejected at config-load; comment corrected
- [ ] M4: a redact shape before a block shape does not downgrade the block
- [ ] M5: `--no-sandbox` description is honest about what it disables
- [ ] M6: missing export-target file classifies as broken (fail-closed)
- [ ] M7: no-UI first-call background/monitor does not block on handshake race
