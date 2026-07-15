---
id: feature-pi-sandbox-background-project-tmp-state
kind: feature
stage: implementing
tags: [bug, sandbox, background-tasks, plugin]
parent: null
depends_on: [feature-pi-sandbox-disk-backed-tmp]
release_binding: null
gate_origin: null
created: 2026-07-14
updated: 2026-07-14
---

# Keep background-task sandbox spawn state coherent with the live pi-sandbox session

## Brief

The live v0.1.0 review-fix session could run ordinary sandboxed `bash`, but both
`background` invocations failed before spawning with:

> Sandbox refused to start background command: Sandbox tmpBackend=session-disk requires projectTmpDir (the pinned per-project disk temp dir). The session_start hook must derive and thread it through; never silently fall back to host /tmp.

This occurred from the repository root after the disk-backed temp work had
landed and prevented detached test runs. The failure is real and correctly
fail-closed, but it exposes incoherent lifecycle state: the mediated bash path
has a healthy session-pinned project temp directory while the independently
resolved `@nklisch/pi-sandbox/sandbox-spawn` helper observes the default
`session-disk` backend with no corresponding `projectTmpDir`.

The seam spans `plugins/pi-sandbox/extensions/sandbox.ts`, `sandbox-spawn.ts`,
and background-tasks' cached bridge/import lifecycle. Pi loads extensions with
fresh Jiti loaders and module caching disabled. `sandbox-spawn.ts` currently
imports mutable getters from `sandbox.ts`; that relative import can evaluate a
second `sandbox.ts` instance whose extension factory and `session_start` never
ran. The package helper therefore sees `activePolicy === null` even while the
live mediated-bash extension instance is healthy.

The feature establishes one coherent initialized spawn contract across direct
extension loading, package-subpath loading, session replacement, and `/reload`.
It preserves fail-closed behavior before initialization or after shutdown; it
does not derive trusted session state per command or silently fall back to host
`/tmp`.

## Scope notes

- Medium feature: the fix changes a cross-package, cross-entry lifecycle
  contract and needs a design pass plus integration coverage.
- No foundation-doc roll-forward: this repairs the existing documented
  background/monitor sandbox integration rather than adding a capability.
- Dependency on `feature-pi-sandbox-disk-backed-tmp` records the session-pinned
  state contract this work preserves; that dependency is already done.
- Direct-read scope plus a focused Explore pass confirmed the failure mechanism:
  Pi's fresh Jiti loaders make module-local state sharing unsafe even when the
  package export and direct extension path resolve to the same filesystem tree.

## Design decisions

- **Cross-loader state transport**: Use a versioned, immutable `globalThis`
  snapshot under a stable `Symbol.for(...)` key. This is option 1, explicitly
  confirmed by the operator. It matches the repository's existing cross-extension
  capability/handshake pattern and is shared across module-loader instances in
  the same JavaScript realm.
- **Read freshness**: Cache the stateless builder function, not the snapshot.
  `buildSandboxedSpawnArgs` reads and validates the current snapshot on every
  invocation, so `/reload` and session replacement cannot retain an old path.
- **Project identity**: Include the canonical session `configCwd` in the ready
  snapshot and require it to match the caller's canonical config cwd. A single
  process-global slot must fail closed rather than bind another project's temp
  directory.
- **Intentional disable compatibility**: Preserve the documented 0.1.0 behavior
  where `--no-sandbox` does not propagate to background/monitor and those tools
  may remain more strictly sandboxed. That branch publishes a usable ready
  `host-tmpfs` snapshot. Propagating the flag remains separate post-0.1.0 work.
- **Trust boundary**: Publish only path/backend/lifecycle labels—no secrets or
  whole config objects. Other Pi extensions can mutate process globals, but Pi
  extensions are already trusted code outside this inner sandbox boundary.

## Architectural choice

### Chosen: versioned global session snapshot

The live sandbox extension atomically replaces a frozen snapshot at lifecycle
transitions. The independently loaded package helper structurally validates and
reads it per call. Module-local `activePolicy` remains the single source for the
live bash/file-tool extension; the snapshot is a narrow cross-loader projection
of only the session-pinned temp state the package helper needs.

### Rejected: inject state through background-tasks' bridge

This makes dependencies explicit but does not by itself solve how the live Jiti
extension instance transfers state into an independently imported package
module. It expands background-tasks' coupling to pi-sandbox internals and still
needs a registration mechanism, with more cache invalidation surface.

### Rejected: derive the temp path per command

This avoids lifecycle state but breaks the session-pinning security invariant,
reopens filesystem race windows for every command/poll, and can make mediated
bash and background/monitor enforce different policies.

## Implementation units

### Unit 1: Versioned snapshot contract

