---
id: story-pi-sandbox-capability-active-narrow-claim
kind: story
stage: review
tags: [security, sandbox, plugin, documentation]
parent: feature-pi-sandbox-credential-isolation-boundary
depends_on: []
release_binding: null
gate_origin: null
research_refs: []
research_origin: null
created: 2026-07-11
updated: 2026-07-11
---

# Narrow the capability `active:true` claim to match the guarantee

## Scope

Review blocker B1. The capability handshake's `active:true` is computed purely
from lifecycle booleans (`sandboxEnabled && sandboxInitialized && !failClosed &&
!disabledViaConfig && !osSandboxUnavailable && !noSandbox`) and does NOT depend
on whether any `denyRead` entries survive config merge. An operator with global
`filesystem.denyRead: []` gets `active:true` with zero read masks. The
documented consumer rule ("load credentials when `active===true`") is therefore
unsafe — `active` proves the sandbox *initialized*, not that the credential being
loaded is *protected*.

Verified in code:
- `publishCredentialBoundaryCapability` (`sandbox.ts:131-164`) — `active` has no
  denyRead input.
- `mergeGlobalDenyList` (`sandbox-config.ts:1674-1676`) — returns `[]` for an
  empty configured list, wiping all defaults.

## Fix

Narrow the contract (doc + wording), NOT the publisher. The publisher stays as-is
(attesting lifecycle state is the right load-bearing job). The fix is:

1. **THREAT_MODEL.md** — rewrite the capability-handshake contract section so
   `active:true` is described as "the bash/file-tool credential-isolation
   boundary is initialized and not fail-closed" — NOT "safe to load credentials."
2. **THREAT_MODEL.md + README** — state a **second, independent precondition**
   the forge consumer MUST enforce: its credential location is registered in the
   operator's global `denyRead` (or `envScrub`). The capability does NOT attest
   this; the forge extension owns verifying its own credential path is masked.
   This keeps the payload path-free (no coupling) while making the load protocol
   sound.
3. **THREAT_MODEL.md** — add an explicit "what `active` does NOT prove" list:
   not that any specific path is masked, not that RPC/background/git-helper
   surfaces are mediated, not that an operator hasn't cleared the deny list.

This is a contract/doc fix. No change to `publishCredentialBoundaryCapability`
or the payload shape.

## Acceptance criteria

- [x] `THREAT_MODEL.md` describes `active:true` as "boundary initialized, not
  fail-closed" — not "safe to load credentials."
- [x] The load protocol states the forge consumer's independent precondition
  (its credential path is in global `denyRead`/`envScrub`) and that the
  capability does NOT attest it.
- [x] A "what `active` does NOT prove" list is present (path masking, RPC/background/helper surfaces, operator deny-list clearing).
- [x] README's capability-handshake summary matches the narrowed claim.

## Implementation notes

- Files changed: `plugins/pi-sandbox/docs/THREAT_MODEL.md`, `plugins/pi-sandbox/README.md`.
- Reframed `active:true` as a lifecycle assertion: the Linux bash/file-tool boundary initialized and is not fail-closed.
- Made credential registration a separate forge-owned precondition and enumerated the five assurances the path-free capability does not provide.
- Verification: proofread both capability sections together and checked every acceptance criterion against the resulting wording.
- Discrepancies from design: none; the publisher and payload shape remain unchanged.
- Adjacent issues parked: none. Review I1 is handled in its own follow-up commit because it changes the exported consumer helper.
