---
id: epic-three-channel-distribution-pi-agile-extension-workflow-shortcuts
kind: story
stage: done
tags: [plugin, tooling]
parent: epic-three-channel-distribution-pi-agile-extension
depends_on: [epic-three-channel-distribution-pi-agile-extension-queue-commands]
release_binding: 0.9.5
gate_origin: null
created: 2026-06-01
updated: 2026-06-01
---

# Add Pi Workflow Shortcut Handoffs

## Scope

Make the board, autopilot, and scoping paths discoverable from Pi without
reimplementing their lifecycle inside the extension. The extension should hand
off to the existing agile-workflow skills.

## Acceptance Criteria

- [x] `/aw board` routes the user to `$agile-workflow:board` instead of starting
  the long-running board server inline.
- [x] `/aw autopilot [scope]` routes to `$agile-workflow:autopilot <scope>`,
  defaulting to the current active scope or `--all` when no scope is supplied.
- [x] `/aw scope <idea>` routes to `$agile-workflow:scope <idea>`.
- [x] Handoffs use Pi follow-up user messages where supported, with a
  notification/text fallback.
- [x] `/aw help` lists both queue inspection commands and workflow handoffs.
- [x] The extension remains independent of `pi-subagents`; subagent behavior is
  provided by the shared skills.

## Implementation Notes

- Added `/aw board`, `/aw autopilot [scope]`, and `/aw scope <idea>` as
  follow-up message handoffs to the shared agile-workflow skills.
- Defaulted `/aw autopilot` to `--all` when no scope is supplied because the
  extension does not own a durable active-scope model.
- Kept board/autopilot lifecycle outside the extension and left subagent policy
  in shared skills; the extension has no dependency on `pi-subagents`.

## Verification

- `rg -n "sendUserMessage|board|autopilot|scope|pi-subagents|follow-up|help" plugins/agile-workflow/extensions/agile-workflow.ts .work/active/stories/epic-three-channel-distribution-pi-agile-extension-workflow-shortcuts.md`
- `git diff --check -- plugins/agile-workflow/extensions/agile-workflow.ts .work/active/stories/epic-three-channel-distribution-pi-agile-extension-workflow-shortcuts.md`

## Review

- Verdict: Approve - story verified by implement; fast-lane advance.
- Notes: Board, autopilot, and scope paths hand off to shared agile-workflow
  skills, preserving the extension as a small command surface rather than a
  workflow reimplementation.
