---
id: feature-pi-sandbox-credential-isolation-boundary-capability-handshake
kind: story
stage: done
tags: [security, sandbox, plugin]
parent: feature-pi-sandbox-credential-isolation-boundary
depends_on: []
release_binding: null
gate_origin: null
research_refs: []
research_origin: null
created: 2026-07-11
updated: 2026-07-11
---

# Capability handshake: non-secret credential-boundary signal for a forge extension

## Scope

Implements **Unit 1** of `feature-pi-sandbox-credential-isolation-boundary`. A
new cross-extension capability contract published by pi-sandbox on a global
symbol so a separate forge-operations extension can require the Linux
bash/file-tool boundary to be initialized and not fail-closed as one precondition
before loading file-backed credentials. The payload is **non-secret state labels
only** — no credential paths, no secrets — and does not attest path masking.

## Unit(s)

`plugins/pi-sandbox/extensions/sandbox-config.ts` (symbol + payload + reader +
consumer helper) and `plugins/pi-sandbox/extensions/sandbox.ts` (publisher at
every state transition).

See the feature body's **Unit 1** for exact interfaces, types, signatures,
implementation notes, and the publication timing rules.

Key contract:

- `Symbol.for("@nklisch/pi-sandbox.credential-boundary-capability")` globalThis
  property.
- Payload `{ active: boolean; failClosed: boolean; reason?: string }`.
- `active === true` only when sandbox enabled + initialized + not fail-closed +
  not disabled + not `--no-sandbox` + (on Linux) bwrap resolved.
- Publish at EVERY state transition in `session_start` (success, fail-closed,
  disabled, degrade, `--no-sandbox`) and `session_shutdown`.
- On non-Linux graceful-degrade, `active=false` (bash unsandboxed → inner
  membrane not active). Honest: forge refuses on macOS.
- Consumer rule: re-read per load and require both `active === true` and
  `failClosed === false`; never cache (state can change on `/reload`). This is
  only the lifecycle precondition. The consumer must independently verify that
  its credential location is registered in global `denyRead` or `envScrub`.
- Re-export the symbol + `readCredentialBoundaryCapability` +
  `isCredentialBoundaryActive` from the package barrel or `./sandbox-spawn`
  subpath so forge-operations imports them.
- The `/sandbox` command output gains a `Credential boundary capability:` line
  read from the symbol (single source of truth).

This is distinct from the existing `background-tasks-integration` handshake — a
second global symbol, so the forge contract is independent of the
background-tasks handshake shape.

## Acceptance criteria

- [x] After successful Linux `session_start`, `readCredentialBoundaryCapability()`
  returns `{ active: true, failClosed: false }`.
- [x] On fail-closed init, returns `{ active: false, failClosed: true, reason: <state label> }`.
- [x] On non-Linux degrade, returns `{ active: false, failClosed: false, reason: "OS bash sandbox unavailable (non-Linux degrade)" }`.
- [x] On `--no-sandbox`, returns `{ active: false, failClosed: false, reason: "sandbox disabled via --no-sandbox" }`.
- [x] On `session_shutdown`, publishes `{ active: false, failClosed: false, reason: "session shutdown" }`.
- [x] The payload contains NO credential paths and NO secrets (only state labels).
- [x] `/sandbox` output includes a `Credential boundary capability:` line.
- [x] `isCredentialBoundaryActive(handshake)` correctly gates the lifecycle
  precondition across all states (active / fail-closed / disabled / degrade /
  shutdown) and rejects malformed or contradictory payloads. Credential loading
  additionally requires the consumer's independent path/env registration check.
- [x] Tests mirror the existing `sandbox-handshake-integration.test.ts` structure.

## Implementation notes

- Added a `Symbol.for` credential-boundary capability contract, strict consumer
  helper, and forge-facing `./sandbox-spawn` re-exports.
- Published an inactive capability before initialization and at every terminal
  `session_start` branch, then published the explicit shutdown state.
  Fail-closed diagnostics are mapped to path-free state labels before they enter
  the global capability payload.
- Added symbol-authoritative `/sandbox` output and lifecycle integration tests
  for active, fail-closed, disabled, non-Linux degrade, `--no-sandbox`, and
  shutdown states.
- Review rework narrowed the documented contract without changing the publisher:
  `active:true` attests only that the Linux bash/file-tool boundary initialized
  and is not fail-closed. It does not prove a specific path is masked, and a
  forge consumer owns the independent `denyRead`/`envScrub` registration check.
- Hardened `isCredentialBoundaryActive` to require the complete, consistent
  payload (`active === true && failClosed === false`), rejecting missing,
  malformed, and contradictory states.
- Verification: `bun test plugins/pi-sandbox/extensions/credential-boundary-capability-integration.test.ts`
  passes 8 tests / 28 assertions. No publisher behavior or payload shape changed.
