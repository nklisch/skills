---
id: epic-three-channel-distribution-delegation-policy-implementation-routing
kind: story
stage: done
tags: [skill, plugin]
parent: epic-three-channel-distribution-delegation-policy
depends_on: [epic-three-channel-distribution-delegation-policy-core]
release_binding: null
gate_origin: null
created: 2026-06-01
updated: 2026-06-01
---

# Add Pi Worker Routing To Implementation Skills

## Scope

Update implementation-facing skills so Pi-hosted runs know how to route worker
and explorer tasks through Pi-native subagents when available. The change should
not alter Claude Code or Codex routing, and it should not require Pi subagents
when they are absent.

## Acceptance criteria

- [x] `plugins/agile-workflow/skills/implement-orchestrator/SKILL.md` includes
  a Pi runtime path for worker/explorer subagents and keeps peeragent out of
  implementation-worker fanout.
- [x] `plugins/agile-workflow/skills/implement/SKILL.md` includes a Pi
  read-only explorer path where it currently lists Claude/Codex explorer paths.
- [x] Wording makes fallback explicit: when Pi subagents are unavailable, use the
  host-local single-agent or fresh-context fallback already described by the
  skill.

## Implementation Notes

- Added a Pi runtime path to `implement-orchestrator` for Pi `worker`,
  `scout`/`context-builder`, and `reviewer` subagents.
- Kept peeragent out of routine implementation-worker fanout; peeragent remains
  reserved by the central policy for cross-model or cross-harness review.
- Added a Pi read-only mapping path to `implement` that only activates after the
  local scope probe leaves a named unknown.
- Fallback remains host-local bounded work or the existing fresh-context
  fallback when Pi subagents are unavailable.

## Verification

- `rg -n "Pi path|Pi \`worker\`|scout|context-builder|peeragent" plugins/agile-workflow/skills/implement-orchestrator/SKILL.md plugins/agile-workflow/skills/implement/SKILL.md`
- `git diff --check -- plugins/agile-workflow/skills/implement-orchestrator/SKILL.md plugins/agile-workflow/skills/implement/SKILL.md .work/active/stories/epic-three-channel-distribution-delegation-policy-implementation-routing.md`

## Review

- Verdict: Approve - story verified by implement; fast-lane advance.
- Notes: The implementation adds a Pi runtime path without changing Claude Code
  or Codex routing, and explicitly keeps peeragent out of routine implementation
  worker fanout.
