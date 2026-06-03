# .research/ — research substrate

The research tier of this repo: external source material, per-source attestations,
and analytical syntheses. It parallels `.work/` (the operational work tier) —
`.work/` tracks what we decide and build; `.research/` holds the grounded source
material that analysis rests on. **Analysis informs operational decisions, never the
reverse** (ARD's substrate cleavage).

> This is the **full live substrate** of the Agentic Research Discipline (ARD),
> provided by the `agentic-research` plugin (adopts ARD v0.1). Note: ARD's *own*
> repository uses `.research/` in a narrower sense — a curated "defensibility trace"
> of positions only. Here, `.research/` is the complete four-tier substrate.

## Tiers (read down-gradient only)

`reference` → `attestation` → `precis` → `analysis`. Higher tiers read lower tiers;
never the reverse. This directionality is the tier-level anti-fabrication guard.

- `reference/<corpus>/INDEX.md` — numbered bibliography per corpus. Raw fetches under
  `reference/**/raw/` are gitignored — they never travel; only derived material is committed.
- `attestation/<handle>.md` — per-source first-read; the citation anchor.
- `precis/<slug>.md` — engagement-unit aggregation, authored from raw.
- `analysis/{positions,briefs,campaigns,hypothesis}/` — cross-source syntheses.

## Conventions

See [CONVENTIONS.md](CONVENTIONS.md) for the frontmatter contracts, the `[handle]{N}`
citation rule, and the lifecycle. Authoring templates live in
`plugins/agentic-research/templates/`; the citation-chain lint is
`plugins/agentic-research/scripts/lint-citations.py`.
