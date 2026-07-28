---
id: feature-background-tasks-sandbox-integration
kind: feature
stage: done
tags: [security, sandbox, plugin]
parent: null
depends_on: [feature-sandbox-first-party-bwrap]
release_binding: null
gate_origin: null
created: 2026-07-01
updated: 2026-07-02
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

- [x] `background` spawns through `bwrap` via the pi-sandbox builder when
      pi-sandbox is installed + initialized + `sandboxIntegration:"auto"` on
      Linux.
- [x] `monitor` polls through `bwrap` via the pi-sandbox builder under the
      same conditions.
- [x] When pi-sandbox is absent OR `sandboxIntegration:"off"`, background/
      monitor behave exactly as today (no sandbox, no error).
- [x] When the sandbox is on but the bwrap spawn throws, the `background`/
      `monitor` call **fails closed** (returns an error, does not run
      unsandboxed) — unless the operator set `sandboxIntegration:"off"`.
- [x] On non-Linux hosts, background/monitor run unsandboxed (graceful
      degrade) and the tool-egress `confirm` mitigation still applies.
- [x] `background` `env` overrides do not leak secrets excluded by the
      sandbox minimal-env allowlist / env-scrub policy.
- [x] `background` job kill/timeout (`process.kill(-pgid)`) still works when
      the child is a bwrap process.
- [x] `@nklisch/pi-sandbox` package.json gains an `exports` subpath exposing
      the pure builder (+ types) for cross-plugin import.
- [x] `@nklisch/pi-background-tasks` package.json declares
      `@nklisch/pi-sandbox` as an optional peer dependency.
- [x] README (background-tasks and/or pi-sandbox) documents the integration,
      the `sandboxIntegration` flag, the Linux-only real-sandboxing limit, and
      the fail-closed default.
- [x] Once real integration lands, the pi-sandbox bypass-tool `confirm`
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

## Design decisions

- **Policy acquisition**: pi-sandbox will expose a new `buildSandboxedSpawnArgs()` helper under `@nklisch/pi-sandbox/sandbox-spawn`; background-tasks will call that helper and will not parse or merge sandbox policy itself. This keeps config validation, additive merge, platform state, fail-closed decisions, and bwrap args in pi-sandbox as the single source of truth.
- **Helper state model**: the helper returns a discriminated union with `state: "ok" | "degraded" | "fail-closed"`. `ok` means spawn `bwrap`; `degraded` means intentionally run unsandboxed (non-Linux, sandbox disabled, or integration off); `fail-closed` means refuse the tool call and do not fall back to `/bin/sh`.
- **Env overrides**: background `env` overrides are merged over `process.env` before policy application, but the sandboxed branch passes only `buildMinimalEnv()` allowlisted keys (`PATH`, `HOME`, `TERM`, `LANG`, `LC_*`, `TMPDIR`). Non-allowlisted overrides and provider tokens are dropped. Degraded/off branches keep today's normal env merge.
- **Detached kill lifecycle**: keep `detached:true` and the existing negative-pgid kill/timeout machinery. In the sandboxed branch the tracked pid is the `bwrap` pid; `process.kill(-child.pid, sig)` signals the bwrap process group, and bwrap termination tears down the wrapped command namespace. Add a real bwrap cancellation test to prove no wrapped sleep is left behind.
- **Config flag placement**: use the existing pi-sandbox config file rather than inventing a background-tasks config file. Add `backgroundTasks: { sandboxIntegration: "auto" | "off" }` to `SandboxConfig`, loaded from `~/.pi/agent/extensions/sandbox.json` and `<cwd>/.pi/sandbox.json`, defaulting to `"auto"`. Additive merge ranks `off < auto`: global/operator config may opt out with `off`; project config may tighten `off -> auto` but cannot loosen default/global `auto -> off`.
- **Bypass-tool mitigation matrix**: relax pi-sandbox's default `background`/`monitor` tool policy to `allow` only when active Linux bwrap integration is provable (valid config, sandbox enabled, `sandboxIntegration:"auto"`, Linux, bwrap available, network `open`/`block`). Keep `confirm`/no-UI fail-closed for integration off, non-Linux degrade, missing bwrap, `filter`, invalid config, or uncertain state. This policy is enforced in pi-sandbox's `tool_call` gate using the same state calculation as the spawn helper.
- **Dispatch rationale**: direct-read only. The feature is security-critical but bounded to two plugin extensions, two package manifests, and existing tests; local reads covered the spawn sites, lifecycle, bwrap helper, config merge, and bypass policy without needing exploratory sub-agents.

