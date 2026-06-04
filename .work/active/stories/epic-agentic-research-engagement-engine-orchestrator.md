---
id: epic-agentic-research-engagement-engine-orchestrator
kind: story
stage: implementing
tags: [skill]
parent: epic-agentic-research-engagement-engine
depends_on: [epic-agentic-research-engagement-engine-discipline]
release_binding: null
gate_origin: null
created: 2026-06-04
updated: 2026-06-04
---

# research-orchestrator skill + role briefs (the engine)

## Scope
The authored engagement engine — Units 4–6 of the parent feature design. Depends on
the `-discipline` story: the orchestrator inlines that skill's verbatim bundle into
each dispatch and references the vendored `dispatch.md` template.

## Units (see parent feature body for full specs + the SPEC-invariant map)
- **Unit 4 — `skills/research-orchestrator/SKILL.md`**: `user-invocable: true`,
  `allowed-tools` incl. `Agent`, `model: opus`. SPEC-grounded walk honoring §3/§7/§8/§9/
  §10.1 — kickoff dial-setting (conversational HITL, NOT `AskUserQuestion`), activation-
  profile, the §10.1 decision-graph, the §7 verification stack at dialed `verification_rigor`,
  §9 registration, fan-out via inline Task dispatch. References ARD SPEC §N for theory;
  concrete on walk + dispatch + checkpoints. Paths: `scripts/lint-citations.py`, `.research/`.
- **Unit 5 — `skills/research-orchestrator/references/{research-specialist,adversarial-reader,evaluator}.md`**:
  role briefs the orchestrator inlines into Task dispatches (NOT `agents/*.md`). Grounded in
  SPEC §7 + CATALOGS §4 (adversarial jobs) / §5 (evaluator components); evaluator enforces
  context-isolation (sees only synthesis + seed — FR.1). Each references the inlined
  discipline; none duplicates its text.
- **Unit 6 — Codex polish + README**: `skills/research-orchestrator/agents/openai.yaml`
  (`policy: { allow_implicit_invocation: false }`); update `README.md` to list the two
  shipped skills (drop "Skills: None yet" + the skills from "Pending").

## Acceptance criteria
- [ ] Orchestrator honors every row of the parent's SPEC-invariant map; references SPEC §N for theory (no re-narration of the control-space model)
- [ ] Dispatch composes [verbatim discipline bundle] + [role brief] + [params] into each Task prompt (discipline arrives by inlining, SPEC §5); `AskUserQuestion` not used; lint path = `scripts/lint-citations.py`
- [ ] Light path (0–1 facet) authors inline; multi path (2+) fans out parallel Task calls
- [ ] 3 role briefs as `references/`; none as `agents/*.md`; each grounds jobs/components in CATALOGS §4/§5; evaluator enforces isolation
- [ ] `openai.yaml` present; README lists `research-orchestrator` + `research-discipline`
- [ ] A trial seed engagement produces `.research/` artifacts that pass `scripts/lint-citations.py`
