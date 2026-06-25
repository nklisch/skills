---
id: story-zai-fetch-windowing-skill-docs
kind: story
stage: implementing
tags: [plugin, docs, zai-research]
parent: feature-zai-fetch-content-paging
depends_on: [story-zai-fetch-windowing-wiring]
release_binding: null
gate_origin: null
created: 2026-06-24
updated: 2026-06-24
---

# Windowing skill docs + tool metadata

## Brief

Update the `fetch_content` tool description, `promptGuidelines`, and parameter
schema (add `window` + `max_chars`), and the portable `SKILL.md` with a
windowing pattern, the 500-line/30k defaults + 120k cap, the JSON/batch
exclusion, the snapshot-drift caveat, the PDF 50-page extraction cap, and the
virtual-wrapping note. Implements Unit 3 of `feature-zai-fetch-content-paging`
(post cross-model review).

## Scope

### Files
- `plugins/zai-research/extensions/index.ts` (description + `promptGuidelines` + `parameters`)
- `plugins/zai-research/skills/zai-research/SKILL.md`

### Changes
- Add `window` (`{start_line?, line_count?}`) and `max_chars` to the `fetch_content` parameter schema.
- `promptGuidelines`: the window loop ("first call returns lines 1–500 + a footer; pass `window:{start_line:501}` to continue; the blob is cached so advancing doesn't re-fetch") + the `max_chars` knob; note JSON + multi-URL batch don't window.
- `SKILL.md`: a "Window over long content" pattern; 500-line/30k defaults, 120k cap; JSON + multi-URL batch exclusion; snapshot-drift caveat; **PDF 50-page extraction cap** (windowing walks the *extracted* markdown, not beyond `pdf.ts`'s default 50-page cap); **virtual wrapping** note (long lines are wrapped so nothing is lost); implicit fitting calls return exact text with no footer.

## Acceptance criteria
- [ ] Tool description + `promptGuidelines` mention windowing + `max_chars`.
- [ ] `fetch_content` parameters include `window` and `max_chars`.
- [ ] `SKILL.md` shows a "Window over long content" pattern + drift/PDF-cap/virtual-wrap caveats.
- [ ] Schema snapshot test asserts `window` + `max_chars` are present in the registered parameters.
- [ ] `SKILL.md` under 500 lines.

## Out of scope
- `paging.ts` core (Unit 1) and fetch_content wiring (Unit 2).
