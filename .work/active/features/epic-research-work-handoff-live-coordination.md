---
id: epic-research-work-handoff-live-coordination
kind: feature
stage: implementing
tags: [skill, docs]
parent: epic-research-work-handoff-live
depends_on: [epic-research-work-handoff-live-fields]
release_binding: null
gate_origin: null
created: 2026-06-04
updated: 2026-06-04
---

# Arrow 1 — `.work/` → `.research/` commissioning convention (the primary entry)

## Brief
Make Arrow 1 of the HANDOFF.md contract live as a **convention, not a new
skill** (locked design decision — see parent epic). A work item that needs
grounding can commission and track a research engagement: it triggers the
existing `research-orchestrator`, **references** the resulting `.research/`
artifacts via `research_refs:`, and may `depends_on` the research output so it
stays blocked until the grounding exists. The work item *awaits* and *cites* —
it never writes into `.research/` (authority stays with the research tier).

Per the locked decisions, this feature is **convention + fields + query**, with
**no new executable skill**: commissioning reuses the existing
`research-orchestrator` invocation, the linkage fields and the
`--research-refs` / `--research-origin` query flags are delivered by the
`fields` feature, and this feature wires the *workflow* around them. Concretely,
its deliverables are documentation/convention surface:
- The documented commissioning workflow — how a work item commissions, tracks,
  references (`research_refs:`), and `depends_on`-s a research engagement, and
  cites the artifact in its body — landed where operators will find it
  (HANDOFF.md Arrow 1 + a pointer from the agile-workflow guide and/or
  `research-orchestrator`'s SKILL.md "work-coordination entry" note).
- The HANDOFF.md / parent-epic foundation roll-forward for **Arrow 1**: flip the
  Arrow 1 line (and, if Arrow 2 is already done, the overall "Status — designed,
  not live" header) to live; update the parent `epic-agentic-research` follow-on
  note. (See the parent epic's decomposition-risk note: flip per-arrow, avoid a
  premature "fully live" claim.)

Kept deliberately light to honor the parent epic's **over-coupling risk**:
Arrow 1 commissions and cites; it does not blur coordination into authorship.
The research engagement runs under ARD discipline and owns its own record.

Does NOT cover: the schema/flags (the `fields` feature owns them — this feature
*uses* them); a new commissioning skill/command (explicitly out per the locked
"no new skill" decision); the Arrow 2 emission gate (separate feature).

## Epic context
- Parent epic: `epic-research-work-handoff-live`
- Position in epic: consumer of `epic-research-work-handoff-live-fields` —
  relies on `research_refs:` and the `--research-refs` / `--research-origin`
  query flags that feature ships, so it lands **after** the schema exists.
  Independent of the `emission-gate` feature → the two parallelize once `fields`
  is done.
- Spans the `agentic-research` doc surface (HANDOFF, `research-orchestrator`
  note) → an `agentic-research` version bump (or a shared bump with
  `emission-gate` at release time). No `work-view` code changes here — the query
  lives in `fields` per the locked decision.

## Foundation references
- `plugins/agentic-research/docs/HANDOFF.md` — "Arrow 1 — `.work/` →
  `.research/` (coordination; the primary entry)" + "Directionality guard": the
  contract this feature makes live, and the invariant it must not erode.
- `plugins/agentic-research/skills/research-orchestrator/SKILL.md` — the
  engagement entry point a work item commissions (reused as-is; no new skill).
- `epic-research-work-handoff-live-fields` — the `research_refs:` field + the
  `--research-refs` / `--research-origin` query flags this convention relies on.
- ARD SPEC §1 / §4.6 / §10.2 — the substrate cleavage + down-gradient
  directionality the commissioning convention must preserve (work commissions
  and cites; it never authors into `.research/`).

## Design decisions
Resolved at design time (the epic locked "convention + fields + query, no new
skill"; these pin the convention's mechanics):
- **`depends_on` targets a `.work/` commissioning item, NOT a `.research/` slug.**
  `work-view`'s `deps_satisfied` resolves dep ids only against `.work/` items
  (`graph.rs`: unknown id → `unwrap_or(false)` → non-terminal → **blocked
  forever**). So a bare `.research/` slug in `depends_on` would permanently block
  the item. The convention: to gate work on grounding, `depends_on` a `.work/`
  commissioning story (a real id) that tracks the research task; cite the
  resulting `.research/` artifact via `research_refs:`. HANDOFF's "may depends_on
  the research output" is realized this way — the `.work/` item is the gateable
  proxy; the `.research/` artifact is the cited grounding.
- **`research_refs:` is set once the artifact exists** (the citation), and is the
  queryable link (`work-view --research-refs <slug>`, from the fields feature).
- **Authoritative home: HANDOFF.md Arrow 1**; the agile-workflow guide gets a
  one-line pointer. No new skill — commissioning reuses `research-orchestrator`.

## Architectural choice
A **documentation/convention** feature — no executable surface of its own. It
makes Arrow 1 real by (a) writing the concrete commissioning recipe into the
authoritative contract doc and (b) flipping the foundation status. It *uses* the
linkage fields + query the `fields` feature ships; it adds no `work-view` code
and no skill. Chosen over a dedicated commissioning skill (the locked "no new
skill" decision; honors the over-coupling risk — commissioning must not blur into
authoring the research record).

## Implementation Units
Single-stride, one author — no child stories (cohesive doc/convention edits).

### Unit 1: HANDOFF.md Arrow 1 → live (the commissioning recipe)
**File**: `plugins/agentic-research/docs/HANDOFF.md`
- Expand the **Arrow 1** section from contract to live convention: the concrete
  recipe — operator runs `research-orchestrator` for the grounding question;
  optionally tracks it as a `.work/` commissioning story; the grounded work item
  sets `research_refs: [<slug>]` (cite) and, to gate, `depends_on:
  [<commissioning-work-item-id>]` (**a `.work/` id, never a `.research/` slug** —
  state the reason: unknown ids block forever).
- Flip the Arrow 1 status to live. Flip the overall **"Status — designed, not
  live"** header to fully-live **only if** the Arrow 2 emission-gate feature has
  also landed (per the parent epic's per-arrow roll-forward note — coordination
  owns the header; guard against a premature "fully live" claim).
**Acceptance**: Arrow 1 documents the commissioning recipe with the
`depends_on`-targets-`.work/` rule explicit; status flipped per-arrow with the
guard; directionality invariant restated (work cites/commissions; never writes
`.research/`).

### Unit 2: pointers — agile-workflow guide + orchestrator note + parent epic
**Files**: `docs/agile-workflow-guide.md`,
`plugins/agentic-research/skills/research-orchestrator/SKILL.md`,
`.work/active/epics/epic-agentic-research.md`
- agile-workflow guide: one-line pointer — "to ground a work item in research,
  commission via `research-orchestrator` and cite with `research_refs:`; see
  agentic-research `docs/HANDOFF.md`."
- `research-orchestrator`: a brief "work-coordination entry" note — a `.work/`
  item may commission an engagement and cite it back via `research_refs:`.
- Parent epic `epic-agentic-research` follow-on note: mark the live handoff as
  landed (Arrow 1 portion; full when Arrow 2 also lands).
**Acceptance**: pointers resolve; no duplication of the authoritative recipe
(HANDOFF.md is the single source); parent epic follow-on note updated.

## Implementation Order
1. Unit 1 — HANDOFF.md Arrow 1 + per-arrow status flip.
2. Unit 2 — guide/orchestrator/epic pointers.
Then the `agentic-research` version bump (after review/done; commit before
`bump-version.sh`). May share a bump with `emission-gate` if they land together.

## Testing
Docs/convention — verified by inspection:
- **Model-correctness**: the recipe never instructs putting a `.research/` slug
  in `depends_on`; it routes gating through a `.work/` commissioning item.
  Cross-check against `work-view` behavior (`--research-refs <slug>` queries the
  citation; deps resolve only `.work/` ids).
- **Directionality**: the convention has no step where work writes into
  `.research/`; all cross-tier action is cite/commission.
- **Per-arrow status**: HANDOFF header claims "fully live" only when both arrow
  features are done; all cross-links resolve.

## Risks
- **Over-coupling / authorship blur** (the epic's named Arrow-1 risk). Mitigation:
  convention-only, no skill; commissioning reuses `research-orchestrator`, which
  owns the research record under ARD discipline.
- **`depends_on` misuse** — an operator putting a `.research/` slug in
  `depends_on` and getting a permanently-blocked item. Mitigation: the recipe
  states the rule explicitly with the reason; this is the central correctness note.
- **Premature "fully live" header.** Mitigation: per-arrow flip with the guard
  (Unit 1); coordination + emission-gate are siblings, so whichever lands second
  flips the overall header.
