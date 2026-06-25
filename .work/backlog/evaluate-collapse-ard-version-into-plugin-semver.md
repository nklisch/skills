---
id: evaluate-collapse-ard-version-into-plugin-semver
created: 2026-06-25
tags: [plugin, docs]
---

# Evaluate collapsing the separate ARD-Version into the plugin semver (post-absorption)

## The question

ARD now lives only inside the `agentic-research` plugin (`ard-core/`) — the separate
framework repo and the dual-pin were retired when ARD was absorbed (commits #25/#26). Yet
ARD still carries its **own content-version** distinct from the plugin's package semver:

- **ARD framework / spec snapshot**: `0.7.0` — `ard-core/SPEC.md` "Snapshot 0.7.0",
  `CATALOGS.md` "(v0.7.0)", `catalogs.json` `catalog_baseline: 0.7.0`, the
  `<!-- ARD-Version: 0.7.0 -->` stamp on every kernel file (templates, conformance, lint,
  schema `x-ard-version`, tools).
- **Plugin package**: `0.6.2` — the three channel manifests.

Now that the distinction is **internal-only** (no external ARD consumer remains), does the
separate ARD-Version still earn its place, or should it collapse into the plugin semver?

## Why it's not a trivial collapse (what the ARD-Version currently drives)

The number is load-bearing, not vanity — any collapse must account for:

- **Conformance baseline.** `ard-core/kernel/conformance/run.py` validates the kernel against
  the `0.7.0` baseline; `catalogs.json` carries `catalog_baseline: 0.7.0`.
- **Drift detection.** `grep -r ARD-Version` across kernel files is the documented spec-drift
  check (the mechanism that survived the dual-pin retirement). The per-file stamps are how a
  reader knows a kernel copy matches the spec snapshot.
- **Empirical-grounding trace.** `evidence/ledger.md` and `theory/COMMITMENTS.md` cite
  "v0.7.0 additions" as the warrant trace for specific failure shapes (`AQ.4`, `GR.9`,
  `decision_relevance`, cross-model verification). These are spec-evolution records, not
  package-change records.
- **Semantic mismatch risk.** A plugin patch bump (typo fix → 0.6.3) would falsely imply the
  *discipline* changed if the two numbers were one; conversely a spec growth (new failure
  shape) is a MINOR ARD bump but might be only a patch to the package.

## What to evaluate

1. Whether a plugin-internal spec snapshot still warrants an independent version, or whether
   "the discipline changed" can be expressed another way (e.g. a CHANGELOG section, a
   `catalog_baseline` that tracks plugin semver, git tags).
2. If collapsing: what conformance + drift machinery changes (the baseline constant, the
   ARD-Version grep, the per-file stamps, the ledger/COMMITMENTS phrasing), and whether the
   drift check degrades.
3. If keeping: document *why* the dual version is intentional post-absorption, so it stops
   reading as redundant (the absorption AGENTS/README note that "no separate framework repo or
   vendoring pin" can be misread as "no separate version").

## Notes

Surfaced 2026-06-25 during the v0.7-propagation epic-blocker work (PR #28). Operator scoped
this as a **separate deliberate decision**, explicitly NOT folded into the blocker fixes — the
v0.7 propagation + `story-record-refresh-verification-scope` proceed on the current dual-version
basis. This item is the deferred architecture question, not a dependency of that work.

A `convert`/scope pass should decide whether this is a `[research]` investigation (evaluate the
versioning-architecture options against the conformance/drift constraints) or a `[prose]`/docs
item (just document the intentional dual-version) — that depends on whether the answer is "keep
+ document" or "collapse + rework machinery."
