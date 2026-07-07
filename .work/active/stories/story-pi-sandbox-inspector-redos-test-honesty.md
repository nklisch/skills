---
id: story-pi-sandbox-inspector-redos-test-honesty
kind: story
stage: done
tags: [security, sandbox, testing]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-06
updated: 2026-07-07
---

# ReDoS regression test overclaims + per-shape window overlap (B1-3, B1-4)

## Source

Surfaced in the 2026-07-06 v0.1.0 readiness deep review (advisory + adversarial
phases). Important (not blocking) for v0.1.0; the inline review-fix raised the
overlap to 2048 as a mitigation, but the proper fix and the test-honesty issue
remain.

## Problem (two related items)

### B1-3 residual: per-shape window overlap

The B1 chunked-scan fix uses a single global `SCAN_WINDOW_OVERLAP = 2048`
(`sandbox-config.ts:311`). This was raised from 256 in the review-fix to
cover realistic long-secret shapes (PEM blocks ~1670 base64 chars, JWTs).
But the inspector supports arbitrary operator-configured regex shapes, and a
secret LONGER than 2048 chars split across a window boundary still evades.
The overlap cannot be derived from an arbitrary regex (the max match length
isn't statically computable), so the proper fix is either:

- **(a) Validate a max-length on configured shapes.** Require each secret
  shape to declare a `maxLength` (or derive a conservative bound from the
  pattern), and size the window overlap to `max(shape.maxLength)` across
  configured shapes. Reject shapes without a bound, or default to a generous
  cap (e.g. 8K) with a warning.
- **(b) Sliding scan at the shape's match granularity.** Instead of fixed
  windows, scan with a sliding cursor that guarantees any window of
  `MAX_SCAN_LENGTH` containing a full match is inspected. More complex;
  preserves the ReDoS cap but changes the scan model.

### B1-4: ReDoS regression test overclaims

`inspector-chunked-scan.test.ts` "bounded windows preserve the ReDoS guard on
a pathologically nested regex" uses `(a+)+` against all-`a`s
(`inspector-chunked-scan.test.ts:79-89`). `(a+)+` against all-`a`s tends to
*match* quickly (the regex succeeds), not exhibit catastrophic backtracking.
A true non-match backtracking case (e.g. `(a+)+$` against `a...!`, or
`(a|aa)+b` against `a...a`) would be a stronger guard. The config validator
(`isSafeRegex`) rejects these patterns, so runtime is the secondary defense —
but the test title overclaims "preserves the ReDoS guard" when it doesn't
exercise the catastrophic case.

## Fix direction

- B1-3: pick (a) or (b) above. (a) is simpler and makes the bound explicit;
  recommend (a) with a `maxLength` field on `SecretShape` defaulting to a
  generous cap.
- B1-4: replace the test regex with a non-matching backtracking case that
  passes `isSafeRegex` validation (so it's a runtime guard test, not a
  validation test), OR clarify the test's purpose via a rename and comment
  ("validates the per-window cap bounds total work on nested-quantifier
  patterns that pass validation").

## Acceptance criteria

- [ ] A secret shape longer than the global overlap cannot evade the scanner
      via a window-boundary split (per chosen B1-3 approach)
- [x] The ReDoS test exercises a genuine catastrophic-backtracking case, or
      is honestly renamed/clarified
- [ ] No regression to the existing chunked-scan tests

## Implementation notes

- Chosen catastrophic pattern: `(a|aa)+c` with a 50K/100K all-`a` payload plus
  a trailing `!` to force a non-match. This pattern is intentionally outside
  the narrow `isSafeRegex` static guard while still passing validation, so it
  exercises runtime chunked-scan bounding instead of config validation behavior.
- Replaced the old over-claiming test with a timing assertion that proves the
  chunk window cap bounds ReDoS work in practice: both 50K and 100K fields must
  complete quickly, and 100K must complete within 4× of the 50K elapsed time to
  demonstrate approximately linear growth with window count.
- B1-3 (`maxLength` per-shape overlap strategy) is intentionally left for
  separate dispatch and not changed in this story.

## Review (2026-07-06)

**Verdict**: Approve - story verified; fast-lane advance (B1-4 sub-item).

**Blockers**: none. **Important**: B1-3 (per-shape maxLength overlap) intentionally
left undone — schema-change design choice pending operator decision, separate
dispatch. **Nits**: none.

**Notes**: fast lane. Re-ran `cd plugins/pi-sandbox && bun test`: 124 pass, 0 fail
(suite runtime now ~15s due to the genuine catastrophic-regex test adding ~10s —
expected and acceptable for a ReDoS-guard test). Implementation notes + verification
present. B1-4 acceptance criterion met; B1-3 criterion intentionally unchecked.
