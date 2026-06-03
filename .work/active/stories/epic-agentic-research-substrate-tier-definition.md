---
id: epic-agentic-research-substrate-tier-definition
kind: story
stage: review
tags: [docs]
parent: epic-agentic-research-substrate-tier
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-03
updated: 2026-06-03
---

# Tier definition: `.research/` skeleton + conventions + templates

## Scope
Story 1 of `epic-agentic-research-substrate-tier`. Creates the repo-root `.research/`
substrate skeleton, its `README` + `CONVENTIONS`, the `.gitignore` append, and the
plugin authoring templates. The exact layout and frontmatter contracts are in the
parent feature body's "Tier specification" section — implement to that contract.

## Implements
- `.research/README.md` (what the tier is + the down-gradient read rule; note it is
  the FULL live substrate, not ARD's curated defensibility-trace sense of `.research/`).
- `.research/CONVENTIONS.md` (layout, the 3 frontmatter contracts, `[handle]{N}` rule,
  append-only invariant, lifecycle: `status`+`temporal_contract` + corrections-vs-reversals).
- `.research/` 4-tier dir skeleton — `reference/`, `attestation/`, `precis/`,
  `analysis/{positions,briefs,campaigns,hypothesis}/` — `.gitkeep` in empty dirs.
- `.gitignore` append: `.research/reference/**/raw/`, `*.pdf *.epub *.azw3 *.mobi`.
- `plugins/agentic-research/templates/{attestation,precis,INDEX}.md` — verbatim ports
  from `/tmp/ARD/example/templates/`.

## Acceptance criteria
- [ ] `CONVENTIONS.md` documents layout, all 3 frontmatter contracts, the `[handle]{N}`
  rule, the append-only invariant, the lifecycle, and the down-gradient rule.
- [ ] The 4-tier skeleton exists and is tracked; `.gitignore` excludes `raw/`.
- [ ] The 3 templates are present in the plugin and match ARD's formats.

## Implementation notes
- **Files created**: `.research/{README,CONVENTIONS,references}.md` + the 4-tier dir
  skeleton (`.gitkeep` ×7); `plugins/agentic-research/templates/{attestation,precis,INDEX}.md`.
- **Templates**: verbatim ports — `diff` confirms byte-identical to `/tmp/ARD/example/templates/`.
- **Discrepancy from design**: the design quoted ARD's global media globs (`*.pdf` …).
  Scoped them to `.research/` (`.research/**/*.pdf` etc.) instead, so source PDFs
  elsewhere in this mixed repo aren't silently ignored. Raw-fetch exclusion via
  `.research/reference/**/raw/` (verified active).
- **Verification**: skeleton tracked; templates diff-identical; CONVENTIONS covers
  layout / 3 frontmatter contracts / `[handle]{N}` + append-only / lifecycle /
  down-gradient; `git check-ignore` confirms `raw/` fetches are excluded.
- **Adjacent issues parked**: none.
