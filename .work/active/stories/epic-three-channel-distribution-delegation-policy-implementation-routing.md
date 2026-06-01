---
id: epic-three-channel-distribution-delegation-policy-implementation-routing
kind: story
stage: implementing
tags: [skill, plugin]
parent: epic-three-channel-distribution-delegation-policy
depends_on: [epic-three-channel-distribution-delegation-policy-core]
release_binding: null
gate_origin: null
created: 2026-06-01
updated: 2026-05-31
---

# Add Pi Worker Routing To Implementation Skills

## Scope

Update implementation-facing skills so Pi-hosted runs know how to route worker
and explorer tasks through Pi-native subagents when available. The change should
not alter Claude Code or Codex routing, and it should not require Pi subagents
when they are absent.

## Acceptance criteria

- [ ] `plugins/agile-workflow/skills/implement-orchestrator/SKILL.md` includes
  a Pi runtime path for worker/explorer subagents and keeps peeragent out of
  implementation-worker fanout.
- [ ] `plugins/agile-workflow/skills/implement/SKILL.md` includes a Pi
  read-only explorer path where it currently lists Claude/Codex explorer paths.
- [ ] Wording makes fallback explicit: when Pi subagents are unavailable, use the
  host-local single-agent or fresh-context fallback already described by the
  skill.
