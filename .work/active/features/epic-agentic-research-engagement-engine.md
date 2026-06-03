---
id: epic-agentic-research-engagement-engine
kind: feature
stage: drafting
tags: [skill]
parent: epic-agentic-research
depends_on: [epic-agentic-research-scaffold]
release_binding: null
gate_origin: null
created: 2026-06-03
updated: 2026-06-03
---

# Research engagement engine (skills + agents)

## Brief
Port ARD's research engagement surface into the plugin — the two skills and three
Claude agents that actually run a disciplined research engagement. Skills:
`research-orchestrator` (user-invocable entry point — reads the `scope_authority`
and `verification_rigor` dials, confirms with the user, discovers fan-out
topology, walks the ARD decision-graph) and `research-discipline` (auto-loaded
anti-fabrication bundle injected into sub-agents so the discipline travels into
sub-contexts). Agents (Claude-native): `research-specialist` (fan-out worker),
`adversarial-reader` (skeptical fresh-context verification gate), and `evaluator`
(isolated-context gate). Carries the `dispatch.md` engagement-registration
template as a skill reference.

The skills are the portable shared surface (work in all three channels via the
open Agent Skills standard); the three agents are a Claude-only harness-specific
surface that degrades to absent — never broken — on Codex/Pi, per the epic's
cross-harness design decision. The two are one feature because they are a single
coupled capability: the orchestrator dispatches the agents and the discipline
bundle injects into them.

Does NOT cover: the `.research/` substrate definition or its lint floor
(substrate-tier), or the `research-view` query binary.

## Epic context
- Parent epic: `epic-agentic-research`
- Position in epic: consumer of `epic-agentic-research-scaffold`; the behavioral
  core of the plugin. Parallel with substrate-tier and foundation-docs.

## Foundation references
- `/tmp/ARD/example/skills/` — `research-orchestrator.md`, `research-discipline.md`
- `/tmp/ARD/example/agents/` — `research-specialist.md`, `adversarial-reader.md`, `evaluator.md`
- `/tmp/ARD/example/templates/dispatch.md` — engagement-registration template
- `AGENTS.md` — "Adding a skill"; harness-specific-surface degradation rules
- `plugins/nates-toolkit/skills/` — SKILL.md structure reference
