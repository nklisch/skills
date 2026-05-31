---
id: epic-agents-rules-autoload-skill-grounding
kind: feature
stage: drafting
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
