---
id: feature-delete-after-release-convert-sync
kind: feature
stage: drafting
tags: [skill, tooling, docs]
parent: epic-delete-after-release
depends_on: [feature-delete-after-release-archive-stub, feature-delete-after-release-release-prune]
release_binding: null
gate_origin: null
created: 2026-06-05
updated: 2026-06-05
---

# convert: seed the terminal-retention convention + offer to prune existing bodies

## Problem

`convert` defines the CONVENTIONS.md format (from `docs/SPEC.md`), runs the conventions interview
(Phase 3), writes CONVENTIONS.md (Phase 5), and seeds the `.agents/rules` tier text (Phase 6.5). None
of it knows about delete-after-release, so a synced/bootstrapped repo keeps the retain-bodies model.
This is the **must-hit requirement**: when a consumer (e.g. Silas) runs convert, it must pick up the
new convention.

## Target

1. **CONVENTIONS format** (`docs/SPEC.md`): add a `## Terminal-tier retention` section to the
   canonical CONVENTIONS.md format — values e.g. `delete-refs` (new default) vs `retain-bodies`
   (legacy). Document the stub shape + one-summary-per-release.
2. **convert Phase 3 (interview)**: ask terminal-tier retention; default `delete-refs`.
3. **convert Phase 5 (write CONVENTIONS.md)**: emit the chosen retention convention.
4. **convert sync — offer to prune**: detect existing retained terminal bodies (full-body files in
   `.work/archive/` and `.work/releases/<version>/`) and OFFER to prune them to stubs (archive) /
   one summary (releases), syncing to current practice. Preserve-only stays the default per convert's
   posture; this is an offered, confirmed cleanup.
5. Update convert's `done-archived` detection/classification text to expect bodyless stubs.

## Implementation notes

- Touch: `convert/SKILL.md` (Phases 3, 5, 6.5, detection table ~line 736) and `docs/SPEC.md`
  CONVENTIONS format.
- Keep convert's "ask before destructive cleanup" rule — the prune offer is opt-in.
- The seeded `.agents/rules` tier text changes are shared with the docs-rules feature; coordinate so
  they don't both rewrite the same block (this feature owns what convert *writes*; docs-rules owns the
  canonical rule/AGENTS prose).

## Acceptance criteria

- A fresh `convert` bootstrap writes a CONVENTIONS.md containing the terminal-retention convention
  (default `delete-refs`).
- `convert` sync on a repo with retained terminal bodies offers (not forces) to prune them to
  stubs/summary, and performs it on confirmation.
- `docs/SPEC.md` documents the convention value + stub shape so it is reproducible.
