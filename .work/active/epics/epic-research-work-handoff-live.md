---
id: epic-research-work-handoff-live
kind: epic
stage: drafting
tags: [skill, tooling]
parent: null
depends_on: [epic-agentic-research]
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
  `parent: null`, `depends_on: [epic-agentic-research]`. Matches HANDOFF.md's
  and the parent epic's "named follow-on epic" framing: the ARD-adoption
  proposal PR is deliberately closed around 6/7 features + the *designed*
  handoff, and ships independently. This live work is its own arc that builds on
  the landed `.research/` tier and the documented contract — not a reopening of
  the proposal's scope.
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

## Candidate decomposition (for epic-design)
Not binding — `epic-design` owns the realized split. A likely shape:
- **Field additions (agile-workflow)** `[tooling, docs]` — add `research_refs:` /
  `research_origin:` as first-class optional `.work/` fields; document in
  CONVENTIONS.md + the SPEC frontmatter contract; teach `work-view` to query
  them. depends_on: `[]` (within this epic) — the schema foundation.
- **Arrow 2 emission gate (agentic-research)** `[skill]` — the operator-confirmed
  `.research/` → `.work/` emission gate/skill, backlog-default, silent no-op
  without `.work/`, emitted items carry `research_origin:` + citation.
  depends_on: the field-additions feature.
- **Arrow 1 coordination (agentic-research + agile-workflow)** `[skill, tooling]`
  — the work-item-commissions-research ergonomics (`research_refs:`,
  `depends_on` a research output, `work-view` linkage queries). depends_on: the
  field-additions feature.

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
