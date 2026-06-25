---
id: story-zai-fetch-windowing-wiring
kind: story
stage: review
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
- [x] Single-URL markdown, **no `window`**, content ≤ budget → exact text, **no footer** (byte-for-byte today).
- [x] Single-URL markdown, content > budget, no `window` → first window + footer; `details.next_start_line`/`has_more` set.
- [x] Second call `{window:{start_line:N}}` same URL → cache hit. **Tested via article mode** (`globalThis.fetch`): second call does NOT invoke `globalThis.fetch` (`details.cache_hit=true`).
- [x] `max_chars` clamp to `[1000,120000]`; default 30000; `text + footer ≤ max_chars`.
- [x] Window past end → footer-only `past_end` result.
- [x] **PDF + `return_format:"json"`** is windowable (PDF precedence wins) — returns PDF markdown, windowed.
- [x] **Errors not cached:** failed fetch returns inline-error text; subsequent same-URL call re-fetches (not served from cached error).
- [x] JSON + batch ignore `window`; `details.windowed=false` + `window_ignored_reason`.
- [x] Existing 71 tests stay green (118 baseline — 71 original + 47 paging — all still pass).

## Implementation log

Wired `applyWindow` + `PageCache` into `fetch_content`'s single-URL text-mode
path. 118 baseline tests still green; 15 new wiring tests added (133 total).

### Files changed
- `plugins/zai-research/extensions/index.ts` — windowing path, constants,
  helpers, closure cache, schema params, shutdown reset.
- `plugins/zai-research/extensions/index.test.ts` — 15 wiring tests +
  `clampMaxChars` unit tests.

### `fetchOneForWindow` refactor (the load-bearing change)
The inner `fetchOne` arrow returned a plain string and collapsed backend errors
into `[webReader error…]` / `[article fetch error…]` / `[fetch failed…]`
strings, leaving the windowing path no way to tell a successful fetch from a
cached-able-to-fail one. Refactored to `fetchOneForWindow(url) → { text, ok }`:

- **`fetchOneArticle` / `fetchOneJson` split into a `*Result` core returning
  `{text, ok}` + a thin string wrapper.** The public string signatures are
  preserved byte-for-byte (their direct tests + the 71-test baseline depend on
  them), so the refactor is invisible to existing callers. The cores give the
  windowing path clean `ok` detection without prefix-sniffing error strings.
- **PDF + webReader branches are inline** in `fetchOneForWindow` with explicit
  `ok`. The PDF webReader-fallback case returns `ok: !res2.isError` — a
  successful fallback (real content, even if lower-quality) is cacheable; a
  webReader error is not.
- The **batch path consumes `.text`**, which is byte-identical to today's
  `fetchOne` return, so batch behavior is unchanged.

### Footer-policy + backward-compat
`showFooter = explicitWindow || !fitsWhole`, where `fitsWhole = !past_end &&
start===1 && end===total_lines && !truncated_by_char_ceiling`. An implicit
fitting call (no `window`, whole content fits one window) returns `w.text` with
**no footer** — byte-for-byte today's `truncate(body)` no-op. The 30k default is
an intentional behavior change for medium (30k–60k) single-URL implicit calls
(documented in the feature's Risks); fitting content under the NEW budget is
preserved exactly.

### `details` contract
Windowed: `windowed, total_lines, returned, next_start_line (=end+1),
has_more (=end<total), past_end, truncated_by_char_ceiling, cache_hit,
requested (raw spec), max_chars (effective)`. Non-windowed: `windowed: false`
+ `window_ignored_reason: "batch" | "json"` (batch takes precedence for
multi-URL). The non-windowed path keeps the legacy `server`/`pdfUsed`/
`jsonMode`/`articleMode` fields for backward-compat.

### Notable decisions
- **`past_end` gets a distinct footer** (`…[window: past end of content …]`)
  rather than the standard range footer, which would read `lines N+1–N of N`
  (start > end) and confuse a reader. `details.past_end` remains the source of
  truth; the footer is human-readable convenience only (per design).
- **Fetch-error path extends the `window_ignored_reason` enum** with
  `"fetch_error"`: a windowable URL whose fetch failed returns the inline-error
  text (NOT cached) with `windowed: false` + `window_ignored_reason:
  "fetch_error"` + `cache_hit: false`. The spec's enum was `"json" | "batch"`;
  this third value is the honest report for the error case.
- **`blob.total_lines` is stored as the raw `split("\n").length`** per the spec
  pseudocode; it is informational metadata only — `applyWindow` recomputes the
  VIRTUAL line count (after wrapping overlong lines) from `text`, so the stored
  value is not used for windowing. Cached to satisfy the `CachedBlob` shape.
- **`pageCache` is closure-scoped** (alongside `hub`/`currentRegistry`), reset
  on `session_shutdown`. Each `makePi()`/`makeWindowingPi()` in tests builds a
  fresh extension → fresh cache, so cases never leak.
- **Type-narrowing**: `params.window` and `params.return_format`/`extract` are
  narrowed from `unknown` before nested access / cache-keying (the param shape
  is `Record<string, unknown>`).

### Verification
`cd plugins/zai-research && bun test` → **133 pass, 0 fail** (118 baseline + 15
new wiring). The original 71 (no-regression signal) and the 47 paging core
tests all still pass.

## Out of scope
- `paging.ts` core (Unit 1 / `story-zai-fetch-windowing-core`).
- SKILL.md / tool metadata (Unit 3).
