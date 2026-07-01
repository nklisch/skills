---
id: feature-background-tasks-sandbox-integration
kind: feature
stage: drafting
tags: [security, sandbox, plugin]
parent: null
depends_on: [feature-sandbox-first-party-bwrap]
release_binding: null
gate_origin: null
created: 2026-07-01
updated: 2026-07-01
---

# background-tasks: route spawned commands through the pi-sandbox bwrap backend

## Brief

`plugins/background-tasks` spawns its own subprocesses **outside** the
sandboxed `bash` tool override, so `background` and `monitor` bypass the
filesystem `denyRead`/`denyWrite`/`allowWrite` and network `open`/`block`
contract that `@nklisch/pi-sandbox` enforces. Verified spawn sites in
`plugins/background-tasks/extensions/background-tasks.ts`:

- `background` tool (~L531): `spawn(command, { shell:"/bin/sh", env:{...process.env, ...envAdd}, detached:true })`
- `monitor` tool (~L694): `pi.exec("/bin/sh", ["-c", command], { cwd, ... })`

Both take a raw command string and inherit `process.env` with no sandbox
wrapping. The current pi-sandbox release *mitigates* this with a tool-egress
policy default of `confirm` (fail-closed with no UI) on `background`/`monitor`
(`story-pi-sandbox-bypass-tool-policy`). This feature replaces that mitigation
with **real integration**: route both spawn sites through the first-party
`buildBwrapArgs()` + `spawn("bwrap", ...)` path that the `bash` tool uses, so
background/monitor commands run inside the same bwrap container.

This is in scope for the pi-sandbox draft PR per operator direction.

## Strategic decisions (locked at scope time)

- **Connection mechanism — optional peer dep + guarded dynamic import.**
  `background-tasks` declares `@nklisch/pi-sandbox` an optional peer
  dependency and imports `buildBwrapArgs` via a guarded dynamic `import()`
  so it degrades cleanly to current behavior when pi-sandbox is absent.
  Rationale: standard optional-dep pattern; keeps pi-sandbox the single source
  of truth for bwrap; background-tasks already has a clean no-sandbox degrade
  path. Chosen over a neutral shared helper (more moving parts) and a pi-core
  runtime hook (deep review established pi core has no `executeBash` override
  hook).
- **Fail-closed default when sandbox is on but bwrap spawn throws.** Refuse
  the spawn (do not run unsandboxed) to match the sandbox's posture. A
  `sandboxIntegration: "auto" | "off"` config flag in background-tasks
  defaults to `"auto"` (use sandbox if present + initialized); `"off"` is the
  explicit operator opt-out. Chosen over fail-open, which would re-introduce
  the exact bypass the feature exists to close.
- **Linux-only real sandboxing; honest degrade elsewhere.** Real bwrap
  sandboxing is Linux-only (pi-sandbox graceful-degrades to unsandboxed bash
  on macOS/Windows). On non-Linux hosts, background/monitor commands run
  unsandboxed and the tool-egress `confirm` mitigation remains the only guard.
  State this plainly in the README + PR.

## Cross-plugin import surface (design input)

`@nklisch/pi-sandbox` currently has **no `exports`/`main`** — it is an
extension-only package. For background-tasks to import `buildBwrapArgs`, the
feature must add a package `exports` subpath to pi-sandbox (e.g.
`"@nklisch/pi-sandbox/bwrap"`) exposing the pure builder + its types
(`buildBwrapArgs`, `BuildBwrapArgsOptions`, `NetworkMode`,
`buildMinimalEnv`, `bwrapIsAvailable`). This keeps the extension entry
(`./extensions`) as the pi runtime surface while exposing the reusable
helper to other packages. The builder is already pure (reads the filesystem
to decide mounts; does not spawn or mutate), so it is safe to import outside
the extension lifecycle.

## Design questions for feature-design

