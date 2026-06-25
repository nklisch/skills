---
id: story-zai-fetch-windowing-wiring
kind: story
stage: implementing
tags: [plugin, tooling, zai-research]
parent: feature-zai-fetch-content-paging
depends_on: [story-zai-fetch-windowing-core]
release_binding: null
gate_origin: null
created: 2026-06-24
updated: 2026-06-24
---

# Wire windowing into fetch_content

## Brief

Wire `applyWindow` + `PageCache` into `fetch_content`'s single-URL text-mode
path: add `window` and `max_chars` params, fetch-and-cache the full blob on the
first call (only successful fetches), serve subsequent windows from the cache
(no re-fetch), virtual-wrap + char-truncate windows at line boundaries, reserve
footer/marker overhead inside `max_chars`, and emit structured `details` the
agent uses to advance. Preserve exact backward-compat for implicit fitting calls.
Implements Unit 2 of `feature-zai-fetch-content-paging` (post cross-model review).

## Scope

### Files
- `plugins/zai-research/extensions/index.ts`
- `plugins/zai-research/extensions/index.test.ts`

### Constants (windowing path only — `MAX_RETURN_CHARS` stays for other paths)
- `DEFAULT_WINDOW_LINES = 500`, `DEFAULT_MAX_CHARS = 30_000`, `MAX_MAX_CHARS = 120_000`, `RESERVED_OVERHEAD = 256`
- `pageCache` declared **inside `zaiResearchExtension(pi)` closure** (alongside `hub`/`currentRegistry`, which are closure-scoped — NOT module scope). Reset on `session_shutdown` + between tests.

### Behavior
- `windowable = urls.length === 1 && !(wantJson && !looksLikePdfUrl(urls[0]))` — effective route (PDF+json windowable as PDF), not raw `wantJson`.
- `max_chars` clamped to `[1000, 120000]`, default `30_000` (`clampMaxChars`); `contentBudget = maxChars - RESERVED_OVERHEAD` so `text + footer ≤ maxChars`.
- Cache key = `cacheKey(url, {return_format, extract})`; miss → `fetchOneForWindow(url)` returning `{text, ok}`; **cache only `ok`** (refactor existing `fetchOne` to surface `ok` — it currently collapses errors into `[… error …]` strings); `!ok` → existing inline-error result, NOT cached.
- `applyWindow(blob.text, spec, contentBudget)` → text + footer + structured `details`.
- **Footer policy:** `showFooter = (window param supplied) || !(fits whole)`. Implicit fitting call → exact text, no footer (byte-for-byte today).
- Footer (human-readable): `…[window: lines {start}–{end} of {total} · request line {next_start_line} to continue]`; `details.next_start_line` is the source of truth.
- JSON mode + multi-URL batch ignore `window`; `details.windowed=false` + `window_ignored_reason: "json"|"batch"`; existing `truncate(body)` at `MAX_RETURN_CHARS` unchanged.
- Import via `"./paging.js"` (matches sibling `.js` import style).

## Implementation notes
- `fetchOneForWindow` = refactor of the per-URL fetch returning `{text, ok}`; preserves today's per-URL error isolation on `!ok`.
- Track `cache_hit` (whether `pageCache.get` hit before re-fetching); surface in `details`.
- `details` includes: `windowed, total_lines, returned, next_start_line, has_more, past_end, truncated_by_char_ceiling, cache_hit, requested, max_chars` (and `window_ignored_reason` on non-windowed paths).

## Acceptance criteria
- [ ] Single-URL markdown, **no `window`**, content ≤ budget → exact text, **no footer** (byte-for-byte today).
- [ ] Single-URL markdown, content > budget, no `window` → first window + footer; `details.next_start_line`/`has_more` set.
- [ ] Second call `{window:{start_line:N}}` same URL → cache hit. **Tested via article mode** (`globalThis.fetch`): second call does NOT invoke `globalThis.fetch` (`details.cache_hit=true`).
- [ ] `max_chars` clamp to `[1000,120000]`; default 30000; `text + footer ≤ max_chars`.
- [ ] Window past end → footer-only `past_end` result.
- [ ] **PDF + `return_format:"json"`** is windowable (PDF precedence wins) — returns PDF markdown, windowed.
- [ ] **Errors not cached:** failed fetch returns inline-error text; subsequent same-URL call re-fetches (not served from cached error).
- [ ] JSON + batch ignore `window`; `details.windowed=false` + `window_ignored_reason`.
- [ ] Existing 71 tests stay green.

## Out of scope
- `paging.ts` core (Unit 1 / `story-zai-fetch-windowing-core`).
- SKILL.md / tool metadata (Unit 3).
