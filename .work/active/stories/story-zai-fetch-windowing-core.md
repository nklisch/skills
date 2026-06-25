---
id: story-zai-fetch-windowing-core
kind: story
stage: implementing
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
- [ ] `applyWindow` 1000-line blob, `{line_count:200}` → lines 1–200, `total_lines=1000`, `truncated_by_char_ceiling=false`.
- [ ] Window over `maxChars` drops trailing virtual lines; `truncated_by_char_ceiling=true`; `returned.end` reflects actual last line.
- [ ] **Virtual wrapping:** a 100k-char single source line with `maxChars=30k` → `total_lines ≥ 4`; consecutive windows walk ALL 100k chars with no loss.
- [ ] Empty content (`""`) → `total_lines=0`, any window → `past_end=true`, stable empty `returned`.
- [ ] `start_line` past end → `past_end=true`, stable empty `returned`.
- [ ] `start_line < 1` clamped to 1; `line_count ≤ 0` / non-finite / fractional → default.
- [ ] `PageCache` evicts LRU on entry-count and total-bytes overflow; TTL expiry → miss; **oversize blob refused (not cached)**.
- [ ] `cacheKey` normalizes defaults (omitted vs explicit `"markdown"`/`"full"` → same key) and distinguishes modes (markdown vs article of same URL → different keys).

## Out of scope
- Wiring into `fetch_content` (Unit 2 / `story-zai-fetch-windowing-wiring`).
- SKILL.md / tool metadata (Unit 3).
