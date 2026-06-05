---
id: feature-archived-atop-late-binding-convention
kind: feature
stage: drafting
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