**File**: `plugins/pi-sandbox/extensions/sandbox-config.ts`

Add a stable symbol and a small structurally validated contract:

```ts
export const SANDBOX_SPAWN_SESSION_STATE_SYMBOL_DESCRIPTION =
  "@nklisch/pi-sandbox.spawn-session-state";
export const SANDBOX_SPAWN_SESSION_STATE_SYMBOL = Symbol.for(
  SANDBOX_SPAWN_SESSION_STATE_SYMBOL_DESCRIPTION,
);

export type SandboxSpawnSessionInactiveReason =
  | "not-initialized"
  | "initializing"
  | "disabled"
  | "fail-closed"
  | "unsupported-platform"
  | "shutdown";

export type SandboxSpawnSessionStateV1 = Readonly<
  | {
      version: 1;
      state: "inactive";
      reason: SandboxSpawnSessionInactiveReason;
    }
  | {
      version: 1;
      state: "ready";
      configCwd: string;
      tmpBackend: "session-disk" | "host-tmpfs";
      projectTmpDir: string | null;
    }
>;

export type SandboxSpawnSessionStateRead =
  | { ok: true; value: SandboxSpawnSessionStateV1 }
  | { ok: false; reason: string };

export function publishSandboxSpawnSessionState(
  state: SandboxSpawnSessionStateV1,
): SandboxSpawnSessionStateV1;

export function readSandboxSpawnSessionState(): SandboxSpawnSessionStateRead;
```

`publish` clones and freezes a flat object before replacing the global value.
`read` rejects absent values, unknown versions, unrecognized discriminants,
non-absolute ready paths, `session-disk` without an absolute project temp dir,
and `host-tmpfs` with a non-null project temp dir. Failure reasons contain no
published path/config dump beyond the caller-visible structural diagnosis.

**Acceptance criteria**:
- [ ] The symbol resolves identically across independently evaluated modules.
- [ ] Published objects are frozen and replaced, never mutated.
- [ ] Absent, malformed, contradictory, or unknown-version payloads are rejected.
- [ ] No credential, environment, policy-rule, or full config data is published.

### Unit 2: Lifecycle publisher

**File**: `plugins/pi-sandbox/extensions/sandbox.ts`

Add narrow local helpers that publish canonical-cwd snapshots derived from the
installed `activePolicy`. At `session_start` entry, invalidate any prior ready
state with `inactive/initializing` before parsing config or awaiting work. Every
early terminal branch publishes its stable inactive disposition. Publish ready
only after a coherent policy is installed:

```ts
function publishReadySpawnSessionState(ctxCwd: string, policy: SandboxPolicy): void;
function publishInactiveSpawnSessionState(
  reason: SandboxSpawnSessionInactiveReason,
): void;
```

Healthy Linux initialization publishes the final `session-disk` path or the
explicit `host-tmpfs/null` pair. The `--no-sandbox` branch publishes its
permissive `host-tmpfs/null` policy to preserve the existing stricter
background integration behavior. `session_shutdown` invalidates the snapshot
before clearing `activePolicy` and other module state.

Keep `getProjectTmpDir` and `getTmpBackend` for direct diagnostics/tests if still
useful, but they are no longer a package-helper dependency.

**Acceptance criteria**:
- [ ] No stale ready snapshot survives initialization entry or shutdown.
- [ ] Partial/failing initialization never publishes `session-disk/null` as ready.
- [ ] Healthy state is published only after `activePolicy` holds the same values.
- [ ] Reload/session replacement transitions ready → inactive → new ready.
- [ ] `--no-sandbox` retains the existing background/monitor behavior.

### Unit 3: Stateless package helper consumer

**File**: `plugins/pi-sandbox/extensions/sandbox-spawn.ts`

Remove the import of mutable getters from `./sandbox`. Resolve the temp inputs
with a local helper:

```ts
type ResolvedSpawnTempState =
  | {
      ok: true;
      tmpBackend: "session-disk" | "host-tmpfs";
      projectTmpDir: string | null;
    }
  | { ok: false; reason: string };

function resolveSpawnTempState(
  opts: SandboxSpawnOptions,
  configCwd: string,
): ResolvedSpawnTempState;
```

Explicit test overrides remain authoritative when complete:
- `tmpBackend:"host-tmpfs"` resolves to `projectTmpDir:null` without global state.
- `tmpBackend:"session-disk"` plus an explicit absolute `projectTmpDir` resolves
  without global state.
- Any production/default path missing required values reads the current
  snapshot, verifies its canonical `configCwd`, and fills only the missing
  values.

Add `"session-state-unavailable"` to the fail-closed result reason union and
return that result for absent, inactive, malformed, version-mismatched, or
wrong-project state. Snapshot resolution occurs after config disable/degrade
and platform checks, but before building bwrap args. The builder function stays
safe to cache because it retains no snapshot.

