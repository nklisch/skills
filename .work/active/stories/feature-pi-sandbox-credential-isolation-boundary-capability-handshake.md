---
id: feature-pi-sandbox-credential-isolation-boundary-capability-handshake
kind: story
stage: review
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
symbol so a separate forge-operations extension can require the credential
boundary is active before loading file-backed credentials. The payload is
**non-secret state labels only** — no credential paths, no secrets.

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
- Consumer rule: load credentials only when `active === true`; re-read per load;
  never cache (state can change on `/reload`).
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
- [x] A forge consumer using only `isCredentialBoundaryActive(handshake)` correctly
  gates credential loading across all states (active / fail-closed / disabled / degrade / shutdown).
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
- Verification: targeted capability/handshake/spawn tests pass (31 tests). Full
  `bun test plugins/pi-sandbox/extensions/` exercised the new tests successfully
  (223 pass) but retains one pre-existing environment-specific bwrap PID test
  failure: this container gives both the Bun parent and the sandboxed shell PID
  2, so its numeric `/proc/<host-pid>` assertion is invalid despite the PID
  namespace being present. No test was weakened for this story.
