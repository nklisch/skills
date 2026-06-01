---
id: epic-three-channel-distribution-delegation-policy-core
kind: story
stage: implementing
tags: [skill, plugin]
parent: epic-three-channel-distribution-delegation-policy
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-01
updated: 2026-05-31
---

# Add Pi Delegation Core Policy

## Scope

Update the central agile-workflow policy surfaces so Pi is part of the runtime
delegation model. The policy should say: prefer Pi-native subagents when
available for Pi-hosted worker/reviewer/scout flows, keep peeragent for
cross-model or cross-harness review, and fall back to single-agent/fresh-local
execution when neither delegation adapter is available.

## Acceptance criteria

- [ ] `plugins/agile-workflow/skills/principles/SKILL.md` includes Pi-native
  subagents in Agent Dispatch Economy and Cross-Model Advisory Review policy.
- [ ] `plugins/agile-workflow/skills/autopilot/SKILL.md` describes Pi-native
  subagents in delegation and final review routing.
- [ ] `plugins/agile-workflow/skills/review/references/deep-review.md` includes
  Pi-native reviewer selection before same-class fallback.
- [ ] The policy preserves current Claude Code and Codex behavior.
