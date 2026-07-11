---
id: story-pi-sandbox-envscrub-healthy-bash
kind: story
stage: review
tags: [security, sandbox, plugin]
parent: feature-pi-sandbox-credential-isolation-boundary
depends_on: []
release_binding: null
gate_origin: null
research_refs: []
research_origin: null
created: 2026-07-11
updated: 2026-07-11
---

# `envScrub` does not apply to healthy sandboxed bash; `LC_*` tokens leak

## Scope

Adversarial release-gate review (lane 6, docs honesty) found a doc-vs-code Blocker. The threat model (THREAT_MODEL.md:42, :271-272) and README (:159) tell operators to register forge tokens via `envScrub.names`/`envScrub.patterns` and promise an environment "without provider or forge tokens." But `buildMinimalEnv` (the healthy bwrap bash path, sandbox.ts:181) only allowlists `PATH, HOME, TERM, LANG, TMPDIR` + ALL `LC_*` vars, and NEVER applies `envScrub`. `stripProviderSecrets` (which applies envScrub) is only called in the degraded spawn paths.

Host-verified:
```
minimal env keys: [ "PATH", "HOME", "TERM", "LANG", "TMPDIR", "LC_FORGE_TOKEN" ]
LC_FORGE_TOKEN leaked into healthy bash? true secret-forge-token
FORGEJO_TOKEN leaked into healthy bash? false
OPENAI_API_KEY leaked? false
```

So: non-`LC_*` tokens are correctly excluded by the whitelist (envScrub is redundant for them on the healthy path), BUT any token in an `LC_*`-prefixed var survives — including one the operator explicitly registered in `envScrub.names`. There's also a `scrubEnv` function at sandbox-config.ts:2365 with NO production caller (dead code).

## Unit

`plugins/pi-sandbox/extensions/sandbox-bwrap.ts` — `buildMinimalEnv` (~line 141-149) and/or `sandbox.ts:181` where it's called. Two fix options (pick during design):
- **Apply envScrub to buildMinimalEnv's output** — pass the loaded envScrub config into `buildMinimalEnv` (or apply `stripProviderSecrets`-style scrubbing after the whitelist) so `LC_*` vars matching envScrub names/patterns are removed. This makes the healthy path honor operator-registered scrubs.
- **Stop allowlisting all `LC_*` vars** — only allow `LC_*` vars that are known locale categories (`LC_ALL`, `LC_CTYPE`, `LC_MESSAGES`, etc.), not arbitrary `LC_*`-prefixed names. Tighter, but may break legitimate locale vars.

The first option is safer (honors operator intent) and aligns with the documented contract. Either way, remove or wire up the dead `scrubEnv` function.

## Acceptance criteria

- [x] A configured `envScrub.names: ["LC_FORGE_TOKEN"]` removes `LC_FORGE_TOKEN` from healthy bwrap bash.
- [x] The threat model / README claims about `envScrub` registration are now true for the healthy path (not just degraded).
- [x] The dead `scrubEnv` function is removed or wired up.
- [x] A test asserts an `LC_*`-prefixed env var in `envScrub.names` is scrubbed from healthy bash.
- [x] Legitimate locale vars (`LC_ALL`, `LC_CTYPE`) still pass through.

## Implementation notes

- Added the shared pure `scrubEnvironment` helper so healthy minimal environments and degraded spawn environments use identical exact-name and case-insensitive glob semantics; scrub targets still win over `envScrub.keep`.
- Threaded the session-loaded `envScrub` configuration into per-command bwrap bash operations and passed it to background/monitor healthy spawn construction.
- Removed the unused process-mutating `scrubEnv` helper, added healthy-path regression coverage for `LC_FORGE_TOKEN`, and documented that `envScrub` applies to both healthy and degraded bash paths.
- Verified with `bun test plugins/pi-sandbox/extensions/` (240 pass).
