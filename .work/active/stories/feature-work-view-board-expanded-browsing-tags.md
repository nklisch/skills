---
id: feature-work-view-board-expanded-browsing-tags
kind: story
stage: implementing
tags: [tooling]
parent: feature-work-view-board-expanded-browsing
depends_on: [feature-work-view-board-expanded-browsing-epic-sidebar]
release_binding: null
gate_origin: null
created: 2026-06-01
updated: 2026-06-01
---

# Add expanded tag browsing to the board sidebar

## Scope

Add an expanded tag browsing mode to the global filter sidebar so large tag sets
can be scanned and selected without losing the compact default layout.

## Acceptance Criteria

- [ ] Tags use the existing `tags` filter set and preserve AND semantics.
- [ ] The tag group exposes a keyboard-reachable expand/collapse button.
- [ ] Compact and expanded tag layouts have stable CSS constraints and do not
  resize board content incoherently.
- [ ] Asset-contract tests cover the shipped tag expansion controls and CSS.
