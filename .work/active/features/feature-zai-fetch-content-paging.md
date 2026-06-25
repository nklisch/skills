---
id: feature-zai-fetch-content-paging
kind: feature
stage: implementing
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
  The cursor encodes enough to resume (`url` + mode + page) so an expired cache
  entry re-fetches transparently at the correct page. This makes the extension
  **stateful across tool calls** — a new property for this previously
  mostly-stateless tool. The cache lives at module scope alongside the existing
  `hub` / `currentRegistry` mutable state, fitting the extension's established
  stateful pattern. Rationale: re-fetching the whole document on every page
  advance is wasteful and slow, especially for PDFs whose local extraction is
  the expensive part; a bounded cache with transparent re-fetch-on-miss gives
  efficiency in the common case and graceful degradation.
- **Mode reach: text modes only, JSON excluded.** Decided at scope — redirect if
  you disagree. Windowing applies to webReader HTML, article, and PDF markdown.
  JSON/API mode is excluded: slicing a compacted JSON string mid-structure
  produces broken fragments an agent cannot use. Agents that need less JSON
  should narrow the API query rather than window the response. (The existing JSON
  path's external `JSON_TRUNCATION_MARKER` stays as-is.)
- **Limit model: tunable `max_chars` with a default + hard ceiling.** Decided at
  scope — redirect if you disagree. The per-call limit becomes an agent-tunable
  parameter (default 30k; hard ceiling 120k) rather than a fixed constant.
  Windowing remains the norm for long content; the parameter lets a justified
  caller ask for more in one shot.

## Scope notes

- This is a **new feature**, not a child of `feature-zai-fetch-content-improvements`
  (which is `stage: done`, reviewed/approved 2026-06-24). That feature was about
  *what* content to fetch (JSON vs article vs HTML); this is about *how much*
  and *how to window* — a distinct concern layered on top of the current code.
- Additive and backward-compatible for content that fits in one window: when
  total length ≤ the limit, behavior is unchanged (no window metadata surfaced).
  For content that exceeds the limit, the result gains windowing metadata
  instead of today's head-truncation marker — an observable result-shape change,
  so this is a feature, not a `[refactor]`.
- New capability → **minor** plugin version bump (consistent with the sibling
  feature's bump classification), via `scripts/bump-version.sh zai-research minor`
  after implementation lands clean.

## Design decisions

- **Cursor replaced by line-based windowing.** At scope the framing was "opaque
  cursor"; at feature-design the user redirected to a window function — the
  agent addresses content by line position, no token to thread. The stateful
  cache (locked at scope) stays as a transparent internal optimization; the
  agent never names it. *(Supersedes the scope-time "opaque cursor" framing.)*
- **Window unit = lines; char ceiling = `max_chars` (orthogonal).** The agent
  asks for a window by `{start_line, line_count}` (1-indexed start, default 1).
  `max_chars` is the per-call char budget: if a window's rendered text exceeds
  it, the tool truncates **at a line boundary** and says so. Lines preserve
  structure (no mid-sentence cuts); chars bound the context budget.
- **Default window = 500 lines; default `max_chars` = 30,000; hard cap on
  `max_chars` = 120,000.** 30k (down from today's 60k) is a deliberate tighter
  context budget — medium docs now window instead of returning whole. `max_chars`
  is tunable up to 120k so a justified caller can grab more in one call.
  *(Hard cap value flagged for veto — say the word to cap strictly at 30k,
  shrink-only.)*
- **No cursor token.** The agent addresses by `(url, start_line, line_count)`.
  Snapshot-drift accepted: a live URL that changes between calls shifts line
  offsets; documented, best-effort cache.
- **Windowing is single-URL, text modes only.** Active when `urls` has exactly
  one URL AND mode is markdown/text/article (PDF included). JSON mode excluded
  (agents narrow the query). Multi-URL batch keeps today's head-truncate at
  `MAX_RETURN_CHARS` (60k) — windowing is silently ignored for batches,
  `details.windowed = false`.
- **Non-windowed paths unchanged.** `MAX_RETURN_CHARS = 60_000` stays for
  `web_search`, zread tools, and fetch_content's batch/JSON paths. Windowing is
  a new single-URL-text path with its own constants — no behavior change to
  anything else.

## Architectural choice

Three approaches were considered:

1. **Opaque cursor + discrete pages** (scope framing). Returns page N + token;
   agent threads token. Snapshot-stable but adds a token to manage and a fixed
   page grid.
2. **Explicit `{url, page}` discrete pages.** Stateless-by-shape; agent picks a
   page. Still a fixed grid — agent can't choose window size.
3. **Line-based windowing + transparent cache (chosen).** Agent addresses
   content by line range; cache is invisible. No token, no fixed grid, agent
   chooses both position and size. Trades snapshot-stability for ergonomics
   (accepted).

**Chosen: 3.** A window function is the most agent-ergonomic: the agent can peek
or gulp, jump anywhere, and never loses a token. The cache makes it efficient;
the char ceiling keeps it budget-safe. The snapshot-drift trade-off is
acceptable for a local-dev research tool whose sources are mostly static docs.

## Implementation Units

### Unit 1: Windowing + cache core (`extensions/paging.ts`, new)

Pure, network-free, directly unit-testable.

```typescript
export interface WindowSpec {
  start_line?: number;   // 1-indexed; default 1
  line_count?: number;   // default DEFAULT_WINDOW_LINES
}

export interface WindowResult {
  /** Windowed text (lines joined with "\n"), char-truncated at a line boundary if needed. */
  text: string;
  total_lines: number;
  /** 1-indexed inclusive range actually returned (may be < requested if the char ceiling bit). */
  returned: { start: number; end: number };
  /** True when the char ceiling cut lines from the end of the requested window. */
  truncated_by_char_ceiling: boolean;
  /** True when the window was past the end of the content (returned empty). */
  past_end: boolean;
}

/** Slice `text` into a line window, char-truncate at a line boundary if over `maxChars`. */
export function applyWindow(text: string, spec: WindowSpec, maxChars: number): WindowResult;

export interface CachedBlob {
  text: string;
  total_lines: number;
  fetchedAt: number;
}

/** Bounded LRU (by entry count AND total bytes) + TTL. Transparent to callers. */
export class PageCache {
  constructor(opts?: { maxEntries?: number; maxBytes?: number; ttlMs?: number });
  get(key: string): CachedBlob | undefined;   // undefined if missing or expired (treat as miss)
  set(key: string, blob: CachedBlob): void;   // evicts LRU if over capacity
  readonly size: number;
}

/** Deterministic cache key from the URL + mode tuple. */
export function cacheKey(url: string, mode: { return_format?: string; extract?: string }): string;
```

**Implementation notes**:
- `applyWindow`: split `text` on `"\n"` (keep empty lines — structural). Clamp
  `start_line` to `[1, total]`; default `line_count` to `DEFAULT_WINDOW_LINES`.
  Take `lines[start-1 .. start-1+count)`, join `"\n"`. If joined length >
  `maxChars`: pop lines from the end until `<= maxChars` (line-boundary
  truncation), set `truncated_by_char_ceiling`. Edge: if the *first* line in the
  window alone exceeds `maxChars`, char-cut it at `maxChars` with a
  `…[char ceiling: single line truncated]` marker (rare — minified content).
  `past_end` when `start_line > total`.
- `PageCache`: `Map` with insertion-order LRU (re-insert on get to mark recent).
  Enforce `maxEntries` (default 8) and `maxBytes` (default 16 MB) — on `set`,
  evict oldest until under both. TTL (default 10 min) checked on `get`; expired
  → treat as miss (lazy delete). Keys are `cacheKey(...)` strings.
- `cacheKey`: `JSON.stringify({url, return_format, extract})` — stable,
  mode-aware so a markdown fetch and an article fetch of the same URL don't
  collide.
- No network, no hub — pure data. Tests drive it directly.

**Acceptance criteria**:
- [ ] `applyWindow` on a 1000-line blob with `{line_count: 200}` returns lines 1–200, `total_lines=1000`, `truncated_by_char_ceiling=false`.
- [ ] A window whose joined text exceeds `maxChars` drops trailing lines at boundaries and sets `truncated_by_char_ceiling=true`; `returned.end` reflects the actual last line.
- [ ] A single line exceeding `maxChars` is char-cut with a marker.
- [ ] `start_line` past the end returns empty `text`, `past_end=true`.
- [ ] `start_line < 1` is clamped to 1.
- [ ] `PageCache` evicts LRU on entry-count and total-bytes overflow; TTL expiry yields a miss.
- [ ] `cacheKey` distinguishes modes (markdown vs article of same URL → different keys).

**Story**: `story-zai-fetch-windowing-core`

### Unit 2: Wire windowing into `fetch_content` (`extensions/index.ts`)

```typescript
// new constants (windowing path only — MAX_RETURN_CHARS stays for other paths)
const DEFAULT_WINDOW_LINES = 500;
const DEFAULT_MAX_CHARS = 30_000;
const MAX_MAX_CHARS = 120_000;

// module-scope cache (alongside existing hub / currentRegistry)
const pageCache = new PageCache();
```

`fetchContentExecute` changes (single-URL text-mode path):

```typescript
const windowable = urls.length === 1 && !wantJson;   // markdown/text/article, incl. PDF
if (windowable) {
  const maxChars = clampMaxChars(params.max_chars);          // default 30k, cap 120k, floor 1k
  const spec = { start_line: params.window?.start_line, line_count: params.window?.line_count };
  const key = cacheKey(urls[0], { return_format: params.return_format, extract: params.extract });
  let cacheHit = true;
  let blob = pageCache.get(key);
  if (!blob) {
    cacheHit = false;
    const full = await fetchOne(urls[0]);   // existing per-URL fetch (PDF/article/webReader)
    blob = { text: full, total_lines: full.split("\n").length, fetchedAt: Date.now() };
    pageCache.set(key, blob);
  }
  const w = applyWindow(blob.text, spec, maxChars);
  const footer = windowFooter(w);   // "[window: lines 201–400 of 1340 · request line 401 to continue]"
  return {
    content: [{ type: "text", text: w.past_end ? footer : `${w.text}\n\n${footer}` }],
    details: { urls, windowed: true, total_lines: w.total_lines, returned: w.returned,
               truncated_by_char_ceiling: w.truncated_by_char_ceiling, cache_hit: cacheHit },
  };
}
// else: existing batch/JSON path (truncate(body) at MAX_RETURN_CHARS) — unchanged
```

**Implementation notes**:
- `clampMaxChars`: `Number.isFinite` + `Math.min(Math.max(value|0, 1000), MAX_MAX_CHARS)`, default `DEFAULT_MAX_CHARS`. Floor 1000 so a tiny window is still useful.
- `windowFooter`: `"…[window: lines {start}–{end} of {total}" + (truncated_by_char_ceiling ? " · char-ceiling truncated" : "") + " · request line {end+1} to continue]"`. When the whole doc fit in one window, emit `"(whole document — {total} lines)"` instead (no "continue" hint).
- `fetchOne` unchanged — the cache wraps its result.
- `window`/`max_chars` ignored (not errored) on the batch and JSON paths; `details.windowed=false`.

**Acceptance criteria**:
- [ ] Single-URL markdown call with no `window` returns the first ≤500 lines + footer; `details.windowed=true`.
- [ ] A second call with `{window:{start_line:501}}` on the same URL hits the cache — the hub/fetch is NOT called a second time (`details.cache_hit=true`).
- [ ] `max_chars` override clamps to `[1000, 120000]`; default 30000.
- [ ] A window past the end returns the footer-only `past_end` result.
- [ ] JSON mode and multi-URL batches ignore `window`; `details.windowed=false`; existing truncation unchanged.
- [ ] Existing 71 tests stay green (non-windowed paths untouched).

**Story**: `story-zai-fetch-windowing-wiring` (depends on `story-zai-fetch-windowing-core`)

### Unit 3: Tool metadata + skill docs

**Files**: `extensions/index.ts` (description + `promptGuidelines` + `parameters` add `window` + `max_chars`), `skills/zai-research/SKILL.md`.

- Add `window` and `max_chars` to the `fetch_content` parameter schema.
- `promptGuidelines`: teach the window loop ("for long pages, the first call returns lines 1–500 + a footer; pass `window:{start_line:501}` to continue; the blob is cached so advancing doesn't re-fetch") and the `max_chars` knob.
- `SKILL.md`: add a "Window over long content" pattern; note the 500-line/30k defaults, the 120k cap, that JSON and multi-URL batches don't window, and the snapshot-drift caveat.
- Schema-snapshot test: assert `window` and `max_chars` are present in the registered parameters.

**Acceptance criteria**:
- [ ] Tool description/guidelines mention windowing + `max_chars`.
- [ ] `SKILL.md` shows the windowing pattern + drift caveat.
- [ ] Schema snapshot asserts `window` + `max_chars` params exist.
- [ ] `SKILL.md` under 500 lines.

**Story**: `story-zai-fetch-windowing-skill-docs` (depends on `story-zai-fetch-windowing-wiring`)

## Implementation Order

1. `story-zai-fetch-windowing-core` — `paging.ts` (pure) + unit tests. No deps.
2. `story-zai-fetch-windowing-wiring` — wire into `fetch_content`, cache integration, tool tests. depends on 1.
3. `story-zai-fetch-windowing-skill-docs` — tool metadata + `SKILL.md`. depends on 2.

Linear chain; `implement-orchestrator` runs them sequentially (Unit 3 must
reflect Unit 2's real param names → keep sequential even though docs could
otherwise draft in parallel).

## Testing

- `paging.test.ts` (new): `applyWindow` suites (sub-default whole, char-ceiling line-truncation, single-line char-cut, past-end, start clamp, default line_count) + `PageCache` suites (LRU entry eviction, byte eviction, TTL miss) + `cacheKey` stability + mode-distinction.
- `index.test.ts`: windowing wiring — single-URL cache-hit (hub called once across two windowed calls), `max_chars` clamp, past-end footer, JSON/batch ignore `window`, schema snapshot for `window` + `max_chars`.
- Regression: existing 71 tests unchanged.

## Risks

- **Snapshot drift** (stateless-by-shape windowing): a live URL changing between calls shifts line offsets. Accepted; documented in SKILL.md. Cache is best-effort.
- **Cache memory** for large PDFs: bounded by `maxBytes` (16 MB) + `maxEntries` (8) + TTL (10 min); LRU eviction. Tunable constants.
- **Concurrency**: two simultaneous windows of the same uncached URL both fetch (last-write-wins). Wasteful but not corrupting; dedupe (a la the hub's pending-promises) deferred — noted, not v1.
- **PDF line coarseness**: `pdf.ts` joins each PDF page's text into one line, so a "line" ≈ a PDF page for PDFs — windowing a PDF by lines ≈ windowing by pages. Acceptable, even nice.
- **Giant single line** (minified): char-cut at the ceiling with a marker. Rare, handled.
- **30k default is a behavior change** for medium (30k–60k) single-URL docs: they now window instead of returning whole. Intended (tighter context discipline); documented.
