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

Raise a forecast proactively during ideation or design alignment, before a
proposal is settled, when it adds or materially changes a component that owns
changing state, publishes results others read, records history, recovers from
failure, or keeps unfinished work alive across calls, or when it changes an
ownership, lifecycle, publication, or integration boundary that crosses layers,
hosts, or providers. Do not run it for routine local choices inside an accepted
authority chain: immutable values, checked views, focused types, and local
modules can clarify one existing owner without creating another lifecycle.

Start from the interaction: one user action and the concrete failure the design
must prevent. Then answer what new state or lifecycle the proposal introduces,
why the existing owner cannot handle it, and what changes for the user,
including failure behavior and cost.

Show the user the minimum coherent chain and the proposed chain in plain
language. Follow each chain far enough to expose applicable state owners,
synchronization points, publication steps, failure guarantees, retries,
recovery duties, persistence or adapter surfaces, and verification cost.
Explain what each added link buys, what it forecloses, and why the simpler chain
is insufficient. Keep maintenance effort separate from CPU, GPU, memory, and
latency costs. For expensive computation or host batches, a single synchronous
bulk call may avoid any unfinished-work lifecycle. A short paragraph often
suffices; use a diagram or table only when it makes a complicated decision
clearer, and do not manufacture alternatives for an obvious choice.

End with a recommendation, and ask the user when the choice changes product
behavior, workflow, external contracts, recovery guarantees, or a durable state
system. Reuse settled answers and reopen one only when new evidence materially
changes the accepted boundary. Preserve current guarantees: do not infer a new
survival or recovery promise from volatile state, and do not remove an existing
promise because a simpler design omits it. Keep the forecast conversational. Do
not create an artifact, fixed packet, or new gate for it; during design, record
accepted decisions in the owning item.

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
