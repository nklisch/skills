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
windowing (`applyWindow`), a bounded LRU+TTL blob cache (`PageCache`), and a
deterministic `cacheKey`. Network-free and directly unit-testable. This is the
foundation Unit 2 wires into `fetch_content`. Implements Unit 1 of
`feature-zai-fetch-content-paging`.

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
  set(key: string, blob: CachedBlob): void;
  readonly size: number;
}
export function cacheKey(url: string, mode: { return_format?: string; extract?: string }): string;
```

### Constants
- `DEFAULT_WINDOW_LINES = 500`
- `PageCache` defaults: `maxEntries = 8`, `maxBytes = 16 MB`, `ttlMs = 600_000` (10 min)

## Implementation notes
- `applyWindow`: split on `"\n"` (keep empty lines — structural); clamp `start_line` to `[1, total]`; default `line_count = DEFAULT_WINDOW_LINES`; join window with `"\n"`; if over `maxChars`, pop trailing lines until `<= maxChars` (set `truncated_by_char_ceiling`); if the first window line alone exceeds `maxChars`, char-cut at `maxChars` with a `…[char ceiling: single line truncated]` marker; `past_end` when `start_line > total`.
- `PageCache`: `Map` insertion-order LRU (re-insert on get to mark recent); evict oldest until under both `maxEntries` and `maxBytes`; TTL checked on `get` (lazy delete on expiry).
- `cacheKey`: `JSON.stringify({ url, return_format, extract })` — stable and mode-aware.

## Acceptance criteria
- [ ] `applyWindow` 1000-line blob, `{line_count:200}` → lines 1–200, `total_lines=1000`, `truncated_by_char_ceiling=false`.
- [ ] Window over `maxChars` drops trailing lines at boundaries; `truncated_by_char_ceiling=true`; `returned.end` reflects the actual last line.
- [ ] Single line > `maxChars` → char-cut with marker.
- [ ] `start_line` past end → empty `text`, `past_end=true`.
- [ ] `start_line < 1` clamped to 1.
- [ ] `PageCache` evicts LRU on entry-count and total-bytes overflow; TTL expiry → miss.
- [ ] `cacheKey` distinguishes modes (markdown vs article of same URL → different keys).

## Out of scope
- Wiring into `fetch_content` (Unit 2 / `story-zai-fetch-windowing-wiring`).
- SKILL.md / tool metadata (Unit 3).
