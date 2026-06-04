---
id: epic-research-work-handoff-live-coordination
kind: feature
stage: drafting
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

<!-- The design pass (/agile-workflow:feature-design) defines the exact doc
edits, where the commissioning convention lives, the worked example, and how to
verify the directionality invariant holds (no path where work writes into
.research/). -->