## Architectural choice

### Options considered

1. **Duplicate sandbox config loading inside background-tasks**. background-tasks could read `~/.pi/agent/extensions/sandbox.json` and `<cwd>/.pi/sandbox.json` directly, then call `buildBwrapArgs()`. This is straightforward locally but duplicates validation, additive merge, platform decisions, and fail-closed semantics in a second package. That duplication is unacceptable for a security boundary.
2. **Expose active pi-sandbox policy as a mutable accessor**. pi-sandbox could export an `activePolicy()`-style function and background-tasks could compose bwrap args. This avoids duplicate parsing but couples background-tasks to extension lifecycle state, breaks tests outside a running pi session, and still makes background-tasks understand policy shape.
3. **Expose a spawn contract helper from pi-sandbox**. pi-sandbox owns config loading, platform decision, minimal env, and bwrap args, returning either a ready-to-spawn bwrap prefix or a refusal/degrade state. background-tasks only chooses between `spawn("bwrap", ...)`, current behavior, or error.

Chosen: **Option 3**. It gives the cleanest port between plugins: background-tasks supplies `{ command, cwd, envAdd }`; pi-sandbox returns a small spawn contract. The security-sensitive policy interpretation has one owner.

## Implementation Units

### Unit 1: pi-sandbox exported spawn helper

**Story**: `story-background-tasks-sandbox-spawn-helper`

**Files**:
- `plugins/pi-sandbox/extensions/sandbox-spawn.ts`
- `plugins/pi-sandbox/extensions/sandbox-config.ts`
- `plugins/pi-sandbox/extensions/sandbox.test.ts`
- `plugins/pi-sandbox/package.json`

```ts
export type BackgroundTasksSandboxIntegration = "auto" | "off";

export interface BackgroundTasksSandboxConfig {
	sandboxIntegration?: BackgroundTasksSandboxIntegration;
}

export interface SandboxSpawnOptions {
	command: string;
	cwd: string;
	envAdd?: NodeJS.ProcessEnv;
	baseEnv?: NodeJS.ProcessEnv;
	agentDir?: string;
	platform?: NodeJS.Platform;
	bwrapAvailable?: boolean;
}

export type SandboxedSpawnArgsResult =
	| {
		state: "ok";
		integration: "active";
		executable: "bwrap";
		args: string[];
		cwd: string;
		env: NodeJS.ProcessEnv;
		message?: string;
	}
	| {
		state: "degraded";
		integration: "inactive";
		reason: "integration-off" | "sandbox-disabled" | "unsupported-platform";
		executable: null;
		args: [];
		cwd: string;
		env: NodeJS.ProcessEnv;
		message: string;
	}
	| {
		state: "fail-closed";
		integration: "blocked";
		reason: "config-parse-error" | "filter-deferred" | "bwrap-missing" | "bwrap-build-error";
		executable: null;
		args: [];
		cwd: string;
		env: NodeJS.ProcessEnv;
		message: string;
		errors?: string[];
	};

export function buildSandboxedSpawnArgs(opts: SandboxSpawnOptions): SandboxedSpawnArgsResult;
```

