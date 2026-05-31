---
id: gate-docs-spec-ready-blocked-semantic
kind: story
stage: implementing
tags: [documentation]
parent: null
depends_on: []
release_binding: 0.8.6
gate_origin: docs
created: 2026-05-31
updated: 2026-05-31
---

# SPEC.md `--ready`/`--blocked` flag rows encode the old implementing-only semantic

## Drift category
foundation-doc-assertion

## Location
- Doc: `plugins/agile-workflow/docs/SPEC.md:284` (`--ready`) and `:285` (`--blocked`)
- Code: `plugins/agile-workflow/work-view/crates/cli/src/actionable.rs:32-66`; bash fallback `plugins/agile-workflow/scripts/work-view.sh:62-63,328-334`

## Current doc text
> `--ready` | (none) | Items at `stage: implementing` with all `depends_on` at `stage: done`
> `--blocked` | (none) | Items waiting on unresolved dependencies (annotates which)

## Reality
The bundle made `--ready`/`--blocked` stage-aware. Implemented predicate:
`tier == Active` AND `stage ∈ {drafting, implementing, review}` AND (ready: all
`depends_on` terminal / blocked: ≥1 non-terminal dep). A drafting feature with
satisfied deps now surfaces in `--ready` — the headline fix of this epic. The SPEC's
distribution section (lines 247-273) was already rolled forward by the bundle, but
these flag-table rows were not.

## Required edit
Line 284 → `--ready` | (none) | Active-tier items at `stage: drafting`,
`implementing`, or `review` with all `depends_on` at `stage: done`.
Line 285 → `--blocked` | (none) | Active-tier items at `stage: drafting`,
`implementing`, or `review` with at least one unresolved dependency (annotates which).
Replace in place, no version-history prose.
