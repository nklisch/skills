---
id: epic-agentic-research-work-handoff
kind: feature
stage: drafting
tags: [docs]
parent: epic-agentic-research
depends_on: [epic-agentic-research-substrate-tier]
release_binding: null
gate_origin: null
created: 2026-06-03
updated: 2026-06-03
---

# research→work handoff (designed + documented, not live)

## Brief
Design and document — but do NOT implement live, per the epic's tier-pairing
strategic decision — the research→work handoff that makes `.research/` pair with
`.work/`. Specify how a research engagement's output (e.g. an `analysis/` position
or campaign carrying `output_kind: adoption-recommendations`) can emit `.work/`
items gate-style, degrading gracefully to a no-op when no work substrate is
present (precedent: `repo-eval` files `.work/` items only when a substrate
exists). Capture the contract: which research artifact triggers a handoff, the
`.work/` item shape it produces, the directionality guard (analysis informs
operational decisions, never the reverse — ARD's substrate cleavage), and the
graceful-absence behavior.

The deliverable is a design/spec document in the plugin docs, not working code —
it is the first-class "pairing story" for the proposal without the integration
risk of a live implementation. Live implementation is an explicit follow-on epic.

Does NOT cover: live handoff code, or any change to `.work/`'s own tooling.

## Epic context
- Parent epic: `epic-agentic-research`
- Position in epic: consumer of `epic-agentic-research-substrate-tier`; the
  documented `.work/` pairing. Parallel with `research-view`.

## Foundation references
- `/tmp/ARD/SPEC.md` — §1 substrate cleavage + directionality; registration `output_kind`
- `AGENTS.md` — Agile-Workflow Substrate section (`.work/` item shape)
- `plugins/nates-toolkit/skills/repo-eval/` — graceful cross-tier-degradation precedent
- `epic-agentic-research-substrate-tier` — the tier this hands off from