**Implementation notes**:
- Load config with `loadConfig(opts.cwd, { agentDir: opts.agentDir })`.
- For `ok`, return `args` ending in `--`, `bash`, `-c`; callers append the command as the final argument.
- Use `buildMinimalEnv({ ...baseEnv, ...envAdd })` for the sandboxed branch and return normal merged env for degraded branches.
- Add package exports:

```json
"exports": {
  "./bwrap": "./extensions/sandbox-bwrap.ts",
  "./sandbox-spawn": "./extensions/sandbox-spawn.ts",
  "./sandbox-config": "./extensions/sandbox-config.ts"
}
```

**Acceptance criteria**:
- `ok` state produces bwrap args and minimal env on Linux with bwrap available.
- invalid config, `filter`, and missing bwrap fail closed.
- non-Linux, sandbox disabled, and integration off degrade honestly.
- env filtering drops non-allowlisted overrides.

### Unit 2: background-tasks optional peer dependency and guarded resolver

**Story**: `story-background-tasks-sandbox-import-config`

**Files**:
- `plugins/background-tasks/package.json`
- `plugins/background-tasks/extensions/background-tasks.ts`
- `plugins/background-tasks/extensions/background-tasks.test.ts`

```ts
type SandboxedSpawnArgsResult = import("@nklisch/pi-sandbox/sandbox-spawn").SandboxedSpawnArgsResult;
type BuildSandboxedSpawnArgs = typeof import("@nklisch/pi-sandbox/sandbox-spawn").buildSandboxedSpawnArgs;

type SandboxSpawnResolver =
	| { state: "absent" }
	| { state: "loaded"; buildSandboxedSpawnArgs: BuildSandboxedSpawnArgs }
	| { state: "broken"; message: string };

interface BackgroundTasksExtensionOptions {
	sandboxResolver?: () => Promise<SandboxSpawnResolver>;
}

export default function backgroundTasksExtension(pi: PiApi, options?: BackgroundTasksExtensionOptions): void;
```

**Implementation notes**:
- `peerDependenciesMeta.@nklisch/pi-sandbox.optional = true`.
- Cache the dynamic import result in the extension closure.
- Missing optional package means current behavior; broken import means fail closed with a tool error.
- No separate background-tasks config file; the flag is in pi-sandbox config and interpreted by the helper.

**Acceptance criteria**:
- background-tasks works without pi-sandbox installed.
- tests can inject loaded/absent/broken resolver states.
- broken helper import does not run commands unsandboxed.

### Unit 3: background tool bwrap spawn path

**Story**: `story-background-tasks-sandbox-background-spawn`

**Files**:
- `plugins/background-tasks/extensions/background-tasks.ts`
- `plugins/background-tasks/extensions/background-tasks.test.ts`

```ts
async function prepareSandboxedSpawn(input: {
	command: string;
	cwd: string;
	envAdd?: NodeJS.ProcessEnv;
}): Promise<SandboxedSpawnArgsResult | { state: "absent" } | { state: "broken"; message: string }>;

function waitForChildSpawn(child: ChildProcess): Promise<void>;
```

Sandboxed branch:

```ts
const child = spawn(sandbox.executable, [...sandbox.args, command], {
	cwd: sandbox.cwd,
	env: sandbox.env,
	detached: true,
	stdio: ["ignore", "pipe", "pipe"],
});
await waitForChildSpawn(child);
```

**Implementation notes**:
- Keep the current `/bin/sh` spawn exactly for absent/degraded states.
- Return `isError:true` before job creation for fail-closed/broken states.
- Attach stdout/stderr, wake-on-pattern, exit handling, job registry, and shutdown behavior after successful spawn.
- Include a real bwrap cancellation test (skip when bwrap missing).

**Acceptance criteria**:
- active integration spawns `bwrap`, not `/bin/sh`.
- denied paths are not readable from background jobs.
- cancelling a sandboxed background job kills the wrapped command.
- current behavior remains unchanged when helper is absent or degraded.

### Unit 4: monitor bwrap poll path

**Story**: `story-background-tasks-sandbox-monitor-spawn`

