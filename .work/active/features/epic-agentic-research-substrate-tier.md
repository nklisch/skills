---
id: epic-agentic-research-substrate-tier
kind: feature
stage: drafting
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
