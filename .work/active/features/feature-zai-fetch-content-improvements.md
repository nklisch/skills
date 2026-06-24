---
id: feature-zai-fetch-content-improvements
kind: feature
stage: drafting
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
