---
id: feature-work-view-board-expanded-browsing-epic-sidebar
kind: story
stage: implementing
tags: [tooling]
parent: feature-work-view-board-expanded-browsing
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-01
updated: 2026-06-01
---

# Add expandable epic browsing to the board sidebar

## Scope

Add a global Epic filter to the board sidebar. Selecting an epic should include
the epic and all descendants in the visible item set, while the existing Parent
filter continues to mean exact direct parent.

## Acceptance Criteria

- [ ] `filters.js` supports an `epics` filter set with normalization,
  serialization, options derivation, and matching.
- [ ] Epic matching walks item parent chains safely and includes descendants.
- [ ] The sidebar renders a compact expandable Epic group.
- [ ] Rust asset-contract tests cover the shipped Epic filter contract and CSS
  sizing constraints.

