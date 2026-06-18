---
id: feature-agentic-research-refresh-entry
kind: feature
stage: drafting
tags: [skill]
parent: epic-agentic-research-reengagement
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-18
updated: 2026-06-18
---

# Prior-artifact-as-lens re-authoring entry for `research-orchestrator`

## Brief

The **lynchpin** of the re-engagement epic. Add an entry path to `research-orchestrator`
that takes a *prior research artifact* as input and re-authors it, rather than starting a
fresh engagement from a seed. The entry:

- accepts a prior artifact (a `.research/` analysis/precis/position) as input;
- registers the `refresh` change-mode + `supersedes-prior` temporal_contract (both already
  vendored — `research-discipline/SKILL.md:99`, `templates/dispatch.md`, `catalogs.json`);
- treats the prior artifact as a **LENS, not substrate** (ARD SPEC §4.6): the old artifact
  is a reading aid for re-engaging the *real* sources, never itself cited as a source —
  this is the anti-fabrication guard that stops a refresh from laundering the prior
  artifact's unsourced claims into the new one;
- re-authors over current sources, producing a superseding artifact with a clean chain.

Both front-half features depend on this: `convert-bootstrap` hands legacy
(`inferred-from-legacy`) artifacts to it; `native-refresh` hands ARD-native artifacts to it
when acquisitions land or substrate goes stale.

## Epic context

- Parent epic: `epic-agentic-research-reengagement`
- Position: dependency root (`depends_on: []`). The shared orchestration primitive both
  front-halves build on. This is the **anti-fabrication surface** of the epic — LENS-not-
  substrate (SPEC §4.6) is the whole point; design it first with adversarial care.

## Design seeds (for the design pass)

- **Two input states the primitive must handle without splitting** — a *legacy* artifact has
  no prior citation chain (establish from scratch); an *ARD-native* artifact has a clean
  chain to revalidate/extend. The entry's contract should cover both as one primitive.
- **The orchestrator is fresh-engagement-shaped today** — it discovers topology from a seed.
  This feature adds a *prior-artifact-in-hand* input mode; confirm where that grafts onto the
  existing dispatch/registration flow (ARD SPEC §9 registration; §10.1 decision-graph).
- **LENS-not-substrate enforcement** — design how the re-authoring pass is prevented from
  citing the prior artifact. This is the riskiest unit; pre-mortem it hard.
- **Verification depth** — a refresh re-runs the verification stack at the dialed rigor over
  the *new* substrate; the prior artifact's old verdicts don't carry forward unexamined.

## Open questions (resolve in design)

- Is the refresh entry a new mode of `research-orchestrator`, or a thin sibling skill that
  prepares the registration and calls the orchestrator? (Lean: a mode, to keep one
  engagement engine — but confirm against the orchestrator's size and the repo's skill-style
  300/500-line budget.)
- Does the prior artifact's existing attestation set get re-validated, extended, or rebuilt
  on refresh — and does that differ between the legacy and native input states?
