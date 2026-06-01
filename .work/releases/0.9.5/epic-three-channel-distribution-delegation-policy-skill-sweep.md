---
id: epic-three-channel-distribution-delegation-policy-skill-sweep
kind: story
stage: done
tags: [skill, plugin]
parent: epic-three-channel-distribution-delegation-policy
depends_on: [epic-three-channel-distribution-delegation-policy-core]
release_binding: 0.9.5
gate_origin: null
created: 2026-06-01
updated: 2026-06-01
---

# Sweep Design Gate And Scout Runtime Routing

## Scope

Sweep agile-workflow skill files that currently enumerate only Claude Code and
Codex subagent paths, and add Pi-native subagent routing where the skill has a
read-only explorer, scout, reviewer, or gate-audit delegation path. Keep changes
mechanical and policy-consistent; do not redesign the skills.

## Acceptance criteria

- [x] `rg "Claude Code / Anthropic|Codex / OpenAI" plugins/agile-workflow/skills`
  no longer finds runtime path blocks that omit Pi when Pi has an equivalent
  native subagent shape.
- [x] Design skills (`epic-design`, `feature-design`, `perf-design`,
  `refactor-design`, `e2e-test-design`, `research`) mention Pi-native explorer
  or analysis subagents where they list Claude/Codex paths.
- [x] Gate/scout skills (`gate-*`, `bug-scan`, `perf-scout`) mention Pi-native
  reviewer/scout/audit subagents where they list Claude/Codex paths.
- [x] Cross-model review wording continues to route to peeragent, not Pi
  same-model subagents.

## Implementation Notes

- Added Pi `scout`/`context-builder` guidance to discovery and design routing
  blocks in `epic-design`, `feature-design`, `perf-design`, `refactor-design`,
  `e2e-test-design`, `research`, `scope`, and
  `refactor-conventions-creator`.
- Added Pi `reviewer`/`oracle` guidance to gate and scout audit routing in
  `gate-security`, `gate-tests`, `gate-cruft`, `gate-docs`, `gate-patterns`,
  `bug-scan`, `perf-scout`, and the e2e audit path.
- Left cross-model peer review semantics on peeragent. The only Pi mention in
  peer-adjacent wording is a same-harness fallback review path when peeragent is
  unavailable, fails, or would be same-class.
- Intentionally did not change peer-review-only references such as
  `perf-scout/references/peer-review-pass.md`; those describe cross-model
  peeragent mechanics rather than runtime worker/scout paths.

## Verification

- `rg -n "Claude Code / Anthropic|Codex / OpenAI|Pi path|Pi-native|pi-subagents|scout|context-builder|reviewer|oracle" plugins/agile-workflow/skills -g 'SKILL.md' -g '*.md'`
- `git diff --check -- plugins/agile-workflow/skills/epic-design/SKILL.md plugins/agile-workflow/skills/feature-design/SKILL.md plugins/agile-workflow/skills/perf-design/SKILL.md plugins/agile-workflow/skills/refactor-design/SKILL.md plugins/agile-workflow/skills/e2e-test-design/SKILL.md plugins/agile-workflow/skills/research/SKILL.md plugins/agile-workflow/skills/bug-scan/SKILL.md plugins/agile-workflow/skills/perf-scout/SKILL.md plugins/agile-workflow/skills/gate-security/SKILL.md plugins/agile-workflow/skills/gate-tests/SKILL.md plugins/agile-workflow/skills/gate-cruft/SKILL.md plugins/agile-workflow/skills/gate-docs/SKILL.md plugins/agile-workflow/skills/gate-patterns/SKILL.md plugins/agile-workflow/skills/scope/SKILL.md plugins/agile-workflow/skills/refactor-conventions-creator/SKILL.md .work/active/stories/epic-three-channel-distribution-delegation-policy-skill-sweep.md`

## Review

- Verdict: Approve - story verified by implement; fast-lane advance.
- Notes: The sweep is mechanical, adds Pi same-harness delegation only where
  equivalent worker/scout/reviewer paths exist, and preserves peeragent as the
  cross-model review route.
