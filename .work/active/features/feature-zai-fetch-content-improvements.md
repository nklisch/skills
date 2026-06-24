---
id: feature-zai-fetch-content-improvements
kind: feature
stage: implementing
tags: [plugin, tooling, zai-research]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-23
updated: 2026-06-23
---

# Improve fetch_content for structured APIs and noisy doc pages

## Brief

`fetch_content` in the `zai-research` extension currently sends every HTML URL
through Z.ai `webReader` and returns the full page markdown. Two recurring
frictions have surfaced:

1. **Structured API endpoints are better fetched directly.** For the Umans
   model-info API, a direct `curl` returned clean JSON while `fetch_content`
   returned a noisy rendered-docs dump. The tool should expose a first-class
   JSON/API mode that does a bounded direct HTTP fetch and returns parsed
   JSON, using the same SSRF and size guards already in place for PDF downloads.

2. **Documentation pages include too much boilerplate.** Doc sites often come
   back with navigation, sidebars, footers, and repeated headers. The tool should
   expose an `extract: "article"` mode that strips this boilerplate and returns
   the main content.

3. **Skill documentation needs to steer users.** The `zai-research` `SKILL.md`
   should explain when to use the new JSON/API mode and the article-extraction
   mode, and it should update the `fetch_content` tool description and prompt
   guidelines so agents self-route correctly.

This feature covers the `zai-research` extension (`plugins/zai-research/extensions/`),
its tests (`extensions/index.test.ts`, `pdf.test.ts`, and new tests for the new
modes), and the portable skill doc
(`plugins/zai-research/skills/zai-research/SKILL.md`).

## Scope notes

- `web_search` diagnostics are explicitly out of scope. The reported opaque
  failure for “omans” was a wrong search term, not a tool error.
- Migration/compatibility: the new options are additive; existing `fetch_content`
  calls keep the current behavior by default.
- The article-extraction implementation should avoid pulling in heavy DOM
  dependencies if possible; a lightweight heuristic or small dependency will
  be selected during design.

## Design decisions

- **Structured API mode is a `return_format` value, not a new tool.** Reusing
  `return_format` keeps the existing `fetch_content` surface coherent: `json`
  means “fetch the URL directly and return parsed JSON,” while `markdown`/`text`
  continue to route through Z.ai `webReader`.
- **Article extraction is a separate `extract` parameter.** `extract: "article"`
  fetches raw HTML and strips navigation/sidebars/footers before converting to
  markdown. It composes with `return_format: markdown/text`; it is ignored (or
  an error) when combined with `return_format: json` because JSON has no
  article semantics.
- **No new heavy DOM dependency for v1.** Article extraction will use a
  lightweight regex/selector heuristic with known-doc-site fallbacks. If the
  heuristic cannot locate a plausible main-content block, it falls back to the
  full page with a note.
- **`prompt` remains a compatibility no-op.** The `prompt` parameter exists for
  drop-in compatibility with other tool schemas but is not sent upstream. The
  design does not turn it into a post-processing or extraction instruction.

## Architectural choice

Three plausible approaches were considered:

1. **New tools** (`fetch_json`, `fetch_article`). Clean separation, but it
   fragments the surface and forces callers to pick the right tool name rather
   than a parameter.
2. **Mode parameters on `fetch_content`** (`return_format: json`,
   `extract: article`). Keeps the tool surface small and matches caller intent
   naturally.
3. **Prompt-driven backend extraction.** Pass caller intent to the webReader as
   a prompt. Rejected because the parameter is explicitly documented as not sent
   to Z.ai and because a backend prompt offers no guarantee of structured JSON.

**Chosen: option 2.** Additive parameters on `fetch_content` give the cleanest UX
and the smallest schema change.

## Implementation units

### Unit 1: JSON/API direct-fetch mode

**File**: `plugins/zai-research/extensions/index.ts`

When `params.return_format === "json"`:

1. Validate the URL with `assertSafeFetchUrl`.
2. Fetch with `fetchBounded` (reusing the existing byte-cap + timeout path
   already used for PDFs).
3. Require the response to parse as JSON; if parsing fails, return a clear
   error that includes the actual Content-Type and a short snippet so the caller
   can tell whether the endpoint returned an HTML error page.
4. Pretty-print the parsed JSON and return it under the normal truncation cap.

Tool schema changes:

```typescript
return_format: strEnum(
  ["markdown", "text", "json"],
  "Output format. markdown/text route through Z.ai webReader; json fetches the URL directly and returns parsed JSON."
)
```

**Story**: `story-zai-fetch-json-api-mode`

