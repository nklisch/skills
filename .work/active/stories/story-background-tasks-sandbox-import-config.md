---
id: story-background-tasks-sandbox-import-config
kind: story
stage: review
tags: [security, sandbox, plugin]
parent: feature-background-tasks-sandbox-integration
depends_on: [story-background-tasks-sandbox-spawn-helper]
release_binding: null
gate_origin: null
created: 2026-07-01
updated: 2026-07-01
---

# Add background-tasks optional peer import and sandbox resolver

## Scope

Declare the optional cross-plugin dependency and add a guarded resolver in `background-tasks` that can call pi-sandbox's spawn helper without making pi-sandbox mandatory.

### Files

- `plugins/background-tasks/package.json`
- `plugins/background-tasks/extensions/background-tasks.ts`
- `plugins/background-tasks/extensions/background-tasks.test.ts`

## Required package metadata

```json
"peerDependencies": {
  "@nklisch/pi-sandbox": "*"
},
"peerDependenciesMeta": {
  "@nklisch/pi-sandbox": {
    "optional": true
  }
}
```

Do not add a normal dependency: background-tasks must still install and run without pi-sandbox.

## Required resolver shape

Add test-injectable resolver plumbing without changing the Pi runtime call shape:

```ts
type SandboxedSpawnArgsResult = import("@nklisch/pi-sandbox/sandbox-spawn").SandboxedSpawnArgsResult;
type BuildSandboxedSpawnArgs = import("@nklisch/pi-sandbox/sandbox-spawn").buildSandboxedSpawnArgs;

type SandboxSpawnResolver =
  | { state: "absent" }
  | { state: "loaded"; buildSandboxedSpawnArgs: BuildSandboxedSpawnArgs }
  | { state: "broken"; message: string };

interface BackgroundTasksExtensionOptions {
  sandboxResolver?: () => Promise<SandboxSpawnResolver>;
}

export default function backgroundTasksExtension(pi: PiApi, options: BackgroundTasksExtensionOptions = {}): void;
```

Default resolver:

```ts
async function resolveSandboxSpawnBuilder(): Promise<SandboxSpawnResolver> {
	try {
		const mod = await import("@nklisch/pi-sandbox/sandbox-spawn");
		return { state: "loaded", buildSandboxedSpawnArgs: mod.buildSandboxedSpawnArgs };
	} catch (err) {
		if (isMissingOptionalSandboxPackage(err)) return { state: "absent" };
		return { state: "broken", message: (err as Error).message };
	}
}
```

## Implementation notes

- Cache the resolver promise in the extension closure so every poll tick does not re-import the package.
- Treat `state:"absent"` as the locked strategic degrade: background/monitor run as today.
- Treat `state:"broken"` as fail-closed for sandbox integration: return an error rather than silently running unsandboxed when the optional package exists but cannot load cleanly.
- Do not add a separate background-tasks config loader. The `sandboxIntegration` flag lives under `<cwd>/.pi/sandbox.json` as `backgroundTasks.sandboxIntegration`; pi-sandbox owns config parsing and returns `degraded/integration-off` when disabled.
- Keep the resolver injectable only for tests; production behavior is the guarded dynamic import.

## Acceptance criteria

- [x] `@nklisch/pi-sandbox` is an optional peer dependency, not a hard dependency.
- [x] background-tasks still registers all three tools when pi-sandbox is absent.
- [x] a missing optional package degrades to current unsandboxed behavior.
- [x] a broken/non-resolving helper module returns a distinct `state: "broken"` / unavailable helper result without crashing; the follow-up spawn-wiring stories will convert that state into the tool error without running unsandboxed.
- [x] resolver is cached and test-injectable.

## Implementation notes

- Added `@nklisch/pi-sandbox` as an optional peer dependency via `peerDependencies` + `peerDependenciesMeta.optional` in `plugins/background-tasks/package.json`. This advertises the integration surface without forcing install and avoids a hard dependency.
- Added `plugins/background-tasks/extensions/sandbox-bridge.ts` as the guarded import boundary. It dynamically imports `@nklisch/pi-sandbox/sandbox-spawn`, distinguishes a missing optional peer (`state: "absent"`) from a broken installed helper (`state: "broken"`), validates that `buildSandboxedSpawnArgs` exists, and caches the probe promise. It also exports the requested `getSandboxSpawnHelper()` availability facade for callers/tests.
- Wired `BackgroundTasksExtensionOptions.sandboxResolver` into `backgroundTasksExtension(pi, options)` and creates a cached resolver in the extension closure. The actual background/monitor spawn sites are intentionally unchanged for this story; later stories will call the cached resolver at spawn-decision time.
- Confirmed `plugins/pi-sandbox/extensions/sandbox-spawn.ts` already reads `backgroundTasks.sandboxIntegration` through `loadConfig()` and returns `degraded` with reason `integration-off` when set to `off`. No background-tasks-side config reader was added, preserving pi-sandbox as the single source of truth for config loading/merge and fail-closed decisions.
- Added typebox-free tests in `plugins/background-tasks/extensions/sandbox-bridge.test.ts` for absent optional package, broken import, available helper, missing export, resolver caching, missing-vs-broken classification, and package metadata.

## Verification

- `bun test plugins/background-tasks/extensions/sandbox-bridge.test.ts` — 7 pass / 0 fail.
- `bun test plugins/background-tasks/extensions/background-tasks.test.ts` — 35 pass / 0 fail.
- `bun test plugins/pi-sandbox/extensions/sandbox-spawn.test.ts` — 11 pass / 0 fail (confirms `backgroundTasks.sandboxIntegration` is honored by the helper).
