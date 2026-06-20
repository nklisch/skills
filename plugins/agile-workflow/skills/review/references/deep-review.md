# Deep Review

Load this reference for feature reviews, epic reviews, explicit `--deep`
requests, or any request that asks for a more robust review across design,
contracts, release, and operational dimensions.

## Reviewer Selection

Prefer a fresh-context reviewer for deep mode. Run the review in a fixed
**two-phase order** — completeness/advisory first, adversarial second — and for a
feature/epic or deep/complex target, use **two different model classes** when
available (one per phase) so both augmentation diversity and adversarial
independence are maximized:

1. **Phase 1 — Completeness / advisory** (different class than host when
   reachable). Ask: are all requirements, acceptance criteria, edge cases, error
   paths, and dependencies covered? What's missing or should be strengthened?
   Augmentation, not judgment — run this *before* attacking.
2. **Phase 2 — Adversarial** (a different class than the host, and ideally a
   different class than Phase 1). Use `peeragent` when a different model class is
   available and appropriate; do not use peeragent when it would be the same
   class as the host.
3. When hosted in Pi and a native Pi subagent adapter is available, use a
   reviewer or oracle subagent as the same-harness fresh-context fallback for
   whichever phase can't reach a different class. Record that it was not
   cross-model.
4. Otherwise, use a fresh local sub-agent at the highest available model class
   when the environment provides one.
5. If no fresh-context mechanism is available, continue inline as a degraded
   deep review and record that limitation in `Notes`.

For the host→peer pairing table and exact `peeragent` flags, load
[../../principles/references/models.md](../../principles/references/models.md).

Peer or sub-agent failures are non-blocking. Fall back to the next option rather
than halting the review.

A top-tier reasoning peer (Opus-class, xhigh Codex/GLM, or equivalent) commonly
takes 10 to 30 minutes before it returns, especially for a large feature, epic,
or out-of-band review. A quiet process that has not returned after a few minutes
is still normal top-tier review latency, not a hang.

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
