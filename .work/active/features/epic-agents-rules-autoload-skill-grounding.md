---
id: epic-agents-rules-autoload-skill-grounding
kind: feature
stage: implementing
tags: [skill]
parent: epic-agents-rules-autoload
depends_on: [epic-agents-rules-autoload-hook]
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Design/implement/review skills read `.agents/rules/*.md` in grounding

## Brief

Close the graceful-degradation gap surfaced by the Codex review: many skills ground
themselves on `AGENTS.md`/`CLAUDE.md`, not `.agents/rules/*`. Once the dense rules
move out of AGENTS.md, those rules could vanish from skill grounding whenever the
hook does not fire (no substrate, untrusted Codex hook, non-coding session). Update
the agile-workflow design/implement/review family skills' grounding phases to read
`.agents/rules/*.md` (if present) alongside the foundation docs and AGENTS.md — a
one-line addition per skill, mirroring how they already read
`.agents/skills/patterns/`.

This is belt-and-suspenders with the mandatory read-directive that
`convert-extract` puts in the slim AGENTS.md block, ensuring load-bearing rules
(test integrity, tag semantics) always reach the agent.

Does NOT cover: the AGENTS.md slim or the hook itself; this only adjusts skill
grounding reads.

## Epic context
- Parent epic: `epic-agents-rules-autoload`
- Position in epic: independent skill-file edits; parallelizes with the producer
  features after the hook lands. Enumerate the affected family explicitly in design
  (feature-design, refactor-design, perf-design, epic-design, implement,
  implement-orchestrator, review — and gates where relevant).

## Foundation references
- `plugins/agile-workflow/skills/*/SKILL.md` — grounding phases of the
  design/implement/review family
- Parent epic body — graceful-degradation decision (Codex finding 2)

## Architectural choice

A one-line addition to each design/implement/review-family skill's grounding step:
read `.agents/rules/*.md` (if present) alongside the foundation docs / AGENTS,
mirroring the existing "read `.agents/skills/patterns/`" line several already have.
This is the belt to the suspenders of the mandatory read-directive convert-extract
put in the always-loaded slim AGENTS block — so load-bearing rules reach skills even
when the hook does not fire.

## Implementation Units

One Unit: add the grounding line to each skill's ground/re-align phase. Enumerate
the agile-workflow family (re-grep each for its grounding anchor — many already
read AGENTS/CLAUDE and/or `.agents/skills/patterns/`, which is the insertion point):
- `feature-design` (Phase 2 + Phase 4 re-align), `epic-design` (Phase 2),
  `refactor-design`, `perf-design`, `implement` (Phase 1 ground),
  `implement-orchestrator` (Phase 1 + Phase 4 re-align), `review` (Phase 2 gather
  context), `fix`, `e2e-test-design`.
- Wording: "Read `.agents/rules/*.md` (if present) — the project's force-loaded
  agent rules (tag semantics, test integrity, review policy)." Place it next to the
  existing AGENTS/patterns grounding line; do not duplicate if a skill already reads
  `.agents/rules/`.

## Testing
Skill docs — read-through: confirm each enumerated skill's grounding phase now
reads `.agents/rules/*.md`, and none was missed (grep the family for the line).

## Risks
- Missing a skill in the family — mitigated by grepping all
  `plugins/agile-workflow/skills/*/SKILL.md` grounding phases and listing coverage.

## Child stories
None — a one-line grounding addition across the family. Single-stride.
