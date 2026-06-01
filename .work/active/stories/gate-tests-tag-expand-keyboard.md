---
id: gate-tests-tag-expand-keyboard
kind: story
stage: implementing
tags: [testing]
parent: null
depends_on: []
release_binding: 0.9.5
gate_origin: tests
created: 2026-06-01
updated: 2026-06-01
---

# Cover tag expand keyboard reachability

## Priority
Critical

## Spec reference
Item: `feature-work-view-board-expanded-browsing-tags`
Acceptance criterion: the tag group exposes a keyboard-reachable
expand/collapse button.

## Gap type
missing test for valid partition

## Suggested test
Extend the expanded browsing JS test to assert the expand/collapse control is a
real `button`, remains in tab order, updates `aria-expanded`, and can be
activated through keyboard-style event dispatch.

## Test location
`plugins/agile-workflow/work-view/crates/cli/tests/board-js/expanded-browsing.test.mjs`
