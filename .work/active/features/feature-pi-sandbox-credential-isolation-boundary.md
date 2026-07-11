---
id: feature-pi-sandbox-credential-isolation-boundary
kind: feature
stage: implementing
tags: [security, sandbox, plugin]
parent: null
depends_on: []
release_binding: null
gate_origin: null
research_refs: [sandboxed-git-auth-patterns]
research_origin: null
created: 2026-07-11
updated: 2026-07-11
---

# Narrow pi-sandbox to a credential-isolation boundary

## Brief

Pi runs as `agent:agent` inside an operator-controlled VM, with `/home/agent/projects`
as its intended working surface. The VM is the primary host-security boundary. The
inner pi-sandbox boundary has a narrower job: keep credentials held by Pi's trusted
control plane unavailable to model-controlled commands and file tools running as the
same Unix user.

Reassess the current first-party bwrap implementation against Pi's existing
`@anthropic-ai/sandbox-runtime` example, Gondolin tool routing, and OpenShell posture.
Retain custom code only for demonstrated Pi-specific gaps. The resulting package
should be a small, reusable credential/process membrane rather than an expanding
general sandbox platform.

This feature replaces the earlier `feature-pi-sandbox-git-egress` direction.
Authenticated GitHub and Forgejo operations belong in a separate forge-operations
plugin and PR; pi-sandbox provides only the credential-isolation capability and a
non-secret health/capability handshake that another trusted extension can require.

## Strategic decisions

- **Outer boundary:** the VM owns host isolation and broad damage containment.
- **Inner boundary:** pi-sandbox separates Pi's credential-bearing control plane from
  model-run processes inside the VM.
- **Protected credentials:** Umans and OpenAI/Codex credentials in Pi provider storage,
  plus operator-owned GitHub and Forgejo credential material.
- **Working surface:** `/home/agent/projects` is the intended writable project surface.
- **Backend posture:** prefer an existing sandbox runtime or VM-routing primitive where
  it meets the contract; own bwrap policy code only where the upstream surfaces do not.
- **Package boundary:** no forge APIs, Git credential helper, privileged Git runner, or
  provider-specific remote-operation policy inside pi-sandbox.
- **Branch/release order:** complete this feature on the current draft pi-sandbox PR and
  keep `plugins/pi-sandbox/package.json` at `0.1.0` until that PR merges.

## Required boundary

The design must preserve or provide:

1. A separate PID namespace and private `/proc` for model-run shell commands, so they
   cannot inspect Pi's process environment.
2. A minimal child environment without provider tokens, forge tokens, authentication
   sockets, or credential-helper variables.
3. Read masking for credential-bearing paths, including Pi auth/session state, SSH/GPG
   material, GitHub CLI state, generic Git credential stores, and operator-configured
   Forgejo credential locations.
4. Equivalent enforcement in Pi's `read` tool, not only Bash mounts.
5. The same boundary for background and monitor commands.
6. Fail-closed behavior when the credential boundary cannot be established.
7. A writable-surface contract centered on the active project under
   `/home/agent/projects`, including the already-completed pinned Git-directory support
   for submodules and linked worktrees.
8. A non-secret capability/health signal that a separate forge-operations extension can
   require before loading file-backed credentials.

## Scope questions for design

- Can `@anthropic-ai/sandbox-runtime` replace the first-party mount/launch backend while
  retaining private `/proc`, minimal environment, file-tool parity, and fail-closed
  semantics?
- Would Gondolin routing materially simplify the inner boundary when Pi itself remains
  inside the outer VM, or does it add a redundant nested VM?
- Which existing general controls remain core, become optional defense-in-depth, or move
  out of pi-sandbox: tool-egress policy, secret-shape inspection, broad write policy, and
  future network filtering?
- What capability handshake can be consumed by other extensions without coupling them
  to pi-sandbox internals?
- How should an operator register additional credential paths, such as the selected
  Forgejo token store, without allowing project-local configuration to weaken policy?

## Acceptance criteria

- The implemented and documented threat model explicitly distinguishes the outer VM
  boundary from the inner credential-isolation boundary.
- Provider credentials and registered forge credential paths are unavailable through
  Bash, `read`, background, and monitor surfaces when protection is active.
- Sandbox children cannot read Pi's environment through `/proc` and receive only the
  declared minimal environment.
- Initialization and integration failures do not silently fall back to credential-visible
  command execution.
- The backend buy-versus-build decision is recorded with a concrete delta against Pi's
  sandbox-runtime, Gondolin, and OpenShell options.
- A forge extension can verify the credential boundary through a small stable capability
  contract without receiving secrets.
- Forge-specific operations and authentication policy are absent from pi-sandbox.
- `plugins/pi-sandbox/package.json` remains at `0.1.0` for the current draft PR.

## Research grounding

**Source:** `.research/analysis/campaigns/sandboxed-git-auth-patterns/synthesis.md`
(slug: `sandboxed-git-auth-patterns`)

The research rejects credentials in model-observable space and privileged host Git over
agent-controlled repository state. Subsequent operator clarification narrows the desired
sandbox posture to protecting Pi-held credentials inside an already-contained VM.

## Design decisions

Resolved interactively with the operator before design (user confirmed
"defaults look good"). These lock direction for the design below.

