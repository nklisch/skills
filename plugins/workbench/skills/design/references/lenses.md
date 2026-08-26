# Design Lenses

Choose one primary lens and only the overlays that affect the decision. Every
design still states the outcome, constraints, boundaries, verification, risks,
and simplest coherent implementation shape. Apply the effective simplification
posture from Workbench conventions across every primary lens. Also apply the
shared [assurance-machinery lens](../../work/references/assurance-machinery.md)
whenever correctness, accounting, verification, state, or determinism machinery
is proposed; risk overlays do not make that machinery automatically necessary.

## New work

- Ground the design in existing architecture and demonstrated project patterns.
- Name two or three plausible approaches only when the choice is consequential.
- Choose explicitly and explain the trade-off.
- Design the riskiest or least-known unit first.
- Define contracts, ownership, state flow, failure behavior, and integration.
- Run a pre-mortem: identify the weakest assumption, likely production failure,
  and fallback.
- Eliminate unnecessary concepts, layers, options, compatibility paths, and
  tests before adding machinery.

## Prototype or feasibility

- Start with the decision, assumption, or feasibility question the prototype
  must resolve. A prototype without a learning question is unfinished design.
- Choose the smallest representative behavior that can produce credible
  evidence. Preserve realism at the uncertain boundary; simplify everything
  else.
- State what the prototype deliberately does not prove, especially production
  reliability, scale, security, accessibility, migration, and maintainability.
- Define the observation, user reaction, measurement, or integration result
  that will answer the question before implementation begins.
- Keep exploratory code isolated when practical. Reuse existing project
  machinery, and do not build a testing or simulation platform merely to
  validate the prototype.
- End with an explicit disposition: discard it, revise and test another
  assumption, or design the maintainable implementation. Adoption is a new
  decision, not an automatic reward for a successful demonstration.
- Plan to remove discarded prototype code. Treat revision or adoption as a
  deliberate next outcome with the design, hardening, and verification it needs.

## Refactor or cleanup

- Read confirmed coding rules, structural foundations, and relevant
  `.agents/skills/patterns/` references as project-specific evidence. They
  extend this lens but do not make every deviation worth changing.
- Shape the target decomposition with
  [../../work/references/structure.md](../../work/references/structure.md):
  apply its calibration protocol and diagnostic questions so the intended
  structure is judged against codebase norms and language idioms, and record
  the chosen decomposition and its payoff for the review pass.
- Apply the black-box test: a refactor preserves observable behavior. Route
  intended behavior change through the new-work lens with explicit
  requirements. The one exception is a provocation-driven bold refactor whose
  behavior deltas the human explicitly accepted during ideation — record those
  deltas here as explicit requirements (see ideate's
  [../../ideate/references/provocation.md](../../ideate/references/provocation.md)).
- Describe the actual current state and the costly or unsafe property.
- Eliminate, inline, merge, or delete before extracting new abstractions.
- State behavioral invariants, measured performance constraints, and other
  contracts that must remain unchanged. Avoid obvious plausible performance
  regressions without manufacturing speculative optimization work.
- Make steps independently understandable and verifiable when practical.
- Include rollback or migration handling where a step is not trivially
  reversible.
- Drop aesthetic or conformity churn whose payoff cannot be stated in clearer
  ownership, less duplication, easier navigation, lower coordination cost, or
  another concrete project benefit.

## Performance

- Do not design from intuition alone. Define a representative workload and
  include a baseline or the reason measurement is blocked in the recorded
  design.
- Profile the symptom with probes appropriate to CPU, memory, I/O,
  serialization, synchronization, cache behavior, or runtime overhead.
- Rank bottlenecks by measured impact and target the hot path.
- Prefer fixes in this order: eliminate work or improve the algorithm/data
  model; reduce I/O; improve locality; use better runtime idioms; add
  parallelism only when higher-level fixes do not apply.
- State expected metric movement and regression budget.
- Design repeatable benchmarks plus end-to-end evidence; a microbenchmark is
  evidence, not proof.
- Reuse existing benchmark and load-test machinery. Discuss a new performance
  laboratory or substantial harness before building it.

## Defect or reliability

- Reproduce the failure or define the missing observable before designing a fix.
- Trace the causal chain and correct the smallest coherent boundary, not merely
  the visible symptom.
- State affected states, timing, concurrency, retries, idempotency, and failure
  reporting where relevant.
- Preserve a regression check at the most stable useful interface.
- If reproduction is impossible, design observability or a bounded diagnostic
  step instead of a speculative correction.

## UI/UX

- Map the meaningful user journey, entry points, decisions, success, empty,
  loading, error, permission, and recovery states.
- Reuse established interaction and visual patterns unless evidence justifies a
  new one.
- Address accessibility, responsive behavior, keyboard behavior, content, and
  destructive-action recovery where relevant.
- Use existing `.mockups/` references or create a mockup only when visual
  alignment materially reduces ambiguity.
- Verify the journey, not only component snapshots.

## Data, migration, or integration

- Identify the source of truth, ownership boundary, schema or protocol, and
  consistency expectations.
- Verify actual external consumers before adding compatibility machinery.
- For owned disposable shapes, land the correct state directly. For external
  consumers or durable real data, define migration, rollback, version skew, and
  observability.
- Address retries, idempotency, partial failure, ordering, and reconciliation.
- Never execute a production or real-data migration without explicit user
  approval.

## Risk overlays

Apply only when evidence warrants them:

- **Security and privacy:** trust boundaries, authorization, input handling,
  secrets, sensitive data, abuse, and least privilege.
- **Accessibility:** assistive technology, focus, semantics, contrast, motion,
  and alternative interaction.
- **Operations:** rollout, monitoring, support, failure isolation, recovery,
  capacity, and incident diagnostics.
- **Compatibility:** verified external consumers, durable data, deployment
  skew, and contractual obligations.
- **Testing:** stable interfaces, meaningful behavior, demonstrated risks, and
  regression history. Every proposed test must earn its upkeep. Reuse existing
  machinery; add only small, cheap, contained evidence without discussion.
