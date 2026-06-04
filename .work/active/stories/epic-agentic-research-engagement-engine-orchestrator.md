---
id: epic-agentic-research-engagement-engine-orchestrator
kind: story
stage: done
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

## Implementation notes
- **Files created**: `skills/research-orchestrator/SKILL.md` (the SPEC-grounded engagement
  driver); `skills/research-orchestrator/references/{research-specialist,adversarial-reader,
  evaluator}.md` (dispatch role briefs); `skills/research-orchestrator/agents/openai.yaml`
  (`allow_implicit_invocation: false`).
- **Files changed**: `README.md` (Skills section now lists both skills; adoption-status
  Pending drops the now-landed engagement skills + the "Claude agents" line, since we ship
  none — inline dispatch).
- **Discrepancies from design**:
  - *Role briefs carry the operational job-lists inline* (adversarial-reader's 8 jobs,
    evaluator's 5 components) rather than only pointing at CATALOGS §4/§5. Necessary: a brief
    dispatched in an *installed* plugin has no access to upstream `CATALOGS.md`, so it must be
    functional standalone. The briefs *cite* §4/§5 as canonical but carry the runnable
    operationalization (which is CATALOGS "made concrete"). Consistent with the design — the
    thin/reference stance is for SPEC/CATALOGS *theory prose*, not a verification agent's
    runnable checklist.
  - *Orchestrator is a SPEC-grounded adaptation* (~150 lines vs the example's 182), referencing
    SPEC §N for the control-space theory and keeping the walk + dispatch mechanism + dials +
    verification stack concrete — exactly the design's intent.
- **Tests added**: none (skills are instruction prose, not executable code).
  **Verified (structural)**: orchestrator covers every SPEC-invariant-map row (§3/§5/§7/§8/§9/
  §10.1); dispatch composes [verbatim discipline] + [role brief] + [params]; `AskUserQuestion`
  absent from allowed-tools + explicitly forbidden; lint path = `scripts/lint-citations.py`;
  light/multi paths present; 3 briefs as `references/`, zero committed `agents/*.md`; evaluator
  enforces context-isolation; all relative links resolve; conformance 15/15.
  **E2E run + passed (gap now closed)**: ran a live light-path engagement following the
  orchestrator's own walk — seed "SemVer 2.0.0: stability in the 0.y.z phase", floor rigor.
  Kickoff → substrate-check → light path → attest (`WebFetch` semver.org →
  `.research/attestation/semver-spec.md`) → synthesize (`.research/analysis/briefs/semver-pre-1.0-stability.md`,
  `[semver-spec]{4}` citations + `## Disconfirming analysis`) → lint → spot-check. Lint result:
  **3/3 citations resolved · 0 broken · 0 thin · exit 0**; the citation chain resolved end to
  end (brief → handle → attestation → fetched source, `source_url` HEAD-check live). The 9
  `version-number` warns are warn-level spot-check prompts, subject-appropriate (a SemVer brief
  names version numbers) and each in cited/structural context. Artifacts kept (they ground
  `docs/VERSIONING.md`'s pre-1.0 claim) + `references.md` entry 4 added.
- **Adjacent issues parked**: none.

## Review (approve · fast-lane)
Verdict: **Approve** — all acceptance criteria met: structural (orchestrator covers every
SPEC-invariant-map row, inline dispatch composes the verbatim discipline, zero committed
`agents/*.md`, evaluator isolation, links resolve) **plus the live E2E** recorded above (3/3
citations resolved · 0 broken · exit 0; chain resolves end to end). Re-confirmed on the
committed state: files present, E2E brief lints clean, conformance 15/15, tree clean. The
substantial authored skill surface gets its deep pass at the feature-level review that
follows. Advance review → done.
