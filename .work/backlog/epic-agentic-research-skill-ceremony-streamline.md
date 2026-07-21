---
id: epic-agentic-research-skill-ceremony-streamline
kind: epic
stage: drafting
tags: [plugin]
parent: null
depends_on: []
release_binding: null
gate_origin: null
research_origin: null
created: 2026-07-20
updated: 2026-07-21
---

# Streamline agentic-research skills/ceremony — conventions + high-level guidelines over skill proliferation

## Brief

`agentic-research` currently carries a skill surface with substantial ceremony:
the `research-orchestrator` walk (decision-graph, checkpoints, fan-out,
registration, verification stack), the `convert` bootstrap/sync flow, the
`research-discipline`/`research-handoff`/`research-handoff` pairing, per-engagement
`research_dials:` blocks, ten-field registration, decomposition-rationale
artifacts, the `{N}<->bibliography` correspondence check, etc. This mirrors the
shape `agile-workflow` grew into — and `agile-workflow`'s maintainer has indicated
work on a **v2 that removes some skills and ceremony in favor of conventions and
high-level guidelines.**

This epic tracks the parallel streamlining for `agentic-research`: move toward a
conventions-and-guidelines posture (the discipline invariants + thin operational
skills) rather than the current ceremony-heavy skill surface. The anti-fabrication
discipline itself (source-bound citation, attestation, the verification stack,
tier directionality) is the substance and stays — what's in question is the
*operational ceremony* layered on top, and how much of it earns its complexity
vs. belonging in project conventions or high-level guidelines.

## What this is NOT

- **Not a discipline change.** The anti-fabrication floor (GR.*, the citation
  chain, provenance, the verification stack) is settled and untouched. This is
  about the *operational surface*, not the discipline.
- **Not the OKF representation work.** That's
  `epic-ard-okf-representation-convergence` (v0.7.0, same version, representation
  layer). This epic is independent — skills/ceremony, not substrate shape. The
  two land in separate versions and shouldn't be bundled.
- **Not a fork/rename/major-version.** Same posture as the representation epic:
  next minor on the existing `agentic-research` track, same name.

## Open (deliberately not pre-decided)

- **Which ceremony earns its keep.** The orchestrator's decision-graph ordering
  and the discipline-propagation mechanism (inline-into-dispatch) are
  load-bearing — they *are* the anti-fabrication fence's operationalization. But
  ten-field registration, decomposition-rationale artifacts, the full
  checkpoint cadence, per-dial confirmation gates — some of this may be
  ceremony that conventions could carry more cheaply.
- **The relationship to agile-workflow v2.** This epic can't be designed without
  seeing what agile-workflow v2 actually does — the two share a posture
  (conventions over ceremony), and if agile-workflow establishes a
  conventions-first pattern, `agentic-research` should align rather than invent
  its own. **Blocker: the agile-workflow v2 work is not yet visible in this
  repo** (no branch, no in-flight item, no backlog idea as of 2026-07-20). This
  epic is parked until that lands or the maintainer shares the direction.

## Next step

**Blocked on agile-workflow v2 visibility.** Do not design this epic's
decomposition until the agile-workflow v2 direction is visible — patterning
against an unseen rewrite risks diverging from the conventions-first shape
that v2 establishes. When agile-workflow v2 lands (or the maintainer shares the
direction), unblock this epic and run a grounded design pass: inventory the
current ceremony, classify each piece (load-bearing discipline operationalization
vs. conventions-portable), and decompose into child features for the trim.

If the maintainer confirms agile-workflow v2 is *not* proceeding, or that its
direction doesn't apply here, unblock independently and proceed without it.

## Research grounding

None — this is a project-direction decision, not a grounded research
engagement. The `research-orchestrator` is *not* the right vehicle (it researches
external subjects; this is internal skill-surface design). When unblocked, this
routes through `feature-design` / `refactor-design` depending on each child's
shape (trimming ceremony is often `[refactor]`; redefining a skill's contract is
a feature).
