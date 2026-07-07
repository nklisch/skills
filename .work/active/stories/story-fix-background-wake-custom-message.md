---
id: story-fix-background-wake-custom-message
kind: story
stage: done
tags: [bug, plugin]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-22
updated: 2026-07-07
---

# Fix background-task wake delivery attribution

## Symptom
The background/monitor plugin wakes the agent by calling `pi.sendUserMessage(...)`, so completion wakes are recorded as if the user authored them.

## Root cause
`plugins/background-tasks/extensions/background-tasks.ts` implements the async wake path with `pi.sendUserMessage(message, { deliverAs: "steer" })`. Pi exposes `pi.sendMessage(...)` for extension-authored custom messages that can also trigger/steer an agent turn, so the plugin was using the wrong wake API for extension-owned events.

## Fix approach
Route wake-ups through a `background-tasks:wake` custom message with `triggerTurn: true` and `deliverAs: "steer"`. Preserve the security boundary: the wake content remains hardcoded/status-only, with command output still available only through the `jobs` tool.

## Regression test
`plugins/background-tasks/extensions/background-tasks.test.ts` asserts that wake events use `sendMessage` custom messages, not `sendUserMessage`, and still omit captured command output.

## Implementation notes
- Changed `plugins/background-tasks/extensions/background-tasks.ts` to emit wake-ups through `pi.sendMessage(...)` as `background-tasks:wake` custom messages with `triggerTurn: true` and `deliverAs: "steer"`.
- Kept wake contents hardcoded/status-only; command stdout/stderr still enters model context only when the agent explicitly reads it with `jobs action=tail` or `jobs action=view`.
- Updated `plugins/background-tasks/skills/background-tasks/SKILL.md` so the portable skill describes extension-authored wake delivery instead of user-message delivery.
- Added regression assertions in `plugins/background-tasks/extensions/background-tasks.test.ts` for custom-message wake metadata and zero `sendUserMessage` calls.

## Verification
- `bun test plugins/background-tasks/extensions/background-tasks.test.ts` — 35 pass.
- `bun test` — 107 pass.
- `python3 /home/nathan/.codex/skills/.system/skill-creator/scripts/quick_validate.py plugins/background-tasks/skills/background-tasks` — valid.
- `git diff --check` — clean.

## Review (2026-07-06)

**Verdict**: Approve - story verified by implement; fast-lane advance.

**Blockers**: none. **Important**: none. **Nits**: none.

**Notes**: fast lane. Confirmed the fix is in the tree (`background-tasks.ts:96,685` —
`WAKE_CUSTOM_TYPE = "background-tasks:wake"`, `pi.sendMessage(...)` path).
`cd plugins/background-tasks && bun test` re-run: 71 pass, 0 fail. Implementation
notes + verification record present and green.
