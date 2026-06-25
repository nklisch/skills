---
id: epic-agentic-research
kind: epic
stage: done
tags: [plugin]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-03
updated: 2026-06-25
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
- **Versioning**: the plugin gets its own semver starting `0.1.0`, recording its ARD
  pin (now **v0.3.0** — see "Upstream evolution" below); the foundation-docs feature
  reconciles ARD's spec-bundle-as-unit model with per-plugin `bump-version.sh`. As of
  ARD v0.3.0 the pin is single-sourced from upstream `ard.json` (`version` +
  `commit_sha`) rather than restated in prose — `ard-sync` owns the consumer-side
  provenance record.
- **Cross-harness degradation**: the lint floor and the `research-view` binary are
  cross-harness (CLI); the three Claude sub-agents are Claude-only and degrade to
  absent — never broken — on Codex/Pi, per the repo's harness-surface rule.
- **Structural reference**: `agile-workflow` is the primary structural mirror — the
  only existing plugin with agentic-research's shape (a substrate tier, a versioned
  Rust query binary, plugin-local docs, hooks, per-skill agent polish). `nates-toolkit`
  is only the minimal three-manifest template for the lean scaffold. Feature → mirror
  map: `research-view` ↔ `plugins/agile-workflow/work-view/` +
  `scripts/{install-work-view,work-view}.sh`; `foundation-docs` ↔
  `plugins/agile-workflow/docs/`; `substrate-tier` ↔ `.work/` + `.work/CONVENTIONS.md`
  + `work-view`; `engagement-engine` ↔ `plugins/agile-workflow/skills/*/agents/openai.yaml`.

## Source
ARD upstream: https://code.s-nc.org/Kevoun/ARD (authored by Kevoun). Cloned
read-only during scoping. Currently a doc/spec framework with **no** plugin channel
metadata (`.claude-plugin` / `.codex-plugin` / `package.json` are net-new work).
Key pieces:
- **Docs**: SPEC.md (invariant architecture), CATALOGS.md (extensible v0.2
  baseline), ADOPTING.md (4-tier manual copy-and-adapt adoption, no install
  script), VERSIONING.md (SemVer; spec bundle versions as a unit; currently v0.2).
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

