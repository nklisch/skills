# Assurance Machinery

Treat machinery for correctness, accounting, verification, state management,
and determinism as a costed design choice, not an automatic mark of rigor. Ask
which concrete product failure or durable invariant it protects, why the
existing boundary cannot protect it, and whether its own failure modes are
cheaper than the original risk.

## Classify behavior, not syntax

Typed interfaces, immutable views, borrowed snapshots, enums, and domain value
types are ordinary structure by default. Treat them as machinery only when they
create independent mutable ownership, publication, lifecycle, synchronization,
retry, recovery, or cross-layer orchestration.

## Forecast consequential machinery

During ideation or design alignment, forecast a proposal before it binds when
it changes a consequential ownership, lifecycle, publication, or integration
boundary. Do not run this alignment step for routine local choices inside an
accepted authority chain.

Show the user the minimum coherent chain and the proposed chain in plain
language. Follow each chain far enough to expose applicable state owners,
synchronization points, publication steps, failure guarantees, retries,
recovery duties, persistence or adapter surfaces, and verification cost.
Explain what each added link buys, what it forecloses, and why the simpler chain
is insufficient. End with a recommendation and the consequential choices that
remain with the user. Keep the forecast conversational. Do not create an
artifact, fixed packet, or new gate for it.

Prefer existing authorities, derived state, narrow boundary checks, meaningful
behavior tests, and recovery at the layer that can act. Be skeptical of:

- parallel ledgers, receipts, status files, caches, or indexes that require
  reconciliation with the thing they describe;
- bespoke validators and test harnesses built mainly to police agent-generated
  bookkeeping rather than user-visible behavior or a real external contract;
- canonical ordering, hashing, reproducible generation, or state machines added
  where ordinary tolerance, recomputation, or explicit human judgment is safer;
- issue-specific rules promoted into universal constraints, migrations, and
  lifecycle states after one failure.

Determinism and formal accounting earn their cost when reproducibility,
financial or regulatory traceability, data integrity, concurrency, irreversible
effects, or a genuine external contract requires them. Otherwise prefer the
simpler adaptive path and state which failures it deliberately leaves visible.
Include synchronization burden, false positives, blocked valid states,
migration needs, and recovery behavior in the trade-off—not only the failures
the machinery hopes to prevent.

This lens never waives correctness, accepted guarantees, or credible behavioral
verification. It asks for the smallest durable mechanism that protects them.
