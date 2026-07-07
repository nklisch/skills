---
id: story-pi-sandbox-bwrap-path-project-trust
kind: story
stage: done
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-06
updated: 2026-07-07
---

# bwrapPath settable from untrusted project config = sandbox escape (B2-1, B2-2)

## Source

Surfaced in the 2026-07-06 v0.1.0 readiness deep review (adversarial phase,
fresh-context gpt-5.5), verified by the orchestrator against `loadConfig`
(sandbox-config.ts:714 reads `<cwd>/.pi/sandbox.json`) and the README
additive-only contract (line 72). CONFIRMED blocker for v0.1.0.

## Problem

The B2 fix (`story-pi-sandbox-bwrap-path-injection`) closed the hostile-PATH
escape but introduced a trust hole: `mergeProjectAdditive`
(`sandbox-config.ts:847`) lets **project-local** config (`.pi/sandbox.json`,
read from the untrusted checkout) set `bwrapPath` to any absolute executable.
`resolveTrustedBwrap` only checks absolute/exists/executable/realpath — no
ownership or allowlist constraint on the configured path. A malicious checkout
with `{"bwrapPath":"/tmp/evil-bwrap"}` + a planted executable runs the
attacker's binary as the "bwrap" wrapper, which ignores the bwrap argv and
runs bash unsandboxed.

This **directly contradicts** the README contract (line 72): "Project-local
config is additive-only. It may tighten policy, but it cannot loosen a
global/default posture... it cannot disable the sandbox, expand writable
paths, or lower a blocked tool to allowed." `bwrapPath` is the most privileged
trust decision in the system — selecting the binary that runs bash — and
letting project config set it is the widest possible loosening.

### Compounding: background/monitor re-resolves mutable config (B2-2)

Even if `bwrapPath` were global-only, `buildSandboxedSpawnArgs`
(`sandbox-spawn.ts:221-223`) re-loads project config and re-resolves per spawn
(the implementer's chosen option (i)). A project can start benign (pass
session_start), then write `.pi/sandbox.json` with a hostile `bwrapPath`
mid-session — the next `background`/`monitor` command spawns the hostile
wrapper while bash keeps the clean session pin. This is the literal miss on
B2 acceptance criterion 5 ("both paths use the pinned bwrap") and combines
with B2-1 into an exploitable mid-session escape.

## Fix direction (design choice for operator)

Two coupled decisions:

### Decision A — `bwrapPath` trust scope

- **(a) Global/operator-only.** `bwrapPath` is settable ONLY in global config
  (`~/.pi/agent/extensions/sandbox.json`), never in project-local config.
  `mergeProjectAdditive` rejects (with a warning) any project-local
  `bwrapPath`. Matches the README additive-only contract. Operators who need a
  custom bwrap install set it globally; projects cannot. Simplest, safest.
- **(b) Allowed from project config BUT require the configured path to be
  root-owned AND on a tightened allowlist** (e.g. `/usr/local/bin/bwrap` added
  to the system allowlist via global config, then project config may select
  among allowlisted paths only). More flexible but the ownership check is
  cross-platform-fiddly and the allowlist still must be operator-curated.

**Recommend (a).** The README already promises additive-only project config;
(b) re-opens the question of which paths are "trusted enough" and the
ownership check adds complexity for marginal flexibility. The operator escape
hatch for custom bwrap is global config, which is already the trust boundary
for `enabled:false`.

### Decision B — spawn-path pinning (depends on A)

- If A=(a): B2-2's mid-session vector disappears (project config can't set
  `bwrapPath` at all). The spawn re-resolution becomes optional hardening —
  global config changing mid-session is an operator action, not an attack.
  Threading the session pin through the background-tasks global-symbol
  handshake (option ii) is then a defense-in-depth nicety, not a blocker.
- If A=(b): B2-2 MUST be fixed by threading the pin (option ii), because
  project config mutation is the attack vector. The spawn path must read the
  session-pinned path, not reloaded config.

## Acceptance criteria

- [x] Project-local `.pi/sandbox.json` cannot set `bwrapPath` to an arbitrary
      executable (per chosen Decision A)
- [x] A malicious checkout with `{"bwrapPath":"/tmp/evil-bwrap"}` does NOT
      result in that binary being spawned as bwrap
- [x] The README additive-only contract holds (or is honestly updated if the
      operator accepts a narrower trust model)
- [x] If Decision A=(b): background/monitor uses the session-pinned bwrap, not
      re-resolved config (acceptance criterion 5 of the original B2 story)
- [x] A regression test covers the malicious-project-config case

## Implementation notes

- Decision: **(a) global/operator-only**. Project-local `bwrapPath` is rejected
  with an additive-only warning in `mergeProjectAdditive` (`sandbox-config.ts`).
  This closes B2-1 (project config cannot pin a hostile bwrap) and B2-2 (a
  project writing `.pi/sandbox.json` mid-session cannot change the spawn path,
  since project config can't set `bwrapPath` at all — the spawn re-resolution
  is now harmless hardening, not a blocker).
- The bash session pin and the spawn re-resolution both now resolve from
  trusted inputs only (global config or the system allowlist); the spawn
  re-resolution's option-(i) purity is preserved without needing the handshake
  thread (option ii) since there's no mutable project-config attack surface.
- Tests: `bwrap-pin.test.ts` updated — the stale fixture asserting
  project-local `bwrapPath` was ACCEPTED is rewritten to assert it is REJECTED
  with a warning naming `bwrapPath`.
- README: `bwrap` no longer described as "available on PATH"; the trusted-
  path allowlist + global `bwrapPath` model is documented, and the additive-only
  contract section explicitly calls out `bwrapPath` as global/operator-only.
- Verification: 124 pi-sandbox + 71 background-tasks green.
