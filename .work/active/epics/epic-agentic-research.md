---
id: epic-agentic-research
kind: epic
stage: drafting
tags: [plugin]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-03
updated: 2026-06-03
---

# Adopt the Agentic Research Discipline (ARD) as the `agentic-research` plugin

## Brief
Adopt the Agentic Research Discipline (ARD) — authored separately at
https://code.s-nc.org/Kevoun/ARD — into this repo as a net-new, three-channel
plugin named `agentic-research`, introducing a `.research/` substrate tier that
parallels the existing `.work/` operational tier.

ARD is an agent-agnostic framework for grounded, verifiable AI research. At its
core it is a *floors-and-affordances* framework, not a procedure: a non-erodable
anti-fabrication floor, a per-engagement control-space of selectable verification
gates, and human-in-the-loop checkpoints. It deliberately cleaves an invariant
architecture (SPEC.md) from an extensible inventory of catalogs (CATALOGS.md) that
grows by a closed-with-extension recipe. ARD also separates an *operational*
substrate (work items) from a *research* substrate (external source material,
attestations, syntheses); that cleavage maps directly onto this repo's `.work/` vs
the proposed `.research/`.

Failure-shapes are just one facet of ARD — one catalog within that inventory. Its
first and prioritized entry, *anchor-and-drift fabrication* (an agent fetches a real
source, grounds one verifiable detail in it, then composes the surrounding
attribution from training-recall rather than the source), is the motivating example
the discipline is most sharply tuned against — not the whole of the framework, and
not its definition.

This is a **proposal from Kevoun to collaborator nklisch**. The scope is a
deliberately focused first cut (see Strategic decisions): port ARD faithfully as
a plugin plus a documented `.research/` tier, add a thin read-only `research-view`
for ergonomics parity with `work-view`, and *design* (not yet implement) the
research→work handoff that makes the two tiers pair.

## Strategic decisions
- **PR ambition**: Proposal cut + the `.work/` pairing as a first-class element.
  Ship the plugin shell, skills, agents, lint floor, foundation docs, and a
  documented `.research/` tier with a seed example; include the research→work
  handoff as a designed/documented headline feature; defer heavy live integration.
- **Naming**: Plugin `agentic-research`; substrate tier `.research/` (parallels
  `.work/`); skills keep ARD's names (`research-orchestrator`, `research-discipline`)
  disambiguated from `agile-workflow:research` (library/API research) and the
  built-in `deep-research` (one-shot) by the plugin namespace.
- **Substrate model**: Faithful to ARD + thin ergonomics. Preserve ARD's lifecycle
  (`status` + `temporal_contract`, corrections-vs-reversals, `[handle]{N}` citations,
  NO draft→review→done stages) and its `lint-citations.py` floor; add a lightweight
  read-only `research-view` (query by handle / status / temporal_contract / corpus)
  for parity with `work-view`, without forcing stages onto items.
- **Tier pairing**: Decoupled in-PR + documented handoff. `.research/` stands alone
  this PR; the research→work handoff (a campaign emitting `.work/` items, gate-style,
  degrading gracefully when no work substrate is present — precedent: `repo-eval`
  files `.work/` items only when a substrate exists) is designed and documented,
  not implemented live.

## Source
ARD upstream: https://code.s-nc.org/Kevoun/ARD (authored by Kevoun). Cloned
read-only during scoping. Currently a doc/spec framework with **no** plugin channel
metadata (`.claude-plugin` / `.codex-plugin` / `package.json` are net-new work).
Key pieces:
- **Docs**: SPEC.md (invariant architecture), CATALOGS.md (extensible v0.1
  baseline), ADOPTING.md (4-tier manual copy-and-adapt adoption, no install
  script), VERSIONING.md (SemVer; spec bundle versions as a unit; currently v0.1).
- **`.research/` substrate** (4-tier, read down-gradient only):
  `reference/<corpus>/` (raw fetches, gitignored) → `attestation/<handle>.md`
  (per-source citation anchor) → `precis/<slug>.md` → `analysis/{positions,briefs,
  campaigns,hypothesis}/`. Item files carry YAML frontmatter (attestation minimum:
  `source_handle`, `fetched`, `source_url`|`source_path`, `provenance`; positions:
  `slug`, `status`, `authored`, `provenance`, `temporal_contract`). Citations are
  `[handle]{N}`, resolving by number against an append-only `references.md`.
