---
id: epic-research-work-handoff-live
kind: epic
stage: review
tags: [skill, tooling]
parent: null
depends_on: [epic-agentic-research-substrate-tier]
release_binding: null
gate_origin: null
created: 2026-06-04
updated: 2026-06-04
---

# Live research↔work handoff (`.research/` ↔ `.work/` pairing, implemented)

## Brief
Make the research↔work pairing **live**. The pairing is already *designed and
documented* — `plugins/agentic-research/docs/HANDOFF.md` (shipped by the done
feature `epic-agentic-research-work-handoff`) specifies the contract; its
"Status — designed, not live" section explicitly names this as the follow-on
epic. This epic implements that contract: the two read-only reference arrows
across the authority boundary become working code, and the linkage fields become
first-class substrate state.

Two deliverables, both arrows live (per the strategic decision below):

1. **Arrow 2 — emission gate (`.research/` → `.work/`).** A handoff skill/gate
   in `agentic-research` that lets a completed research engagement carrying
   actionable findings (e.g. `output_kind: adoption-recommendations`, a staged
   hypothesis, a recommendation) **emit `.work/` items gate-style** —
   operator-confirmed (mirroring `repo-eval`'s `AskUserQuestion`), defaulting to
   `.work/backlog/` (lowest commitment). Each emitted item carries
   `research_origin:` plus a body citation to the source artifact. **Degrades to
   a silent no-op when no `.work/` substrate is present** (the `repo-eval`
   precedent: "if no substrate exists, skip this phase silently"). The plugin's
   research capability remains fully usable without `.work/`.

2. **Arrow 1 — coordination tooling (`.work/` → `.research/`).** A work item
   that needs grounding can **commission and track** a research engagement: it
   triggers `research-orchestrator`, references the resulting `.research/`
   artifacts via `research_refs:`, and may `depends_on` the research output so it
   stays blocked until the grounding exists. Read-only across the boundary — the
   work item *awaits* and *cites* the research record; it never writes into
   `.research/`. This requires `work-view` to recognize the linkage (query "what
   work is grounded in research X?").

3. **The linkage contract, made real.** The two `.work/`-item frontmatter
   fields HANDOFF.md proposes — `research_refs:` (coordination / Arrow 1) and
   `research_origin:` (grounding / Arrow 2) — become first-class optional fields
   in agile-workflow's `.work/` schema and `work-view`, mirroring the existing
   `gate_origin:` convention. Any `.research/`-artifact-side linkage fields (a
   research artifact back-pointing to its commissioning work, or tracking the
   items it emitted) are owned by `agentic-research`.

**The invariant is preserved throughout** (ARD SPEC §1/§4.6, restated in
HANDOFF.md): analysis informs operational decisions; **operational state never
rewrites the research record.** Both arrows are commissions/citations, not
writes into the other tier's authoritative record. Within `.research/`, reads
stay down-gradient only.

## Strategic decisions
Resolved at scope time (the framing calls; epic-design may refine decomposition,
not these).
- **Standalone follow-on epic, not a child of `epic-agentic-research`** —
  `parent: null`, `depends_on: [epic-agentic-research-substrate-tier]`. Matches
  HANDOFF.md's and the parent epic's "named follow-on epic" framing: the
  ARD-adoption proposal PR is deliberately closed around 6/7 features + the
  *designed* handoff, and ships independently. This live work is its own arc that
  builds on the landed `.research/` tier and the documented contract — not a
  reopening of the proposal's scope.
  - **Dependency precisified (epic-design):** originally
    `depends_on: [epic-agentic-research]` (the whole proposal epic). Re-pointed to
    `epic-agentic-research-substrate-tier` — the actual prerequisite (the landed
    `.research/` tier + the done `engagement-engine`/`research-orchestrator`),
    exactly what the done design feature `epic-agentic-research-work-handoff`
    depended on. The whole-epic edge over-coupled the handoff to the *orthogonal*
    `research-view` sibling follow-on, which this epic's own Notes already declare
    independent ("the two follow-ons do not depend on each other"). With
    `substrate-tier` done, the handoff is correctly unblocked without waiting on
    `research-view`.
- **Both arrows live** — not Arrow 2 emission only. The live epic implements the
  Arrow 1 coordination tooling (a work item commissioning `research-orchestrator`
  and `depends_on`-ing a research output, with `work-view` aware of the linkage)
  *and* the Arrow 2 operator-confirmed emission gate. HANDOFF.md establishes both
  arrows are real and that the work-coordinates arrow is the *primary*
  operational entry point; building only emission would ship the secondary arrow
  and leave the primary one a hand-written convention.
- **Split field ownership: each tier owns the linkage fields on its own item
  shape.** agile-workflow owns the `.work/`-item-side fields (`research_refs:`,
  `research_origin:`) as first-class optional fields — documented in
  `.work/CONVENTIONS.md` / the SPEC frontmatter contract and greppable/queryable
  via `work-view`, mirroring `gate_origin:`, with **no hard dependency** on
  `agentic-research` (the fields are inert when the plugin is absent).
  agentic-research owns any `.research/`-artifact-side linkage fields. Clean
  boundary: neither plugin reaches into the other's schema; the gate and the
  coordination tooling populate fields each tier already declares on its own
  items.

## Foundation references
- `plugins/agentic-research/docs/HANDOFF.md` — **the contract this epic
  implements.** Authority-vs-coordination distinction, both arrows, the proposed
  linkage fields, graceful degradation, the directionality guard, and the
  explicit "Status — designed, not live → follow-on epic" pointer.
- `epic-agentic-research-work-handoff` (done) — the design/doc feature; this
  epic is its live successor.
- `epic-agentic-research` — the parent proposal epic; see its "PR scope (this
  proposal) + named follow-ons" section, which names this live handoff as a
  deferred follow-on alongside `research-view`.
- `plugins/nates-toolkit/skills/repo-eval/` — the cross-tier graceful-degradation
  precedent (SKILL.md: file `.work/` items only when `.work/CONVENTIONS.md`
  exists, operator-confirmed via `AskUserQuestion`, silent no-op otherwise).
- agile-workflow `gate-*` skills + `gate_origin:` — the gate-style item-emission
  precedent the Arrow 2 gate and the `research_origin:` field mirror.
- `plugins/agile-workflow/work-view/` + `.work/CONVENTIONS.md` — the `.work/`
  schema + query tooling that gains the two linkage fields.
- `plugins/agentic-research/skills/research-orchestrator/` — the engagement entry
  point Arrow 1 commissions and the Arrow 2 gate hangs off of.
- ARD SPEC §1 / §4.6 / §10.2 — the substrate cleavage + down-gradient
  directionality (the authority invariant the live code must not violate).

## Cross-plugin coordination
This epic spans **two plugins**, which shapes decomposition and ownership:
- **`agentic-research`** owns: the Arrow 2 emission gate (new skill/gate), the
  Arrow 1 commissioning ergonomics from the research side, and any
  `.research/`-artifact-side linkage fields. Version bump on `agentic-research`.
- **`agile-workflow`** owns: the `research_refs:` / `research_origin:` `.work/`
  frontmatter fields (CONVENTIONS.md + SPEC frontmatter contract), and
  `work-view` support for querying them (e.g. "what work is grounded in research
  X?" / "what work did this campaign produce?"). Version bump on `agile-workflow`.
- The gate degrades to a no-op without `.work/`; the fields are inert without
  `agentic-research`. Neither plugin takes a hard dependency on the other.

Because two plugins change, decomposition should keep the agile-workflow schema/
tooling change and the agentic-research gate/coordination change as **separate
child features** (separate version bumps, separate `bump-version.sh` runs), with
the gate feature `depends_on` the field-additions feature so emission targets a
schema that already recognizes `research_origin:`.

## Foundation impact (applied during implementation, not at scope time)
No foundation-doc roll-forward at scope time — same rationale the parent epic
used. The `research_refs:` / `research_origin:` fields do **not** exist in
`.work/`'s schema or tooling yet; writing them into `.work/CONVENTIONS.md`, the
agile-workflow SPEC frontmatter contract, or the AGENTS.md substrate section now
would misreport reality (presence-based docs). The field-additions child feature
performs that roll-forward when it lands. HANDOFF.md already carries the design;
implementation flips its "Status — designed, not live" section and the parent
epic's follow-on note to "live."

## Design decisions
Locked at epic-design time (Phase 4.7, direct user invocation). Each child
feature's design pass inherits these:
- **Linkage query ownership → the field-additions feature owns it.** The
  `--research-origin` / `--research-refs` query flags ship *with* the schema
  fields, as one complete vertical slice mirroring `gate_origin:`/`--gate`
  end-to-end. Rationale: a field with no filter flag is dead weight (the
  `gate_origin` precedent shipped field + flag together), and the query is just
  a filter on `.work/` items' own fields — "what work is grounded in research
  X?" = `--research-origin X` — with no cross-tier traversal (`work-view` never
  reaches into `.research/`). Keeps all `work-view` changes in one agile-workflow
  version bump.
- **Arrow 1 depth → convention + fields + query, no new skill.** Arrow 1 ships
  the documented commissioning workflow (a work item sets `research_refs:`,
  `depends_on`-s the research output, cites the artifact) and reuses the query
  from the fields feature — but introduces *no* new executable skill;
  commissioning reuses the existing `research-orchestrator` invocation. Lightest
  shape; honors the over-coupling risk (don't blur coordination into authorship).

## Decomposition
Three child features, split by **arrow + plugin ownership** (not by layer): the
schema foundation in agile-workflow, then the two arrows in agentic-research,
which parallelize once the foundation lands. This shape was chosen over a
single cross-plugin feature (it would force one version bump across two plugins
and couple the schema to the gate) and over a finer slice (separating the query
from the fields would ship an unqueryable schema — see the locked decision).

The epic's cross-epic gate (`depends_on: [epic-agentic-research-substrate-tier]`)
is **materialized onto the `fields` entry feature**, because `work-view`
readiness is non-transitive (it evaluates an item's own `depends_on`, not its
parent epic's). The other two children inherit the gate through their dependency
on `fields`. Because `substrate-tier` is **done**, this gate is satisfied — the
handoff is unblocked and ready for design/implementation, independent of the
still-in-progress `research-view` sibling follow-on.

### Child features
- `epic-research-work-handoff-live-fields` `[tooling, docs]` — the `.work/`
  schema + `work-view` linkage fields (`research_refs:` / `research_origin:`)
  and the `--research-origin` / `--research-refs` query flags, plus the
  CONVENTIONS/SPEC/AGENTS roll-forward. agile-workflow version bump. — depends
  on: `[epic-agentic-research-substrate-tier]` (the materialized cross-epic gate;
  satisfied — substrate-tier is done).
- `epic-research-work-handoff-live-emission-gate` `[skill]` — Arrow 2: the
  operator-confirmed `.research/` → `.work/` emission gate, backlog-default,
  silent no-op without `.work/`, emitted items carry `research_origin:` +
  citation. agentic-research version bump. — depends on:
  `[epic-research-work-handoff-live-fields]`.
- `epic-research-work-handoff-live-coordination` `[skill, docs]` — Arrow 1: the
  work→research commissioning *convention* (no new skill), reusing
  `research-orchestrator` + the linkage fields/query. agentic-research doc
  surface. — depends on: `[epic-research-work-handoff-live-fields]`.

### Decomposition risks
- **`research_refs` is plural — not a `gate_origin` clone.** HANDOFF.md frames
  `research_refs:` as "handles or analysis slugs" (a list), unlike
  `gate_origin`'s single `Option<String>`. The `fields` design pass must account
  for list parse (YAML sequence vs scalar), membership-match filter semantics,
  and the flag's matching — not blind-copy the `gate_origin` shape.
- **Shared foundation roll-forward across two features.** Both `emission-gate`
  (Arrow 2) and `coordination` (Arrow 1) touch HANDOFF.md's status + the parent
  epic's follow-on note. Flip **per-arrow**, and guard against a premature
  "fully live" claim before *both* arrows land — feature-design resolves exact
  wording so the two parallel features don't race the header.
- **Sequencing / two version bumps.** `emission-gate` writes `research_origin:`
  and `coordination` relies on the query flags — both must land after `fields`
  (enforced by `depends_on`). Bumps are split: agile-workflow for `fields`,
  agentic-research for the two arrows. Per CONVENTIONS/CLAUDE.md, commit feature
  changes before each `bump-version.sh` run.
- **Directionality erosion in live code.** Both arrows must stay
  reference/commission-only (the gate writes only to `.work/`; coordination only
  reads/cites `.research/`). Each feature's design pass verifies no path lets
  work write into `.research/` (ARD SPEC §1/§4.6).

## Risks
- **Cross-plugin schema coupling.** The fields live in agile-workflow but are
  populated by agentic-research. Mitigation: fields are generic/optional and
  inert when agentic-research is absent (the `gate_origin:` precedent); no hard
  dependency either direction.
- **Directionality erosion in live code.** The whole point of HANDOFF.md's
  authority-vs-coordination framing is that work must never *write* into
  `.research/`. The emission gate and the coordination tooling must both stay
  reference/commission-only. Mitigation: design each child feature against the
  invariant; the gate writes only to `.work/`, the coordination tooling only
  reads/cites `.research/`.
- **Over-coupling Arrow 1.** Making a work item *trigger* `research-orchestrator`
  risks blurring coordination into authorship. Mitigation: Arrow 1 commissions
  and cites; the research engagement runs under ARD discipline and owns its own
  record.
- **Two version bumps / sequencing.** The gate emitting `research_origin:` before
  agile-workflow recognizes the field would produce items the substrate can't
  query. Mitigation: the depends_on chain (gate/coordination depend on the
  field-additions feature) enforces order.

## Notes
Released sibling follow-on: `research-view` (the Rust query binary over
`.research/`) remains a separately-tracked drafting feature under
`epic-agentic-research` — independent of this epic; the two follow-ons do not
depend on each other.

## Realized (autopilot run)
All three child features implemented, reviewed, and `done`:
- `…-fields` (agile-workflow) — `research_refs`/`research_origin` in `Item`/parse/filter
  + `--research-origin`/`--research-refs` flags + board feed + SPEC/AGENTS/CONVENTIONS/
  ARCHITECTURE roll-forward. 3 stories; `cargo test --workspace` → 323 passed.
- `…-emission-gate` (agentic-research) — new `research-handoff` skill (Arrow 2):
  operator-confirmed, silent no-op without `.work/`, emits items with `research_origin:`
  + citation, writes only to `.work/`.
- `…-coordination` (agentic-research) — Arrow 1 commissioning convention (no new skill):
  HANDOFF Arrow 1 recipe + the `depends_on`-targets-`.work/`-id rule, orchestrator/guide
  pointers. HANDOFF.md overall status flipped to **live** (both arrows).

**Invariant held end-to-end**: directionality grep confirms zero `.research/` writes;
both arrows are commission/cite only. The epic's own dependency
(`epic-agentic-research-substrate-tier`) was done before any work started.

**Deferred to release (NOT done here)**: two version bumps — `agile-workflow` (fields)
and `agentic-research` (both arrows) — via `bump-version.sh` (user controls publication);
and rebuilding/recommitting the distributed `.work/bin/work-view` binary so the live
`--research-*` flags reach the committed CLI. Both are version-bump-time steps.
