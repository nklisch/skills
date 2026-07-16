# Deep Review

Load this reference for feature and epic reviews, explicit `--deep` standalone
requests, or any out-of-band request that asks for a more robust review across
design, contracts, release, and operational dimensions. Child stories are not
reviewed; standalone stories use the bounded inline lane and never load deep
review. Epics receive the deepest aggregate item review.

## Reviewer Selection And Pass Count

Prefer a fresh-context reviewer for deep mode. **Deep changes the lenses and
reviewer capability, not the effective weight.** Resolve `review_weight` before
dispatch:

- `light` and `standard` use at most one fresh-context pass. For `standard`, ask
  one balanced prompt covering completeness and adversarial failure modes;
  adjudicate, fix, verify, and finish without commissioning another pass.
- `thorough` and `maximum` use review → adjudicate → fix → verify convergence,
  continuing until a pass yields no receiver-confirmed material current-cycle
  blockers. Smaller findings are parked, noted, or rejected by receiver
  judgment rather than prolonging the loop.
- `maximum` splits complementary and adversarial coverage when useful and uses
  different model classes across those perspectives when available.

An epic receives broader aggregate lenses than a feature, but a standard epic
still gets one independent pass. `--deep`, artifact size, or first-pass findings
must not silently escalate `standard` into a convergence loop.

For any independent pass, prefer a reviewer from a different model class than
the host when reachable. Use `peeragent` only when it supplies a different
class. Otherwise use a fresh generic sub-agent prompted with the reviewer
capsule from
[../../principles/references/subagents.md](../../principles/references/subagents.md)
and label it same-harness fresh context unless its selected model class actually
differs from the host.

Within `maximum`, completeness/complementary review precedes adversarial attack.
Within `thorough`, preserve that order whenever both perspectives run. Reviewer
or model disagreement is evidence to investigate, not a vote.

For the host→peer pairing table and concrete peer mechanism flags, load
[../../principles/references/models.md](../../principles/references/models.md).
When an OpenAI reviewer is eligible under the different-class rule or is being
used as the same-harness fallback, prefer GPT-5.6 over GPT-5.5. Use Sol for deep
review when available, then another suitable 5.6 tier; use GPT-5.5 only when no
GPT-5.6 review-capable model is available in the current harness, and record that
fallback.

A failed required fresh-context path blocks feature/epic completion unless a
permitted fallback succeeds; design-time advisory failure remains non-blocking.

A top-tier reasoning peer (Opus-class, xhigh Codex/GLM, or equivalent) commonly
takes 10 to 30 minutes before it returns, especially for a large feature, epic,
or out-of-band review. Quiet output after a few minutes is not a hang. Budget
for additional rounds only when the effective weight is `thorough` or
`maximum`.

## Reviewer Packet

Give the fresh reviewer enough context to judge without bloating the task:

- Review target and mode: substrate feature/epic, PR, branch, or range.
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
- Large feature reviews: emphasize integrated capability alignment and release
  readiness in addition to the applicable code-level dimensions.
- Epic reviews: go deeper at aggregate scope—end-to-end capability completeness,
  cross-feature contracts, cumulative operational/release risk, and foundation
  alignment—without repeating per-line child review.
