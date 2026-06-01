---
id: gate-tests-board-js-harness-markdown-filter
kind: story
stage: implementing
tags: [testing]
parent: gate-tests-board-js-harness
depends_on: [gate-tests-board-js-harness-runner]
release_binding: null
gate_origin: tests
created: 2026-06-01
updated: 2026-06-01
---

# Add markdown and filter board JS behavior tests

## Scope

Use the board JS harness to test markdown safety and global filter composition
with executed module behavior instead of Rust static-grep proxies.

## Acceptance Criteria

- [ ] Adversarial markdown containing script tags, event attributes, and
  `javascript:` links renders inert output through `renderMarkdown`.
- [ ] `matchesFilters` covers OR within kind/stage/parent groups, AND across
  filter groups, tag AND semantics, search matching, null parent handling, and
  tier-based auto-hide behavior.
- [ ] The new suites pass under `node --test`.

