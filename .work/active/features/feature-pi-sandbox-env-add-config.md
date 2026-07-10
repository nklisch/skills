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

## Scope correction (2026-07-10): REMOTE_PI_DEBUG_LOG is OUT OF SCOPE

The original motivating use case was getting `REMOTE_PI_DEBUG_LOG=1` into pi's own
`process.env` before the `remote_pi` extension module loads. Investigation proved
this feature **cannot solve that**, and the feature is now scoped strictly to
subprocess env. Verified findings:

- `remote_pi`'s `createDeliveryDebugLog()` runs at **module top-level**
  (`pi-extension/src/index.ts:~1219`, `let _deliveryDebugLog = createDeliveryDebugLog();`
  above the `extension: ExtensionFactory` declaration). It executes on `import`,
  not in a hook. `session_start` is too late.
- `envAdd` threads into `createSandboxedBashOps` → `buildMinimalEnv` — the env of
  **bash-tool subprocesses**, not pi's own `process.env`.
- The sandbox extension's `session_start` *intentionally leaves `process.env`
  untouched* (confirmed in `sandbox.ts`).
- The var is stripped by an **outer PID-1 bwrap** (code-server/dev-VM layer) that
  runs before any extension loads.

Three unblock options were evaluated:
1. **Outer-launch config** (outside this repo) — `--setenv REMOTE_PI_DEBUG_LOG 1`
   in the PID-1 bwrap. Robust, available now, not in skills-repo reach.
2. **Mutate `process.env` at the sandbox extension's module load** (in-repo) —
   FRAGILE: load-order race. The git-skills sandbox registration loads before
   remote_pi, but the local-test registration (`../../projects/skills/plugins/pi-sandbox`,
   packages index 5) loads *after* remote_pi (index 4), so under that registration
   it silently no-ops for the exact case that motivates it. Also a bigger trust
   grant than subprocess env, and `passthrough` can't help (the outer bwrap
   already stripped the var).
3. **A pi-core `settings.json` env block applied before extensions load** — robust,
   but **does not exist today** (verified: no such settings field, no `--setenv` CLI
   flag, no pre-extension env mechanism in `@earendil-works/pi-coding-agent`). This
   would be a new upstream feature, out of this repo's scope.

**Decision:** keep this feature subprocess-only. Do NOT add an `envInject`/`hostEnv`
field to pi-sandbox — it would be a high-trust host-process mutation whose primary
motivating use case (REMOTE_PI_DEBUG_LOG) it cannot reliably serve due to the
load-order race. Remote Pi unblocks via option 1 now; option 3 is the proper
architectural fix and belongs upstream in pi-core.

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

- **Subprocess-only. `envAdd` mutates the bash-tool child env only, never pi's own
  `process.env`.** A separate `envInject`/`hostEnv` field that mutates the host
  process is explicitly OUT OF SCOPE — see the scope-correction section above
  (load-order race + host-process trust grant + the local-test registration loads
  after remote_pi, so it would silently no-op for the motivating use case).
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
- **Do not expand `envAdd` to mutate `process.env` during design.** If a reviewer
  suggests `envInject`/`hostEnv`, refer them to the scope-correction section: the
  load-order race makes it unreliable for REMOTE_PI_DEBUG_LOG and the trust surface
  (host process = potential code execution via `NODE_OPTIONS`) is distinct from
  subprocess env. The upstream pi-core pre-extension env mechanism (option 3) is
  the proper home for that capability if it is ever built.