**Files**:
- `plugins/background-tasks/extensions/background-tasks.ts`
- `plugins/background-tasks/extensions/background-tasks.test.ts`

```ts
interface ShellRunOptions {
	command: string;
	cwd: string;
	timeoutMs: number;
	signal?: AbortSignal;
	sandbox?: SandboxedSpawnArgsResult | null;
	piExec?: PiApi["exec"];
}

async function runShellOnce(opts: ShellRunOptions): Promise<ExecResult>;
```

**Implementation notes**:
- `pi.exec` has no env option in the local API slice, so the sandboxed monitor branch must use direct `spawn("bwrap", ...)` to enforce the minimal bwrap process env.
- Prepare the sandbox result once when starting the monitor; use it on every tick.
- Store `job.child`/`job.pid` only while a direct-spawn poll is in flight and clear them on close so cancel can kill the current bwrap poll.
- Preserve recursive `setTimeout` after each poll and the `job.polling` non-overlap guard.

**Acceptance criteria**:
- active integration runs every poll under `bwrap ... -- bash -c <command>`.
- absent/degraded states keep the current `pi.exec("/bin/sh", ["-c", command])` behavior.
- fail-closed/broken states return an immediate error and schedule no monitor.
- all satisfy modes work from direct-spawn stdout/stderr/code.
- canceling an in-flight sandboxed poll terminates the bwrap process group.

### Unit 5: bypass-tool policy matrix and docs

**Story**: `story-background-tasks-sandbox-bypass-docs`

**Files**:
- `plugins/pi-sandbox/extensions/sandbox-config.ts`
- `plugins/pi-sandbox/extensions/sandbox.ts`
- `plugins/pi-sandbox/extensions/sandbox.test.ts`
- `plugins/pi-sandbox/README.md`
- `plugins/background-tasks/README.md`

```ts
export interface BypassToolIntegrationState {
	backgroundTasksSandbox: "active" | "inactive" | "blocked";
	reason?: string;
}

export function applyBypassToolDefaults(
	tools: ToolRules | undefined,
	state?: BypassToolIntegrationState,
): ToolRules;
```

**Implementation notes**:
- Default `background`/`monitor` to `allow` only for active Linux bwrap integration.
- Default them to `confirm` for inactive/degraded/blocked/uncertain states; no-UI confirmation remains fail-closed.
- `/sandbox` must report integration state and effective policy.
- Create `plugins/background-tasks/README.md` if absent.

**Acceptance criteria**:
- tests cover active, off, non-Linux, missing bwrap, filter, invalid config, and project-loosening attempts.
- docs show `backgroundTasks.sandboxIntegration` config, Linux-only real sandboxing, non-Linux degrade, and fail-closed defaults.

## Implementation Order

1. `story-background-tasks-sandbox-spawn-helper` — pi-sandbox helper, config flag, package exports.
2. `story-background-tasks-sandbox-import-config` — optional peer dependency and guarded dynamic import in background-tasks.
3. `story-background-tasks-sandbox-background-spawn` — route long-running background jobs through the helper.
4. `story-background-tasks-sandbox-monitor-spawn` — route monitor polls through direct bwrap spawn. This is serialized after background spawn because both stories edit `background-tasks.ts`/tests and the monitor runner should reuse the spawn/error-handling primitives from Unit 3.
5. `story-background-tasks-sandbox-bypass-docs` — relax/retain bypass tool policy by proven integration state and update docs.

Cycle check: planned story IDs were checked with `.work/bin/work-view --blocking <story-id>` before writing dependencies; no blockers/cycles were reported.

## Testing

### Unit tests

- `plugins/pi-sandbox/extensions/sandbox.test.ts`
  - `buildSandboxedSpawnArgs` returns `ok`, `degraded`, and `fail-closed` states.
  - env allowlist drops secrets and preserves allowed keys.
  - `backgroundTasks.sandboxIntegration` validates and merges additively.
  - package metadata exposes the new subpaths.
  - bypass policy matrix defaults to allow only in active Linux integration state.
