---
id: feature-zai-fetch-content-paging
kind: feature
stage: done
tags: [plugin, tooling, zai-research]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-24
updated: 2026-06-24
---

# Pageable, context-limited fetch_content

## Brief

`fetch_content` in the `zai-research` extension caps the text returned to the
model at `MAX_RETURN_CHARS = 60_000` per call. The `truncate()` helper keeps the
**head** of the content and appends a marker
(`…[truncated by zai-research: showing first 60000 of <N> chars]`) — but there
is **no way to retrieve the rest**. The tail is silently lost; an agent that
needs the next chunk has no position to ask for it, and re-calling just returns
the same head again.

This feature adds two things:

1. **A context-limit default** that is a first-class, tunable concept — an
   agent can request more per call when justified (within a hard ceiling),
   rather than the limit being a hidden constant.
2. **Windowing** — when content exceeds the per-call limit, the tool returns
   the first window plus metadata the agent uses to request the next window by
   line position, walking the whole document without re-fetching or losing
   content. (Revised from a cursor-token approach at design time — see Design
   decisions.)

The webReader, local-PDF (`unpdf`), and article (`readability` + `turndown`)
backends all return full content in one shot — there is no server-side cursor —
so windowing is necessarily **client-side slicing** of an already-fetched blob.
The extension therefore fetches the full blob once, caches it transparently,
and serves later windows from the cache.

This covers the `zai-research` extension
(`plugins/zai-research/extensions/`), its tests (`extensions/index.test.ts`
plus a new `paging.test.ts`), and the portable skill doc
(`plugins/zai-research/skills/zai-research/SKILL.md`).

## Strategic decisions

> **Revised at feature-design (2026-06-24):** the "opaque cursor" below was
> superseded by **line-based windowing** — the agent addresses content by line
> position with no token to thread. The stateful cache is unchanged. See
> `## Design decisions` for the full picture.

- **Paging architecture: cache the fetched blob + opaque cursor.** Locked at
  scope time. The first call fetches the full blob and caches it (small
  in-memory LRU + TTL); it returns page 1 plus an opaque cursor the agent
  passes back on later calls, which are served from cache with no re-fetch.
  *(The cursor was later replaced by line-windowing; the cache — now known to
  be **extension-closure-scoped**, like `hub`/`currentRegistry`, NOT module-
  scoped — stays. See Design decisions.)*
- **Mode reach: text modes only, JSON excluded.** Decided at scope. Windowing
  applies to webReader HTML, article, and PDF markdown. JSON/API mode is
  excluded: slicing a compacted JSON string mid-structure produces broken
  fragments an agent cannot use. (The existing JSON path's external
  `JSON_TRUNCATION_MARKER` stays as-is.)
- **Limit model: tunable `max_chars` with a default + hard ceiling.** Decided at
  scope. Default 30k; hard ceiling 120k (endorsed by cross-model review).
  Windowing remains the norm for long content; the parameter lets a justified
  caller ask for more in one shot.

## Scope notes

- This is a **new feature**, not a child of `feature-zai-fetch-content-improvements`
  (which is `stage: done`, reviewed/approved 2026-06-24). That feature was about
  *what* content to fetch (JSON vs article vs HTML); this is about *how much*
  and *how to window* — a distinct concern layered on top of the current code.
- **Backward-compat is exact for the common implicit case:** a single-URL call
  with no `window` whose content fits in one window returns the text *exactly as
  today* — no footer, no window metadata (see Design decisions → footer policy).
  For content that exceeds the limit, the result gains windowing metadata
  instead of today's head-truncation marker — an observable result-shape change,
  so this is a feature, not a `[refactor]`.
