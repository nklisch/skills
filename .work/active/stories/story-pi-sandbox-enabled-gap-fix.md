---
id: story-pi-sandbox-enabled-gap-fix
kind: story
stage: review
tags: [security, sandbox]
parent: feature-sandbox-first-party-bwrap
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-01
updated: 2026-07-01
---

# `enabled: false` routes to unsandboxed bash (enabled-gap fix)

## Scope

The bash tool override's `execute` early-outs only on the `no-sandbox` flag; it never checks config `enabled`. So `enabled: false` leaves `sandboxInitialized = false` → bash fail-closes with "Sandbox not yet initialized" instead of running unsandboxed. **Already applied inline** on the on-box source copy (`~/.pi/agent/sandbox-extension-backup/index.ts`) this session — travels with the copy into `plugins/pi-sandbox/`.

## Unit

**File**: `plugins/pi-sandbox/extensions/sandbox.ts`, bash tool `execute` (~line 678) + module state (~line 673) + `session_start` `!config.enabled` branch (~line 880).

```ts
let disabledViaConfig = false; // module state
// session_start, !config.enabled branch:
disabledViaConfig = true;
// bash execute:
if ((pi.getFlag("no-sandbox") as boolean) || disabledViaConfig) {
  return localBash.execute(id, params, signal, onUpdate);
}
```

## Acceptance Criteria

- [x] With `enabled: false` in config and no `--no-sandbox` flag, bash runs unsandboxed (no "Sandbox not yet initialized" error).
- [x] With `enabled: true`, normal sandboxed path unchanged.
- [x] `--no-sandbox` flag still bypasses regardless of config.

## Implementation notes

Land mode: verified the source already carried the intended `disabledViaConfig` state and bash execute guard. I factored the guard predicate into the pure `shouldBypassSandbox(noSandboxFlag, disabledViaConfig)` helper so the module-internal decision is regression-testable without importing Pi core or `typebox`.

Scoped verification: `bun test plugins/pi-sandbox/extensions/sandbox.test.ts` passed (3 tests, 4 assertions). The tests cover `enabled:false` bypass, `enabled:true` sandbox path preservation, and `--no-sandbox` bypass precedence.