**Acceptance criteria**:
- [ ] `return_format: "json"` on a JSON endpoint returns pretty-printed JSON.
- [ ] On a non-JSON endpoint the tool returns a structured error (not a dump).
- [ ] SSRF and byte-cap failures use the same messages and behavior as PDFs.
- [ ] Unit tests exercise success, parse failure, SSRF rejection, and byte-cap.

### Unit 2: Article-only extraction

**Files**:
- `plugins/zai-research/extensions/article.ts` (new helper)
- `plugins/zai-research/extensions/index.ts` (integration)

When `params.extract === "article"`:

1. Fetch raw HTML directly with `fetchBounded` and SSRF guards.
2. Pass the HTML to `extractArticle(html)`.
3. `extractArticle`:
   - Strip `<script>`, `<style>`, `<nav>`, `<header>`, `<footer>`, `<aside>`,
     `<form>`, and elements with common noise classes/IDs (`sidebar`, `nav`,
     `menu`, `toc`, `ads`, `comments`).
   - Prefer main-content containers in order: `<main>`, `<article>`,
     `[role="main"]`, `.content`, `#content`, `.documentation`, `.main`,
     `.page-content`.
   - If a main container is found, narrow to it; otherwise operate on `<body>`.
   - Convert the remaining HTML to lightweight markdown: headings (`h1`→`#`,
     etc.), paragraphs, lists, code blocks, links. Strip remaining tags rather
     than trying to represent every DOM node.
   - If the result is empty or below a token floor, fall back to full-page
     extraction with a leading note.

Tool schema changes:

```typescript
extract: strEnum(
  ["full", "article"],
  "For HTML pages, full returns the whole webReader output; article strips navigation/sidebars/footers and returns main content."
)
```

**Story**: `story-zai-fetch-article-extraction`

**Acceptance criteria**:
- [ ] A fixture representing a noisy docs page returns only the main article
      content when `extract: "article"`.
- [ ] A fixture with no identifiable article falls back to full text with a
      fallback marker.
- [ ] `extract: "article"` combined with a PDF URL is ignored (PDF extraction
      proceeds normally).
- [ ] Existing `fetch_content` behavior is unchanged when `extract` is omitted.

### Unit 3: Tool metadata and skill documentation

**Files**:
- `plugins/zai-research/extensions/index.ts` (description + prompt guidelines)
- `plugins/zai-research/skills/zai-research/SKILL.md`

Update the registered tool description and `promptGuidelines` to tell agents:
- Use `return_format: "json"` for REST/JSON API endpoints.
- Use `extract: "article"` when a docs page returns too much navigation noise.

Update `SKILL.md`:
- Add a “Fetch a structured API endpoint” pattern.
- Add a “Strip boilerplate from a docs page” pattern.
- Update the guardrails to mention JSON-mode SSRF/size guards and the article
  heuristic fallback.

**Story**: `story-zai-fetch-skill-docs-update`

**Acceptance criteria**:
- [ ] Tool description and guidelines mention JSON and article modes.
- [ ] `SKILL.md` examples show the new modes.
- [ ] The skill remains under 500 lines; deep catalogs are split into
      references if needed.

## Implementation order

1. `story-zai-fetch-json-api-mode` — adds the direct-fetch path and tests.
2. `story-zai-fetch-article-extraction` — adds the article helper, wires it, and
   tests.
3. `story-zai-fetch-skill-docs-update` — updates tool metadata and
   `SKILL.md` after the code changes are landed.

## Testing

### New unit test file

`plugins/zai-research/extensions/index.test.ts` already exists; add test suites:

- `fetch_content JSON mode`:
  - success with a local inline JSON fixture
  - parse error with HTML body
  - SSRF rejection
  - byte-cap enforcement
- `fetch_content article extraction`:
  - noisy docs fixture → clean article
  - no-main-content fixture → fallback note
  - PDF URL with `extract: article` → unchanged PDF path

MCP/webReader fakes in the existing test harness can be reused; JSON and article
paths do not call the MCP hub.

### Regression

- Run `bun test` in `plugins/zai-research/` and expect all tests green.
- Verify the plugin version bump script runs cleanly after changes.

## Risks

1. **Article extraction heuristic misses unusual doc templates.** Mitigation:
   documented fallback to full content; callers can still use the default mode.
2. **JSON mode bypasses webReader and may fetch large HTML error pages.**
   Mitigation: byte cap + Content-Type check already in design.
3. **New parameters could confuse callers if names are ambiguous.** Mitigation:
   clear descriptions and updated SKILL.md examples; parameters are additive.