- `plugins/background-tasks/extensions/background-tasks.test.ts`
  - resolver absent -> current background/monitor behavior.
  - resolver broken/fail-closed -> `isError:true`, no job, no spawn.
  - resolver ok -> background and monitor call `spawn("bwrap", ...)` with appended command and minimal env.
  - monitor direct-spawn path preserves all four satisfy modes and broken-poll diagnostics.

### Integration tests

Skip real bwrap tests when not Linux or `bwrap --version` fails.

- sandboxed background job cannot read a configured `denyRead` file.
- sandboxed monitor poll cannot read a configured `denyRead` file.
- `network.mode:"block"` prevents a monitor/background command from reaching a localhost listener.
- cancelling a sandboxed background `sleep` job terminates the wrapped command and reaches `cancelled` without a completion wake.
- cancelling a monitor while a bwrap poll is in flight kills the current bwrap process group.

### Regression tests

- Existing background trusted wake messages still never include command output.
- Existing monitor `/bin/sh -c` shell-syntax regression tests still pass in absent/degraded mode.
- Existing pi-sandbox `user_bash`, file-policy, config, and bwrap tests stay green.

## Risks

- **Monitor `pi.exec` seam**: `pi.exec` does not expose `env`, so trying to run `bwrap` through it would leave the bwrap process with inherited env. Mitigation: direct-spawn monitor polls in the sandboxed branch and test stdout/stderr/code parity against current `pi.exec` behavior.
- **bwrap kill lifecycle**: the job registry now tracks the bwrap pid, not the shell pid. Mitigation: keep `detached:true`, kill the negative process group, and add real bwrap cancellation tests for background and in-flight monitor polls.
- **Policy relaxation race**: pi-sandbox's `tool_call` gate runs before background/monitor execute. Mitigation: relax to `allow` only when startup can prove the same Linux bwrap integration state the helper would return; otherwise keep `confirm`/fail-closed.
- **Optional import ambiguity**: a missing optional peer is a supported degrade, but a broken installed helper must not fail open. Mitigation: distinguish missing package errors from other dynamic-import errors and treat broken imports as tool errors.
- **Config opt-out weakening**: `sandboxIntegration:"off"` is an operator bypass and must not be available as a project-local weakening. Mitigation: additive merge ranks `off < auto`; project-local config cannot loosen active/default integration.
- **Cross-plugin package exports**: exporting TS subpaths from a Pi package is new for `pi-sandbox`. Mitigation: package metadata tests plus background-tasks import tests pin the resolver path.

## Implementation summary — autopilot run 2026-07-01 (raised tier)

All 5 child stories advanced to `stage: review` via implement-orchestrator
(serialized single-worker waves — cross-plugin integration, mostly shared
files → width 1), then fast-lane to `done`.

- `story-background-tasks-sandbox-spawn-helper` — pi-sandbox `buildSandboxedSpawnArgs()`
  helper (ok/fail-closed/degraded states) + package `exports` subpath
  (`./sandbox-spawn`, `./bwrap`, `./sandbox-config`) + `backgroundTasks.sandboxIntegration`
  config flag (additive-only: project cannot loosen auto→off).
- `story-background-tasks-sandbox-import-config` — optional peer dep
  (`peerDependenciesMeta.optional`) + guarded dynamic `import()` bridge
  (`sandbox-bridge.ts`); degrades cleanly on absent/broken pi-sandbox.
- `story-background-tasks-sandbox-background-spawn` — `background` spawn wired
  through bwrap (ok) / unsandboxed (degraded) / error (fail-closed); job
  lifecycle preserved; kill-lifecycle PROVEN (process.kill(-pgid) terminates
  the bwrap namespace — marker never created).
