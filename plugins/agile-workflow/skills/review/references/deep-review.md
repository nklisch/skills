# Deep Review

Load this reference for feature reviews, epic reviews, explicit `--deep`
requests, or any request that asks for a more robust review across design,
contracts, release, and operational dimensions.

## Reviewer Selection

Prefer a fresh-context reviewer for deep mode. Run the review in a fixed
**two-phase order** — completeness/complementary/advisory first, adversarial
second. Because a review target is a **complete** artifact (unlike an open
design), each phase is a **multi-step convergence loop**, not a single ask:
iterate until findings stabilize (the ideal is the full `peer-review`
convergence loop — ≥3 review→refine passes, continue while substantive issues
keep surfacing, stop on nits, cap ~5). For a feature/epic or deep/complex
target, use **two different model classes** when available — one class drives
the Phase 1 convergence loop, a *different* class drives the Phase 2 loop — so
both augmentation diversity and adversarial independence are maximized.

1. **Phase 1 — Completeness / complementary convergence loop** (different class
   than host when reachable). Ask each round: are all requirements, acceptance
   criteria, edge cases, error paths, and dependencies covered? What is missing
   or should be strengthened? Iterate to convergence; this is augmentation, not
   judgment — run it *before* attacking.
2. **Phase 2 — Adversarial convergence loop** (a different class than the host,
   and ideally a different class than Phase 1). Same convergence shape, now in
   attack posture: what is broken, contradictory, built on a false assumption,
   or will fail in operation? Use `peeragent` when a different model class is
   available and appropriate; do not use peeragent when it would be the same
   class as the host.
3. When hosted in Pi and the agile-workflow `reviewer` role is available, use
   it as the same-harness fresh-context fallback for whichever phase/class can't
   reach a different class. Record that it was not cross-model. Do not assume
   generic Pi reviewer roles are equivalent to the shipped agile-workflow role.
4. Otherwise, use a fresh local sub-agent at the highest available model class
   when the environment provides one. If the mechanism only supports single
   passes (no convergence loop), run as many rounds as it allows and note that
   full convergence was not reached.
5. If no fresh-context mechanism is available, continue inline as a degraded
   deep review and record that limitation in `Notes`.

For the host→peer pairing table, exact `peeragent` flags, and the design-vs-
review loop distinction, load
[../../principles/references/models.md](../../principles/references/models.md).

Peer or sub-agent failures are non-blocking. Fall back to the next option rather
than halting the review.

A top-tier reasoning peer (Opus-class, xhigh Codex/GLM, or equivalent) commonly
takes 10 to 30 minutes before it returns, especially for a large feature, epic,
or out-of-band review. A quiet process that has not returned after a few minutes
is still normal top-tier review latency, not a hang — budget for it across a
multi-round convergence loop.

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