- **Skills (2)**: `research-orchestrator` (user-invocable engagement entry point),
  `research-discipline` (auto-loaded anti-fabrication bundle injected into sub-agents).
- **Agents (3, Claude-native)**: `research-specialist` (fan-out worker),
  `adversarial-reader` (skeptical fresh-context gate), `evaluator` (isolated-context
  gate — the FR.1 fence).
- **Tooling**: `lint-citations.py` — zero-dependency citation-chain *validator*
  (not a query tool).

## Decomposition sketch (design input for epic-design)
Anticipated child features — `epic-design` owns the final cut and the real
`depends_on` chains. Slugs follow the `feature-agentic-research-*` convention.

1. **feature-agentic-research-scaffold** `[plugin]` — plugin dir + three-channel
   metadata (`.claude-plugin`, `.codex-plugin`, `package.json`) + `marketplace.json`
   entry + README + AGENTS.md plugin-map registration (per the "Adding a plugin"
   checklist). Foundation of everything else.
2. **feature-agentic-research-skills** `[skill]` — port `research-orchestrator` +
   `research-discipline` as `SKILL.md`, namespaced; templates (dispatch / attestation
   / precis / INDEX) as `references/`. depends_on: scaffold.
3. **feature-agentic-research-agents** `[skill]` — port `research-specialist`,
   `adversarial-reader`, `evaluator` as Claude-native agent defs (harness-specific
   surface; degrade-to-absent on Codex/Pi). depends_on: scaffold.
4. **feature-agentic-research-substrate-tier** `[docs]` — define the `.research/`
   tier (layout, frontmatter contracts, `[handle]{N}` + `references.md`,
   `temporal_contract`/`status` lifecycle, corrections-vs-reversals); wire
   `lint-citations.py` as the floor; seed one worked example. depends_on: scaffold.
5. **feature-agentic-research-research-view** `[tooling]` — thin read-only
   `research-view` (query attestations / positions / campaigns by handle / status /
   temporal_contract / corpus). No stages. depends_on: substrate-tier.
6. **feature-agentic-research-foundation-docs** `[docs]` — adapt SPEC / CATALOGS /
   ADOPTING / VERSIONING into the repo's doc conventions; reconcile ARD's
   spec-bundle-as-unit versioning with per-plugin `bump-version.sh`. depends_on: scaffold.
7. **feature-agentic-research-work-handoff** `[docs]` — design + document the
   research→work handoff (a campaign emits `.work/` items, gate-style, graceful when
   the work substrate is absent). Design only this PR. depends_on: substrate-tier.

## Foundation impact (applied during implementation, not at scope time)
No foundation-doc roll-forward happens at scope time: the `plugins/agentic-research/`
directory does not exist yet, and the AGENTS.md plugin map is presence-based
("FOUR distinct plugins under `plugins/`… `ls plugins/` before assuming"), so
registering it now would misreport reality. The scaffold feature performs the
registration per the "Adding a plugin" checklist (AGENTS.md plugin map +1 row,
`marketplace.json`, three channel manifests). The two-substrate architecture note
(operational `.work/` + research `.research/`) lands in `docs/` during the
foundation-docs feature.

## Open questions for epic-design / nklisch
- **Doc home**: adapted SPEC/CATALOGS under `plugins/agentic-research/docs/`
  (plugin-local, like `agile-workflow/docs/`) vs the repo-level `docs/`?
  Leaning plugin-local.
- **research-view form**: prebuilt binary (Rust, parity with `work-view`) vs a
  zero-dep script (Python, parity with `lint-citations.py`)? Affects the
  `substrate-binary` reference-skill story.
- **Versioning reconciliation**: ARD's "spec bundle versions as a unit" vs the
  repo's per-plugin semver — start the plugin at its own `0.1.0` and record
  "adopts ARD v0.1" in the manifest/README?
- **Cross-harness degradation**: the `lint` floor ports everywhere, but the
  sub-agent verification gates (`adversarial-reader`, `evaluator`) are Claude-only.
  Confirm "degrade to absent, never broken" is acceptable for the rigor controls
  on Codex/Pi.
