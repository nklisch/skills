---
id: epic-three-channel-distribution-delegation-policy-core
kind: story
stage: review
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

- [x] `plugins/agile-workflow/skills/principles/SKILL.md` includes Pi-native
  subagents in Agent Dispatch Economy and Cross-Model Advisory Review policy.
- [x] `plugins/agile-workflow/skills/autopilot/SKILL.md` describes Pi-native
  subagents in delegation and final review routing.
- [x] `plugins/agile-workflow/skills/review/references/deep-review.md` includes
  Pi-native reviewer selection before same-class fallback.
- [x] The policy preserves current Claude Code and Codex behavior.

## Implementation Notes

- Added Pi-native subagents to the central Agent Dispatch Economy as a
  same-harness delegation adapter for worker, scout, reviewer, and oracle flows.
- Kept peeragent as the cross-model/cross-harness adapter and made Pi subagents
  an explicit fresh-context fallback, so Claude Code and Codex behavior remains
  unchanged when Pi is not the host.
- Updated autopilot and deep-review routing so feature/epic review and final
  completion checks use different-model peer review first, then Pi-native
  reviewer/oracle subagents when available, then local same-class fallback.

## Verification

- `rg -n "Pi|pi-subagents|reviewer/oracle" plugins/agile-workflow/skills/principles/SKILL.md plugins/agile-workflow/skills/autopilot/SKILL.md plugins/agile-workflow/skills/review/references/deep-review.md`
- `git diff --check -- plugins/agile-workflow/skills/principles/SKILL.md plugins/agile-workflow/skills/autopilot/SKILL.md plugins/agile-workflow/skills/review/references/deep-review.md .work/active/stories/epic-three-channel-distribution-delegation-policy-core.md`
