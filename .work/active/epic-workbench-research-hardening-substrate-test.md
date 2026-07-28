---
id: epic-workbench-research-hardening-substrate-test
kind: story
status: active
tags: [plugin, skill, prose]
parent: epic-workbench-research-hardening
blocked_by: []
related_to: []
research_refs: []
mock_refs: []
created: 2026-07-28
updated: 2026-07-28
---
# Restore the two-part substrate test to the Workbench discipline

## Brief

Add a compact substrate test to Workbench's research discipline without adding a
new workflow phase or artifact. Research artifacts should remain usable without
the producing project's hidden context and should read as engagement with their
subject rather than narration of the agent task or authoring history.

Workbench already keeps recommendations and project framing out of
attestations. This item generalizes the underlying guard clearly enough to bind
all committed research artifacts while preserving the simpler skill surface.

## Acceptance

- The discipline asks whether a reader without deployment context can use the
  artifact and requires leaked project framing to move downstream.
- The discipline asks whether task instructions, session history, or authoring
  narration leaked into artifact prose and requires their removal.
- The wording distinguishes reusable research context from prohibited hidden
  task context; it does not ban a brief from naming its explicit decision
  boundary.
- No new stage, checkpoint, template, marker vocabulary, or validator is added
  unless a concrete enforcement need is demonstrated during implementation.