**Acceptance criteria**:
- [ ] `sandbox-spawn.ts` has no import from `./sandbox`.
- [ ] A cached builder observes lifecycle snapshot replacement on every call.
- [ ] Missing/inactive/malformed/wrong-cwd state fails closed with a stable reason.
- [ ] Existing explicit test/diagnostic overrides continue to work.
- [ ] No production path falls back to host `/tmp` when session state is absent.

### Unit 4: Cross-loader regression and lifecycle coverage

**Files**:
- `plugins/pi-sandbox/extensions/sandbox.test.ts`
- `plugins/pi-sandbox/extensions/sandbox-spawn.test.ts`
- `plugins/pi-sandbox/extensions/sandbox-handshake-integration.test.ts`
- `plugins/background-tasks/extensions/background-tasks.test.ts` only if needed
  to exercise the real cached helper seam

The decisive regression loads a cache-busted live `sandbox.ts` extension,
drives its real `session_start` with controlled `XDG_CACHE_HOME` and
`tmpBackend:"session-disk"`, then invokes the independently imported real
`buildSandboxedSpawnArgs` with no temp overrides. It must return `ok` and carry
the live path in both `--bind` and `--setenv TMPDIR`. This fails on the current
module-getter implementation.

Add contract/lifecycle cases:
1. before start → `session-state-unavailable`;
2. start project A → A's path is used;
3. shutdown → blocked;
4. replacement/reload-shaped start project B → B's path is used, never A's;
5. stale ready followed by an initialization failure → blocked;
6. malformed/unknown-version/wrong-cwd snapshots → blocked;
7. explicit test overrides work with no snapshot;
8. a cached builder function sees state replacements without re-importing.

**Acceptance criteria**:
- [ ] At least one test reproduces distinct module identities without overrides.
- [ ] Tests assert bwrap argv and child `TMPDIR`, not just accessor values.
- [ ] Tests prove shutdown/failure invalidation, not only healthy publication.
- [ ] The real background helper seam is covered rather than only a fake builder.

## Implementation order

1. Add the snapshot contract and its structural tests.
2. Publish lifecycle state from the live extension.
3. Switch `sandbox-spawn` to the per-call snapshot consumer.
4. Add the cross-loader regression and lifecycle integration coverage.
5. Run both plugin suites and the pi-package metadata checks.

No child stories: the units form one tightly coupled lifecycle contract and the
regression exercises all of them together. Splitting them would create partial
states that cannot be verified independently.

## Testing

- **Unit**: symbol identity, freeze/replace semantics, structural validation,
  backend/path invariants, explicit override resolution, and stable fail-closed
  reasons.
- **Lifecycle integration**: drive `session_start`/`session_shutdown` on the
  cache-busted live extension while invoking one independently imported cached
  builder across transitions.
- **Cross-package integration**: confirm background/monitor spawn decisions use
  the live project temp directory and create no job when the snapshot is
  invalidated.
- **Regression suites**:
  - `bun test plugins/pi-sandbox/extensions`
  - `bun test plugins/background-tasks/extensions`
  - `npm run check:pi-packages`

## Pre-mortem and risks

- **Single global slot with concurrent project runtimes**: two active sandbox
  sessions in one JavaScript realm could replace each other's snapshot. The
  canonical-cwd check converts this into fail-closed denial rather than
  cross-project binding. Current Pi session replacement is sequential and
  awaits shutdown; multi-runtime support would require a keyed registry and is
  outside this fix.
- **Version skew**: an old producer with a new helper has no recognized snapshot;
  a new producer with an old helper retains the current failure. Unknown or
  absent versions fail closed. Compatibility tests must cover the new helper's
  side of the contract.
- **Optimistic handshake diagnostics**: the existing handshake proves helper
  availability, not ready session state, so `/sandbox` may briefly say the
  bridge is loaded while a spawn correctly fails closed. This fix does not
  broaden the handshake; readiness diagnostics can follow separately if the
  brief window is operationally confusing.
- **Snapshot invalidated during an already prepared monitor poll**: active jobs
  are cancelled and awaited on `session_shutdown`; new spawn preparation reads
  current state. Existing monitor behavior may retain one prepared argv prefix
  during its lifetime, which is acceptable only because shutdown owns job
  cancellation.
- **Trusted-extension tampering**: any trusted Pi extension can replace the
  symbol. That is outside pi-sandbox's stated inner credential boundary.

Fallback if the global snapshot cannot cross the actual loader boundary is a
minimal global registration function returning the current frozen snapshot;
that still uses the same symbol/realm mechanism and must preserve the same
validation and lifecycle ordering. Per-command derivation is not an acceptable
fallback.
