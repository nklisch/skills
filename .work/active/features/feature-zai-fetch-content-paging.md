---
id: feature-zai-fetch-content-paging
kind: feature
stage: drafting
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
needs the next 60k has no offset or cursor to ask for it, and re-calling just
returns the same head again.

This feature adds two things:

1. **A context-limit default** that is a first-class, tunable concept — an
   agent can request more per call when justified (within a hard ceiling),
   rather than the limit being a hidden constant.
2. **Paging** — when content exceeds the per-call limit, the tool returns
   page 1 plus an opaque cursor the agent passes back to retrieve subsequent
   pages, walking the whole document without re-fetching or losing content.

The webReader, local-PDF (`unpdf`), and article (`readability` + `turndown`)
backends all return full content in one shot — there is no server-side cursor —
so paging is necessarily **client-side slicing** of an already-fetched blob. The
extension therefore fetches the full blob once, caches it, and serves later
pages from the cache.

This covers the `zai-research` extension
(`plugins/zai-research/extensions/`), its tests (`extensions/index.test.ts`
plus a new cache/paging test file as needed), and the portable skill doc
(`plugins/zai-research/skills/zai-research/SKILL.md`).

## Strategic decisions

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
  you disagree. Paging applies to webReader HTML, article, and PDF markdown.
  JSON/API mode is excluded: slicing a compacted JSON string mid-structure
  produces broken fragments an agent cannot use. Agents that need less JSON
  should narrow the API query rather than page the response. (The existing JSON
  path's external `JSON_TRUNCATION_MARKER` stays as-is.)
- **Limit model: tunable `max_chars` with a default + hard ceiling.** Decided at
  scope — redirect if you disagree. The per-call limit becomes an agent-tunable
  parameter (default ≈ 60k to preserve today's behavior; hard ceiling ≈ 200k)
  rather than a fixed constant. Paging remains the norm for long content; the
  parameter lets a justified caller ask for more in one shot.

## Scope notes

- This is a **new feature**, not a child of `feature-zai-fetch-content-improvements`
  (which is `stage: done`, reviewed/approved 2026-06-24). That feature was about
  *what* content to fetch (JSON vs article vs HTML); this is about *how much*
  and *how to page* — a distinct concern layered on top of the current code.
- Additive and backward-compatible for content that fits in one page: when total
  length ≤ the limit, behavior is unchanged (no cursor surfaced). For content
  that exceeds the limit, the result gains paging metadata instead of (or in
  addition to) today's head-truncation marker — an observable result-shape
  change, so this is a feature, not a `[refactor]`.
- New capability → **minor** plugin version bump (consistent with the sibling
  feature's bump classification), via `scripts/bump-version.sh zai-research minor`
  after implementation lands clean.

## Design decisions (framing locked; interface details deferred to feature-design)

- **Client-side paging via a cached blob.** The full fetched content is cached
  once; `page`/`cursor` calls slice `[offset, offset+limit)` from the cache.
  Total length is known after fetch (`text.length`), so the result can report
  `page X of N` accurately.
- **Opaque cursor, not a raw offset.** The cursor is an opaque token the agent
  passes back; it is *not* a bare integer offset. This keeps the contract
  stable if the internal representation (offset vs. cache key vs. resume info)
  evolves, and lets the cache key be an implementation detail. Exact encoding
  (base64 of a small JSON payload? signed? what fields?) is a feature-design
  call — note that the cursor carries `url`+mode+page so an expired entry can
  re-fetch transparently, and consider whether a local-dev tool needs cursor
  signing at all (likely not; document the forgery posture either way).
- **Paging supersedes head-truncation for paged content.** Today's
  `truncate()` head-keep + marker is replaced, for content exceeding the limit,
  by page-1 + cursor + page metadata. For sub-limit content, `truncate()` is
  effectively a no-op and stays. How the two behaviors coexist (e.g. a single
  `page` param defaulting to 1, cursor `null` when there is no more) is a
  feature-design interface call.
- **Cache lifecycle.** Bounded LRU (capacity TBD) + TTL (TBD), both
  feature-design calls. Eviction is silent and safe because an expired/evicted
  entry re-fetches transparently via the resume info in the cursor. Consider
  memory pressure: a 25 MB PDF's markdown can be large; the LRU should bound
  total cached bytes, not just entry count.
- **Batch `urls` interaction.** `fetch_content` accepts up to 20 URLs in one
  call. Paging over a batch needs a per-URL cursor story — likely the cursor
  identifies a specific URL within the batch. This is a real design question
  for feature-design: does paging require single-URL calls, or can a cursor
  resume one URL out of a prior batch?

## Implementation units (suggested — feature-design may restructure)

1. **Paging core + cache module** — a bounded LRU+TTL blob cache at module
   scope, the cursor encode/decode + transparent re-fetch-on-miss, the
   `page`/`cursor` parameter handling, and the slice logic. Suggested story:
   `story-zai-fetch-paging-core`.
2. **Tunable `max_chars` limit** — expose the per-call limit as a parameter
   (default + hard ceiling) and wire it into the paging slice size. Suggested
   story: `story-zai-fetch-max-chars-limit`.
3. **Tool metadata + skill docs** — update the `fetch_content` description and
   `promptGuidelines` to teach agents the page/cursor loop and the `max_chars`
   knob; update `SKILL.md` with a paging pattern and guardrails. Suggested
   story: `story-zai-fetch-paging-skill-docs`.

feature-design will set `depends_on` (likely paging-core → max-chars → docs,
mirroring the sibling feature's ordering) and formalize acceptance criteria.

## Testing

- Single-page (sub-limit) content: behavior unchanged, no cursor surfaced.
- Multi-page content: page 1 returns cursor + `page 1/N`; later pages from
  cache return the correct slice and advancing cursor; final page has no
  next cursor.
- Cache miss / TTL expiry: cursor triggers transparent re-fetch and resumes
  at the correct page.
- LRU eviction: bounded entry/byte count evicts oldest; resume still works.
- PDF and article modes page correctly (the expensive-extraction cases the
  cache exists to protect).
- `max_chars`: default preserved; values above the ceiling are clamped/rejected.
- Cursor decode is robust to malformed/tampered tokens (graceful error, not a
  crash or an arbitrary-URL fetch).
- Regression: existing JSON truncation marker and sub-limit behavior unchanged.

## Risks

1. **Cross-call state is new for this tool.** Mitigation: bounded LRU + TTL,
  transparent re-fetch-on-miss, and module-scope placement matching the
  existing `hub`/`currentRegistry` pattern.
2. **Cursor forgery could direct an arbitrary fetch.** Mitigation: cursor
  encodes `url`+mode that were already SSRF-checked on the first fetch;
  resume re-runs `assertSafeFetchUrl`. Document whether signing is needed.
3. **Large PDFs inflate cache memory.** Mitigation: bound total cached bytes,
  not just entry count; TTL keeps the working set small.
4. **Batch paging UX is awkward.** Mitigation: feature-design decides whether
  paging is single-URL-only or supports per-URL cursors in a batch.
5. **Result-shape change for over-limit content** (marker → cursor metadata).
  Mitigation: backward-compatible for sub-limit content; over-limit callers
  gain capability rather than lose it.

## Next

`/agile-workflow:feature-design` picks this up at `stage: drafting` to flesh out
interfaces (param names, cursor format, LRU/TTL/ceiling values, batch-cursor
story), spawn child stories with `depends_on`, and advance to `implementing`.
