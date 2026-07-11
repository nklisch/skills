---
id: idea-pi-sandbox-isactive-reject-contradictory-payload
created: 2026-07-11
updated: 2026-07-11
tags: [security, sandbox, plugin]
---

# `isCredentialBoundaryActive` should reject contradictory payloads

## Capture

Review finding I1. `isCredentialBoundaryActive(handshake)` checks only
`active === true`, so a contradictory `{active: true, failClosed: true}` payload
is accepted despite the contract describing "active and not fail-closed." The
current publisher cannot emit that combination, but the helper is the exported
stable consumer contract accepting `unknown`, and the design contemplates other
isolation providers using it.

## Fix

Change `isCredentialBoundaryActive` to require
`active === true && failClosed === false`, and add the contradictory/malformed
payload cases to the test matrix in
`credential-boundary-capability-integration.test.ts`.

Small, scoped code+test fix. Can land inline or as a small story.
