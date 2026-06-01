---
id: gate-tests-pi-extension-queue-wrappers
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

# Add Pi extension queue command tests

## Priority
Critical

## Spec reference
Item: `epic-three-channel-distribution-pi-agile-extension-queue-commands`
Acceptance criteria: `/aw status` produces a compact ready/review/blocked
snapshot; `/aw parent <id>` and `/aw blocking <id>` validate id shape; large
command output is bounded or truncated.

## Gap type
boundary

## Suggested test
Mock `pi.exec` and `ctx.ui`; assert status composes the three allowlisted
`work-view` calls, UI status/widget are updated, invalid ids never call exec,
and long output includes the truncation marker.

## Test location
`plugins/agile-workflow/extensions/agile-workflow.test.ts`
