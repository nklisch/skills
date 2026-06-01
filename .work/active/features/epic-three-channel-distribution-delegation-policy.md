---
id: epic-three-channel-distribution-delegation-policy
kind: feature
stage: drafting
tags: [skill, plugin]
parent: epic-three-channel-distribution
depends_on: [epic-three-channel-distribution-package-metadata]
release_binding: null
gate_origin: null
created: 2026-06-01
updated: 2026-05-31
---

# Pi Delegation And Subagent Policy

## Brief

Update agile-workflow's orchestration guidance so Pi-native subagents are the
preferred delegation path when available, peeragent remains the cross-model or
cross-harness advisory lane, and single-agent execution remains the fallback.
The key behavior change is policy-level: Pi should support confident autopilot
drains with visible state and bounded stop rules, not a conservative default
that avoids full-drain work.

This feature touches skill and principle text, not the Pi extension runtime
itself. It should preserve existing Claude Code and Codex behavior while adding
clear Pi routing wherever the skills currently describe Claude/Codex subagent
paths.

## Epic context

- Parent epic: `epic-three-channel-distribution`
- Position in epic: policy feature that can be designed after package metadata
  defines Pi as a first-class channel. It can run in parallel with the extension
  feature.

## Foundation references

- `plugins/agile-workflow/skills/autopilot/SKILL.md` — queue driver and final
  review behavior
- `plugins/agile-workflow/skills/implement-orchestrator/SKILL.md` — worker
  delegation policy
- `plugins/agile-workflow/skills/review/SKILL.md` — fresh-context and
  cross-model review policy
- `docs/research/pi-package-format.md` — `pi-subagents` companion surface
