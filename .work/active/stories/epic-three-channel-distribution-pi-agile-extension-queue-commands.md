---
id: epic-three-channel-distribution-pi-agile-extension-queue-commands
kind: story
stage: review
tags: [plugin, tooling]
parent: epic-three-channel-distribution-pi-agile-extension
depends_on: [epic-three-channel-distribution-pi-agile-extension-manifest-shell]
release_binding: null
gate_origin: null
created: 2026-06-01
updated: 2026-06-01
---

# Add Pi Queue Snapshot Commands

## Scope

Extend the `/aw` command with safe wrappers around the existing `work-view`
filters so Pi users can inspect the active substrate without remembering every
CLI flag.

## Acceptance Criteria

- [x] `/aw status` produces a compact ready/review/blocked snapshot by composing
  `.work/bin/work-view --ready`, `--stage review`, and `--blocked`.
- [x] `/aw ready`, `/aw blocked`, and `/aw review` map to the matching
  `work-view` filters.
- [x] `/aw parent <id>` and `/aw blocking <id>` validate the id shape and pass it
  as an argument array to `work-view`.
- [x] When `ctx.ui` is available, `status` updates a small status/widget summary;
  otherwise it returns plain text only.
- [x] Large command output is bounded or truncated with a clear marker.

## Notes

- Keep all work-view invocations allowlisted. Do not add a generic "pass any
  args to work-view" mode.

## Implementation Notes

- Added `/aw status`, `ready`, `blocked`, `review`, `parent <id>`, and
  `blocking <id>` command handling.
- Composed `status` from allowlisted `work-view` calls and updated Pi
  status/widget UI when present.
- Added item id validation and output truncation so user input cannot become a
  generic shell or unbounded session dump.

## Verification

- `rg -n "status|ready|blocked|review|parent|blocking|ITEM_ID_RE|truncate|setWidget|setStatus" plugins/agile-workflow/extensions/agile-workflow.ts`
- `git diff --check -- plugins/agile-workflow/extensions/agile-workflow.ts .work/active/stories/epic-three-channel-distribution-pi-agile-extension-queue-commands.md`
