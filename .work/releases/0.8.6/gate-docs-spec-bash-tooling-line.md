---
id: gate-docs-spec-bash-tooling-line
kind: story
stage: done
tags: [documentation]
parent: null
depends_on: []
release_binding: 0.8.6
gate_origin: docs
created: 2026-05-31
updated: 2026-05-31
---

# SPEC.md tooling-requirements frames bash as the work-view runtime, not the fallback

## Drift category
foundation-doc-assertion

## Confidence
Medium

## Location
- Doc: `plugins/agile-workflow/docs/SPEC.md:488`
- Code: `plugins/agile-workflow/scripts/install-work-view.sh`, `plugins/agile-workflow/work-view/dist/`

## Current doc text
> - **bash** ≥ 4.0 — for `work-view`

## Reality
`work-view` is a prebuilt static binary requiring no runtime; bash ≥ 4.0 is now needed
only for the *fallback* `work-view.sh`, the install helper, and `work-board.sh`. The
same SPEC's binary section (lines 247-273) already says "Users need no Rust toolchain";
this older "bash for work-view" line wasn't reconciled with it. Medium confidence
because bash IS still required today (dist/ empty → fallback active), but the line
asserts bash is *the* work-view runtime, which is no longer the contract.

## Required edit
Line 488 → `- **bash** ≥ 4.0 — for the `work-view` bash fallback (`work-view.sh`), the
install helper, and `work-board.sh`.` Leave the optional `yq`/`jq`/`gh` entries; they
still apply to the bash fallback. Replace in place.

## Done (2026-05-31)
SPEC.md line 488 → "for the `work-view` bash fallback (`work-view.sh`), the install
helper (`install-work-view.sh`), and `work-board.sh`" (verified work-board.sh exists).
Replaced in place.
