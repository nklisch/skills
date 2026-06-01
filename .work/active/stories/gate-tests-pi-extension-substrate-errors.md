---
id: gate-tests-pi-extension-substrate-errors
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

# Add Pi extension substrate and error behavior tests

## Priority
Critical

## Spec reference
Item: `epic-three-channel-distribution-pi-agile-extension-manifest-shell`
Acceptance criteria: `/aw` walks upward from `ctx.cwd` to find
`.work/CONVENTIONS.md`; missing substrate or missing `.work/bin/work-view`
returns an actionable message.

## Gap type
error case

## Suggested test
Unit-test the extension with a fake Pi API and temp directories for no
substrate, substrate without `work-view`, upward discovery, `/aw help`, and
`pi.exec(command, args, options)` argument-array use.

## Test location
`plugins/agile-workflow/extensions/agile-workflow.test.ts`
