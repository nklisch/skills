# Deep Review

Load this reference for feature reviews, epic reviews, explicit `--deep`
requests, or any request that asks for a more robust review across design,
contracts, release, and operational dimensions.

## Reviewer Selection

Prefer a fresh-context reviewer for deep mode:

1. Use a different model class through peeragent when available and appropriate.
   Do not use peeragent when it would be the same model class as the host.
2. When hosted in Pi and a native Pi subagent adapter is available, use a
   reviewer or oracle subagent as the same-harness fresh-context fallback.
   Record that it was not cross-model.
3. Otherwise, use a fresh local sub-agent at the highest available model class
   when the environment provides one.
4. If no fresh-context mechanism is available, continue inline as a degraded
   deep review and record that limitation in `Notes`.

Peer or sub-agent failures are non-blocking. Fall back to the next option rather
than halting the review.

If peeragent launches Claude Opus, especially for a large feature, epic, or
out-of-band review, expect 10 to 30 minutes before it returns. A quiet process
that has not returned after a few minutes is still normal Opus review latency,
not a hang.

## Reviewer Packet

Give the fresh reviewer enough context to judge without bloating the task:

- Review target and mode: substrate item, PR, branch, range, or epic.
- Diff or aggregate scope from `target-resolution.md`.
- Item brief/design/implementation notes, or PR/commit description.
- Relevant project conventions from `AGENTS.md` / `CLAUDE.md`.
- Relevant foundation-doc assertions.
- Core lenses from `review-lenses.md`.
- Deep dimensions below.

The host classifies returned findings, files substrate items when applicable,
and performs stage transitions. The fresh reviewer only evaluates.

## Deep Dimensions

Apply these after the core lenses:

- **Contract and API behavior**: public interfaces, generated contracts, schemas,
  CLI/config surfaces, compatibility, and consumer expectations.
- **Data and migration behavior**: persistence shape, idempotency, backfills,
  rollback/forward safety, and data compatibility.
- **Concurrency and lifecycle**: async races, cancellation, retries, resource
  cleanup, cache invalidation, and stale reads.
- **Operational and release risk**: observability, failure modes, deploy
  ordering, feature flags, dependency changes, and rollback behavior.
- **Product or UX completeness**: when user-facing, does the end-to-end
  capability match the brief or PR description from a user's point of view?

## Depth Calibration

Deep does not mean exhaustive. Pull the dimensions that match the change:

- API/schema/CLI changes: emphasize contracts, breaking changes, docs, and tests.
- Persistence changes: emphasize data migration, idempotency, rollback, and
  observability.
- Async/cache/network changes: emphasize concurrency, lifecycle, retries, and
  failure modes.
- UI/workflow changes: emphasize capability completeness, accessibility-relevant
  behavior, state transitions, and regression coverage.
- Epic reviews: emphasize aggregate alignment and release readiness, not per-line
  diff analysis.
