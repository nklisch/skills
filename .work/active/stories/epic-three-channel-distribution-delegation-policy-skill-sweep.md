---
id: epic-three-channel-distribution-delegation-policy-skill-sweep
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

# Sweep Design Gate And Scout Runtime Routing

## Scope

Sweep agile-workflow skill files that currently enumerate only Claude Code and
Codex subagent paths, and add Pi-native subagent routing where the skill has a
read-only explorer, scout, reviewer, or gate-audit delegation path. Keep changes
mechanical and policy-consistent; do not redesign the skills.

## Acceptance criteria

- [ ] `rg "Claude Code / Anthropic|Codex / OpenAI" plugins/agile-workflow/skills`
  no longer finds runtime path blocks that omit Pi when Pi has an equivalent
  native subagent shape.
- [ ] Design skills (`epic-design`, `feature-design`, `perf-design`,
  `refactor-design`, `e2e-test-design`, `research`) mention Pi-native explorer
  or analysis subagents where they list Claude/Codex paths.
- [ ] Gate/scout skills (`gate-*`, `bug-scan`, `perf-scout`) mention Pi-native
  reviewer/scout/audit subagents where they list Claude/Codex paths.
- [ ] Cross-model review wording continues to route to peeragent, not Pi
  same-model subagents.
