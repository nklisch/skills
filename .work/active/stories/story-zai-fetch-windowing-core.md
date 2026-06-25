---
id: story-zai-fetch-windowing-core
kind: story
stage: review
tags: [plugin, tooling, zai-research]
parent: feature-zai-fetch-content-paging
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-24
updated: 2026-06-24
---

# Windowing + cache core (paging.ts)

## Brief

New pure module `plugins/zai-research/extensions/paging.ts` providing line-based
windowing with **virtual wrapping** (`applyWindow`), a bounded LRU+TTL blob
cache that **refuses oversize entries** (`PageCache`), and a default-normalizing
`cacheKey`. Network-free and directly unit-testable. This is the foundation Unit
2 wires into `fetch_content`. Implements Unit 1 of
`feature-zai-fetch-content-paging` (post cross-model review).

## Scope

### Files
- `plugins/zai-research/extensions/paging.ts` (new)
- `plugins/zai-research/extensions/paging.test.ts` (new)

### Interfaces

```typescript
export interface WindowSpec { start_line?: number; line_count?: number; }
export interface WindowResult {
  text: string; total_lines: number;
  returned: { start: number; end: number };
  truncated_by_char_ceiling: boolean; past_end: boolean;
}
export function applyWindow(text: string, spec: WindowSpec, maxChars: number): WindowResult;

export interface CachedBlob { text: string; total_lines: number; fetchedAt: number; }
export class PageCache {
  constructor(opts?: { maxEntries?: number; maxBytes?: number; ttlMs?: number });
  get(key: string): CachedBlob | undefined;
  set(key: string, blob: CachedBlob): void;   // refuses oversize blobs (caller serves anyway)
  readonly size: number;
}
export function cacheKey(url: string, mode: { return_format?: string; extract?: string }): string;
```

### Constants
- `DEFAULT_WINDOW_LINES = 500`
- `PageCache` defaults: `maxEntries = 8`, `maxBytes = 16 MB` (UTF-8 bytes via `TextEncoder`), `ttlMs = 600_000` (10 min)

