---
id: story-record-refresh-verification-scope
kind: story
stage: implementing
tags: [docs, skill, plugin]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-25
updated: 2026-06-25
---

# Record the refresh verification scope / grandfathered set (ARD v0.7 §221)

## Origin

Cross-model epic review (Codex, high effort, 2026-06-25) of
`epic-agentic-research-reengagement`. Verified against `ard-core` SPEC.
Blocker on the reengagement epic — release-readiness gap on the refresh primitive.

## The drift

ARD v0.7 SPEC (`plugins/agentic-research/ard-core/SPEC.md:221`, "Incremental
re-verification on refresh") requires: when a refresh re-authors an existing
artifact, the verification stack re-runs over the **changed or added substrate**
(the new/revised citation range), not the whole artifact; **the prior-verified set
is grandfathered, recorded explicitly so the verification scope stays auditable.**
The SPEC names the failure it fences: *"A silent whole-artifact re-verification
claim, or un-recorded grandfathering, is the failure this fences."*

The live refresh procedure
(`skills/research-orchestrator/references/refresh-reengagement.md:147`, "The
re-authoring walk") resumes the normal walk over the *current* substrate and notes
"the prior's old verdicts do not carry forward" — but **does not require recording
the grandfathered prior-verified set or the verification scope**. `grep -i
'grandfather|prior-verified|verification scope'` over the refresh procedure returns
zero. So a refresh today can silently re-verify (or silently grandfather) without
an auditable scope record — exactly the v0.7 failure shape.

## Acceptance criteria

- The refresh re-authoring walk (`refresh-reengagement.md` step 5 / verify, and
  the orchestrator SKILL §Refresh re-engagement) requires the verification stack to
  run over the **delta** (changed/added substrate) and to **record explicitly**
  which prior-verified set is grandfathered and what scope was re-verified.
- The hard-floor gates still fire over the delta (per SPEC §221) — make that
  explicit in the procedure.
- The recorded scope is auditable: name where it is written (the superseding
  artifact's provenance / a refresh note), so a reader can see "verified the delta,
  grandfathered set X."
- Cross-check against SPEC §221 wording; cite the §221 obligation the procedure
  implements.
- Conformance still passes: `python3 plugins/agentic-research/ard-core/kernel/conformance/run.py`.

## Notes

Pairs with `story-propagate-v07-ten-field-registration` — both are v0.7-absorption
propagation drift surfaced by the same cross-model review. The LENS-not-substrate
guard (§4.6) in the same procedure was independently verified as solid by both the
host and the peer reviewer; this story does not touch it.
