---
id: story-pi-sandbox-inspector-per-shape-overlap
kind: story
stage: done
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-07
updated: 2026-07-07
---

# Per-shape window overlap for the chunked secret scanner (B1-3)

## Source

Split from `story-pi-sandbox-inspector-redos-test-honesty` (its B1-3 sub-item,
left unchecked). The B1 chunked-scan fix uses a single global
`SCAN_WINDOW_OVERLAP = 2048`; a secret shape whose matches are LONGER than 2048
chars, split across a window boundary, appears in no single 10K window and
evades. Important (not blocking for the original B1 story, but in-scope for the
v0.1.0 hardening pass).

## Problem

`inspectToolInput` (`sandbox-config.ts`) scans long fields in 10K windows with
`SCAN_WINDOW_OVERLAP = 2048`. The overlap covers realistic secret shapes
(API keys <100, PEM ~1670, JWTs), but the inspector supports arbitrary
operator-configured regex shapes, and a secret LONGER than 2048 chars split
across a window boundary still evades. The max match length isn't statically
derivable from an arbitrary regex, so a fixed global overlap can't be correct
for all shapes.

## Locked design decision (from operator)

**Approach (a): add a `maxLength` field to `SecretShape`, default generous, size
the window overlap to `max(shape.maxLength)` across configured shapes.**

- Add `maxLength?: number` to `SecretShape` (`sandbox-config.ts`).
- Default: **4096** (covers PEM private-key blocks including header/footer,
  which can approach ~2K+ base64; covers JWTs comfortably).
- The effective scan overlap becomes `max(SCAN_WINDOW_OVERLAP, ...configured
  maxLengths)` — shapes without `maxLength` use the default; declared
  `maxLength` raises the overlap for that scan.
- **Warn on overlong patterns**: when a configured shape's pattern statically
  appears to exceed the effective overlap without an explicit `maxLength`
  declaration, emit a config-load warning naming the shape. (Static "appears
  overlong" detection is heuristic — literal-char count + bounded quantifiers —
  and best-effort; it surfaces risk without forcing every operator to set the
  field.)
- Backward-compatible: existing configs without `maxLength` keep working at the
  4096 default (raised from 2048).

## Acceptance criteria

- [ ] A secret shape whose matches exceed 2048 chars is caught when split across
      a window boundary (with `maxLength` declared)
- [ ] A configured `maxLength` raises the effective scan overlap for that shape
- [ ] The default (4096, no `maxLength` set) catches PEM-shaped secrets (~2K)
      split across a boundary
- [ ] A regression test covers the long-secret-boundary case
- [ ] An overlong-pattern warning fires when a shape's pattern statically
      exceeds the effective overlap without an explicit `maxLength`
- [ ] Existing inspector tests still pass (backward-compatible default)

## Hardened design (post adversarial design review, 2026-07-07)

Refinements from the design review:
- **`maxLength` = full regex match length (`match[0]`), not `secretGroup` length.**
  Redaction/block ranges are based on `match[0]`; a capture group may be short
  while the full regex spans boundary context. Document this on the field.
- **Cap `maxLength` at `MAX_SCAN_LENGTH` (10_000).** A shape declaring
  `maxLength > 10_000` cannot be satisfied by windowed scanning (the full match
  can't fit in any 10K window). Reject with a config-load error naming the shape,
  rather than degenerating to byte-by-byte scanning (stride=1 explosion).
- **`maxLength` is a positive integer** (JS string code units). Validate in
  `validateSecretShape`.
- **Per-shape, not global, scan overlap.** The review flagged that
  `max(...maxLengths)` globally lowers stride for every shape. Better: each
  shape scans with its own effective overlap (`max(SCAN_WINDOW_OVERLAP_DEFAULT,
  shape.maxLength)`). Shapes with different lengths use different strides; a
  long shape doesn't slow short shapes. (Slightly more complex per-shape loop,
  but avoids the global slowdown.)
- **"Static overlong" detection is heuristic** (literal-char count + bounded
  quantifiers) and best-effort. Compare the shape's apparent max against its OWN
  declared/default `maxLength` (not the global). Warn when a pattern appears to
  exceed its `maxLength` (likely mis-declared). Don't over-engineer the analyzer.
- **Warning channel**: reuse the existing `additiveWarnings` / `globWarnings`
  pattern. Add to `LoadedConfig`'s warnings if a generic channel isn't present.
- **Backward-compat**: default raised 2048→4096 (covers PEM ~2K + header/footer).
  Existing configs without `maxLength` keep working; the cost increase is
  bounded (more overlap = more windows, but each window is still capped).

**Stance check**: inspector is pi-sandbox's own config; no cross-extension seam.

## Implementation notes
- Files changed: `plugins/pi-sandbox/extensions/sandbox-config.ts`, `plugins/pi-sandbox/extensions/inspector-chunked-scan.test.ts`, `plugins/pi-sandbox/extensions/sandbox.test.ts`.
- Implementation: added `SecretShape.maxLength` as the expected full regex match length (`match[0]`) with default `4096`, positive-integer validation, and a hard cap of `MAX_SCAN_LENGTH` (`10_000`). Compiled shapes now carry `maxLength`, and the shared scanner uses per-shape overlap `max(4096, shape.maxLength)` so long shapes do not globally slow short shapes. Added best-effort overlong-pattern warnings (literal/bounded-quantifier heuristic) into `LoadedConfig.additiveWarnings`.
- Tests added: chunked scanner coverage for default 4096 boundary catches and explicit `maxLength` >4096 boundary catches; config validation coverage for impossible/non-positive `maxLength`; config-load warning coverage for an overlong pattern.
- Test maintenance: updated the existing B1-1 redaction-cap fixture to separate decoy tokens with a non-matching byte, because the greedy token regex otherwise produced one merged range rather than the intended >10K unique ranges.
- Discrepancies from design: none.
- Adjacent issues parked: none.
- Verification: `cd plugins/pi-sandbox && bun test extensions/inspector-chunked-scan.test.ts extensions/sandbox.test.ts -t "B1-3|maxLength|chunked scanning"` passed (15 tests).

## Review (2026-07-07)

**Verdict**: Approve (adversarial result review; blockers fixed inline in 93d230a)

**Mode/Depth**: substrate / adversarial result review, fresh-context gpt-5.5
(two parallel passes: config cluster + integration cluster). Blockers found
were verified reproducible, then fixed inline.

**Notes**: see commit 93d230a for the specific blockers fixed per item. The
adversarial review caught 4 real reproducible blockers (M3 wrapper bypass, M6
path bug, H2 AWS container creds, M8 ENOENT crash) + 2 importants (B1-3 cap,
H3 cwd) that the implementation tests missed — all resolved before advancement.
