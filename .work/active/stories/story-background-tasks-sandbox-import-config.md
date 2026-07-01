---
id: story-background-tasks-sandbox-import-config
kind: story
stage: implementing
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

- [ ] `@nklisch/pi-sandbox` is an optional peer dependency, not a hard dependency.
- [ ] background-tasks still registers all three tools when pi-sandbox is absent.
- [ ] a missing optional package degrades to current unsandboxed behavior.
- [ ] a broken/non-resolving helper module returns a tool error and does not run the command unsandboxed.
- [ ] resolver is cached and test-injectable.
