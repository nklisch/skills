---
id: story-pi-sandbox-inspector-failopen-cap
kind: story
stage: done
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-06
updated: 2026-07-06
---

# Inspector fails open after the first 10KB (blocker B1)

## Source

Surfaced in the 2026-07-06 v0.1.0 readiness adversarial review (inspector
deep-dive, fresh-context gpt-5.5). CONFIRMED blocker. This is a regression from
the ReDoS-mitigation work in `story-pi-sandbox-inspector-redos-guard` — the
input cap was correct for DoS prevention but wrong to apply as a silent
truncate.

## Problem

`inspectToolInput` truncates each scanned field to `MAX_SCAN_LENGTH = 10_000`
*before* the regex loop (`sandbox-config.ts:303`). A secret placed after 10KB
of padding is never scanned:

```json
{ "body": "<10,001 harmless chars>OPENAI_API_KEY=sk-..." }
```

The secret is outside the scanned prefix, no shape matches, the call is
allowed. This trivially defeats the inspector's purpose.

## Fix direction

Do not silently fail open on over-cap input. Options (the orchestrator should
pick one and surface the tradeoff in the implementation notes):

- **(a) Chunked scan** — scan the field in bounded windows (e.g. 10K windows
  with overlap) so a secret anywhere in the field is caught. Overlap handles
  patterns split across window boundaries. Cost: O(n) still, but constant
  memory per window.
- **(b) Fail-closed on overflow** — treat any field over the cap as `confirm`/
  `block` (per `onNoMatch` semantics). Cheapest, but may block legitimate large
  inputs (long prompts, big configs) in `auto`-policy fields.
- **(c) Keep the cap but scan the tail too** — scan the first 10K AND the last
  10K, on the assumption secrets are rarely in the exact middle of a 100K blob.
  Cheap heuristic, but a secret placed at byte 50K still evades.

The ReDoS protection (the original purpose of the cap) must be preserved —
the fix must not reintroduce the synchronous-hang risk on huge inputs.

## Acceptance criteria

- [x] A secret placed after 10KB of padding in an auto-policy field is caught
- [x] A 100K-char field does not hang the gate (ReDoS protection preserved)
- [x] The fix is tested with a secret at the start, middle, and end of a >10K field
- [x] The chosen approach is documented in the implementation notes with rationale

## Implementation notes

- Files changed: `plugins/pi-sandbox/extensions/sandbox-config.ts`, `plugins/pi-sandbox/extensions/inspector-chunked-scan.test.ts`.
- Approach: implemented the locked chunked-scan design. Long fields are no longer truncated before inspection; each shape scans the current field text in `MAX_SCAN_LENGTH` (10,000 char) windows with a 256-char overlap. The overlap is deliberately larger than provider/API-key-shaped secrets (<100 chars), so a key split across a window boundary is fully visible in at least one bounded regex invocation.
- Redaction across windows: matches are collected as global field-coordinate ranges (`windowOffset + match.index`), normalized to merge overlapping duplicate ranges from adjacent-window overlap, then applied once to the full field text. Redaction still runs shape-by-shape so fields under the cap preserve the previous single-pass behavior for existing inspector tests. Pathological one-character redact rules retain the existing 10K redaction-mutation cap, but scanning still walks every window rather than silently truncating the field.
- ReDoS safety: every regex call sees at most 10,000 chars, preserving the original synchronous-regex cap while making total work linear in the number of windows. Tests cover a 100K no-match field and a 50K field with a nested regex shape.
- Tests added: `inspector-chunked-scan.test.ts` covers a secret after 10KB padding, 100K prompt-sized fields, start/middle/end secrets in >10K fields, a boundary-straddling secret redacted exactly once, the nested-regex bounded-window guard, and under-cap byte-identical redaction placement.
- Verification: `cd plugins/pi-sandbox && bun test 2>&1 | tail -8` (121 pass); `cd plugins/background-tasks && bun test 2>&1 | tail -5` (71 pass).
- Discrepancies from design: none.
- Adjacent issues parked: none.

## Review (2026-07-06)

**Verdict**: Approve (with follow-ups filed)

**Mode/Depth**: substrate / deep (two-phase: advisory → adversarial), fresh-context
`openai-codex/gpt-5.5` each phase. Same-class-across-phases limitation recorded
(umans reserved for orchestration; no Claude/Gemini subagent path in-harness).

**Blockers**: none remaining (two were found and fixed inline in `501d68b`):
- B1-2 (keyword pre-filter per-window → whole-field): fixed. Test added; the
  keyword now gates the full field text before the window loop, closing the
  padding-separates-keyword-from-secret evasion.
- B1-3 (256-char overlap too small for long secrets): mitigated by raising the
  overlap to 2048, covering realistic PEM/JWT-shaped secrets. Test added and
  verified to fail under the old 256 overlap / pass under 2048. The proper
  per-shape fix filed separately.

**Important** (filed as follow-up stories):
- B1-1 redaction-cap silent tail-secret leak → `story-pi-sandbox-inspector-redact-cap-overflow`
  (design choice: fail-closed vs diagnostic vs raise-cap)
- B1-3 per-shape overlap + B1-4 ReDoS test honesty → `story-pi-sandbox-inspector-redos-test-honesty`

**Nits**: stale test name "capped to 10k characters before regex scan"
(`sandbox.test.ts:1131`); redaction cap counts ranges before dedup.

**Notes**: the two inline fixes are committed in `501d68b` with regression
tests. 123 pi-sandbox + 71 background-tasks green. The chunked-scan core
(windowed scan, global-coordinate redaction, ReDoS per-window cap) is sound;
the review found the refactor's newly-introduced auxiliary logic (keyword
placement, overlap sizing, redaction cap) needed correction, not the core
approach.
