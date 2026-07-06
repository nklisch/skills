---
id: story-pi-sandbox-inspector-redact-cap-overflow
kind: story
stage: drafting
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-06
updated: 2026-07-06
---

# Redaction cap silently leaks tail secrets (B1-1)

## Source

Surfaced in the 2026-07-06 v0.1.0 readiness deep review (adversarial phase,
fresh-context gpt-5.5). CONFIRMED blocker for v0.1.0. This is **new code
introduced by the B1 chunked-scan fix** (`MAX_REDACTIONS_PER_SHAPE`), not a
pre-existing residual.

## Problem

`inspectToolInput` caps redact ranges per shape at
`MAX_REDACTIONS_PER_SHAPE = 10_000` (`sandbox-config.ts:316`, `:527-529`):
```ts
if (redactRanges.length < MAX_REDACTIONS_PER_SHAPE) {
    redactRanges.push({ start, end });
}
```
When a `redact`-action shape matches >10K times, further matches stop being
pushed but **scanning continues and the call ultimately `allow`s**. An attacker
pads 10K decoy `sk-AAAA...` matches then a real `sk-...` key → the real key is
scanned, `isAllowed` doesn't match, action is `redact`, but
`redactRanges.length` is already 10K → the real key is NOT pushed → it
survives unredacted into the tool call.

`block`-action shapes short-circuit on first match, so only `redact` shapes
are affected — but `redact` is specifically the "allow after mutation"
policy, so this is an unsafe-egress secret leak.

## Fix direction (design choice for operator)

The cap exists for a real reason (a pathological one-char redact rule
shouldn't expand a large field into megabytes of replacement markers). The
question is what happens on overflow:

- **(a) Fail-closed on overflow.** When the cap is hit for a `redact` shape,
  treat it as a `block` (the field has too many secret-shaped matches to
  safely redact — refuse the call). Strongest; may block legitimate large
  inputs with many false-positive-shaped tokens. Reuses `onNoMatch`-style
  fail-closed semantics.
- **(b) Allow but emit a diagnostic.** Surface "redaction cap exceeded for
  shape X in field Y; tail secrets may be unredacted" via the existing
  warning channel. Preserves availability but the secret still leaks — only
  honest about it. Weak for a security gate.
- **(c) Raise the cap and dedup before counting.** Count ranges AFTER
  `normalizeRedactRanges` dedup (currently counts before), and raise the cap
  (e.g. to 100K). Reduces false-positive overflow but doesn't close the hole
  for a determined attacker who crafts 100K+ unique decoys.

**Recommend (a).** A security gate that silently allows a known-matched
secret is wrong by construction; the cap's purpose (DoS on redaction
expansion) is preserved by failing closed, and the operator can raise the cap
or refine the shape if legitimate inputs hit it. (c) is a worth-doing
hardening regardless (dedup-before-counting) but doesn't substitute for a
fail-closed default.

## Acceptance criteria

- [ ] A real secret placed after 10K decoy matches of the same `redact` shape
      does NOT survive unredacted into the tool output
- [ ] The cap's DoS purpose is preserved (a pathological redact rule doesn't
      expand a field unboundedly)
- [ ] The chosen behavior is documented with rationale
- [ ] A regression test covers the 10K-decoys-then-real-key case
