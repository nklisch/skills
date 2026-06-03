---
id: epic-agentic-research-substrate-tier
kind: feature
stage: implementing
tags: [docs, tooling]
parent: epic-agentic-research
depends_on: [epic-agentic-research-scaffold]
release_binding: null
gate_origin: null
created: 2026-06-03
updated: 2026-06-03
---

# `.research/` substrate tier definition + lint floor

## Brief
Define the `.research/` substrate tier that parallels `.work/`, and wire its
mechanical floor. Specify the 4-tier down-gradient layout (`reference/<corpus>/`
→ `attestation/<handle>.md` → `precis/<slug>.md` →
`analysis/{positions,briefs,campaigns,hypothesis}/`), the YAML frontmatter
contracts (attestation normative-minimum: `source_handle`, `fetched`,
`source_url`|`source_path`, `provenance`; the position schema), the `[handle]{N}`
citation convention resolving by number against an append-only `references.md`,
and the faithful-to-ARD lifecycle (`status` + `temporal_contract`,
corrections-vs-reversals — explicitly NO draft→review→done stages). Port
`lint-citations.py` as the citation-chain validator (the floor), carry the
substrate-scaffolding templates (`attestation.md`, `precis.md`, `INDEX.md`), and
preserve the `.gitignore` posture (raw fetches under `reference/**/raw/` never
committed). Seed one worked `.research/` example so the tier is demonstrable, not
just documented.

This is the conceptual lynchpin: `research-view` and `work-handoff` both build on
the schema and layout defined here, so the frontmatter contracts and tier
semantics are load-bearing — get them right before downstream features inherit
them.

Does NOT cover: the `research-view` query binary, or the research→work handoff.

## Epic context
- Parent epic: `epic-agentic-research`
- Position in epic: consumer of `epic-agentic-research-scaffold`; foundation for
  `research-view` and `work-handoff`. Parallel with engagement-engine and
  foundation-docs.

## Foundation references
- `/tmp/ARD/SPEC.md` — §4 (citation/attestation chain), §10 (substrate structure/lifecycle)
- `/tmp/ARD/.research/` + `/tmp/ARD/example/.research` layout
- `/tmp/ARD/example/templates/` — `attestation.md`, `precis.md`, `INDEX.md`
- `/tmp/ARD/example/lint-citations.py` — the floor to port
- `AGENTS.md` — Agile-Workflow Substrate section (`.work/` as the parallel model)

## Design decisions
- **Tier instantiation + seed**: repo-root `.research/` dogfood — grow a real
  `.research/` substrate at the repo root (parallel to `.work/`), seeded with a real
  worked example about this adoption. Honors the VISION dogfooding thesis; adopters
  get the same shape via the plugin's templates + CONVENTIONS.
- **Lint wiring**: standalone script — port `lint-citations.py` faithfully into the
  plugin (`plugins/agentic-research/scripts/`), documented manual/CI invocation, no
  harness coupling. Hooks/gates deferred to a possible follow-on.
- **Doc split (mirrors `.work/`)**: the tier's *operational* definition lives at the
  substrate root — `.research/README.md` + `.research/CONVENTIONS.md` (mirroring
  `.work/CONVENTIONS.md`). The *framework architecture* (SPEC/CATALOGS) is the
  `foundation-docs` feature's job (`plugins/agentic-research/docs/`), not this one.
- **Template + tool home**: the plugin ships the canonical authoring templates
  (`plugins/agentic-research/templates/`) and the lint script
  (`plugins/agentic-research/scripts/`); repo-root `.research/` is the live instance.

## Architectural choice
Faithful 4-tier ARD substrate instantiated at the repo root, with a standalone
Python lint floor. Rejected: (a) a simplified subset (attestation+position only) —
not faithful to the down-gradient model; (b) plugin-`example/`-only — the user
chose the repo-root dogfool over a self-contained example.

## Tier specification (the contract downstream features inherit)

### Layout (repo root, parallel to `.work/`)
```
.research/
  README.md                       # what the tier is + the down-gradient read rule
  CONVENTIONS.md                  # frontmatter contracts, citation rule, lifecycle
  references.md                   # consolidated numbered bibliography (append-only)
  reference/<corpus>/INDEX.md     # per-corpus numbered bibliography (raw/ gitignored)
  attestation/<handle>.md         # per-source, the citation anchor
  precis/<slug>.md                # engagement-unit aggregation, authored-from-raw
  analysis/
    positions/<slug>.md           # cross-source syntheses
    briefs/<slug>.md  campaigns/<slug>/  hypothesis/<slug>.md
```
**Down-gradient read rule**: reference → attestation → precis → analysis. Higher
tiers read lower; never the reverse (anchor-and-drift guard at the tier level).

### Frontmatter contracts (verbatim from ARD templates)
- **attestation** (`.research/attestation/<handle>.md`): required `source_handle`
  (MUST equal the `[handle]` in citing prose), `fetched: YYYY-MM-DD`, one of
  `source_url` / `source_path`, `provenance: source-direct`. Optional `source_class`,
  `version`, `substrate_confidence: source-direct|search-summary|snippet-thin`.
  Body: `## Summary` / `## Key passages` (`>` quotes + source-internal anchors) /
  `## Structural metadata`. A body with NO `##` anchors AND NO `>` quotes is a *thin
  attestation* (GR.5) — lint flags it.
