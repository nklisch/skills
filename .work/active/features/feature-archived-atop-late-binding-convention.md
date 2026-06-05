---
id: feature-archived-atop-late-binding-convention
kind: feature
stage: done
tags: [skill, tooling, docs]
parent: epic-archived-atop-late-binding
depends_on: [feature-archived-atop-late-binding-stub-stamp, feature-archived-atop-late-binding-release]
release_binding: null
gate_origin: null
created: 2026-06-05
updated: 2026-06-05
---

# Fold the merged model into one convention (SPEC + convert)

## Problem

v0.11 added a `terminal-tier retention: delete-refs | retain-bodies` convention. Silas separately
has a `## Done-item archival` convention describing `archived_atop` late-binding. The merged model
needs ONE convention so a converted repo gets the whole theory, and convert's sync path currently
doesn't even seed/offer the retention convention (a gap found during Silas's convert).

## Target

1. **SPEC**: replace the standalone `Terminal-tier retention` block with a single merged section
   that documents: bodyless stubs carrying `archived_atop` + `git_ref`, `archived_atop` late-binding,
   one-summary release. `retain-bodies` stays as the legacy opt-out.
2. **convert Phase 3/5 (bootstrap)**: the interview question + CONVENTIONS write produce the merged
   convention (default delete-refs + archived_atop late-binding).
3. **convert sync (the gap)**: S1 audit detects whether CONVENTIONS carries the merged convention;
   S3 offers to add it AND offers the prune-to-stubs migration for existing retained terminal
   bodies (stamping `archived_atop` from `git log` + `git_ref`). Today sync does neither.
4. Reconcile with a repo that already has a bespoke `Done-item archival` section: detect it, offer to
   converge it into the merged convention rather than duplicating.

## Acceptance criteria
- A fresh convert seeds the one merged convention; `archived_atop` + stub shape documented in SPEC.
- convert sync detects a missing/partial merged convention and offers to add it (not silently), and
  offers the existing-body prune with `archived_atop` stamping.
- A repo with a pre-existing `Done-item archival` convention is offered convergence, not duplication.

## Implementation (2026-06-05)

Folded the v0.11 retention convention + `archived_atop` late-binding into ONE merged convention:

- **`docs/SPEC.md`** — reworked the `Terminal-tier retention` prose into the merged convention: a
  numbered 3-step lifecycle (archive decoupled → late-bind via `archived_atop` → one-summary
  release). `retain-bodies` kept as the legacy opt-out with identical `archived_atop`/late-binding
  semantics (bodies just not pruned). Added a note that a bespoke "Done-item archival" section should
  be converged, not duplicated. (The F1 stub-shape + computation subsections from this feature's
  sibling remain under the same section.)
- **convert Phase 3 (Q6)** — interview now describes the merged model (stub + `archived_atop` +
  late-binding + one-summary), not just byte retention. Phase 5 already defers to the SPEC format, so
  the merged convention flows through unchanged.
- **convert Phase 8 (seeding + sync block)** — `done-archived` seeds now stamp `archived_atop`; the
  "Sync existing substrates to delete-refs" prune ALSO stamps `archived_atop` (from `git log`
  history at the archival/done commit, else `pre-release`); added a "Converge a bespoke Done-item
  archival convention" block (detect, offer convergence, route project-specific rules to
  `.agents/rules/<name>.md`).
- **convert sync (the gap)** — S1 audit now classifies the `Terminal-tier retention` convention
  (`missing` / `match` / `partial` / bespoke-overlap) AND scans for retained terminal bodies; S3
  offers to add/reconcile/converge the convention and offers the prune-to-stubs migration (stamping
  `archived_atop` + `git_ref` from history). S4 preserve-list and S5 commit updated to cover the new
  confirmed writes. (See Review fixes below: the bare value-only form is now `match`, not `partial` —
  the per-project CONVENTIONS template is value-only and the merged prose lives only in SPEC.)

Judgment calls:
- The merged convention keeps the `## Terminal-tier retention` heading (rather than renaming to
  "Done-item archival") because SPEC, ARCHITECTURE, convert, and the v0.11 CONVENTIONS template all
  already reference that heading; renaming would orphan those pointers. The bespoke "Done-item
  archival" name is treated as a convergence *source*, not the canonical heading.
- Sync's prune offer derives `archived_atop` from `git log` history (best-effort: latest release at
  the item's last-touching commit). For released bodies whose baseline is unknowable from history,
  the summary's `archived_atop` column gets `—`. This is honest about historical uncertainty without
  blocking the migration. All prune/converge offers stay opt-in (preserve-only default).

## Review fixes (2026-06-05)

Fresh-context review found one accepted finding on this feature's surface; fixed (item stays
`stage: done`).

- **I1 (important) — bootstrap output self-classified as drift.** The sync `partial` state was
  defined as "a bare `delete-refs`/`retain-bodies` value with no merged prose," but bootstrap writes
  exactly that bare value (the per-project CONVENTIONS template is value-only; the merged prose lives
  only in SPEC.md, never duplicated per project). So a repo bootstrapped by this version would be
  flagged `partial` on its next sync — churn, and the `match` branch was unreachable. Fix: a bare
  `delete-refs`/`retain-bodies` value IS `match` (the canonical value-only form). `partial` now fires
  only when the value is absent under the heading (folded into `missing`) or contradictory/bespoke.
  `missing`-accept appends just the heading + value line, not the full SPEC prose. Reconciled across
  convert S1 classification, the Terminal-tier-retention drift table, S3 apply (missing/partial), S4
  preserve note, and Phase 5 bootstrap write (now explicitly value-only). A freshly bootstrapped repo
  now classifies as `match` on its next sync.
