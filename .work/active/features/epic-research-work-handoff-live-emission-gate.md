---
id: epic-research-work-handoff-live-emission-gate
kind: feature
stage: drafting
tags: [skill]
parent: epic-research-work-handoff-live
depends_on: [epic-research-work-handoff-live-fields]
release_binding: null
gate_origin: null
created: 2026-06-04
updated: 2026-06-04
---

# Arrow 2 — `.research/` → `.work/` emission gate (operator-confirmed)

## Brief
Make Arrow 2 of the HANDOFF.md contract live: a completed research engagement
carrying actionable findings can **emit `.work/` items gate-style**. A new
`agentic-research` skill/gate that, when a research engagement surfaces something
operational — a campaign or position carrying `output_kind:
adoption-recommendations`, a staged hypothesis to validate, a recommendation to
implement — proposes `.work/` items, **operator-confirmed**, mirroring
`repo-eval`'s emission precedent exactly. Each emitted item carries
`research_origin:` (the source campaign/position slug, recognized by the schema
the `fields` feature ships) plus a body citation back to the grounding artifact.

Behavioral contract, all inherited from established precedent:
- **Operator-confirmed via `AskUserQuestion`** — never a silent automatic write
  (repo-eval Phase 4 / "agile-workflow gates produce items" precedent).
- **Default target `.work/backlog/`** (lowest commitment); active stories or
  features only when scope warrants.
- **Silent no-op without `.work/`** — if no `.work/CONVENTIONS.md` is present,
  skip emission silently (repo-eval: "if no substrate exists, skip this phase
  silently"). The plugin's research capability stays fully usable standalone.
- **Reference-only, directionality preserved** — the gate writes only to
  `.work/`; it never writes into `.research/`. Research informs work; work never
  rewrites the research record (ARD SPEC §1/§4.6).

Owned by `agentic-research` → an `agentic-research` version bump, separate from
the `fields` feature's agile-workflow bump.

Does NOT cover: the `.work/` schema/flags (the `fields` feature owns those —
this feature *populates* `research_origin:` and assumes the substrate already
recognizes it); the Arrow 1 commissioning convention (separate feature).

## Epic context
- Parent epic: `epic-research-work-handoff-live`
- Position in epic: consumer of `epic-research-work-handoff-live-fields` — emits
  items carrying `research_origin:`, so it must land **after** the schema
  recognizes the field (else it would produce items the substrate can't query).
  Independent of the `coordination` feature → the two parallelize once `fields`
  is done.
- Implements the parent epic's foundation roll-forward for **Arrow 2 only**: flip
  HANDOFF.md's Arrow 2 / "Status — designed, not live" line to live for this
  arrow (see the parent epic's decomposition-risk note on avoiding a premature
  "fully live" claim before both arrows land).

## Foundation references
- `plugins/agentic-research/docs/HANDOFF.md` — "Arrow 2 — `.research/` → `.work/`
  (grounding; emission)" and "Graceful degradation": the contract this feature
  implements.
- `plugins/nates-toolkit/skills/repo-eval/SKILL.md` — the cross-tier
  graceful-degradation + operator-confirmed emission precedent (the
  `AskUserQuestion` checkpoint, `.work/CONVENTIONS.md` presence test, backlog
  default, "skip this phase silently").
- agile-workflow `gate-*` skills + `gate_origin:` — the gate-style item-emission
  precedent `research_origin:` mirrors (a research engagement as a "grounding
  gate" over `.work/`).
- `plugins/agentic-research/skills/research-orchestrator/SKILL.md` +
  `references/` — the engagement entry point this gate hangs off; the
  `output_kind` registration that signals "actionable."
- `epic-research-work-handoff-live-fields` — the schema/flag feature that must
  land first so emitted `research_origin:` is first-class.

<!-- The design pass (/agile-workflow:feature-design) defines the skill surface,
the trigger (which output_kind / engagement state fires the gate), the
AskUserQuestion shape, the emitted item template, and the test approach. -->