- **Q1 — buy-vs-build posture for v0.1.0**: **(A) document-only reassessment** — record the concrete buy-vs-build delta against `@anthropic-ai/sandbox-runtime` (srt), Gondolin, and OpenShell in the design body + README non-goals + a threat-model doc; retain the first-party bwrap argv builder for v0.1.0 because it already meets the required boundary and carries Pi-specific guards srt lacks; track srt adoption as a follow-up work item gated on srt closing its documented gaps and reaching maturity. Rationale: the required boundary is already met by the existing implementation; porting to srt (0.0.26, research preview) now would regress the hard-won guards for no demonstrated boundary gain, and srt has documented gaps that conflict with required-boundary #1/#3/#6.
- **Q2 — Gondolin & OpenShell scope**: **posture references only, not adoption candidates** for pi-sandbox; no pluggable-backend interface designed in v0.1.0. Rationale: Gondolin is a full local Linux micro-VM (redundant nested VM inside the already-contained operator VM); OpenShell is a whole-agent governance platform (Pi would run inside it, not use it as an inner membrane). A pluggable-backend interface is speculative surface that contradicts "small reusable membrane."
- **Q3 — general-controls triage**: tool-egress policy = **core** (credential-exfil prevention across subagent/web-search/etc., required for boundary #4 parity); write policy = **core** (required-boundary #7 writable-surface contract); secret-shape inspector = **optional defense-in-depth** (catches secrets already leaked into tool *input*; valuable but not the isolation boundary itself — keep shipped, document as opt-in, candidate to split out later); network `filter` mode = **deferred + tracked, stays in package** (already a backlog item; removing it loses the fail-closed guardrail).
- **Q4 — capability handshake shape**: **(B) a separate stable query surface** — a new `Symbol.for("@nklisch/pi-sandbox.credential-boundary-capability")` globalThis property published by pi-sandbox (distinct from the existing background-tasks handshake), consumed by a future forge-operations extension; verify **boundary-active-and-not-fail-closed only**, NOT specific credential paths. Rationale: verifying specific paths couples the forge extension to pi-sandbox's path registry, which the brief wants to avoid; a second symbol keeps the forge contract independent of the background-tasks handshake shape.
- **Q5 — credential path registration**: **no new config block** — the existing global `denyRead` + `envScrub.names`/`patterns` already serve as the operator credential registry, and project-local config is already additive-only (can add credential paths = tighten, never remove). The demonstrated gap is the env-scrub *floor* missing `GITHUB_TOKEN`/`GH_TOKEN` and the default `denyRead` missing the XDG git credential store; close those. Rationale: a separate `operatorCredentials` block would duplicate a mechanism that already meets the "operator registers, project can't weaken" requirement — that is over-engineering against "retain custom code only for demonstrated gaps."

## Other agent review

Cross-model advisory review was **not** run: this feature was designed under direct user invocation (interactive alignment), and the user confirmed the design decisions above. Per the feature-design caller-awareness rule, the user is the alignment signal in interactive mode; advisory review applies to autopilot delegations with large/risky decisions and no prior `--only-questions` capture. The design may still receive a fresh-context review pass at stage:review.

## Architectural choice

**Chosen: A — document-only reassessment + minimal gap closure, retain first-party bwrap backend.**

Three plausible approaches:

- **A. Document-only reassessment + minimal gap closure (chosen).** Record the buy-vs-build delta; retain the first-party bwrap argv builder; add only the net-new capability handshake and close the two demonstrated credential-path/env-scrub gaps; document the threat model and controls triage. Optimizes for: preserving the near-complete, heavily-reviewed draft PR; no new runtime dependency; no regression of the Pi-specific guards. Sacrifices: does not gain srt's proxy-based `filter` network mode or macOS seatbelt backend (neither is required by the brief; `filter` stays deferred+tracked).
- **B. Port to `@anthropic-ai/sandbox-runtime` as the backend.** Adopt srt's `SandboxManager.wrapWithSandbox`; keep only Pi-specific gap-glue. Optimizes for: cross-tool config vocabulary parity with the official Pi example; srt's proxy `filter` mode and macOS seatbelt. Sacrifices: regresses the hard-won guards (fail-closed config, in-process file-tool parity, additive-only project merge, hardlink-alias guard, trusted bwrap-path resolution, background/monitor spawn contract); adds a 0.0.x research-preview dependency to a 0.1.0 package; srt's documented gaps (Issue #214 proc-in-container, Issue #149 denyRead-tmpfs-writable) conflict with required-boundary #1/#3/#6.
- **C. Hybrid — adopt srt's `credentials` config shape, keep first-party argv builder.** Optimizes for: operator ergonomics + config parity with srt. Sacrifices: more config surface for v0.1.0; a second config vocabulary (`credentials` vs `denyRead`/`envScrub`) that operators must reconcile; the srt `credentials` shape gains nothing the existing additive-only denyRead/envScrub does not already provide.

A is chosen because the required boundary is already met by the existing first-party implementation, srt's maturity and documented gaps make a port premature, and the brief directs "retain custom code only for demonstrated Pi-specific gaps" — which the first-party code satisfies in full (see Buy-vs-build delta below).

## Boundary status against the required boundary

The current draft PR already meets most of the 8-point required boundary. The design is partly retrospective (document what exists) and partly prospective (net-new handshake + two gap closures). This is the honest mapping:

| # | Required boundary | Status | Where |
|---|---|---|---|
| 1 | Separate PID namespace + private `/proc` | **MET** | `buildBwrapArgs`: `--unshare-pid --proc /proc` |
| 2 | Minimal child env without tokens/sockets | **MET** (gap in degraded scrub floor) | `buildMinimalEnv` whitelist + `PROVIDER_SECRET_ENV_NAMES` for degraded spawn; **gap**: `GITHUB_TOKEN`/`GH_TOKEN` missing from scrub floor → Story 2 |
| 3 | Read masking for credential-bearing paths | **MET** (gap in default denyRead) | bwrap deny overlays + in-process `enforceDenyRead`; defaults cover `~/.ssh`, `~/.aws`, `~/.gnupg`, `~/.pi/agent/auth.json`, `~/.pi/agent/sessions`, `~/.config/gh`, `~/.git-credentials`, `~/.netrc`, `~/.npmrc`, `~/.docker/config.json`; **gap**: XDG `~/.config/git/credentials` missing → Story 2; forgejo paths are operator-registered via global `denyRead` (already additive-only) |
| 4 | Equivalent enforcement in `read` tool | **MET** | `makeReadOperations` → `enforceDenyRead` |
| 5 | Same boundary for background + monitor | **MET** | `buildSandboxedSpawnArgs` + `sandbox-bridge` handshake + `backgroundTasks.sandboxIntegration` |
| 6 | Fail-closed when boundary can't be established | **MET** | `failClosed` state + `createFailClosedPolicy` + degraded-spawn secret strip |
| 7 | Writable-surface contract + pinned git dirs | **MET** (already-completed) | `discoverGitDirs` + `pinnedGitDirs` (session-pinned) + additive-only `allowWrite` |
| 8 | Non-secret capability/health signal for a forge extension | **NOT MET** (net-new) | → Story 1 |

## Buy-vs-build delta (recorded decision)

**Decision: retain the first-party bwrap backend for v0.1.0; do not adopt srt/Gondolin/OpenShell.** Assessed 2026-07-11 against srt v0.0.26 (the version Pi's own official example pins).

### `@anthropic-ai/sandbox-runtime` (srt) — the library behind Pi's official sandbox example

srt provides: Linux bwrap + network namespace, macOS seatbelt, proxy-based `filter` network mode (the mode pi-sandbox deferred), a `credentials` config block (deny files + `--unsetenv` env vars), PID-namespace isolation with tests, and a `wrapWithSandbox(command)` API.

**Demonstrated Pi-specific gaps srt does NOT close** (justifying retained custom code):

1. **Fail-closed config boundary.** srt's official Pi example fails *open* on init error (catch sets `sandboxEnabled=false` and notifies; bash falls through unsandboxed). pi-sandbox fails *closed* (blocks bash, keeps file tools hardened).
2. **In-process file-tool parity.** srt sandboxes bash only. pi-sandbox hardens `read`/`write`/`edit` in-process, so protections hold even when bwrap is fail-closed or unavailable.
3. **Additive-only project config.** srt's example `deepMerge`s project-over-global (project can weaken). pi-sandbox enforces additive-only (project can only tighten).
4. **Hardlink-alias guard.** srt Issue #149 documents denyRead dirs are writable via tmpfs mount. pi-sandbox's `assertNoHardlinkedDeniedFiles` refuses to start when a denied file has `nlink > 1`.
5. **Trusted bwrap-path resolution.** srt resolves bwrap via PATH; pi-sandbox uses a fixed system allowlist (`/usr/bin/bwrap`, `/bin/bwrap`) + realpath, never PATH (hostile PATH cannot substitute a fake wrapper).
6. **Background/monitor spawn contract.** srt's `wrapWithSandbox` returns a command string. pi-sandbox's `buildSandboxedSpawnArgs` returns an argv+env contract with explicit fail-closed/degraded states that `@nklisch/pi-background-tasks` consumes.

**srt advantages not required by this feature** (deferred, not rejected): proxy `filter` network mode; macOS seatbelt backend. `filter` stays deferred+tracked (backlog `idea-pi-sandbox-filter-tcp-proxy`); macOS is graceful-degrade by design (outer VM is the boundary).

**srt shared limitations (honest, not a Pi-specific advantage):** `--proc /proc` fails in containers with default seccomp even with `CAP_SYS_ADMIN` (srt Issue #214) — pi-sandbox has the same limitation since it uses the same bwrap flag; the operator VM must clear this at the environment level. srt is labeled an "open source research preview" and is 0.0.x versioned.

### Gondolin (earendil-works) — not adopted

A full local Linux micro-VM (QEMU/krun default) with a userspace network stack and secret-injection-without-delivery. Inside the already-contained operator VM it is a redundant nested VM; its value (hermetic network mediation, secret injection) is orthogonal to pi-sandbox's narrow credential-isolation job. **Posture reference only.**

### OpenShell (NVIDIA) — not adopted

A whole-agent governance platform that wraps the agent runtime as a k8s pod / managed sandbox with declarative YAML policy across network/filesystem/process/inference layers. Adopting it means Pi runs *inside* OpenShell; it is not an inner membrane pi-sandbox could use. **Posture reference only.**

### Revisit triggers

- srt reaches a stable 1.x and closes Issue #214 (proc-in-container) and Issue #149 (denyRead-tmpfs-writable).
- srt exposes an additive-only config merge, in-process file-tool hooks, a fail-closed init contract, and a background/monitor spawn contract (or pi core exposes the interception hooks to build them atop srt).
- A product requirement emerges for macOS seatbelt bash sandboxing or proxy-based `filter` egress that justifies the port cost.

## Implementation Units

### Unit 1: Forge capability handshake (trickiest unit — net-new cross-extension contract)
**File**: `plugins/pi-sandbox/extensions/sandbox-config.ts` (symbol + payload + reader) and `plugins/pi-sandbox/extensions/sandbox.ts` (publisher at every state transition)
**Story**: `feature-pi-sandbox-credential-isolation-boundary-capability-handshake`

This is the highest-unknown unit: it introduces a new cross-extension contract (a global symbol + publication timing + consumer semantics) that a not-yet-existing forge-operations extension will depend on. Getting the payload shape wrong (too much → coupling; too little → forge can't verify; wrong timing → race) is the main risk.

```typescript
// sandbox-config.ts — new exports

export const CREDENTIAL_BOUNDARY_CAPABILITY_SYMBOL_DESCRIPTION =
  "@nklisch/pi-sandbox.credential-boundary-capability";
export const CREDENTIAL_BOUNDARY_CAPABILITY_SYMBOL =
  Symbol.for(CREDENTIAL_BOUNDARY_CAPABILITY_SYMBOL_DESCRIPTION);

/** Non-secret capability/health signal published by pi-sandbox for a separate
 *  forge-operations extension to require before loading file-backed credentials.
 *  Contains NO credential paths and NO secrets — only state labels. */
export interface CredentialBoundaryCapability {
  /** True only when the inner credential-isolation boundary is active:
   *  sandbox enabled + initialized + not fail-closed + not disabled +
   *  not --no-sandbox + (on Linux) bwrap resolved. False on non-Linux degrade,
   *  fail-closed, disabled, or bypass. Consumers MUST refuse to load
   *  file-backed credentials when this is false. */
  active: boolean;
  /** True when the sandbox failed to initialize and is blocking bash.
   *  Distinct from active=false due to bypass. Consumers treat both as
   *  "do not load credentials" regardless. */
  failClosed: boolean;
  /** Short human-readable reason when active is false. State labels only
   *  ("disabled via config", "fail-closed: bwrap missing",
   *  "unsupported platform: darwin"). Never secrets or paths. */
  reason?: string;
}

export function readCredentialBoundaryCapability(): unknown {
  return (globalThis as typeof globalThis & Record<symbol, unknown>)[
    CREDENTIAL_BOUNDARY_CAPABILITY_SYMBOL
  ];
}

/** Forge consumer helper. Returns true only when the boundary is provably
 *  active. Re-read per credential load — never cache (state can change on
 *  /reload); the symbol read is cheap. */
export function isCredentialBoundaryActive(handshake: unknown): boolean {
  if (!handshake || typeof handshake !== "object") return false;
  return (handshake as { active?: unknown }).active === true;
}
```

```typescript
// sandbox.ts — publisher, called at every state transition in session_start
// (success, fail-closed, disabled, degrade, --no-sandbox) and session_shutdown.

function publishCredentialBoundaryCapability(state: {
  sandboxEnabled: boolean;
  sandboxInitialized: boolean;
  failClosed: boolean;
  disabledViaConfig: boolean;
  osSandboxUnavailable: boolean;
  noSandbox: boolean;
  lastFailClosedReason: string | null;
}): void {
  const active =
    state.sandboxEnabled &&
    state.sandboxInitialized &&
    !state.failClosed &&
    !state.disabledViaConfig &&
    !state.osSandboxUnavailable &&
    !state.noSandbox;
  const reason = active
    ? undefined
    : state.noSandbox
      ? "sandbox disabled via --no-sandbox"
      : state.disabledViaConfig
        ? "sandbox disabled via config"
        : state.failClosed
          ? state.lastFailClosedReason ?? "sandbox fail-closed"
          : state.osSandboxUnavailable
            ? "OS bash sandbox unavailable (non-Linux degrade)"
            : "sandbox not initialized";
  const capability: CredentialBoundaryCapability = {
    active,
    failClosed: state.failClosed,
    reason,
  };
  (globalThis as typeof globalThis & Record<symbol, unknown>)[
    CREDENTIAL_BOUNDARY_CAPABILITY_SYMBOL
  ] = capability;
}
```

The `/sandbox` command output gains a `Credential boundary capability:` line read from the symbol (single source of truth).

**Implementation Notes**:
- Publish at every transition, not just success: a forge consumer reading during a fail-closed window must see `active:false, failClosed:true`, and on `--no-sandbox` must see `active:false, failClosed:false, reason:"sandbox disabled via --no-sandbox"`. On `session_shutdown` publish `{active:false, failClosed:false, reason:"session shutdown"}`.
- On non-Linux graceful-degrade, `active=false` (bash is unsandboxed — the inner membrane is not active). This is honest: a forge consumer refuses to load credentials where the bash boundary isn't active, even on macOS. The operator who wants forge on macOS accepts the outer-VM-only boundary via forge's own config — that is forge's decision, not pi-sandbox's.
- The payload is deliberately path- and secret-free. A forge consumer verifies "boundary active and not fail-closed" — never specific credential paths (Q4 decision), so it does not couple to pi-sandbox's path registry.
- Re-use the existing `Symbol.for` global-registry pattern from the background-tasks handshake so independently loaded extension modules share one key. The description string is the stable contract; forge-operations imports it from `@nklisch/pi-sandbox` (re-export the symbol + reader + `isCredentialBoundaryActive` from the package barrel or `./sandbox-spawn` subpath).

**Acceptance Criteria**:
- [ ] After successful Linux `session_start`, `readCredentialBoundaryCapability()` returns `{ active: true, failClosed: false }`.
- [ ] On fail-closed init, returns `{ active: false, failClosed: true, reason: <state label> }`.
- [ ] On non-Linux degrade, returns `{ active: false, failClosed: false, reason: "OS bash sandbox unavailable (non-Linux degrade)" }`.
- [ ] On `--no-sandbox`, returns `{ active: false, failClosed: false, reason: "sandbox disabled via --no-sandbox" }`.
- [ ] The payload contains NO credential paths and NO secrets (only state labels).
- [ ] `/sandbox` output includes a `Credential boundary capability:` line.
- [ ] A forge consumer using only `isCredentialBoundaryActive(handshake)` correctly gates credential loading across all states.

---

### Unit 2: Credential-path / env-scrub gap closure
**File**: `plugins/pi-sandbox/extensions/sandbox-spawn.ts` and `plugins/pi-sandbox/extensions/sandbox-config.ts`
**Story**: `feature-pi-sandbox-credential-isolation-boundary-credential-gap-closure`

Two demonstrated gaps in the credential-isolation floor:

1. **Env-scrub floor missing GitHub CLI tokens.** `PROVIDER_SECRET_ENV_NAMES` (the non-configurable degraded-spawn scrub floor in `sandbox-spawn.ts`) lists `COPILOT_GITHUB_TOKEN` but not `GITHUB_TOKEN` or `GH_TOKEN` — the env vars the GitHub CLI and GitHub Actions/Codespaces set for operator-owned GitHub credentials. On the healthy Linux bwrap path these are already excluded by `buildMinimalEnv`'s whitelist (PATH/HOME/TERM/LANG/LC_*/TMPDIR only), so this gap only affects the degraded spawn path (non-Linux, `sandboxIntegration:off`, or `enabled:false`) where `stripProviderSecrets` is the backstop.

2. **Default `denyRead` missing the XDG git credential store.** `DEFAULT_CONFIG.filesystem.denyRead` covers `~/.git-credentials` and `~/.netrc` but not `~/.config/git/credentials` (the XDG location git's `store` credential helper uses). This is a generic Git credential store per required-boundary #3.

```typescript
// sandbox-spawn.ts — add to PROVIDER_SECRET_ENV_NAMES (non-configurable floor):
export const PROVIDER_SECRET_ENV_NAMES = [
  // ...existing entries...
  "GITHUB_TOKEN",   // GitHub CLI / Actions / Codespaces operator token
  "GH_TOKEN",       // GitHub CLI alternate
  // ...existing entries...
];
```

```typescript
// sandbox-config.ts — add to DEFAULT_CONFIG.filesystem.denyRead:
filesystem: {
  denyRead: [
    // ...existing entries...
    "~/.config/git/credentials",  // XDG git credential store (git store helper)
    // ...existing entries...
  ],
  // ...
}
```

**Implementation Notes**:
- `GITHUB_TOKEN`/`GH_TOKEN` go in `PROVIDER_SECRET_ENV_NAMES` (the non-configurable floor), not `DEFAULT_CONFIG.envScrub.names`, because they are credential material per the brief ("operator-owned GitHub ... credential material") and the floor is the documented non-weakenable set. `FORGEJO_TOKEN` is operator-specific and stays out of the floor — operators register it via global `envScrub.names` (the existing additive-only mechanism, Q5 decision).
- `~/.config/git/credentials` goes in `DEFAULT_CONFIG.filesystem.denyRead` so it is masked in bwrap AND blocked in the in-process `read` tool by default. It flows through the existing additive-only project merge (a project cannot remove it; an operator can remove it from global config if they have a workflow that must read it).
- Audit: confirm the credential env-var floor and default denyRead now cover everything in the brief's "Protected credentials" list: Umans/OpenAI-Codex (auth.json — denyRead ✓), Anthropic (`ANTHROPIC_OAUTH_TOKEN`/`ANTHROPIC_API_KEY` ✓), operator GitHub (`~/.config/gh`, `~/.git-credentials`, `~/.netrc`, `~/.config/git/credentials`, `GITHUB_TOKEN`/`GH_TOKEN`/`COPILOT_GITHUB_TOKEN` ✓ after this unit), SSH (`~/.ssh` ✓), GPG (`~/.gnupg` ✓), forgejo (operator-registered via global `denyRead`/`envScrub` ✓). Document the audit result in the story body.
- The existing global `denyRead` + `envScrub.names`/`patterns` IS the operator credential registry (Q5 decision: no new config block). They are already additive-only at the project merge — an operator registers forgejo paths/files there and a project checkout cannot weaken them.

**Acceptance Criteria**:
- [ ] Degraded spawn (`stripProviderSecrets`) strips `GITHUB_TOKEN` and `GH_TOKEN` from the child env.
- [ ] Default `denyRead` includes `~/.config/git/credentials`.
- [ ] The in-process `read` tool blocks reads of `~/.config/git/credentials`.
- [ ] Audit note in the story body documents which credential env vars/paths are covered by defaults vs operator-registered, mapped to the brief's protected-credentials list.
- [ ] No new top-level config block is introduced (Q5 decision); the existing global `denyRead`/`envScrub` mechanism is documented as the credential registry.

---

### Unit 3: Threat model + buy-vs-build + controls triage documentation
**File**: `plugins/pi-sandbox/docs/THREAT_MODEL.md` (new) and `plugins/pi-sandbox/README.md` (updated)
**Story**: `feature-pi-sandbox-credential-isolation-boundary-threat-model`

Prose/documentation deliverable carrying the feature's documentation acceptance criteria. Depends on Units 1 + 2 to reflect final handshake payload and scrub-list shapes.

`docs/THREAT_MODEL.md` contains:
- **Two-boundary threat model** — explicitly distinguishes the outer VM boundary (host isolation, broad damage containment, owned by the operator VM) from the inner credential-isolation boundary (keep Pi's credential-bearing control plane unavailable to model-run commands/file tools running as the same Unix user). States what each boundary does and does not own.
- **Protected credentials** — the list from the brief (Umans/OpenAI-Codex provider storage, operator GitHub, operator Forgejo, SSH, GPG, GitHub CLI state, generic Git credential stores) and where each is masked (bwrap denyRead, in-process read tool, env whitelist, degraded scrub floor).
- **Required-boundary matrix** — the 8-point required boundary with status (MET / MET-with-gap / NET-NEW) and where each is enforced, copied from the design body above.
- **Buy-vs-build delta** — the recorded decision against srt/Gondolin/OpenShell (copied from the design body above, with srt version 0.0.26 and revisit triggers).
- **General-controls triage** — the core / optional-defense-in-depth / deferred+tracked table (Q3 decision).
- **Capability handshake contract for forge consumers** — the `Symbol.for("@nklisch/pi-sandbox.credential-boundary-capability")` contract: payload shape, consumer rule (load credentials only when `active === true`, re-read per load, never cache), what the payload does NOT contain (paths/secrets), and the non-Linux-degrade behavior (active=false → forge refuses).
- **Credential-registration mechanism** — document that global `denyRead` (files) + `envScrub.names`/`patterns` (env vars) ARE the operator credential registry; project-local config is additive-only (can add, never remove); `bwrapPath` and `enabled:false` are global/operator-only.
- **Scope boundary** — forge-specific operations, Git credential helpers, privileged Git runners, and provider-specific remote-operation policy are explicitly OUT of pi-sandbox; pi-sandbox provides only the credential-isolation capability and the non-secret handshake.

`README.md` updates:
- "Security boundary / non-goals" section: lead with the two-boundary threat model (link `docs/THREAT_MODEL.md`); add the buy-vs-build delta summary (retain first-party bwrap; srt/Gondolin/OpenShell not adopted, with one-line rationale each); add the controls triage table; add the capability-handshake contract summary + the `/sandbox` capability line; document credential registration via global `denyRead`/`envScrub`.
- Add `GITHUB_TOKEN`/`GH_TOKEN` to the documented env-scrub coverage and `~/.config/git/credentials` to the documented denyRead defaults.

**Implementation Notes**:
- Foundation-doc rolling principle: describe current truth, not past state. The buy-vs-build delta is a dated decision (2026-07-11, srt v0.0.26) with revisit triggers — not a permanent claim.
- The threat model must NOT over-claim: state the known gaps honestly (RPC/API direct bash bypass; TOCTOU in in-process file-tool path checks; non-Linux bash unsandboxed; `filter` deferred; background `jobs action=tail` output not redacted — all already documented in the README non-goals).
- No automated tests for this unit; acceptance is review against the feature's documentation criteria.

**Acceptance Criteria**:
- [ ] `docs/THREAT_MODEL.md` explicitly distinguishes the outer VM boundary from the inner credential-isolation boundary.
- [ ] The buy-vs-build decision is recorded with a concrete delta against srt (v0.0.26), Gondolin, and OpenShell, with revisit triggers.
- [ ] The general-controls triage (core / optional / deferred) is documented.
- [ ] The capability-handshake contract for forge consumers is documented (payload, consumer rule, non-contents).
- [ ] The credential-registration mechanism (global `denyRead`/`envScrub`, additive-only) is documented.
- [ ] README "Security boundary / non-goals" references the threat model and reflects the closed gaps.
- [ ] Forge-specific operations and authentication policy are documented as absent from pi-sandbox.

---

## Implementation Order

1. **Story: capability-handshake** (Unit 1) and **Story: credential-gap-closure** (Unit 2) — parallel, independent. The orchestrator can fan these out; they touch different files (`sandbox.ts`/`sandbox-config.ts` vs `sandbox-spawn.ts`/`sandbox-config.ts`). Coordinate on `sandbox-config.ts` only if both land simultaneously (Unit 1 adds exports; Unit 2 edits `DEFAULT_CONFIG` — non-overlapping regions, safe to merge).
2. **Story: threat-model** (Unit 3) — after Units 1 + 2, so the documented handshake payload and scrub list reflect final code.

## Testing

### Unit Tests: `plugins/pi-sandbox/extensions/sandbox-handshake-integration.test.ts` (extend) or new `credential-boundary-capability.test.ts`
- Publish/read across states: active (Linux success), fail-closed (bwrap missing / config parse error / filter deferred), disabled-via-config, `--no-sandbox`, non-Linux degrade, session-shutdown.
- Assert payload contains NO credential paths / secrets (only state labels).
- Assert `isCredentialBoundaryActive` correctly gates across all states.
- Mirror the existing background-tasks handshake test structure (`createSandboxBridge` pattern adapted to the publish direction).

### Unit Tests: `plugins/pi-sandbox/extensions/provider-strip-list.test.ts` (extend)
- Assert `stripProviderSecrets` removes `GITHUB_TOKEN` and `GH_TOKEN` in degraded spawn.
- Assert default `denyRead` includes `~/.config/git/credentials`; assert the `read` tool blocks it (via `enforceDenyRead`).

### Docs (Unit 3): review-only
- No automated test; acceptance is review against the feature's documentation criteria.

## Risks

- **Handshake timing race** (pre-mortem, trickiest unit): a forge consumer reading the symbol before pi-sandbox's `session_start` publishes sees `undefined` → treats as not-active → refuses to load credentials (fail-safe). Mitigation: document that consumers MUST re-read per credential-load and never cache; the symbol read is cheap and state can change on `/reload`.
- **Handshake coupling drift**: if a future need tempts adding credential paths to the payload, the forge extension couples to pi-sandbox internals. Mitigation: the payload contract is `{active, failClosed, reason}` only; document the non-contents as a hard contract.
- **Env-scrub false positive**: scrubbing `GITHUB_TOKEN`/`GH_TOKEN` in degraded mode could break a legitimate macOS git workflow that relied on them. Mitigation: on Linux (primary deployment) `buildMinimalEnv` already excludes them (no behavior change); on degraded paths scrubbing is consistent with the brief's "operator-owned GitHub credential material." Document the behavior change in the README.
- **Buy-vs-build drift**: the recorded delta becomes stale as srt matures (0.0.x). Mitigation: date the assessment (2026-07-11), cite srt v0.0.26, and record explicit revisit triggers.
- **denyRead default expansion**: adding `~/.config/git/credentials` to defaults blocks a workflow that read it via sandboxed bash. Mitigation: it is a credential store — model-readability should be blocked; an operator who needs it removes it from global config (project-local config cannot, by additive-only design). Acceptable.
- **Proc-in-container residual**: `--proc /proc` fails in containers with default seccomp (srt Issue #214; pi-sandbox shares this bwrap limitation). Not introduced by this feature; document in the threat model as a shared limitation the operator VM must clear at the environment level.

## Implementation summary

Driven by `/agile-workflow:implement-orchestrator` over the 3-child dependency graph. Wave plan: S1 (capability-handshake) and S2 (credential-gap-closure) serialized into two sub-waves to avoid a shared-file (`sandbox-config.ts`) merge conflict (S1 adds exports at the end; S2 edits `DEFAULT_CONFIG` — non-overlapping regions but same file); S3 (threat-model) after both so docs reflect final code.

- **S1 `…capability-handshake`** → `stage: review`. Commit `7708283`. Added the `Symbol.for("@nklisch/pi-sandbox.credential-boundary-capability")` contract (`CredentialBoundaryCapability` payload, `readCredentialBoundaryCapability`, `isCredentialBoundaryActive`); publisher at every `session_start` transition + `session_shutdown`; `/sandbox` capability line; re-exports from the `./sandbox-spawn` subpath; 8 new lifecycle/security integration tests.
- **S2 `…credential-gap-closure`** → `stage: review`. Commit `4ebaec2`. Added `GITHUB_TOKEN`/`GH_TOKEN` to `PROVIDER_SECRET_ENV_NAMES`; added `~/.config/git/credentials` to `DEFAULT_CONFIG.filesystem.denyRead`; regression coverage; credential audit documented in the story body.
- **S3 `…threat-model`** → `stage: review`. Commit `331a577`. New `plugins/pi-sandbox/docs/THREAT_MODEL.md` (two-boundary model, protected credentials, required-boundary matrix, buy-vs-build delta vs srt v0.0.26/Gondolin/OpenShell, controls triage, capability-handshake contract, credential-registration mechanism, scope boundary, **consolidated Release scope (0.1.0) + post-0.1.0/v1 path**); README updated to reference the threat model and reflect the closed gaps.

**Cross-cutting deviations**: none. All three stories implemented as designed; no design-flaw escape hatches fired.

**Verification**: `bun test plugins/pi-sandbox/extensions/` → 228 pass, 0 fail (up from 217 at design time; +11 new tests). Worker subagents reported a single environment-specific PID-namespace assertion failure (host/sandbox PID both `2` inside their bwrap spawn context — the documented container/seccomp `--proc /proc` limitation, srt Issue #214); it does not reproduce in the orchestrator's environment and is not a regression from this work.

**Answer to the operator's pre-dispatch question** ("have we recorded what 0.1.0 promises and v1 entails?"): **yes, now** — the consolidated Release scope (0.1.0) + post-0.1.0/v1 path section in `docs/THREAT_MODEL.md` is the single source a reviewer or release gate checks the package version against. Previously the promise was scattered across README fragments and config comments.

## Review (2026-07-11)

**Verdict**: Request changes

**Mode/depth**: substrate, deep lane, feature-level. Two-phase fresh-context review on `openai-codex/gpt-5.6-sol` (the one non-host class available): Phase 1 advisory → Phase 2 adversarial, both to convergence. Findings verified against code by the host.

**Blockers** (3 — feature bounced to `implementing`):
- **B1**: `active:true` doesn't prove the credential being loaded is protected — computed purely from lifecycle booleans, independent of denyRead survival. An operator with global `denyRead: []` gets `active:true` with zero read masks, yet the consumer rule says "load on active." → `story-pi-sandbox-capability-active-narrow-claim` (narrow the contract/doc, not the publisher).
- **B2**: threat model marks required-boundary #3 "MET" while git credential helpers/sockets/keyrings are unmasked (`~/.gitconfig`/`~/.config/git/config` can declare a helper; HOME preserved so `git credential fill` works). → `story-pi-sandbox-git-credential-helper-scope-honesty`.
- **B3**: `docs/SPEC.md` + `docs/ARCHITECTURE.md` say every supported plugin has all three channel manifests; pi-sandbox is Pi-only. Foundation-doc drift. → `story-pi-sandbox-pi-only-foundation-doc-forward`.

**Important** (5 — parked in backlog):
- **I1**: `isCredentialBoundaryActive` accepts contradictory `{active:true, failClosed:true}`. → `idea-pi-sandbox-isactive-reject-contradictory-payload`.
- **I2**: provider-coverage regression test is a permanent pass-through skip (imports a non-exported pi-ai subpath). → `idea-pi-sandbox-provider-strip-list-test-honesty`.
- **I3**: capability lifecycle tests miss hardlink/filter/stale-clearing branches. → `idea-pi-sandbox-capability-branch-coverage`.
- **I4**: "operator can remove the default" mitigation is false (mergeGlobalDenyList is all-or-nothing). → `idea-pi-sandbox-denyread-selective-override-doc`.
- **I5**: PID-namespace test predicate is invalid (asserts host PID absent; PIDs collide numerically), not the seccomp failure it was attributed to. → `idea-pi-sandbox-pid-namespace-test-root-cause`.

**Nits**: forge startup-ordering semantics unspecified (fail-safe but availability trap); `reason` wording drift ("bwrap unavailable" vs design's "bwrap missing" — cosmetic).

**Notes**: The implementation faithfully executed the design — the publisher fires at all 10 transitions, the payload is secret-free, the path-redaction layer (`credentialBoundaryFailClosedReason`) is sound, and the buy-vs-build delta is dated and accurate. The throughline: the design's capability contract over-claimed. `active:true` was specified to mean "the boundary is active" (which a forge consumer reads as "safe to load credentials"), but it actually means "the sandbox initialized" — a weaker claim. The fix is to narrow the contract to match the guarantee, not to re-architect the publisher. 3 blocker stories + 5 backlog items filed; feature bounced to `implementing`.

## Host verification of rework (2026-07-11)

*(Not a fresh-context re-review — host inline verification only. A fresh-context re-review is still required before this feature advances to `done`.)*

**Verdict**: Approve with comments (host-verified, pending fresh-context re-review)

Rework driven by `/agile-workflow:implement-orchestrator` as a single coherent bundle (6 items converged on the same docs — parallel agents would have reproduced the inconsistency). All 3 blockers + the 2 folded important findings (I1, I4) resolved; 3 remaining backlog items (I2 provider-strip skip, I3 branch coverage, I5 PID test) stay parked as independent test-integrity work.

- **B1 resolved**: contract narrowed — `active:true` now documented as "boundary initialized, not fail-closed" with an explicit "what `active` does not prove" list and a second independent precondition (forge consumer verifies its own credential path is in global `denyRead`). `isCredentialBoundaryActive` hardened to `active===true && failClosed===false` (I1 folded in). Verified in `THREAT_MODEL.md` + `README.md` + `sandbox-config.ts`.
- **B2 resolved**: boundary #3 reclassified as "MET (file-backed stores); helper/socket/keyring stores operator-registered or out of scope for 0.1.0." `~/.gitconfig` + `~/.config/git/config` added to default `denyRead`. Git-helper residual named in README non-goals + release-scope known gaps.
- **B3 resolved**: `docs/SPEC.md` + `docs/ARCHITECTURE.md` rolled forward with the Pi-only exception (pi-sandbox + background-tasks annotated, anatomy notes manifest omission). Aligns with `AGENTS.md`.
- **I4 resolved**: `mergeGlobalDenyList` all-or-nothing semantics documented in README + threat model with the full default list for operators who need the escape.

Verification: `bun test plugins/pi-sandbox/extensions/` → 228 pass, 0 fail (orchestrator context). The environment-fragile PID-namespace test (I5) remains parked, not fixed in this pass.

All 6 child stories (3 original + 3 blockers) at `stage: review`. Feature advances to `review`.
