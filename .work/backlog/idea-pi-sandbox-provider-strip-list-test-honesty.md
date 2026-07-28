---
id: idea-pi-sandbox-provider-strip-list-test-honesty
created: 2026-07-11
updated: 2026-07-11
tags: [security, sandbox, testing]
---

# Provider-coverage regression test is a permanent pass-through skip

## Capture

Review finding I2. `provider-strip-list.test.ts` imports
`@earendil-works/pi-ai/dist/env-api-keys.js`, a subpath pi-ai does not export.
`loadPiAi()` therefore always returns null, the test always skips, and it
reports as `(pass)`. A security regression test that can never fail is
test-theater. (No current provider token is missing — the floor is complete
today; the defect is the no-op test, not missing coverage.)

## Fix

Either:
- Fix the import to the exported subpath (`@earendil-works/pi-ai/providers/all`
  exists; find the real env-key source or derive it from
  `getBuiltinProviders`), so the test actually runs; OR
- Delete the test and document provider-coverage as a manual/operator check in
  the threat model's "known gaps."

Do NOT leave a permanent skip masquerading as a pass.
