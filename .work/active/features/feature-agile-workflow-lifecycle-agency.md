---
id: feature-agile-workflow-lifecycle-agency
kind: feature
stage: drafting
tags: [skill, plugin]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-11
updated: 2026-07-12
---

# Simplify agile-workflow lifecycle and increase agent agency

## Brief

Simplify agile-workflow's operational skills so they state durable invariants, completion boundaries, and failure conditions while giving current models more freedom to size and orchestrate the work in front of them. Remove pseudo-precise line, file, bundle, and wave prescriptions; bundle examples and detailed worker prompt recipes are intentionally out of scope because modern models can derive execution topology from dependencies, ownership, repository shape, and risk.

Make lifecycle completion independent of execution mode. A direct implementation or bug-fix invocation should proactively continue through the appropriate review lane and finish at `done`, or return with a documented review bounce/blocker. `stage: review` remains a real state and review remains a separate fresh-context responsibility where warranted, but it is no longer a mandatory user-driven handoff. An explicit caller request such as "stop at review" preserves the old boundary when desired.

Keep the qualities that define the plugin: Item-IS-the-Work, dependency and cycle integrity, test integrity, fresh-context deep review, strategic checkpoints for irreversible choices, durable review findings, rolling foundation docs, late release binding, terminal retention, and conservative parent roll-up. The desired result is less ceremonial and more decisive, not weaker governance.

## Agreed direction

- Operational verbs finish their semantic promise: implementation and fix flows continue through review by default.
- Review depth follows risk and evidence, with item kind as a starting heuristic rather than a rigid rule.
- Inline versus delegated execution is chosen from cohesion, ownership, sequencing, and uncertainty rather than LoC/file counts.
- The orchestrator chooses its execution topology and host-native mechanism; remove bundle recipes, examples, fixed wave widths, and prescribed prompt templates.
- Worker/model capability is selected by the agent from risk and scope unless the caller or project explicitly overrides it; do not ask routinely.
- Normal design resolves routine/reversible decisions with judgment and logs rationale; reserve user questions for product direction, external contracts, and expensive irreversible choices. `--only-questions` remains the explicit alignment mode.
- Advisory review follows risk rather than being useful only under autopilot.
- The common prose lane and specific bug-fix lane should complete end to end instead of requiring ceremonial follow-up invocations.
- Consolidate repeated policy into canonical auto-loaded homes and shrink oversized skill bodies through progressive disclosure, without hiding load-bearing invariants in optional references.

## Acceptance criteria

- [ ] Direct `implement`, `implement-orchestrator`, and `fix` flows continue through review by default, with an explicit stop-at-review override.
- [ ] Review rolls completed children up through eligible parent review stages without requiring autopilot.
- [ ] Review lane selection accounts for risk/evidence rather than item kind alone and preserves fresh-context deep review.
- [ ] Hard LoC/file-count routing and fix cutoffs are removed or clearly demoted to non-binding hints.
- [ ] `implement-orchestrator` is rewritten around outcomes and invariants; detailed bundle examples, bundle sizing recipes, default wave width, worker prompt templates, and routine model-tier questions are removed.
- [ ] Design-family question policy is based on reversibility and user-facing consequence, while `--only-questions` remains interactive-only.
- [ ] Cross-model/fresh-context advisory review is risk-driven across direct and autopilot design modes.
- [ ] Common prose work and verified bug fixes can complete through review in one invocation.
- [ ] Repeated dispatch, caller-awareness, routing, and test-integrity prose is consolidated without weakening worker self-containment.
- [ ] Touched SKILL.md files follow repo-skill-style limits through progressive disclosure where practical, and no updated SKILL.md exceeds 500 lines.
- [ ] Foundation docs accurately describe the revised lifecycle and orchestration policy.
- [ ] Skill validation, agile-workflow channel parity checks, and relevant repository tests pass.
