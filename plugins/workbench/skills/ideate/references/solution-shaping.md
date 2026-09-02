# Solution-Shaping Lens

Use this lens when ideation begins proposing implementation or architecture
shapes. Its purpose is to make the cost of a solution visible before scope or
design hardens.

## Ground proposals in the repository

When a repository is available, inspect the relevant conventions, including its
`## Overbuilding calibration` when adopted, principles, foundations, existing
architecture, and reusable mechanisms first. Apply the calibration as a
project-specific proportionality lens; if it is absent, use current repository
evidence without inventing durable guidance. Explain how
each proposal fits, replaces, or intentionally departs from them. Do not propose
generic infrastructure that duplicates a capability the project already owns.

Account for the whole durable footprint, not only the headline code: new domain
concepts, services, schemas, persisted state, registries, generated or copied
files, hooks, configuration, tests, fixtures, validation scripts, operational
surfaces, and ongoing synchronization. Treat bookkeeping and verification
machinery as real product cost.

## Offer a useful spectrum

Normally make these shapes visible when they are materially different:

- **Minimum coherent** — the simplest version that delivers the core outcome
  without becoming a disposable hack or planting obvious maintenance debt.
- **Repository fit** — the approach best aligned with current project
  boundaries and conventions; this is usually the working recommendation.
- **Expanded or ideal** — a broader architecture when its additional capability
  or simplification may earn the extra cost.

This is not a mandatory three-option template. Combine indistinguishable
options, add a genuinely different alternative, or recommend only one when the
others would be theater. Simplicity means few durable concepts and low operating
cost, not merely the smallest diff.

For each serious option, name:

- what user or project outcome it provides;
- what it reuses and what new surfaces it creates;
- **necessary complexity** imposed by the outcome, constraints, or existing
  system;
- **avoidable complexity** that can be removed, deferred, generated from one
  authority, or replaced by a simpler boundary;
- trade-offs, failure or migration risk, reversibility, and likely future cost.

Reject options whose apparent completeness comes mostly from parallel file
copies, duplicate registries, broad hooks, speculative adapters, configuration
matrices, or tests and validators that protect invented machinery rather than
meaningful behavior.

## Audit assurance machinery

Read and apply the shared
[assurance-machinery lens](../../work/references/assurance-machinery.md) to every
serious option. Use it to compare the mechanism's product value with the
complexity and failure modes it introduces.

When an option crosses that lens's consequential boundary, use its machinery
forecast before recommending a handoff. Show the minimum coherent and proposed
chains to the user, then let their response shape the recommendation. Do not
turn routine type or interface choices into an alignment ceremony.

## Let architecture challenge scope without taking it over

A simpler system-wide boundary may sit outside the user's initial scope. Offer
it conversationally when it materially reduces total complexity or exposes a
better ownership model. Label the scope expansion and contrast it with the
best in-scope option, including migration cost and behavior changes. Never
silently absorb it into the selected handoff.

Treat solution shaping as a dialogue. Update the spectrum and recommendation as
the user reacts to cost, ambition, constraints, and desired future state rather
than presenting a one-shot menu and moving on.