- `story-background-tasks-sandbox-monitor-spawn` — `monitor` per-poll execution
  direct-spawns bwrap (sandboxed) vs `pi.exec` (unsandboxed); all polling
  semantics preserved (exit_zero/nonzero, stdout_matches/not_matches, interval,
  timeout, early-wake, non-overlap).
- `story-background-tasks-sandbox-bypass-docs` — policy matrix (allow when
  integration active, confirm otherwise), `/sandbox` reports integration
  state, both READMEs document the integration honestly (Linux-only real
  sandboxing, fail-closed default, graceful non-Linux degrade).

Verification: 143/143 tests across pi-sandbox + background-tasks suites (pure
unit + real bwrap integration: kill-lifecycle, denyRead, block-network,
secret-env omission, per-poll timeout). `grep -r sandbox-runtime` empty.
Cross-cutting deviations: none. Ready for review.

## Review fix (deep review 2026-07-01)

Blocking finding fixed: pi-sandbox previously relaxed `background`/`monitor` to
`allow` from its own Linux+bwrap/config readiness alone, without proof that the
loaded background-tasks package had resolved and was using the sandbox bridge.
That left an older/non-integrated background-tasks package, or a current package
whose optional peer resolved `absent`/`broken`, able to run unsandboxed while the
pi-sandbox tool gate allowed the call.

Fix: background-tasks now publishes a versioned same-process capability
handshake on `globalThis[Symbol.for("@nklisch/pi-sandbox.background-tasks-integration")]`
after resolving the sandbox bridge probe. Shape is `{ integrated: true,
bridgeState: "loaded" }` for a loaded helper and `{ integrated: false,
reason: "absent"|"broken", bridgeState: ... }` otherwise. pi-sandbox reads the
same `Symbol.for` key and marks integration `active` only when its own
preconditions (valid config, Linux, bwrap, open/block network, auto integration)
AND the loaded handshake are both present. Missing, absent, broken, or malformed
handshakes stay `inactive`, so bypass tools remain `confirm`/fail-closed.

Rationale: intentionally skipped a helper-version check for v1. The exported
helper surface is already pinned by the required `buildSandboxedSpawnArgs`
function probe; adding an unowned package-version/package-json read would add
fragility without preventing this review finding. The fail-closed handshake shape
can grow a `helperVersion` later if the helper contract changes.

Additional verification: full 4-file suite now reports 145 pass / 0 fail; new
regressions cover loaded/undefined/absent/broken handshakes, precondition
fail-closed behavior, and real background-tasks handshake publication.
`grep -r sandbox-runtime plugins/pi-sandbox/ plugins/background-tasks/` remains
empty.

## Review (2026-07-01)

**Verdict**: Approve with comments

**Blockers**: none remaining.
- Deep review round 1 found the bypass-tool policy `allow` was based only on
  pi-sandbox readiness, not proof that the loaded background-tasks is
  integrated (version-skew/absent-bridge fail-open hole). Fixed in `6199313`:
  a versioned runtime capability handshake over a shared
  `Symbol.for("@nklisch/pi-sandbox.background-tasks-integration")` key.
  background-tasks publishes its resolved bridge state (loaded/absent/broken)
  to `globalThis`; pi-sandbox reads it (refreshed at `tool_call` time to avoid
  a session_start ordering race) and only sets integration `active` (→ `allow`)
  when the handshake reports `{integrated:true, bridgeState:"loaded"}` AND
  pi-sandbox's own preconditions hold. Every other case (undefined/absent/broken
  handshake, non-Linux, off, fail-closed) → `inactive` → `confirm`/fail-closed.
  Confirmed-resolved in a focused re-review (APPROVED).

**Important**: none. (One substantive — a cross-package publish→read
integration test is missing; the two sides are tested separately. Filed as
backlog `idea-bgtasks-sandbox-handshake-cross-pkg-test` — correct by
inspection, not blocking.)

**Nits**: none.

