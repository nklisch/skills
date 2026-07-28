---
id: story-pi-sandbox-capability-active-narrow-claim
kind: story
stage: done
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

Review blocker B1. The capability handshake's `active:true` is computed from
lifecycle state and does not attest whether any particular credential path is
effectively masked. The first rework tried to make the forge consumer verify a
second precondition—that its path was registered in global `denyRead`—but that
condition is neither enforceable nor sound through the exported contract:
pi-sandbox does not export config discovery, effective policy, or path
normalization, and registration does not imply a bash mask. Glob entries are
not bwrap-enforced, and nonexistent paths are skipped.

## Fix

Narrow the documentation contract without changing the publisher or adding an
effective-protection query:

1. `active:true` means only that the Linux bash/file-tool
   credential-isolation boundary initialized and is not fail-closed.
2. The capability is a necessary but insufficient signal. A forge consumer must
   refuse on an absent/malformed/inactive/fail-closed signal, but must not treat
   a true signal as permission or proof that a specific credential is safe.
3. The forge extension owns credential custody. It must use a credential path
   whose masking was arranged independently (for example, an operator registers
   a literal path and confirms it exists at initialization), or use a
   broker-private channel that never enters model-observable space regardless of
   pi-sandbox state.
4. pi-sandbox does not attest effective path protection. Consumers must not
   duplicate its internal config discovery/merge/normalization rules and call
   that an attestation.
5. The `What active does not prove` list explicitly includes that an
   operator-registered `denyRead` entry may not be bash-masked when it is a glob
   or nonexistent.

## Acceptance criteria

- [x] `THREAT_MODEL.md` defines `active:true` solely as the initialized,
  not-fail-closed Linux bash/file-tool boundary state.
- [x] THREAT_MODEL and README call the signal necessary but insufficient and
  forbid treating it as safe-to-load permission or path attestation.
- [x] The forge consumer's independent credential-custody responsibility is
  stated with both literal-existing-path and broker-private-channel examples.
- [x] The unenforceable “two independent preconditions” / consumer-verifies-
  registration framing is removed.
- [x] `What active does not prove` includes the glob/nonexistent-path bwrap gap.
- [x] No effective-protection query or other internals-coupling machinery is
  added.

## Implementation notes

- Files changed: `plugins/pi-sandbox/docs/THREAT_MODEL.md` and
  `plugins/pi-sandbox/README.md`.
- Replaced the unsound consumer-enforced second precondition with a
  necessary-but-insufficient lifecycle contract. `active:true` now has exactly
  one meaning: the Linux bash/file-tool boundary initialized and is not
  fail-closed.
- Made forge credential custody explicitly forge-owned: independently arranged
  literal/existing path masking or a broker-private channel, without claiming
  pi-sandbox attests either.
- Added the missing warning that registration does not imply bwrap enforcement
  for glob or nonexistent `denyRead` entries, and warned consumers not to clone
  internal config logic as a substitute for an exported guarantee.
- Publisher, payload, and exported helper behavior are unchanged; no
  effective-protection query was introduced.
- Verification: proofread the THREAT_MODEL and README contract paragraphs
  together; searches find no remaining “two independent preconditions” or
  consumer-verifies-registration claims; the unchanged capability lifecycle
  integration suite passes 8 tests / 28 assertions.
- Discrepancy from the first rework: its second precondition was unenforceable;
  the residual is now explicit rather than presented as a consumer check.
- Adjacent issues parked: none.
