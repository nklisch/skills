# Constraint Proportionality Lens

Use this lens when the question is whether software constraints earn their cost
for the actual product. It applies to desktop, server, library, CLI, and hosted
software. It is not a general instruction to make behavior permissive.

## What to examine

Select only constraints relevant to the confirmed scan boundary:

- input validation, authorization, and unsupported-feature refusals;
- identity, path, filesystem, and environment checks;
- recovery, rollback, locking, corruption, and interrupted-operation paths;
- memory, storage, workload, and history budgets;
- optional integration, presentation, and host-readiness gates;
- workflow states that reject, discard, or permanently block ordinary progress.

Do not inventory every condition merely because it returns an error. Start from
constraints that can materially affect intended users or recovery from failure.

## Evidence bar

For each candidate, establish all of the following before calling it a defect:

1. **Protected failure** — the integrity, security, correctness, or operational
   failure the constraint claims to prevent, with the authoritative expectation.
2. **Actual protection** — the concrete control flow and whether it prevents
   that failure in this product's deployment model. A partial or inconsistent
   check may be a defect even when the rule sounds conservative.
3. **User cost** — the intended workflow blocked, data or work lost, recovery
   burden, or availability consequence.
4. **Proportionate response** — why a hard stop remains warranted, or the
   smallest credible alternative: degraded operation, scoped exclusion,
   inspect/quarantine, explicit abandon, save/checkpoint-and-continue, user
   choice, or a documented override.

An assertion that a guard is inconvenient is not enough. Likewise, a plausible
attack without a concrete project exposure is not enough. Ask whether the
control matches the product's trust boundary: a network service receiving
untrusted requests may need a strict refusal that a user-owned desktop project
should handle with a recoverable path.

## Recovery and resource checks

Give extra attention to constraints that run during error handling. Verify that
reported success matches durable state, cleanup cannot strand the canonical
recovery authority, and users have a comprehensible path to inspect, reconcile,
or intentionally abandon irrecoverable state.

For resource limits, distinguish hard representational or arithmetic limits
from policy budgets. A policy budget should preserve last-good state and, where
credible, reclaim disposable work, checkpoint, compact, offer a continuation
path, or explain the next safe action before it rejects ordinary work. Do not
recommend consuming all system resources by default; account for the product's
other processes and operating environment.

## Report honestly

- Report an earned strict protection as a verified strength.
- Report a reproduced false-success, permanent wall, destructive cleanup, or
  guard that fails to protect its stated failure as a confirmed defect.
- Report a plausible product improvement with unclear requirements or trade-offs
  as an improvement hypothesis, including validation and a credible no-change
  case.
- Preserve strict refusal when the named threat and product context justify it;
  the lens assesses proportionality, not permissiveness.

Use scan's ordinary opportunity shape. Include the protected failure, actual
behavior, user cost, and recommended disposition so the outcome owner can make
the product decision.