**Notes**: Substrate deep lane, fresh-context `openai-codex/gpt-5.5` (xhigh) —
different model class from the umans orchestrator. One convergence round to
APPROVED. Verification: 145/145 tests across pi-sandbox + background-tasks
(pure unit + real bwrap integration: kill-lifecycle, denyRead, block-network,
secret-env omission, monitor per-poll timeout, handshake publish/read);
`grep -r sandbox-runtime` empty. Not archived (feature body retained for the
draft-PR description).

## Full-surface review fixes (2026-07-01)

Resolved the PR-prep adversarial review's background-tasks blocking findings while keeping this feature at `stage: done` because the fixes are review-driven corrections inside the accepted sandbox-integration criteria.

- **B1 — PATH-poisoned bwrap wrapper bypass**: pi-sandbox's spawn helper now resolves the bwrap wrapper from trusted `baseEnv`/`process.env` before merging user `envAdd`, and returns an absolute executable path. background-tasks already spawns `result.executable`, so a user-supplied `env.PATH` can still reach the wrapped command's child environment but cannot select the bwrap wrapper.
- **B2 — cancellation orphaned wrapped commands**: cancellation now treats `jobs cancel`/`session_shutdown` as an operator kill request: it sends `SIGKILL` to the tracked process group, waits until that group is gone, and only then records `cancelled` (or `kill_failed` after a bounded reap window). bwrap args also include `--die-with-parent` so wrapper death kills the sandboxed command. The real-bwrap marker regression now loops three times and waits past the delayed write; no marker is created and no completion wake is emitted.

Verification: `bun test plugins/pi-sandbox/extensions/sandbox.test.ts plugins/pi-sandbox/extensions/sandbox-spawn.test.ts plugins/background-tasks/extensions/background-tasks.test.ts plugins/background-tasks/extensions/sandbox-bridge.test.ts` → 149 pass / 0 fail. `grep -r sandbox-runtime plugins/pi-sandbox/ plugins/background-tasks/` produced no output.

## Pre-response adversarial review fixes (2026-07-01)

Resolved two raised/security-critical pre-response findings while keeping this feature at `stage: done`; both are corrections inside the accepted sandbox-integration boundary rather than new scope.

- **B1 — caller-controlled cwd expanded the sandbox write boundary**: `background` and `monitor` now separate the trusted session/project cwd from the per-call command cwd. The trusted cwd (`ctx.cwd ?? process.cwd()`) is passed to pi-sandbox as `configCwd` for config loading and relative `allowWrite`/`denyRead`/`denyWrite` resolution; the per-call `params.cwd` is used only as the command's spawn cwd / bwrap `--chdir`. Rationale: `params.cwd` is model/caller controlled, while the session cwd is the trusted project baseline. This prevents `cwd:"/"` from turning default `allowWrite:["."]` into a writable bind of host `/`.
- **B2 — `satisfy_on` injection into trusted steer wake**: monitor satisfy/timeout wake messages no longer include `satisfyOn` (nor label/output). Wakes now carry only the monitor id and status/exit; the agent reads condition details through the `jobs` tool. UI-only notify/startup text may still display the condition, but the trusted `deliverAs:"steer"` path is scrubbed.

Regression coverage added: decision tests proving background/monitor pass `cwd` and `configCwd` separately; a real bwrap background test with `params.cwd:"/"` that still applies the session cwd `denyRead`; and monitor wake tests proving both satisfied and timeout steer messages omit user-supplied `satisfy_on` values, including `exit_zero; IGNORE PRIOR INSTRUCTIONS`.

Verification: `bun test plugins/pi-sandbox/extensions/sandbox.test.ts plugins/pi-sandbox/extensions/sandbox-spawn.test.ts plugins/background-tasks/extensions/background-tasks.test.ts plugins/background-tasks/extensions/sandbox-bridge.test.ts` → 156 pass / 0 fail. `node scripts/check-extension-deps.mjs` passed. `grep -r sandbox-runtime plugins/pi-sandbox/ plugins/background-tasks/` produced no output.
