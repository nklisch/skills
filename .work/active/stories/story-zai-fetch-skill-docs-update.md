---
id: story-zai-fetch-skill-docs-update
kind: story
stage: implementing
tags: [plugin, docs, zai-research]
parent: feature-zai-fetch-content-improvements
depends_on: [story-zai-fetch-json-api-mode, story-zai-fetch-article-extraction]
release_binding: null
gate_origin: null
created: 2026-06-23
updated: 2026-06-23
---

# Update zai-research SKILL.md for new fetch_content modes

## Brief

Update the portable `zai-research` skill documentation so agents and users know
when and how to use the new JSON/API and article extraction modes.

## Acceptance criteria

- The `fetch_content` tool description and `promptGuidelines` describe the new
  `return_format: json` / API mode and `extract: article` mode.
- A new “Patterns” example shows fetching a structured JSON API endpoint to
  confirm model IDs, config keys, or version lists.
- A new “Patterns” example shows using `extract: article` on a noisy docs site.
- Guardrails section notes any limitations (e.g. article extraction is heuristic).
