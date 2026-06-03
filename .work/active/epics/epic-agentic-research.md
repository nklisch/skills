---
id: epic-agentic-research
kind: epic
stage: implementing
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

## Design decisions
Resolved during epic-design (the epic's open questions, now closed). nklisch may
revisit any of these in review.
- **research-view form**: Rust prebuilt binary — parity with `.work/bin/work-view`,
  following the `substrate-binary` pattern (Rust source + prebuilt dist binaries +
  checksum + version-freshness). Chosen for cross-tier ergonomic consistency over a
  lighter zero-dep script.
- **Doc home**: plugin-local (`plugins/agentic-research/docs/`) — per `docs/VISION.md`
  ("the repo stays thin and defers; each plugin carries its own foundation docs");
  matches `plugins/agile-workflow/docs/`.
- **Versioning**: the plugin gets its own semver starting `0.1.0`, recording "adopts
  ARD v0.1"; the foundation-docs feature reconciles ARD's spec-bundle-as-unit model
  with per-plugin `bump-version.sh`.
- **Cross-harness degradation**: the lint floor and the `research-view` binary are
  cross-harness (CLI); the three Claude sub-agents are Claude-only and degrade to
  absent — never broken — on Codex/Pi, per the repo's harness-surface rule.

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

## Decomposition
Split by capability into six child features. The scaffold is the dependency root
(the plugin shell everything lives in); the substrate-tier is the conceptual
lynchpin (the query binary and the handoff both build on its schema). ARD's two
skills and three agents are merged into one **engagement-engine** feature — they
are a single coupled capability (the orchestrator dispatches the agents; the
discipline bundle injects into them), so splitting them would slice a layer, not a
capability. After scaffold lands, engagement-engine / substrate-tier /
foundation-docs run in parallel; research-view and work-handoff open up once the
tier schema is fixed.

### Child features
- `epic-agentic-research-scaffold` `[plugin]` — plugin shell + three-channel metadata + marketplace/AGENTS registration + 0.1.0 baseline — depends on: `[]`
- `epic-agentic-research-engagement-engine` `[skill]` — the 2 skills + 3 Claude agents + dispatch template — depends on: `[epic-agentic-research-scaffold]`
- `epic-agentic-research-substrate-tier` `[docs, tooling]` — `.research/` tier definition + lint floor + seed example — depends on: `[epic-agentic-research-scaffold]`
- `epic-agentic-research-foundation-docs` `[docs]` — SPEC/CATALOGS/ADOPTING/VERSIONING adaptation + versioning reconciliation — depends on: `[epic-agentic-research-scaffold]`
- `epic-agentic-research-research-view` `[tooling]` — Rust prebuilt query binary (work-view parity) — depends on: `[epic-agentic-research-substrate-tier]`
- `epic-agentic-research-work-handoff` `[docs]` — designed + documented research→work handoff (not live) — depends on: `[epic-agentic-research-substrate-tier]`

### Decomposition risks
- **substrate-tier is the lynchpin.** research-view and work-handoff both inherit
  its frontmatter contracts and tier semantics; an error there propagates. Design
  it before its dependents are picked up.
- **Template ownership is split.** The `dispatch.md` template (engagement
  registration) lives with engagement-engine; the `attestation.md` / `precis.md` /
  `INDEX.md` templates (substrate artifacts) live with substrate-tier. feature-design
  should confirm this split when each is picked up.
- **engagement-engine spans the portability boundary** (portable skills + Claude-only
  agents in one feature). Acceptable — its design pass documents per-surface
  degradation — but watch its size and split it if it overflows one feature-design pass.

## Foundation impact (applied during implementation, not at scope time)
No foundation-doc roll-forward happens at scope time: the `plugins/agentic-research/`
directory does not exist yet, and the AGENTS.md plugin map is presence-based
("FOUR distinct plugins under `plugins/`… `ls plugins/` before assuming"), so
registering it now would misreport reality. The scaffold feature performs the
registration per the "Adding a plugin" checklist (AGENTS.md plugin map +1 row,
`marketplace.json`, three channel manifests). The two-substrate architecture note
(operational `.work/` + research `.research/`) lands in `docs/` during the
foundation-docs feature.
