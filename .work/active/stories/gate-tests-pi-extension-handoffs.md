---
id: gate-tests-pi-extension-handoffs
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

# Add Pi extension workflow handoff tests

## Priority
Critical

## Spec reference
Item: `epic-three-channel-distribution-pi-agile-extension-workflow-shortcuts`
Acceptance criteria: `/aw board` routes to `$agile-workflow:board`;
`/aw autopilot [scope]` routes to `$agile-workflow:autopilot <scope>`;
handoffs use Pi follow-up messages where supported, with a notification/text
fallback.

## Gap type
e2e-seam

## Suggested test
Mock `sendUserMessage` and fallback runtimes; assert board/autopilot/scope
queue the exact skill invocations, autopilot defaults to `--all`, scope
requires text, and help lists queue plus handoff commands.

## Test location
`plugins/agile-workflow/extensions/agile-workflow.test.ts`
