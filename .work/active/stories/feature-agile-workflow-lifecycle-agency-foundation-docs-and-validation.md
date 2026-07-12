---
id: feature-agile-workflow-lifecycle-agency-foundation-docs-and-validation
kind: story
stage: implementing
tags: [documentation, skill, plugin]
parent: feature-agile-workflow-lifecycle-agency
depends_on:
  - feature-agile-workflow-lifecycle-agency-lifecycle-inline-lane
  - feature-agile-workflow-lifecycle-agency-orchestrator-rewrite
  - feature-agile-workflow-lifecycle-agency-review-lane-rollup
  - feature-agile-workflow-lifecycle-agency-question-advisory-policy
  - feature-agile-workflow-lifecycle-agency-review-weight-configuration
release_binding: null
gate_origin: null
created: 2026-07-12
updated: 2026-07-12
---

# Roll foundation docs forward + consolidated validation

## Scope

Unit 5 of `feature-agile-workflow-lifecycle-agency`. The terminal unit. After
the four skill-touching units land, roll the agile-workflow foundation docs
forward to describe the revised lifecycle and orchestration policy, then run
the consolidated validation across every touched skill and the relevant repo
tests.

This story implements the foundation-docs and validation acceptance criteria in
the parent feature body. It depends on Units 1–4 because the docs describe the
landed behavior and validation runs across the landed changes.

## Files

- `plugins/agile-workflow/docs/VISION.md`
- `plugins/agile-workflow/docs/SPEC.md`
- `plugins/agile-workflow/docs/ARCHITECTURE.md`

(Consolidated validation reads every touched SKILL.md and runs repo tests; it
does not edit them.)

## Changes

### Foundation docs (rolling-foundation discipline)

Replace stale assertions in place; no "previously" / "in v1.x" prose. Update:

- **Stage advancement tables and prose** (SPEC §Stage flow per kind;
  ARCHITECTURE §Item lifecycle / §Stage advancement): feature and story `done`
  is no longer framed as "user-facing review approves" — it is "the review lane
  approves." `stage: review` remains a real state but is no longer a mandatory
  user handoff; production skills continue through it to `done` by default,
  honoring an explicit `stop-at-review` override.
- **Skill catalog role rows** (ARCHITECTURE §Skill catalog): update the rows
  for `implement`, `fix`, `implement-orchestrator`, and `review` so the
  described role reflects completion-through-review and risk-based lane
  selection. Update the `implement` vs `implement-orchestrator` routing note so
  it describes the choice in cohesion/ownership/sequencing/uncertainty terms,
  not LoC/file counts.
- **Orchestration policy** (ARCHITECTURE §Autopilot algorithm and any
  orchestration prose): describe the orchestrator in outcomes/invariants terms
  — dependency-graph scheduling, write-set independence, per-wave verification,
  one commit per item, conservative parent roll-up, worker self-containment —
  and note that bundle sizing, wave widths, and prompt templates are not
  prescribed. Worker capability is chosen from risk/scope unless overridden.
- **Advisory / question policy** (where ARCHITECTURE/SPEC reference design-time
  questions or advisory review): align with the reversibility-based question
  policy and risk-driven advisory review across modes. Document effective
  `review_weight` resolution (explicit invocation → project convention →
  `standard`) and the five high-level levels without turning them into a rigid
  orchestration recipe.
- **VISION success criteria**: refresh any lifecycle/orchestration language so
  it describes the simpler, more decisive lifecycle without losing the
  governance invariants the brief keeps (Item-IS-the-Work, dependency/cycle
  integrity, test integrity, fresh-context deep review, strategic checkpoints,
  durable findings, rolling foundation, late binding, terminal retention,
  conservative roll-up).

### Consolidated validation

- Run the skill validator on every touched SKILL.md:
  `python3 /home/nathan/.codex/skills/.system/skill-creator/scripts/quick_validate.py <skill-dir>`
  (per `repo-skill-style`).
- Run `plugins/agile-workflow/scripts/tests/channel-parity.test.sh`.
- Run the relevant repo tests: `bump-version.test.sh`, `agent-metadata.test.sh`,
  `pi-package-metadata.test.sh`.
- Fix any regression in scope; file any out-of-scope finding as a follow-up
  item rather than expanding this story.

## Acceptance criteria

- [ ] SPEC stage-flow tables/prose describe `done` as "review lane approves,"
  not "user-facing review approves"; `review` is a real state but not a
  mandatory handoff; `stop-at-review` override documented.
- [ ] ARCHITECTURE skill-catalog rows for `implement`, `fix`,
  `implement-orchestrator`, and `review` reflect the revised behavior.
- [ ] ARCHITECTURE orchestration/autopilot prose describes outcomes/invariants
  (no prescribed sizes, wave widths, or prompt templates; worker capability
  from risk/scope).
- [ ] ARCHITECTURE/SPEC question and advisory-review references align with the
  reversibility-based question policy and risk-driven advisory review across
  modes, including review-weight resolution and level semantics.
- [ ] VISION lifecycle/orchestration language refreshed; governance invariants
  preserved.
- [ ] No "previously" / legacy prose in the touched docs (rolling-foundation).
- [ ] Skill validator passes on every touched SKILL.md.
- [ ] `channel-parity.test.sh` passes.
- [ ] Relevant repo tests (`bump-version`, `agent-metadata`, `pi-package-metadata`)
  pass.

## Notes

- Do not start until Units 1–4 are at least at `review` (their behavior is what
  the docs describe). If a prior unit bounced, document the gap in the docs
  rather than describing unbuilt behavior as shipped.
- `gate-docs` is the long-term backstop for drift; this story aims to leave it
  nothing to find.
