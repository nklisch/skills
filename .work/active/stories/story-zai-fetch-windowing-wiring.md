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
first call, serve subsequent windows from the cache (no re-fetch), char-truncate
windows at line boundaries, and emit a footer + `details` the agent uses to
advance. Implements Unit 2 of `feature-zai-fetch-content-paging`.

## Scope

### Files
- `plugins/zai-research/extensions/index.ts`
- `plugins/zai-research/extensions/index.test.ts`

### Constants (windowing path only — `MAX_RETURN_CHARS` stays for other paths)
- `DEFAULT_WINDOW_LINES = 500`, `DEFAULT_MAX_CHARS = 30_000`, `MAX_MAX_CHARS = 120_000`
- module-scope `const pageCache = new PageCache();`

### Behavior
- Windowing active iff `urls.length === 1 && !wantJson` (markdown/text/article, incl. PDF).
- `max_chars` clamped to `[1000, 120000]`, default `30_000` (`clampMaxChars`).
- Cache key = `cacheKey(url, { return_format, extract })`; miss → `fetchOne(url)` → cache `{text, total_lines, fetchedAt}`.
- `applyWindow(blob.text, spec, maxChars)` → text + `windowFooter` + `details`.
- Footer: `…[window: lines {start}–{end} of {total} · request line {end+1} to continue]` (or `(whole document — {total} lines)` when it all fit).
- JSON mode + multi-URL batch ignore `window`; `details.windowed=false`; existing `truncate(body)` at `MAX_RETURN_CHARS` unchanged.

## Implementation notes
- `fetchOne` is unchanged — the cache wraps its result.
- Track `cache_hit` (whether `pageCache.get` hit before re-fetching) and surface in `details`.
- `window`/`max_chars` on batch/JSON paths are silently ignored (not errors); `details.windowed=false`.

## Acceptance criteria
- [ ] Single-URL markdown, no `window` → first ≤500 lines + footer; `details.windowed=true`.
- [ ] Second call `{window:{start_line:501}}` same URL → cache hit, hub NOT called again (`details.cache_hit=true`).
- [ ] `max_chars` clamp to `[1000, 120000]`; default 30000.
- [ ] Window past end → footer-only `past_end` result.
- [ ] JSON + batch ignore `window`; `details.windowed=false`; existing truncation unchanged.
- [ ] Existing 71 tests stay green.

## Out of scope
- `paging.ts` core (Unit 1 / `story-zai-fetch-windowing-core`).
- SKILL.md / tool metadata (Unit 3).