- How does background-tasks obtain the sandbox **policy** (denyRead/denyWrite/
  allowWrite/network mode) at spawn time? Options: (a) read the same
  `~/.pi/agent/extensions/sandbox.json` + `<cwd>/.pi/sandbox.json` config
  pi-sandbox reads (duplicates load+merge); (b) pi-sandbox exposes an
  active-policy accessor alongside the builder; (c) background-tasks calls a
  pi-sandbox helper that returns the full sandboxed-spawn args given a cwd.
  Prefer (c) — a single `buildSandboxedSpawnArgs({ command, cwd, env? })` (or
  `createSandboxedBashOps()`-equivalent) so background-tasks never touches
  policy parsing and pi-sandbox owns the whole contract.
- `background` takes a `cwd` param and `env` overrides (merged over
  `process.env`). The bwrap minimal-env allowlist must still apply (secrets
  excluded); `envAdd` entries must be vetted against the secret-inspector /
  env-scrub policy, not blindly passed through. `monitor` runs in the session
  cwd. Both must resolve the sandbox config for the effective cwd.
- The `detached: true` + job-registry lifecycle in `background` must survive
  wrapping: the spawned process is `bwrap ... -- bash -c <command>`, and the
  job's `child.pid`/kill/timeout machinery must target the bwrap process
  (killing bwrap kills the child namespace). Confirm `process.kill(-pgid)`
  still works through bwrap.
- `sandboxIntegration` flag placement: background-tasks config (`<cwd>/.pi/background-tasks.json`? or reuse pi-sandbox config under a `backgroundTasks` key?) — feature-design picks.

## Acceptance Criteria

- [ ] `background` spawns through `bwrap` via the pi-sandbox builder when
      pi-sandbox is installed + initialized + `sandboxIntegration:"auto"` on
      Linux.
- [ ] `monitor` polls through `bwrap` via the pi-sandbox builder under the
      same conditions.
- [ ] When pi-sandbox is absent OR `sandboxIntegration:"off"`, background/
      monitor behave exactly as today (no sandbox, no error).
- [ ] When the sandbox is on but the bwrap spawn throws, the `background`/
      `monitor` call **fails closed** (returns an error, does not run
      unsandboxed) — unless the operator set `sandboxIntegration:"off"`.
- [ ] On non-Linux hosts, background/monitor run unsandboxed (graceful
      degrade) and the tool-egress `confirm` mitigation still applies.
- [ ] `background` `env` overrides do not leak secrets excluded by the
      sandbox minimal-env allowlist / env-scrub policy.
- [ ] `background` job kill/timeout (`process.kill(-pgid)`) still works when
      the child is a bwrap process.
- [ ] `@nklisch/pi-sandbox` package.json gains an `exports` subpath exposing
      the pure builder (+ types) for cross-plugin import.
- [ ] `@nklisch/pi-background-tasks` package.json declares
      `@nklisch/pi-sandbox` as an optional peer dependency.
- [ ] README (background-tasks and/or pi-sandbox) documents the integration,
      the `sandboxIntegration` flag, the Linux-only real-sandboxing limit, and
      the fail-closed default.
- [ ] Once real integration lands, the pi-sandbox bypass-tool `confirm`
      mitigation for `background`/`monitor` is revisited: the default may
      relax to `allow` when integration is active, but must stay `confirm`/
      fail-closed when integration is off or on non-Linux. Document the
      resulting policy matrix.

## Dependencies

- `feature-sandbox-first-party-bwrap` (done) — provides the bwrap builder and
  the config/policy contract this integration consumes.

## Out of scope

- Sandboxing other extension-provided tools beyond background-tasks.
- The mesh (`agent_send`) exfil channel — a separate concern; `agent_send` is
  a pi tool, not a bash subprocess, so bwrap does not touch it.
- A macOS `sandbox-exec` or Windows native backend for background/monitor
  (real sandboxing stays Linux-only; non-Linux degrades).
