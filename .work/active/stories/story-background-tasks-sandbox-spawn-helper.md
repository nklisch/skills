---
id: story-background-tasks-sandbox-spawn-helper
kind: story
stage: done
tags: [security, sandbox, plugin]
parent: feature-background-tasks-sandbox-integration
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-01
updated: 2026-07-01
---

# Export pi-sandbox spawn helper for background-tasks

## Scope

Implement the pi-sandbox-owned helper that turns a shell command request into a bwrap spawn contract, plus the package subpath exports needed by `plugins/background-tasks`.

### Files

- `plugins/pi-sandbox/extensions/sandbox-spawn.ts` — new helper module.
- `plugins/pi-sandbox/extensions/sandbox-bwrap.ts` — reuse/export existing builder types only if needed; do not duplicate policy logic.
- `plugins/pi-sandbox/extensions/sandbox-config.ts` — add `backgroundTasks.sandboxIntegration` config type, validation, merge semantics, and diagnostics support.
- `plugins/pi-sandbox/extensions/sandbox.test.ts` — helper/config/export tests.
- `plugins/pi-sandbox/package.json` — add subpath `exports`.

## Required API

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
		args: string[]; // [...buildBwrapArgs(...), "--", "bash", "-c"] — append command at spawn time.
		cwd: string;
		env: NodeJS.ProcessEnv; // minimal allowlisted env only.
		message?: string;
	}
	| {
		state: "degraded";
		integration: "inactive";
		reason: "integration-off" | "sandbox-disabled" | "unsupported-platform";
		executable: null;
		args: [];
		cwd: string;
		env: NodeJS.ProcessEnv; // normal merged env for current unsandboxed behavior.
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

## Implementation notes

- `buildSandboxedSpawnArgs` owns policy acquisition: call `loadConfig(opts.cwd, { agentDir: opts.agentDir })`, honor additive project merge, and never make `background-tasks` parse sandbox config.
- State mapping:
  - `config.backgroundTasks?.sandboxIntegration === "off"` -> `degraded/integration-off` (run unsandboxed by explicit operator opt-out).
  - `config.enabled === false` -> `degraded/sandbox-disabled` (same intentional disable semantics as pi-sandbox bash).
  - `parseErrors.length > 0` -> `fail-closed/config-parse-error`.
  - `network.mode=filter` or `loaded.failClosedReasons` -> `fail-closed/filter-deferred`.
  - `decidePlatformState(...).state === "degrade"` -> `degraded/unsupported-platform`.
  - `decidePlatformState(...).state === "fail-closed"` -> `fail-closed/bwrap-missing | filter-deferred`.
  - successful Linux state -> `ok`.
- Env handling:
  - Compute `normalEnv = { ...(opts.baseEnv ?? process.env), ...(opts.envAdd ?? {}) }`.
  - For `ok`, compute `minimalEnv = buildMinimalEnv(normalEnv)` and pass that same `minimalEnv` to `buildBwrapArgs({ env: minimalEnv, ... })`; non-allowlisted `envAdd` keys are dropped.
  - For `degraded`, return `normalEnv` so non-Linux / explicit-off behavior matches current background-tasks behavior.
- `package.json` subpaths must expose at least:

```json
"exports": {
  "./bwrap": "./extensions/sandbox-bwrap.ts",
  "./sandbox-spawn": "./extensions/sandbox-spawn.ts",
  "./sandbox-config": "./extensions/sandbox-config.ts"
}
```

## Acceptance criteria

- [x] `buildSandboxedSpawnArgs({ cwd, command, bwrapAvailable:true, platform:"linux" })` returns `state:"ok"`, `executable:"bwrap"`, args ending in `["--", "bash", "-c"]`, and minimal env.
- [x] `envAdd` allowlisted keys (`PATH`, `HOME`, `TERM`, `LANG`, `LC_*`, `TMPDIR`) survive in `ok`; non-allowlisted keys such as `OPENAI_API_KEY` and arbitrary secrets are absent.
- [x] invalid sandbox JSON returns `fail-closed/config-parse-error` and does not return runnable args.
- [x] `network.mode:"filter"` returns `fail-closed/filter-deferred`.
- [x] Linux with missing bwrap returns `fail-closed/bwrap-missing`.
- [x] non-Linux returns `degraded/unsupported-platform` with normal merged env.
- [x] `backgroundTasks.sandboxIntegration:"off"` returns `degraded/integration-off`.
- [x] package metadata exports the helper subpath and existing tests stay green.

### Completed implementation notes

- Added `plugins/pi-sandbox/extensions/sandbox-spawn.ts` with `buildSandboxedSpawnArgs(opts)` returning a discriminated `ok` / `degraded` / `fail-closed` spawn contract. The ok contract returns `executable: "bwrap"` and args ending at `["--", "bash", "-c"]`; callers append `opts.command` as the final argv item so the helper does not embed shell text into the reusable prefix.
- The helper owns config acquisition via `loadConfig(opts.cwd, { agentDir })`, treats parse errors/filter/missing bwrap/build errors as fail-closed, degrades only for `sandboxIntegration:"off"`, `enabled:false`, or non-Linux unsupported platform, and filters sandboxed env through `buildMinimalEnv` after applying `envAdd` over `baseEnv`.
- Added `backgroundTasks.sandboxIntegration: "auto" | "off"` to pi-sandbox config with default `auto`. Additive merge ranks `off < auto`: a global/operator config may opt out with `off`, but a project-local `off` against default/global `auto` is a loosening attempt and is ignored with an additive warning; a project may tighten global `off` back to `auto`.
- Added package export subpaths for `./bwrap`, `./sandbox-spawn`, and `./sandbox-config` using `{ "types": "./extensions/*.ts", "import": "./extensions/*.ts" }`. Pi extension loading remains through the `pi.extensions` manifest, not the exports map.
- Added typebox-free tests in `plugins/pi-sandbox/extensions/sandbox-spawn.test.ts` covering ok env filtering, degraded states, fail-closed states, additive config merge, validation, and package export metadata.
- Verification: `bun test plugins/pi-sandbox/extensions/sandbox-spawn.test.ts` (11 pass) and `bun test plugins/pi-sandbox/extensions/sandbox.test.ts` (66 pass).

## Review (2026-07-01)

**Verdict**: Approve - story verified by implement; fast-lane advance

**Blockers**: none
**Important**: none
**Nits**: none

**Notes**: Substrate fast lane. Implementation verification recorded by implement (143/143 tests passing across the pi-sandbox + background-tasks suites incl. real bwrap integration: kill-lifecycle, denyRead, block-network, secret-env). Advanced review -> done.