## Implementation notes
- `applyWindow`: (1) `total_lines = text === "" ? 0 : wrapAndSplit(text, maxChars).length` — wrap any source line longer than `maxChars` into virtual sub-lines ≤ `maxChars` (hard-wrap); (2) validate `spec`: `start_line` default 1, `line_count` default `DEFAULT_WINDOW_LINES`, clamp non-finite/`≤0`/fractional to default; (3) `requestedStart > total_lines` → `past_end=true`, `text=""`, stable `returned={start:total+1,end:total}`; (4) clamp `start` to `[1,total]`, take virtual lines `[start-1, start-1+count)`, join `"\n"`; (5) if joined > `maxChars`, pop trailing virtual lines until `≤ maxChars`, set `truncated_by_char_ceiling`, update `returned.end`. No single-line char-cut needed — virtual wrapping guarantees every virtual line ≤ `maxChars`.
- `PageCache`: `Map` insertion-order LRU (re-insert on get); on `set`, if blob alone > `maxBytes` → **refuse** (don't cache); else evict oldest until under both `maxEntries` and `maxBytes`; TTL checked on `get` (lazy delete).
- `cacheKey`: normalize `return_format ?? "markdown"`, `extract ?? "full"`, then `JSON.stringify({url, return_format, extract})`.

## Acceptance criteria
- [x] `applyWindow` 1000-line blob, `{line_count:200}` → lines 1–200, `total_lines=1000`, `truncated_by_char_ceiling=false`.
- [x] Window over `maxChars` drops trailing virtual lines; `truncated_by_char_ceiling=true`; `returned.end` reflects actual last line.
- [x] **Virtual wrapping:** a 100k-char single source line with `maxChars=30k` → `total_lines ≥ 4`; consecutive windows walk ALL 100k chars with no loss.
- [x] Empty content (`""`) → `total_lines=0`, any window → `past_end=true`, stable empty `returned`.
- [x] `start_line` past end → `past_end=true`, stable empty `returned`.
- [x] `start_line < 1` clamped to 1; `line_count ≤ 0` / non-finite / fractional → default.
- [x] `PageCache` evicts LRU on entry-count and total-bytes overflow; TTL expiry → miss; **oversize blob refused (not cached)**.
- [x] `cacheKey` normalizes defaults (omitted vs explicit `"markdown"`/`"full"` → same key) and distinguishes modes (markdown vs article of same URL → different keys).

## Out of scope
- Wiring into `fetch_content` (Unit 2 / `story-zai-fetch-windowing-wiring`).
- SKILL.md / tool metadata (Unit 3).

## Implementation log

**Files created**
- `plugins/zai-research/extensions/paging.ts` — the module (`applyWindow`,
  `PageCache`, `cacheKey`, exported `DEFAULT_WINDOW_LINES`; cache defaults kept
  local, matching `pdf.ts`'s local-tuning-constant pattern).
- `plugins/zai-research/extensions/paging.test.ts` — 47 unit tests across
  `applyWindow`, `cacheKey`, and `PageCache`.

**Verification**: `cd plugins/zai-research && bun test` → **118 pass / 0 fail**
(baseline 71 + 47 new). No biome/typecheck step in this plugin; `bun test` is
the gate.

**Key decisions / realizations**
- `past_end` condition is `total_lines === 0 || requestedStart > total_lines`.
  The design's `requestedStart > total_lines` alone yields `past_end` for the
  common empty case (default start → `1 > 0`), but not for an empty blob with a
  negative `start_line` (`-5 > 0` is false). The acceptance criterion "empty →
  any window → `past_end`" required OR-ing in `total_lines === 0`, so the stable
  empty range `{total+1, total}` is returned for every past-end request.
- `past_end` is checked against the requested start BEFORE lower-clamping, so a
  `start_line` past the end is reported (not silently clamped to the last
  line); `start_line < 1` is then clamped to 1 on the slicing path.
- `maxChars` is defensively floored to a positive integer
  (`Math.max(1, Math.floor(maxChars))`). A non-positive budget would make the
  hard-wrap loop run forever; a fractional one would produce fractional slice
  indices. No-op for the integer budgets Unit 2 passes.
- Char-ceiling truncation drops whole trailing virtual lines incrementally
  (never a mid-line char cut) — the wrapping invariant guarantees every virtual
  line ≤ `maxChars`, so the loop always leaves ≥1 line.
- `PageCache` byte accounting is UTF-8 via a shared `TextEncoder`, on the text
  payload only (`total_lines`/`fetchedAt` are negligible). Re-insert-on-get for
  recency; TTL lazy-delete-on-get (`set` never filters by age); oversize blobs
  refused before insert so the cache never exceeds `maxBytes`; refusal leaves
  existing entries untouched.
- `cacheKey` normalizes via `??` to `"markdown"`/`"full"` then
  `JSON.stringify({url, return_format, extract})`.

**Test fix in-session**: removed a misguided parametric case
`Number.MAX_SAFE_INTEGER + 0.5` from the invalid-`line_count` table — beyond
2⁵³ float precision can't represent the `.5`, so the value is integral and was
correctly treated as a valid (huge) `line_count`. Fractional fallback is
covered by the `1.5`/`2.5` cases. Bad test premise, not a product bug.

**Follow-up notes (non-blocking)**
- Virtual wrapping splits by UTF-16 code unit, so a wrap boundary can fall
  inside a surrogate pair. This never loses characters (the pair's two units
  land in adjacent virtual lines and reconstruct exactly when a single source
  line is walked), but a lone surrogate could render oddly mid-window. Matches
  the rest of the extension's `.length`-based budgeting; not worth special-casing
  for a local-dev research tool.
- The no-data-loss guarantee is exact for a single overlong source line (the
  PDF-page case the feature targets): walking one-virtual-line windows and
  concatenating their texts reconstructs the original byte-for-byte.
