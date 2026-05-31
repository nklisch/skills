---
id: gate-docs-architecture-ready-rule
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

# ARCHITECTURE.md ready-rule + embedded AGENTS cheatsheet state old implementing-only semantic

## Drift category
foundation-doc-assertion

## Location
- Doc: `plugins/agile-workflow/docs/ARCHITECTURE.md:114-115` (dependency-graph rule) and `:209-210` (embedded AGENTS.md work-view cheatsheet)
- Code: `plugins/agile-workflow/work-view/crates/cli/src/actionable.rs:32-66`

## Current doc text
> - An item is **ready** when its `stage` is `implementing` AND every `depends_on` entry is at `stage: done`.

(lines 209-210)
> `--ready              stage:implementing AND all depends_on done`
> `--blocked            stage:implementing AND unmet dependencies`

## Reality
Ready/blocked are now stage-aware across `{drafting, implementing, review}` within the
active tier. The bundle DID roll forward the `bin/` layout block (lines 26-28:
"platform-matched prebuilt binary … installed by install-work-view.sh") and the
`convert` skill-catalog row (line 563), but left the dependency-graph "ready"
definition (114-115) and the AGENTS embed (209-210) on the old semantic.

## Required edit
Lines 114-115 → "An item is **ready** when it is in the active tier, its `stage` is
`drafting`, `implementing`, or `review`, AND every `depends_on` entry is terminal
(`stage: done`/`released`, or resident in archive/releases)."
Lines 209-210 → `--ready  active-tier items at drafting/implementing/review with all
depends_on done` and `--blocked  active-tier items at drafting/implementing/review
with unmet dependencies`. This embed is the canonical AGENTS.md content `convert`
writes, so it must match the live semantic. Replace in place.

## Done (2026-05-31)
ARCHITECTURE.md ready-rule (114-115) rewritten to active-tier
drafting/implementing/review with terminal deps; the embedded AGENTS cheatsheet
(`--ready`/`--blocked` lines) updated to match. Replaced in place.
