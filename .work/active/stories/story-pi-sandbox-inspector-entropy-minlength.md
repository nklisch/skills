---
id: story-pi-sandbox-inspector-entropy-minlength
kind: story
stage: implementing
tags: [security, sandbox]
parent: feature-pi-sandbox-inspector-hardening
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-06
updated: 2026-07-06
---

# Entropy min-length gate: block low-entropy but long-enough candidates

## Scope

Implements Unit 2 of `feature-pi-sandbox-inspector-hardening`. Change the entropy
check in `inspectToolInput` (~line 437) from a hard `continue` (low-entropy → skip
entirely) to a gated block: a low-entropy candidate is still blocked if it is long
enough to be a real secret (≥20 chars).

```ts
// Before: low-entropy → skip (real low-entropy secrets pass)
if (shape.entropy !== undefined) {
  const ent = shannonEntropy(candidate);
  if (ent < shape.entropy) continue;
}

// After: low-entropy AND short → skip; low-entropy but long → still a candidate
if (shape.entropy !== undefined) {
  const ent = shannonEntropy(candidate);
  const MIN_SECRET_LENGTH = 20;
  if (ent < shape.entropy && candidate.length < MIN_SECRET_LENGTH) continue;
}
```

See the feature body's "Unit 2" section for rationale (closes the
`token=aaaa...` hole without the false-positive spike of removing entropy
entirely) and tuning notes.

## Acceptance Criteria

- [ ] `token=aaaaaaaaaaaaaaaaaaaa` (20 low-entropy chars) → blocked
- [ ] `password=changeme` (8 chars, low entropy) → not blocked
- [ ] `sk-ant-...` (provider shape, no entropy field) → unaffected

## Files

- `plugins/pi-sandbox/extensions/sandbox-config.ts` — the entropy check site
- `plugins/pi-sandbox/extensions/sandbox.test.ts` — tests for the three criteria
