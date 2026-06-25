---
id: story-zai-fetch-windowing-skill-docs
kind: story
stage: done
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
- [x] Tool description + `promptGuidelines` mention windowing + `max_chars`.
- [x] `fetch_content` parameters include `window` and `max_chars`.
- [x] `SKILL.md` shows a "Window over long content" pattern + drift/PDF-cap/virtual-wrap caveats.
- [x] Schema snapshot test asserts `window` + `max_chars` are present in the registered parameters.
- [x] `SKILL.md` under 500 lines.

## Out of scope
- `paging.ts` core (Unit 1) and fetch_content wiring (Unit 2).

## Implementation notes

**Baseline reconciliation (divergence from story prose):** the story reserved a
"schema snapshot test" for Unit 3 and projected `133 → 134`. In reality Unit 2
already shipped a `window`/`max_chars` *presence* check (`describe("fetch_content
windowing schema") > "parameters include window..."`) inside the 133 baseline.
Rather than duplicate it, Unit 3 adds a complementary **full structural
snapshot** test (`schema snapshot: full fetch_content parameter surface`) that
pins the entire documented parameter shape (every top-level key, the routing
enums, the `window` sub-schema, and both `required` arrays) — a genuine
regression guard so the SKILL.md docs and the registered schema cannot drift
apart. Net: 133 → 134, matching the story's math; no duplicate test.

**Files changed:**
- `extensions/index.ts` — `fetch_content` `description` gains a windowing
  clause (single-URL text modes window; JSON + batches do not). `promptGuidelines`
  adds a window-loop guideline (exact footer string, cached blob,
  `details.next_start_line` as source of truth) and a `max_chars` guideline
  (default 30000, clamp [1000,120000], `truncated_by_char_ceiling` on overflow);
  the batch guideline notes batches + JSON direct fetches are not windowed. The
  `max_chars` param description was refined to describe the overflow behavior
  (trailing lines dropped at a line boundary) instead of the vaguer "windowing
  still applies past the budget." `window`/`window.start_line`/`line_count`
  param descriptions left as-is — already accurate.
- `skills/zai-research/SKILL.md` — added a "Window over long content" pattern
  (with the `window={start_line}` continuation example), a "Walk a page/PDF
  longer than one context window" row in the "When to use which" table, and five
  guardrails: single-URL-text-only windowing (+ the three `window_ignored_reason`
  values + PDF+json still windows), snapshot drift, PDF 50-page extraction cap,
  virtual wrapping (no data loss), and `max_chars` total-budget semantics.
  152 → 192 lines (under 500; no `references/` split needed).
- `extensions/index.test.ts` — added the full-surface schema snapshot test
  alongside the existing presence check.

**Accuracy:** every doc claim cross-checked against the as-built `index.ts`
windowing path (`windowable`, `details` shape, `windowFooter` format,
`clampMaxChars`, `RESERVED_OVERHEAD`), `paging.ts` (`DEFAULT_WINDOW_LINES=500`,
`wrapAndSplit` virtual wrapping, `PageCache` LRU+TTL), and `pdf.ts`
(`DEFAULT_MAX_PAGES=50`). The footer string `…[window: lines 1–500 of 1340 ·
request line 501 to continue]` matches `windowFooter` byte-for-byte (en-dash +
middle dot). No design flaw found; no escape hatch needed.

**Verification:** `cd plugins/zai-research && bun test` → 134 pass / 0 fail
(364 expect() calls). SKILL.md = 192 lines.

**Follow-up risk (out of scope here):** the `window.start_line` param
description still reads "Pass next_start_line from a prior call's details to
continue" while prose elsewhere says "details.next_start_line" — both clear,
both accurate; left as-is to avoid churn. The plugin version bump
(`scripts/bump-version.sh zai-research minor`) is the feature's release step,
not this story's.
