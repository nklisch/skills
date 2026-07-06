---
id: story-pi-sandbox-inspector-failopen-cap
kind: story
stage: implementing
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

- [ ] A secret placed after 10KB of padding in an auto-policy field is caught
- [ ] A 100K-char field does not hang the gate (ReDoS protection preserved)
- [ ] The fix is tested with a secret at the start, middle, and end of a >10K field
- [ ] The chosen approach is documented in the implementation notes with rationale
