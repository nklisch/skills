---
id: story-zai-fetch-article-extraction
kind: story
stage: implementing
tags: [plugin, tooling, zai-research]
parent: feature-zai-fetch-content-improvements
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-23
updated: 2026-06-23
---

# Add article-only extraction mode to fetch_content

## Brief

Doc sites fetched through `webReader` often return markdown full of navigation,
sidebars, footers, and headers. Add an `extract: "article"` mode that strips
this boilerplate and returns the main page content, making doc reads concise.

## Acceptance criteria

- A new `extract` parameter accepts `"full"` (default, current behavior) and
  `"article"`.
- In `"article"` mode, the fetched HTML is cleaned to remove navigation,
  sidebars, footers, ads, and repeated chrome.
- The implementation either uses a lightweight existing library judged worth the
dependency or a clean heuristic with documented limitations.
- Falls back to full extraction if the cleaner cannot identify a main content
  area, with a note in the output.
- New unit tests cover a representative doc-page HTML fixture, a page with no
  identifiable article, and a PDF URL combined with `extract: article`.
- No regression in existing `fetch_content` behavior.
