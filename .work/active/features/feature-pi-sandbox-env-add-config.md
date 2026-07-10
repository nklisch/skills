---
id: feature-pi-sandbox-env-add-config
kind: feature
stage: drafting
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-09
updated: 2026-07-10
---

# Config-driven environment-variable merge for sandboxed bash (`envAdd`)

## Brief

Sandboxed bash currently has **no config-driven way to add environment variables**
to the minimal child env. There are three env paths with different baselines:

- **bwrap (healthy Linux)** — `createSandboxedBashOps` (`sandbox.ts`) and
  `buildSandboxedSpawnArgs` (`sandbox-spawn.ts`) start from `buildMinimalEnv()`
  (`sandbox-bwrap.ts`), a **hardcoded allowlist**: only `PATH, HOME, TERM, LANG,
  LC_*, TMPDIR`. Everything else is dropped.
- **degraded** (non-Linux / sandbox disabled / `backgroundTasks.sandboxIntegration: off`)
  — starts from the full `process.env` and strips via `stripProviderSecrets()`
  (provider secret list + `envScrub`).
- **`envScrub.keep`** — vestigial on the bwrap path: `scrubEnv`'s `keep` loop is a
  near no-op and `buildMinimalEnv` never reads it, so `keep` cannot surface a var
  the minimal allowlist already dropped.

The only existing injection point is `SandboxSpawnOptions.envAdd` — a **runtime**
parameter passed by background-tasks, not reachable from operator/project config.
So an operator cannot make `NODE_ENV=test`, `CI=true`, or `DATABASE_URL` reach
sandboxed bash on Linux. This feature adds a config-driven `envAdd` field to
extend the minimal env, with the order `minimal → add → scrub` so the existing
secret-stripping floor always wins on top.

## Strategic decisions

- **Trust scope = A (global/operator-only; project-local ignored + warned).**
  Rationale: `envScrub` (delete) is safe for untrusted project config because
  deleting is always "tighter." `envAdd` (merge/inject) is the *opposite* trust
  direction — injecting `HTTPS_PROXY=attacker`, a poisoned `PATH` prefix, or
  `NODE_OPTIONS=--require /tmp/evil` *weakens* the sandbox. Project-local
  `envAdd` therefore cannot be blanket-allowed without breaking the additive-only
  contract. This mirrors the existing `bwrapPath` precedent
  (`sandbox-config.ts` `mergeProjectAdditive`): "bwrapPath is a global/operator-only
  trust decision … Project-local config is untrusted (a malicious checkout) and
  must not be able to pin a hostile bwrap." `envAdd` is treated identically —
  operator-trust-only, project entries rejected with an additive-only warning.
- **Both `values` (literal) and `passthrough` (copy-from-host) are in scope.**
  `passthrough` is safe on the bwrap path because the value already exists in the
  operator's environment (no new secret value is introduced) and
  `PROVIDER_SECRET_ENV_NAMES` / `envScrub` strip still applies on top. A missing
  host var is silently skipped (no injection — carry-through only).
- **Order of operations is `minimal → add → scrub`** (not `minimal → scrub → add`).
  This guarantees `envScrub.names/patterns` AND `PROVIDER_SECRET_ENV_NAMES` always
  win: even a global `envAdd.values.AWS_SECRET_ACCESS_KEY` is stripped. Scrub is
  the final, authoritative floor.
- **Routing = `feature-design`** (greenfield config capability, no `[refactor]` —
  this adds a new public config surface, not a behavior-preserving structural
  change). Not `[perf]`, not `[prose]`, not `[research]`.

## Proposed config shape

```jsonc
"envAdd": {
  "values":      { "NODE_ENV": "test", "CI": "true" },   // literal injection
  "passthrough": ["DATABASE_URL", "GIT_SHA"]             // copy from host process.env if present
}
```

## Touch surface (pi-sandbox is Pi-only — single channel)

- `sandbox-config.ts` — `EnvAddConfig` type (neighbor of `EnvScrubConfig`);
  `DEFAULT_CONFIG.envAdd` field; `validateConfig` unknown-keys + `values` record /
  `passthrough` string-array validation; `mergeProjectAdditive` (global union;
  project-local rejected + warned, like `bwrapPath`).
- `sandbox-bwrap.ts` — `buildMinimalEnv(sourceEnv, envAdd?)` extends the allowlist,
  then provider/scrub strip is applied by callers on top.
- `sandbox-spawn.ts` — thread merged `envAdd` into both the `buildMinimalEnv`
  (ok/bwrap) path and the degraded `stripProviderSecrets` path so both surfaces
  honor the config.
- `sandbox.ts` — pass loaded `envAdd` from `loadPiConfig` into
  `createSandboxedBashOps`'s `buildMinimalEnv` call.
- Tests — `envAdd` merge + scrub-wins-on-top ordering; project-local rejection +
  warning; `passthrough` missing-host-var skip; parity across bwrap and degraded
  paths.
- `plugins/pi-sandbox/README.md` — document `envAdd` (values/passthrough),
  global-only trust posture, and the `minimal → add → scrub` order.
- `scripts/bump-version.sh pi-sandbox patch` after the change lands.

## Notes for design

- The `envScrub.keep` vestigial behavior is out of scope here — do not attempt to
  wire `keep` into `buildMinimalEnv` as part of this feature; `envAdd.passthrough`
  is the supported way to surface a host var. (A separate cleanup of `keep` can be
  parked if it surfaces.)
- Confirm whether `values` should allow empty-string values (e.g. `CI=""`) —
  likely yes (an empty env var is distinct from absent), but pin in design.
- The `bwrapPath` project-rejection block in `mergeProjectAdditive` is the exact
  pattern to copy for the `envAdd` project-rejection warning.
