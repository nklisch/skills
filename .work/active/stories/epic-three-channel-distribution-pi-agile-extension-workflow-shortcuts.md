---
id: epic-three-channel-distribution-pi-agile-extension-workflow-shortcuts
kind: story
stage: implementing
tags: [plugin, tooling]
parent: epic-three-channel-distribution-pi-agile-extension
depends_on: [epic-three-channel-distribution-pi-agile-extension-queue-commands]
release_binding: null
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

- [ ] `/aw board` routes the user to `$agile-workflow:board` instead of starting
  the long-running board server inline.
- [ ] `/aw autopilot [scope]` routes to `$agile-workflow:autopilot <scope>`,
  defaulting to the current active scope or `--all` when no scope is supplied.
- [ ] `/aw scope <idea>` routes to `$agile-workflow:scope <idea>`.
- [ ] Handoffs use Pi follow-up user messages where supported, with a
  notification/text fallback.
- [ ] `/aw help` lists both queue inspection commands and workflow handoffs.
- [ ] The extension remains independent of `pi-subagents`; subagent behavior is
  provided by the shared skills.