- **precis** (`.research/precis/<slug>.md`): required `source_handle`, `authored`,
  `provenance: agent-authored-from-raw`. Optional `source_unit`.
- **position** (`.research/analysis/positions/<slug>.md`): `slug`, `status`,
  `authored`, `provenance: agent-synthesis`, `temporal_contract`.

### Citation rule
`[handle]{N}` (grammar `\[([\w-]+)\]\{(\d+)\}`). `handle` resolves to
`attestation/<handle>.md`; `N` resolves by number against `references.md` (and the
per-corpus `INDEX.md`). **`references.md` and `INDEX.md` are append-only — never
renumber** (renumbering breaks every live citation).

### Lifecycle (faithful to ARD — NO draft→review→done stages)
`status` (e.g. `settled`) + `temporal_contract` ∈ {`write-once-on-converge`,
`extend-on-source-rev`, `supersedes-prior`, `ttl-bounded`, `re-engage-on-trigger`}.
Change model: **correction** = fix in place + a `## Revisions` log entry;
**reversal** = new artifact at a new path with a `supersedes:` pointer.

### `.gitignore` posture
Append: `.research/reference/**/raw/` and `*.pdf *.epub *.azw3 *.mobi` — raw source
fetches never travel; only IP-cleared derived material is committed.

## Implementation Units
Multi-surface with an internal join → spawn 3 child stories (S1 ∥ S2 → S3).

### Unit/Story 1: tier definition — `epic-agentic-research-substrate-tier-definition`
**Creates**: `.research/{README.md, CONVENTIONS.md}` + the 4-tier dir skeleton
(`.gitkeep` in empty dirs) + the `.gitignore` append + the plugin authoring
templates `plugins/agentic-research/templates/{attestation,precis,INDEX}.md` (ported
verbatim from `/tmp/ARD/example/templates/`).
**Acceptance**:
- [ ] `.research/CONVENTIONS.md` documents the layout, the three frontmatter
  contracts, the `[handle]{N}` rule, the append-only invariant, the lifecycle
  (`status`+`temporal_contract`, corrections-vs-reversals), and the down-gradient rule.
- [ ] The 4-tier skeleton exists and is tracked; `.gitignore` excludes `raw/`.
- [ ] The 3 templates are present in the plugin and match ARD's formats.

### Unit/Story 2: lint floor — `epic-agentic-research-substrate-tier-lint`
**Creates**: `plugins/agentic-research/scripts/lint-citations.py` (ported from
`/tmp/ARD/example/lint-citations.py`, zero-dep Python3), default
`--attestation-dir .research/attestation` / `--analysis-dir .research/analysis`
(already repo-root-relative) + a fixture-based smoke test.
**Acceptance**:
- [ ] Validates citation-chain integrity (`[handle]{N}` → attestation resolution +
  `source_handle` match), the 6 surface-pattern warnings, and the GR.5 thin check.
- [ ] `--format markdown|json` and `--exit-code-on high|...` work as in upstream.
- [ ] Smoke test: a known-good fixture passes; a known-bad fixture (broken handle,
  thin attestation) is flagged. Run via the `subprocess-cli-harness` pattern.

### Unit/Story 3: seed example (dogfood) — `epic-agentic-research-substrate-tier-seed`
**Creates** a REAL worked example in `.research/`: ≥1 `reference/<corpus>/INDEX.md`,
≥1 `attestation/<handle>.md` (real source, verbatim `>` quotes + anchors), ≥1
`analysis/positions/<slug>.md` citing `[handle]{N}`, and the matching `references.md`
entries — grounding a real claim about THIS adoption (e.g. the Claude Code
directory-marketplace model, or ARD's substrate cleavage).
**depends_on**: S1 (structure+templates), S2 (lint to validate against).
**Acceptance**:
- [ ] Every `[handle]{N}` in the position resolves to a real attestation with a
  matching `source_handle` and a reachable `source_url`.
- [ ] `lint-citations.py .research/analysis/positions/ --exit-code-on high` exits 0.
- [ ] NO fabrication: every attributed claim traces to a `>` quote/anchor in its
  attestation. (The seed must itself pass the discipline it demonstrates.)

## Implementation Order
1. `-definition` and `-lint` in parallel (independent).
2. `-seed` after both (needs the structure/templates to author into and the lint to
   validate against).

## Testing
- **Lint** is the substrate's own verification: the seed (S3) is "tested" by lint
  exiting clean; the lint port (S2) is tested by good/bad fixtures via the repo's
  `subprocess-cli-harness` pattern.
- **No app build/test framework** for the prose/markdown units (S1) — verification is
  structural (dirs exist, CONVENTIONS covers the contract, templates match ARD).

## Risks
- **The seed must be genuinely grounded, not fabricated** — the sharp irony of
  seeding an anti-fabrication substrate. Mitigation: S3 acceptance requires every
  claim trace to a real quoted+anchored attestation and lint to pass; treat a
  failing lint as a real defect, never game it.
- **Append-only invariant is load-bearing** — a future edit that renumbers
  `references.md`/`INDEX.md` silently breaks every `[handle]{N}`. CONVENTIONS must
  state it loudly; lint catches unresolved/mismatched handles.
- **Two meanings of `.research/`** — ARD's repo uses `.research/` for a curated
  *defensibility trace* (positions only); ours is the *full live substrate*. The
  README must say which this is to avoid confusing a reader who knows ARD.