- The 30k default (down from today's 60k) is a deliberate behavior change for
  medium (30k–60k) single-URL implicit calls: they now window instead of
  returning whole. Intended (tighter context discipline); documented in Risks.
- New capability → **minor** plugin version bump, via
  `scripts/bump-version.sh zai-research minor` after implementation lands clean.

## Design decisions

*Incorporates a Codex `gpt-5.5` xhigh cross-model design review (2026-06-24).
Accepted findings folded in below; see `## Other agent review` for the summary.*

- **Cursor replaced by line-based windowing.** The agent addresses content by
  line position, no token to thread. The stateful cache stays as a transparent
  internal optimization; the agent never names it. *(Supersedes the scope-time
  "opaque cursor" framing.)*
- **Cache scope = extension closure, NOT module scope.** `hub` and
  `currentRegistry` are closure-scoped inside `zaiResearchExtension(pi)`
  (not module-scoped — an earlier draft of this design was wrong). `pageCache`
  is declared in the same closure, reset on `session_shutdown` alongside `hub`,
  and reset between tests.
- **Window unit = lines; char ceiling = `max_chars` (orthogonal).** The agent
  asks for a window by `{start_line, line_count}` (1-indexed start, default 1).
  `max_chars` is the per-call char budget: if a window's rendered text exceeds
  it, the tool truncates **at a line boundary** and says so. Lines preserve
  structure (no mid-sentence cuts); chars bound the context budget.
- **Virtual wrapping guarantees no data loss.** Any source line longer than the
  content budget is split into virtual sub-lines ≤ the budget before windowing,
  so line-based addressing reaches **every character** — including PDFs, where
  each page's text is one giant line (`pdf.ts`). `total_lines` counts virtual
  lines. (For PDFs this degrades to char-paging, which is acceptable; the point
  is no content is unreachable.) Without this, the char-cut-on-overflow path
  would skip the rest of an overlong line forever — a real loss the feature's
  "walk the whole document" promise forbids.
- **Default window = 500 lines; default `max_chars` = 30,000; hard cap = 120,000.**
  30k is a deliberate tighter context budget. `max_chars` is tunable up to 120k.
  *(Cross-model review endorsed keeping the 120k cap; it flagged that 30k vs 60k
  is the user's explicit choice — kept at 30k per user decision, with the
  fitting-content backward-compat preserved by the footer policy below.)*
- **Footer policy preserves exact backward-compat for fitting implicit calls.**
  If the caller supplied **no `window`** AND the whole content fits in one
  window (≤ content budget), return the text **exactly as today** — no footer,
  no window metadata. Only when `window` is supplied OR the result is partial
  do we append a footer + window `details`. (Today's single-URL sub-cap path
  returns `truncate(body)` — a no-op under the cap — so this preserves it.)
- **`max_chars` is the TOTAL returned budget, footer/marker included.** Like
  `truncate()` (which budgets its marker inside the cap), the windowing path
  reserves a small overhead (`RESERVED_OVERHEAD`, ~256 chars for footer+marker)
  before slicing, so `text + footer + marker ≤ max_chars`.
- **Continuation is structured, not text-parsed.** The human-readable footer is
  a convenience; the source of truth for "where to continue" is structured
  `details`: `next_start_line`, `has_more`, `past_end`, `returned`,
  `total_lines`, `requested`, effective `max_chars`, `truncated_by_char_ceiling`,
  `cache_hit`, `windowed`, and `window_ignored_reason`.
- **Windowable follows the EFFECTIVE route, not the raw `wantJson` flag.** PDF
  URL precedence wins over `return_format:"json"` in `fetchOne` (a PDF+json call
  returns PDF markdown). So windowable = `urls.length === 1 && !(wantJson && !
  looksLikePdfUrl(urls[0]))` — i.e. exclude only the effective JSON direct-fetch
  path, not "raw param was json."
- **Cache only successful fetches; never cache error strings.** `fetchOne`
  collapses backend errors into ordinary text (`[webReader error…]`,
  `[article fetch error…]`, `[fetch failed…]`). The cache-miss path must detect
  success/failure (refactor `fetchOne` to return `{ text, ok }` for the
  windowing path) and cache **only** `ok` results — otherwise a transient error
  is cached for the TTL and concurrent last-write-wins could cache failure over
  success.
- **PageCache oversize handling + byte accounting.** If a single blob exceeds
  `maxBytes`, serve it for the current call but **do not cache it** (never leave
  the cache over budget). Byte accounting = UTF-8 byte length via `TextEncoder`
  (not `.length` chars), documented.
- **`cacheKey` normalizes to effective defaults.** Normalize omitted
  `return_format → "markdown"` and `extract → "full"` before keying, so an
  omitted-default call and an explicit-default call share one cache entry.
  `JSON.stringify({url, return_format, extract})` — no collision/injection
  concern (verified by review).
- **Windowing is single-URL, text modes only; JSON + batch excluded.** JSON and
  multi-URL batches keep today's head-truncate at `MAX_RETURN_CHARS` (60k).
  When `window` is ignored on those paths, `details.windowed = false` +
  `window_ignored_reason: "json" | "batch"`.
- **Non-windowed paths unchanged.** `MAX_RETURN_CHARS = 60_000` stays for
  `web_search`, zread tools, and fetch_content's batch/JSON paths. Windowing is
  a new single-URL-text path with its own constants.

## Architectural choice

Three approaches were considered:

1. **Opaque cursor + discrete pages** (scope framing). Returns page N + token;
   agent threads token. Snapshot-stable but adds a token to manage and a fixed
   page grid.
2. **Explicit `{url, page}` discrete pages.** Stateless-by-shape; agent picks a
   page. Still a fixed grid — agent can't choose window size.
3. **Line-based windowing + transparent cache (chosen).** Agent addresses
   content by line range; cache is invisible. No token, no fixed grid, agent
   chooses both position and size. Virtual wrapping guarantees full coverage.
   Trades snapshot-stability for ergonomics (accepted).

**Chosen: 3.** A window function is the most agent-ergonomic: the agent can peek
or gulp, jump anywhere, and never loses a token. The cache makes it efficient;
the char ceiling keeps it budget-safe; virtual wrapping keeps it lossless. The
snapshot-drift trade-off is acceptable for a local-dev research tool whose
sources are mostly static docs.

## Implementation Units

### Unit 1: Windowing + cache core (`extensions/paging.ts`, new)

Pure, network-free, directly unit-testable.

```typescript
export interface WindowSpec {
  start_line?: number;   // 1-indexed; default 1
  line_count?: number;   // default DEFAULT_WINDOW_LINES
}

export interface WindowResult {
  text: string;                 // windowed text (virtual lines joined "\n"), ≤ content budget
  total_lines: number;          // virtual line count (0 for empty content)
  returned: { start: number; end: number };  // 1-indexed inclusive; stable empty range when past_end
  truncated_by_char_ceiling: boolean;         // char budget cut trailing virtual lines
  past_end: boolean;           // requested start beyond total_lines
}

/** Wrap overlong source lines into virtual sub-lines ≤ maxChars, then slice a window.
 *  No data loss: every character is reachable via line addressing. */
export function applyWindow(text: string, spec: WindowSpec, maxChars: number): WindowResult;

export interface CachedBlob { text: string; total_lines: number; fetchedAt: number; }

/** Bounded LRU (entry count AND total UTF-8 bytes) + TTL. Transparent to callers. */
export class PageCache {
  constructor(opts?: { maxEntries?: number; maxBytes?: number; ttlMs?: number });
  get(key: string): CachedBlob | undefined;   // undefined if missing/expired (treat as miss; lazy delete)
  set(key: string, blob: CachedBlob): void;    // evicts LRU until under both caps; REFUSES oversize blobs (caller still serves them)
  readonly size: number;
}

/** Deterministic cache key; normalizes omitted return_format/extract to defaults. */
export function cacheKey(url: string, mode: { return_format?: string; extract?: string }): string;
```

**Implementation notes**:
- `applyWindow`: 
  1. `total_lines = text === "" ? 0 : wrapAndSplit(text, maxChars).length` — first wrap any source line longer than `maxChars` into virtual sub-lines (hard-wrap at `maxChars`; word-boundary-near-`maxChars` if cheap, else hard cut). Empty content → 0 lines.
  2. Validate `spec`: `start_line` default 1; `line_count` default `DEFAULT_WINDOW_LINES`; clamp non-finite/`≤0`/fractional `line_count` to default.
  3. If `requestedStart > total_lines` → `past_end=true`, `text=""`, `returned={start: total_lines+1, end: total_lines}` (stable empty range), `has_more=false`.
  4. Else clamp `start` to `[1, total]`, take virtual lines `[start-1, start-1+count)`, join `"\n"`.
  5. If joined length > `maxChars`: pop trailing virtual lines until `≤ maxChars`, set `truncated_by_char_ceiling=true`, update `returned.end` to the actual last virtual line returned.
  6. (No single-line char-cut path needed — virtual wrapping already guarantees every virtual line ≤ `maxChars`, so a window of ≥1 virtual line never needs a mid-line cut.)
- `PageCache`: `Map` insertion-order LRU (re-insert on get). Enforce `maxEntries` (default 8) and `maxBytes` (default 16 MB, UTF-8 bytes via `TextEncoder`). On `set`: if the blob alone exceeds `maxBytes`, **refuse** (don't cache; caller serves it anyway); else evict oldest until under both caps. TTL (default 10 min) checked on `get` (lazy delete). Keys are `cacheKey(...)` strings.
- `cacheKey`: normalize `return_format ?? "markdown"`, `extract ?? "full"`, then `JSON.stringify({url, return_format, extract})`.
- No network, no hub — pure data. Tests drive it directly.

**Acceptance criteria**:
- [ ] `applyWindow` 1000-line blob, `{line_count:200}` → lines 1–200, `total_lines=1000`, `truncated_by_char_ceiling=false`.
- [ ] Window over `maxChars` drops trailing virtual lines at boundaries; `truncated_by_char_ceiling=true`; `returned.end` reflects the actual last line.
- [ ] **Virtual wrapping:** a single source line of 100k chars with `maxChars=30k` produces `total_lines` ≥ 4 virtual lines; consecutive windows walk ALL 100k chars with no loss.
- [ ] Empty content (`""`) → `total_lines=0`, any window → `past_end=true`, empty `text`, stable `returned`.
- [ ] `start_line` past end → `past_end=true`, stable empty `returned`.
- [ ] `start_line < 1` clamped to 1; `line_count ≤ 0` / non-finite / fractional → default.
- [ ] `PageCache` evicts LRU on entry-count and total-bytes overflow; TTL expiry → miss; **oversize blob is refused (not cached)**, caller still serves it.
- [ ] `cacheKey` normalizes defaults (omitted vs explicit `"markdown"`/`"full"` → same key) and distinguishes modes (markdown vs article of same URL → different keys).

**Story**: `story-zai-fetch-windowing-core`

### Unit 2: Wire windowing into `fetch_content` (`extensions/index.ts`)

```typescript
// new constants (windowing path only — MAX_RETURN_CHARS stays for other paths)
const DEFAULT_WINDOW_LINES = 500;
const DEFAULT_MAX_CHARS = 30_000;
const MAX_MAX_CHARS = 120_000;
const RESERVED_OVERHEAD = 256;   // footer + marker budget, reserved inside max_chars (like truncate)

// declared INSIDE zaiResearchExtension(pi) closure — alongside hub/currentRegistry
// (which are closure-scoped, NOT module-scoped). Reset on session_shutdown + in tests.
```

`fetchContentExecute` changes (single-URL text-mode path):

```typescript
const isPdf = looksLikePdfUrl(urls[0]);
const windowable = urls.length === 1 && !(wantJson && !isPdf);  // effective route, not raw flag
if (windowable) {
  const maxChars = clampMaxChars(params.max_chars);            // default 30k, cap 120k, floor 1k
  const contentBudget = maxChars - RESERVED_OVERHEAD;
  const spec = { start_line: params.window?.start_line, line_count: params.window?.line_count };
  const explicitWindow = params.window !== undefined;
  const key = cacheKey(urls[0], { return_format: params.return_format, extract: params.extract });
  let cacheHit = true;
  let blob = pageCache.get(key);
  if (!blob) {
    cacheHit = false;
    const r = await fetchOneForWindow(urls[0]);   // returns { text, ok } — see notes
    if (!r.ok) return /* existing inline-error handling, NOT cached */ ;
    blob = { text: r.text, total_lines: r.text === "" ? 0 : r.text.split("\n").length, fetchedAt: Date.now() };
    pageCache.set(key, blob);   // PageCache refuses if oversize; served anyway
  }
  const w = applyWindow(blob.text, spec, contentBudget);
  const fitsWhole = !w.past_end && w.returned.start === 1 && w.returned.end === w.total_lines && !w.truncated_by_char_ceiling;
  const showFooter = explicitWindow || !fitsWhole;
  const footer = showFooter ? windowFooter(w) : "";
  const text = w.past_end ? footer : (footer ? `${w.text}\n\n${footer}` : w.text);
  return {
    content: [{ type: "text", text }],
    details: { urls, windowed: true, total_lines: w.total_lines, returned: w.returned,
               next_start_line: w.returned.end + 1, has_more: w.returned.end < w.total_lines,
               past_end: w.past_end, truncated_by_char_ceiling: w.truncated_by_char_ceiling,
               cache_hit: cacheHit, requested: spec, max_chars: maxChars },
  };
}
// else (batch or effective-JSON): existing truncate(body) at MAX_RETURN_CHARS, details.windowed=false + window_ignored_reason
```

**Implementation notes**:
- **`fetchOneForWindow`**: refactor the per-URL fetch to return `{ text, ok }` (the existing `fetchOne` collapses errors into strings — surface `ok` so the cache skips errors). On `!ok`, return the existing inline-error text result **without caching** (preserve today's per-URL error isolation).
- `clampMaxChars`: `Number.isFinite` + `Math.min(Math.max(value|0, 1000), MAX_MAX_CHARS)`, default `DEFAULT_MAX_CHARS`.
- `windowFooter`: `"…[window: lines {start}–{end} of {total}" + (truncated_by_char_ceiling ? " · char-ceiling truncated" : "") + " · request line {next_start_line} to continue]"`. Human-readable convenience; `details.next_start_line` is the source of truth.
- **No-footer backward-compat:** `showFooter = explicitWindow || !fitsWhole` — implicit fitting calls return exact text (today's behavior).
- **Total budget:** windowing slices to `contentBudget = maxChars - RESERVED_OVERHEAD`, so `text + footer ≤ maxChars`.
- `pageCache` reset on `session_shutdown` (alongside `hub`) and between tests.
- Import via `"./paging.js"` (matches sibling `.js` import style).
- `window`/`max_chars` on batch/JSON paths: ignored, `details.windowed=false` + `window_ignored_reason: "json" | "batch"`.

**Acceptance criteria**:
- [ ] Single-URL markdown, **no `window`**, content ≤ budget → returns exact text, **no footer** (byte-for-byte today); `details.windowed=true` but no `next_start_line` needed.
- [ ] Single-URL markdown, content > budget, no `window` → first window + footer; `details.next_start_line`/`has_more` set.
- [ ] Second call `{window:{start_line: N}}` same URL → cache hit. **Tested via article mode** (article path uses `globalThis.fetch`): assert the second windowed call does **not** invoke `globalThis.fetch` (`details.cache_hit=true`).
- [ ] `max_chars` clamp to `[1000, 120000]`; default 30000; `text + footer ≤ max_chars`.
- [ ] Window past end → footer-only `past_end` result.
- [ ] **PDF + `return_format:"json"`** is windowable (PDF precedence wins) — returns PDF markdown, windowed.
- [ ] **Errors are not cached:** a failed fetch returns the inline-error text and a subsequent same-URL call re-fetches (not served from a cached error).
- [ ] JSON + batch ignore `window`; `details.windowed=false` + `window_ignored_reason`.
- [ ] Existing 71 tests stay green (non-windowed paths untouched).

**Story**: `story-zai-fetch-windowing-wiring` (depends on `story-zai-fetch-windowing-core`)

### Unit 3: Tool metadata + skill docs

**Files**: `extensions/index.ts` (description + `promptGuidelines` + `parameters` add `window` + `max_chars`), `skills/zai-research/SKILL.md`.

- Add `window` and `max_chars` to the `fetch_content` parameter schema.
- `promptGuidelines`: the window loop ("first call returns lines 1–500 + a footer; pass `window:{start_line:501}` to continue; the blob is cached so advancing doesn't re-fetch") + the `max_chars` knob.
- `SKILL.md`: "Window over long content" pattern; 500-line/30k defaults, 120k cap; JSON + multi-URL batch exclusion; snapshot-drift caveat; **PDF 50-page extraction cap** (windowing walks the *extracted* markdown, not beyond `pdf.ts`'s default 50-page cap); **virtual wrapping** note (long lines are wrapped so nothing is lost).

**Acceptance criteria**:
- [ ] Tool description + `promptGuidelines` mention windowing + `max_chars`.
- [ ] `fetch_content` parameters include `window` and `max_chars`.
- [ ] `SKILL.md` shows the windowing pattern + drift/PDF-cap caveats.
- [ ] Schema snapshot test asserts `window` + `max_chars` present.
- [ ] `SKILL.md` under 500 lines.

**Story**: `story-zai-fetch-windowing-skill-docs` (depends on `story-zai-fetch-windowing-wiring`)

## Implementation Order

1. `story-zai-fetch-windowing-core` — `paging.ts` (pure) + unit tests. No deps.
2. `story-zai-fetch-windowing-wiring` — wire into `fetch_content`, cache integration, tool tests. depends on 1.
3. `story-zai-fetch-windowing-skill-docs` — tool metadata + `SKILL.md`. depends on 2.

Linear chain; `implement-orchestrator` runs them sequentially (Unit 3 must
reflect Unit 2's real param names → keep sequential).

## Testing

- `paging.test.ts` (new): `applyWindow` suites (sub-default whole, char-ceiling line-truncation, **virtual-wrap walks all content**, empty content, past-end, start clamp, invalid `line_count`, default `line_count`) + `PageCache` suites (LRU entry eviction, byte eviction, **oversize-refused-not-cached**, TTL miss) + `cacheKey` (default-normalization, mode-distinction).
- `index.test.ts`: windowing wiring — **no-footer-when-fits** (exact text today), partial+footer when over, **cache-hit via article-mode `globalThis.fetch` count** (second call does not fetch), `max_chars` clamp + total-≤-max_chars, past-end footer, **PDF+json windowable**, **errors-not-cached**, JSON/batch ignore + `window_ignored_reason`, schema snapshot for `window` + `max_chars`.
- Regression: existing 71 tests unchanged.

## Risks

- **Snapshot drift** (stateless-by-shape windowing): a live URL changing between calls shifts line offsets. Accepted; documented in SKILL.md. Cache is best-effort.
- **Cache memory** for large PDFs: bounded by `maxBytes` (16 MB, UTF-8 bytes) + `maxEntries` (8) + TTL (10 min); LRU eviction; **oversize blobs served-but-not-cached**. Tunable constants.
- **Concurrency**: two simultaneous windows of the same uncached URL both fetch (last-write-wins). Wasteful but not corrupting; **errors are not cached** so a failed fetch can't poison a concurrent success. Dedupe deferred — noted, not v1.
- **PDF line coarseness**: each PDF page is one giant line, so a "line" ≈ a PDF page; virtual wrapping degrades PDF windowing to char-paging. Acceptable — no content is lost (the guarantee that matters).
- **PDF 50-page extraction cap**: `pdfBufferToMarkdown` extracts at most 50 pages by default; windowing walks the *extracted* markdown and cannot retrieve pages beyond that cap. Documented in SKILL.md.
- **30k default is a behavior change** for medium (30k–60k) single-URL implicit calls: they now window (partial + footer) instead of returning whole. Intended (tighter context discipline); the fitting-content case is preserved exactly by the footer policy.

## Other agent review

**Reviewer**: Codex `gpt-5.5` @ xhigh thinking (cross-model; host is GLM). Fresh context, 28 tool uses. Verdict: **revise**.

Accepted (folded into Design decisions + Units above):
- Cache scope is **extension-closure**, not module scope (corrected a false claim).
- Window/past-end/empty semantics made precise; `line_count` validated.
- **Virtual wrapping** added so overlong lines (esp. PDF pages) lose no content.
- **Footer policy**: no footer for implicit fitting calls → exact backward-compat.
- **Errors not cached** (`fetchOne` → `{text, ok}`); concurrent last-write-wins can't poison success.
- **`max_chars` reserves footer/marker overhead** (total ≤ budget, like `truncate`).
- **Structured `details`** for continuation (`next_start_line`, `has_more`, …); footer is convenience only.
- **Windowable follows effective route** (PDF+json windowable as PDF), not raw `wantJson`.
- **PageCache oversize = served-not-cached**; byte accounting = UTF-8 bytes.
- **`cacheKey` normalizes defaults**; `.js` import style; `window_ignored_reason`.
- Cache-hit tested via article-mode `globalThis.fetch` count (no new injection seam needed).
- PDF 50-page extraction cap documented as a windowing bound.

Reviewer opinions on locked decisions: **keep 120k cap** (endorsed); suggested default stay 60k for compat — **kept at 30k per explicit user decision**, with fitting-content compat preserved by the footer policy and the medium-doc change documented as intentional.

## Implementation (2026-06-24)

All three child stories implemented and at `stage: review`:

- `story-zai-fetch-windowing-core` — `paging.ts` (`applyWindow` + `PageCache` + `cacheKey`) + 47 tests. Virtual wrapping (no data loss), empty/past-end semantics (incl. the empty+negative-start edge the design missed), `line_count` validation, oversize-refused `PageCache` with UTF-8 byte accounting — all honored.
- `story-zai-fetch-windowing-wiring` — wired windowing into `fetch_content`'s single-URL text path + 15 wiring tests + 4 `clampMaxChars` unit tests. Closure-scoped `pageCache`; effective-route `windowable` (PDF+json windowable as PDF); `fetchOneForWindow → {text, ok}` (errors not cached); footer policy (no footer for implicit fitting → byte-for-byte backward-compat); `max_chars` reserves overhead; structured `details` (`next_start_line`, `has_more`, …).
- `story-zai-fetch-windowing-skill-docs` — tool description/guidelines + `SKILL.md` "Window over long content" pattern + 5 guardrails + a full-surface schema-snapshot test.

**Verification**: `cd plugins/zai-research && bun test` → **134 pass / 0 fail** (71 original + 47 paging + 15 wiring + 1 schema snapshot). The original 71 — the no-regression signal — all green.

**As-built deviations** (non-blocking, documented in story bodies): `past_end` gets a distinct footer; `window_ignored_reason` extended with `"fetch_error"`; the windowed-path `details` is narrower than the legacy single-URL shape (documented in `SKILL.md`).

**Commits**: `7e5ac71` (core), `7cc70b1` (wiring), `506670e` (skill-docs).

Ready for review.

## Review (2026-06-24)

**Verdict**: Approve (after fixes)

A cross-model code review (Codex `gpt-5.5` @ high, fresh context) ran over the three implementation commits. It raised 1 blocker + 2 important; all were fixed in `80704d9` with regression tests:

- **Blocker (wiring)** — implicit no-window calls windowed >500-line docs that fit the char budget (the 500-line default capped them), violating "fits budget → exact text, no footer." Fixed: implicit calls are now char-budget-bound (line_count unbounded); `fitsWhole` returns the whole doc when it fits. Regression test added (>500 short lines under budget → whole, no footer).
- **Important (wiring)** — `clampMaxChars` used `value | 0`, a 32-bit coercion that wrapped >2^31 inputs negative → clamped to the floor. Fixed with `Math.trunc`. Regression asserts added.
- **Important (docs)** — `SKILL.md` overpromised "never cut mid-sentence"; hard-wrapping can split a sentence/word. Softened to describe the actual behavior.

**Verification**: `cd plugins/zai-research && bun test` → **135 pass / 0 fail** (71 original + 47 paging + 15 wiring + 1 schema snapshot + 1 regression). Original 71 (no-regression signal) green.

All three child stories advanced to `stage: done`.
