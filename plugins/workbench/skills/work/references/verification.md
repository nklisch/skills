# Behavioral Verification

Verify the requested outcome at the most stable useful interface.

1. Check every accepted requirement and explicit exclusion.
2. Run required commands from `.work/CONVENTIONS.md`, CI, or project
   instructions.
3. Exercise meaningful user journeys or integration boundaries.
4. Inspect the final diff for accidental expansion, stale compatibility,
   sensitive data, and incomplete cleanup.
5. Review proportionately to consequence, uncertainty, and reversibility.
6. Reconcile affected foundation assertions.

Prefer tests that prove externally meaningful behavior at stable interfaces.
Avoid tautological mocks, implementation-detail assertions, and coverage-only
tests that cannot catch a real regression. When durable behavior changes, add
or update the smallest useful behavioral evidence.

Tests must earn their maintenance cost by protecting a meaningful behavior,
contract, boundary, risk, or reproduced regression. Do not test every line,
branch, implementation path, or trivial accessor. Concentrate evidence where a
failure would matter, and remove or reshape tests whose signal no longer
justifies their brittleness and upkeep.

Use the smallest credible evidence surface. Prefer existing tests, commands,
fixtures, environments, and observability. A small local test, fixture, probe,
or benchmark may be added when it is cheap, contained, and protects meaningful
behavior. Remove temporary probes after they answer the uncertainty unless
their ongoing signal earns maintenance.

Apply [assurance-machinery.md](assurance-machinery.md) when verification would
introduce durable state, ledgers, generated receipts, canonicalization, bespoke
validators, or a new harness. Challenging that machinery never permits skipping
required evidence: replace it with the smallest credible behavioral proof, or
state the unresolved verification limit.

Do not invent or materially expand a test framework, simulation platform,
benchmark system, mock service, synthetic environment, or validation
architecture merely to prove one change. Discuss that investment with the user
before building it. Autonomous execution does not authorize hidden
verification-infrastructure scope. If existing evidence is insufficient, use a
bounded alternative, propose the smallest useful addition, or tell the user
about the limitation in the current conversation; never pretend the work is
verified.

Apply security, privacy, accessibility, performance, compatibility, data
integrity, and operational-readiness lenses when the affected surface or
discovered risk warrants them. These are lenses, not fixed gates. For
behavior-preserving simplification, also preserve measured performance
constraints and check obvious plausible regressions such as worse algorithmic
complexity, repeated work, or needless I/O; do not require speculative low-level
optimization evidence.

For reported defects, reproduce before correction whenever possible. Preserve a
failing regression test or another repeatable before/after check, diagnose root
cause, correct the smallest coherent boundary, and prove the original behavior
now passes. Never weaken a test merely to obtain green output.

If a reported defect cannot be reproduced, do not make a speculative fix.
Investigate environment, state, timing, versions, and observability; otherwise
record what was attempted in the relevant active item and leave it active or
blocked. Fix incidental defects within scope only when they block or are caused
by the delivery and the correction is cohesive. Park unrelated defects with
reproduction evidence.

Do not declare completion while required verification fails or a consequential
blocker remains.
