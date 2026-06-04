# Project Conventions

## Release mapping
none

Shipping happens through `scripts/bump-version.sh` (per-plugin semver bump,
auto-commit + push). `release-deploy` runs the gates and archives bound items
but does not tag or branch — publishing stays with the bump script.

## Tag taxonomy
- refactor    behavior-preserving structural change ONLY — fails the black-box test (any observable behavior change for callers) means NOT a refactor — routes to refactor-design
- perf        throughput, latency, memory — routes to perf-design
- skill       authoring or changing an individual skill (a SKILL.md and its references)
- plugin      plugin-level work: manifests, structure, marketplace wiring, versioning
- tooling     substrate tooling — work-view, the board, the planned binary, scripts/
- docs        guides, foundation docs, READMEs

## Slug conventions
kebab-case. Children are prefixed with their parent's slug
(e.g. `epic-substrate-tooling` → `feature-substrate-tooling-cli`).

## Stage overrides
none

## Linkage fields

Two optional frontmatter fields connect `.work/` items to `.research/` artifacts,
mirroring `gate_origin`. Both are inert when absent — missing → `[]` / `null`
with no validation warning.

- **`research_refs: [<slug>, ...]`** — the research artifacts (`.research/` slugs
  or handles) this work item tracks or consumes (Arrow 1, coordination). Queryable
  via `work-view --research-refs <slug>` (membership, like `--blocking`).
- **`research_origin: <slug>|null`** — the research artifact that spawned this
  work item (Arrow 2, grounding). Mirrors `gate_origin`. Queryable via
  `work-view --research-origin <slug>` (or `null`).

These fields are the schema substrate for the research↔work handoff arrows;
the arrows themselves (Arrow 2 emission gate and Arrow 1 commissioning convention)
are separate features not yet implemented. For the cross-tier pairing contract,
see `plugins/agentic-research/docs/HANDOFF.md`.

## Gate config
gates_for_release: [tests, cruft, docs, patterns]
