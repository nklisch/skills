---
id: gate-docs-adoption-research-view-landed
kind: story
stage: done
tags: [documentation]
parent: null
depends_on: []
release_binding: null
gate_origin: docs
created: 2026-06-04
updated: 2026-06-04
---

# ADOPTION.md still calls research-view "forthcoming" — it ships in this bundle

## Drift category
foundation-doc-assertion (High)

## Location
- Doc: `plugins/agentic-research/docs/ADOPTION.md:79`
- Code: `plugins/agentic-research/research-view/` (shipped crate + bin), `scripts/install-research-view.sh`, `.github/workflows/build-research-view.yml`

## Current doc text
> The lint and the forthcoming `research-view` binary are cross-harness (CLI).

## Reality
research-view is a shipped Rust workspace (core+cli crates, dist layout, install
script, bash fallback, CI build workflow) — no longer forthcoming. The plugin
README already lists it as landed.

## Required edit
Drop "forthcoming" (rolling-foundation, in place): e.g. "The lint and the
`research-view` binary are cross-harness (CLI)." Scan ADOPTION.md for any other
forthcoming/pending phrasing about research-view while there.

## Implementation notes
Dropped "forthcoming" from `docs/ADOPTION.md:79` — line now reads "The lint and the
`research-view` binary are cross-harness (CLI)." research-view ships in this branch.
No other forthcoming/pending phrasing about research-view in ADOPTION.md.
