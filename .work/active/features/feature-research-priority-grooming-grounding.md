---
id: feature-research-priority-grooming-grounding
kind: feature
stage: done
tags: [research]
parent: null
depends_on: []
release_binding: null
gate_origin: null
research_origin: null
research_refs: [priority-value-signal-for-items, backlog-grooming-skill]
research_dials:
  scope_authority: in-engagement-judgment
  verification_rigor: standard
  intent: grounding-input
  output_kind: brief+position
created: 2026-06-15
updated: 2026-06-15
research_completion_record: priority-and-grooming-shapes-for-agentic-substrates
---

# Ground priority signaling + backlog grooming for an agent-driven work substrate

## Brief

Two parked plugin enhancements want to borrow agile affordances — an optional
**priority / value signal** on items (`priority-value-signal-for-items`) and a
**backlog grooming / hygiene** capability (`backlog-grooming-skill`). Before either
is scoped and designed, ground them: the affordances we'd be reaching for were
designed for human teams with sprint ceremonies and a product owner, and we'd be
porting them into an **agent-driven, late-binding, autopilot-FIFO** substrate where
the worker is an agent draining a queue. The translation is not obvious and the
output ships in a supported plugin — so substrate-before-stance applies: engage the
material before committing a frontmatter field or a skill shape that would calcify.

This is a grounding **input** to a later design call, not a shippable deliverable.
It does not bind to a release; its verification gates run inline in the
orchestrator's stack.

## Research questions (the four facets)

1. **Priority-signaling mechanisms.** How do mature agile/lean systems actually
   encode importance — WSJF, MoSCoW, value/effort pairs, cost-of-delay, RICE,
   ordinal P1/P2/P3? For each: is it a *machine-readable signal a queue can consume*
   or a *human-ceremony artifact*? Which survive translation to an optional, inert-
   when-absent frontmatter field consumed by an autopilot ordering pass?

2. **Backlog grooming / refinement discipline.** What is the established practice
   (refinement cadence, the "DEEP" criteria — Detailed-appropriately / Estimated /
   Emergent / Prioritized; WIP-aging and staleness signals)? What prior art exists
   for detecting dead / superseded / duplicate / mergeable items, and for routing
   findings as proposals rather than auto-pruning?

3. **The agentic translation (load-bearing, freshest).** How do agent-driven /
   autopilot / multi-agent coding systems handle prioritization and backlog hygiene?
   Does "priority" mean the same thing when the consumer is an agent draining a queue
   by readiness + FIFO rather than a human picking in standup? What does grooming look
   like when an agent can cross-reference every item against current code cheaply?

4. **The anti-pattern check.** Where do priority pointing and backlog grooming *fail*
   in practice — estimation theater, priority inflation, grooming-as-busywork, sandbag
   estimates, the planning-poker social dynamics? We want to copy the lesson, not the
   ceremony; name the failure modes so the design avoids them.

## Output

- A landscape brief in `.research/analysis/briefs/` (the 4-facet synthesis).
- A settled position in `.research/analysis/positions/` naming the recommended
  priority-signal shape and grooming-capability shape **for this kind of substrate**.

## Boundary constraint (load-bearing — do not violate)

This is a self-contained project. **The research artifacts must be project-agnostic
and must not reference, name, or allude to any external project, parent monorepo, or
sibling substrate** — not as a link and not as a prose mention (project-boundaries
discipline). The motivating consumer evidence that prompted the two parked items
stays in the conversation and in the consuming project's own substrate; these
artifacts cite only external sources and the general pattern. This is also the right
shape on its own terms: the brief/position are publishable plugin grounding,
independent of any one deployment.

## Routing

`[research]` → `agentic-research:research-orchestrator`. Standard verification rigor
(grounding-input sizing). On completion, the two parked items
(`priority-value-signal-for-items`, `backlog-grooming-skill`) are re-scoped against
the grounded findings via the normal flow; each will carry `research_origin` pointing
back at this engagement's position slug.

## Engagement record (2026-06-15)

- **Dials (settled at kickoff):** scope_authority `in-engagement-judgment`,
  verification_rigor `standard`, intent `grounding-input`, output_kind `brief+position`.
  (`scope_authority` was corrected from an invalid `broad` value at kickoff.)
- **Fan-out:** multi-path, 3 research-specialists (priority-signaling · backlog-grooming ·
  agentic-translation), anti-pattern facet distributed into each. 33 source attestations
  authored across the three.
- **Verification stack:** lint (floor — no high-severity on any brief; all "broken" =
  in-sandbox URL-liveness, chains resolve) → adversarial-read (`opus`, returned
  NEEDS-REVISION on one MEDIUM: a "scores decay" claim laundered as source-attested when the
  attestation is silent on stability — reframed as synthesis inference; 3 minor findings
  fixed) → spot-check (lead; confirmed corrections). Project-boundary scan clean across all
  five artifacts.
- **Output:**
  - Parent synthesis: `.research/analysis/briefs/workflow-priority-grooming-for-agentic-substrates-landscape.md`
  - Within-specialist briefs: `priority-signaling-mechanisms-landscape.md`,
    `backlog-grooming-discipline-landscape.md`, `agentic-prioritization-hygiene-landscape.md`
  - Verification checklist: `workflow-priority-grooming-verification-checklist.md`
  - **Settled position:** `.research/analysis/positions/priority-and-grooming-shapes-for-agentic-substrates.md`
- **Headline findings:** structural priority (dependencies/position) beats hand-assigned value
  scores for a machine-drained queue; a value field is worth adding only optionally + conditionally
  (and a categorical flag is the rejected ordering shape); grooming is warranted as a
  propose-not-prune capability mechanizing only date/metadata signals, with a last-touched field
  as its precondition. Coverage gap (named, not resolved): value-selection at decomposition time;
  agentic literature is thin/inferential.