## Upstream evolution — ARD v0.3.0 (consumption contract)
Mid-adoption, ARD advanced **v0.2 → v0.3.0** ("consumption contract: a derived
machine surface over canonical prose"; upstream commit `6218f08`). It is a **MINOR,
backward-compatible** bump — our vendored v0.2 surface keeps producing identical
verdicts — but it changes *how* a downstream should consume ARD, replacing
hand-auditing with a machine surface. This is exactly the affordance set the
`ard-sync` feature anticipated and was designed to use. New upstream surface:
- **`ard.json`** — single machine-readable manifest: `version`, `release_tag`,
  `catalog_baseline`, `invariants`, and an enumerated `vendorable_surface[]` where each
  entry carries a **vendor-mode** — `verbatim` (copy unaltered; never re-narrate),
  `data` (consume as structured data), or `verify` (run to validate your copy). Also
  an `adopter_pin` contract: we record `{version, release_tag, commit_sha}`.
- **`kernel/`** — the liftable vendorable surface; `example/` keeps only the Claude
  wiring and points at it. Files we vendor now move conceptually under `kernel/`:
  `discipline.md` (verbatim), `lint-citations.py` (verbatim, now data-sourced),
  `templates/` (verbatim), `schema/attestation.schema.json` (verbatim, **new**),
  `catalogs.json` (data, **new**), `conformance/` (verify, **new**).
- **Per-artifact `ARD-Version:` stamps** + git-tagged releases → `grep -r ARD-Version`
  and `git diff <tag>..<tag> -- kernel/` become the drift check.

Consequences by child feature (folded into each as design input):
- **`foundation-docs`** — consume `kernel/catalogs.json` as *data* (do not re-narrate
  CATALOGS member lists); re-point doc refs `example/` → `kernel/`; adopt `ard.json`
  as the canonical version source and VERSIONING.md's per-axis adopter-action table +
  the verbatim/data/verify vendor-mode taxonomy as the sync policy it owns.
- **`engagement-engine`** — `research-discipline` vendors `kernel/discipline.md`
  *verbatim* with a thin Claude wrapper (frontmatter + concept→path mapping), mirroring
  ARD's own `example/skills/research-discipline.md`. The drift fence: do not re-narrate.
- **`ard-sync`** — its anticipated affordances all shipped; the v0.2 → v0.3.0 re-sync
  is now its concrete worked example (re-vendor the surface, run `conformance/run.py`).
- **`substrate-tier`** (DONE) — its v0.2 vendoring is still *correct and working*
  (backward-compatible), so nothing is broken; the re-vendor to the v0.3.0 `kernel/`
  surface runs through `ard-sync`'s worked re-sync, not a silent re-open.

**Pin reference:** upstream tags are pushed and verified — annotated `v0.1` / `v0.2` /
`v0.3.0`, with `v0.3.0` dereferencing to `6218f08` (matching `ard.json`'s `release_tag`
and `origin/main`). So `ard-sync` pins by **tag** (`v0.3.0` + `commit_sha 6218f08`) and
the `git diff <tag>..<tag> -- kernel/` drift path works directly — no SHA-range degrade.

## Decomposition
Split by capability into seven child features (the seventh, `ard-sync`, scoped later
as upstream-maintenance after the ARD v0.2 bump surfaced the need). The scaffold is the dependency root
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
- `epic-agentic-research-ard-sync` `[tooling]` — repeatable ARD upstream-version sync (single-source provenance record + drift tool); follow-on maintenance, surfaced by the ARD v0.2 bump — depends on: `[epic-agentic-research-foundation-docs]`

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

## PR scope (this proposal) + named follow-ons
The PR carries **6 of 7 features** plus three on-branch ARD absorptions (v0.2→v0.3.0 by hand;
v0.3.0→v0.4.0 and v0.4.0→v0.4.1 tool-driven). **Done:** scaffold, substrate-tier, foundation-docs,
engagement-engine, ard-sync, work-handoff. The epic remains `implementing` — not because the
proposal is incomplete, but because two pieces are **deliberately deferred as named
follow-ons**, not abandoned:
- **`research-view`** — **LANDED.** The Rust query binary over `.research/` (work-view
  parity / ergonomics) shipped via `epic-agentic-research-research-view` (4 stories: core,
  cli, fallback, dist). The committed `dist/<triple>/research-view` binaries land via the
  post-merge `build-research-view.yml` CI run.
- **Live `work-handoff`** — **LANDED.** The `.work/`↔`.research/` pairing is now fully live:
  Arrow 2 (emission gate `/agentic-research:research-handoff`) and Arrow 1 (commissioning
  convention `research_refs:` + `depends_on` recipe) are both implemented. See
  `docs/HANDOFF.md` — status is now "live."

## Children complete (2026-06-04)
All 7 child features are now `done` (scaffold, engagement-engine, substrate-tier,
foundation-docs, ard-sync, work-handoff, research-view). Both formerly-deferred follow-ons
landed — the *live* `.work/`↔`.research/` handoff (separate epic
`epic-research-work-handoff-live`) and `research-view`. Epic advanced `implementing → review`
by the research-view deep-review rollup; ready for `/agile-workflow:release-deploy`.

## Review (2026-06-25)

**Verdict**: Request changes — bounced `review → implementing`.

Deep epic review (host: Claude Opus, aggregate-alignment pass) + cross-model peer
review (Codex, high effort, job `20260625T174848Z`). The seven children delivered
their briefs at the ARD vintage they were authored against, and the deliverables are
genuinely live in the plugin — but the **ARD absorption (#25/#26) bumped `ard-core` to
Snapshot 0.7.0 without propagating the v0.7 registration contract into the live plugin
surface**, leaving foundation/contract drift. Per review policy, foundation-doc drift is
a blocker.

**Blockers**:
- v0.7 ten-field registration + `decision_relevance` kickoff gate absent from the live
  orchestrator SKILL + HANDOFF (the body still describes a nine-field shape: "four-field
  commissioning subset + remaining five"). → `story-propagate-v07-ten-field-registration`

**Important**: none beyond the blocker above.

**Nits** (not items):
- `refresh-scan.py` lacked its exec bit despite a `#!/usr/bin/env python3` shebang —
  **fixed inline** this session (now `-rwxr-xr-x`, parity with `lint-citations.py`).
- Epic prose still says "The epic remains `implementing`" and carries v0.3/v0.4-era ARD
  history; understandable as audit trail, noisy against the absorbed v0.7 tree. Left as-is.

**Notes**: Substrate mode, deep lane, cross-model (different model class via peeragent).
Verification run by the peer: ard-core conformance 57/57 PASS; lint-citations PASS (0
broken / 0 thin); research-view --version 0.6.1; refresh_scan tests PASS. The LENS-not-
substrate guard (§4.6) and the "lint-is-not-a-backstop" handling were independently
confirmed solid by both host and peer — not a concern. Epic closes once the v0.7
propagation story lands.

## Closed (2026-06-25)

Advanced `implementing → done`. The v0.7 propagation blocker
(`story-propagate-v07-ten-field-registration`, peer-approved and merged via PR #28) was advanced to
`done` in this cleanup and parented here. All 7 child features are `done`; no epic-level review gate
applies (`## Stage overrides: none`). (Plugin SemVer is now 0.6.4; the epic's older v0.3/v0.4-era
ARD history above is left as audit trail.)
