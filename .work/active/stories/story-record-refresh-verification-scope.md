---
id: story-record-refresh-verification-scope
kind: story
stage: done
tags: [docs, skill, plugin]
parent: epic-agentic-research-reengagement
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

## Implementation notes (2026-06-25)

Wired the §221 incremental-re-verification obligation into both refresh surfaces. Parent set to
`epic-agentic-research-reengagement` (was orphaned `parent: null` — created as a blocker on that
epic in PR #27's drift-bounce review but never linked).

- **`references/refresh-reengagement.md` step 5 (verify)** — now states the stack re-runs over the
  **delta** (changed/added citation range), the prior-verified set is **grandfathered**, the
  hard-floor gates (lint + spot-check) fire over the delta, and the scope is **recorded explicitly**
  in the superseding artifact's provenance (delta re-verified + grandfathered set). Named the
  un-recorded-grandfathering / silent-whole-artifact case as the §221 defect, not a stylistic gap.
- **`references/refresh-reengagement.md` Output section** — the superseding artifact now carries a
  refresh-verification record in its provenance (what was re-checked vs inherited), per §221.
- **`SKILL.md` §Refresh step 4** — same obligation in the orchestrator's own voice (delta re-run +
  recorded delta/grandfathered set in provenance).

Grounding: the recording home is the analytical artifact's `provenance` surface (ARD SPEC §10.4 —
artifacts carry a `provenance` field + optional per-citation manifest); not conflated with the
attestation-tier `provenance:` enum. §221 wording cited verbatim as the obligation source.

**Acceptance:**
- Refresh procedure + orchestrator skill require delta-scoped verification + explicit grandfathered-
  set recording — ✅ (was absent; the story's `grep -i 'grandfather|prior-verified|verification
  scope'` returned **zero** before, now returns matches in both surfaces).
- Hard-floor gates fire over the delta, stated explicitly — ✅.
- Recorded scope is auditable; home named (superseding artifact provenance / refresh note) — ✅.
- Cross-checked against SPEC §221 wording; §221 cited — ✅.
- Conformance still passes — ✅ `57/57`.

## Review (2026-06-25)

Cross-model review (Codex, high effort, fresh context on the branch diff). Verdict: **BLOCK on one
defect**, §221 substance otherwise confirmed correct.

- **Blocker (fixed):** the record-home was underspecified — the edits said to write the scope "into
  the superseding artifact's provenance," but `provenance:` is a **required scalar enum**
  (`source-direct` / `agent-synthesis` / …, SPEC §10.4 + the convert scaffold's required contract).
  An implementer might overload that scalar and corrupt the contract. **Fix:** named a concrete,
  distinct **top-level `refresh_verification:` frontmatter field** — a sibling of the existing
  lineage predicates `supersedes` / `superseded_by` (CATALOGS §268 establishes top-level structural
  predicates as the pattern), with `delta_reverified` / `grandfathered_prior_verified` sub-keys, and
  an explicit "not a value of the scalar `provenance:` enum" caveat. Applied to all three spots
  (step 5 bullet + a YAML example, the Output section, and SKILL §Refresh step 4).
- **Confirmed correct by the reviewer:** all other §221 obligations captured (delta re-run,
  grandfathered set, explicit recording, hard-floor gates over delta, auditable scope); the two
  surfaces consistent; no blanket carry-forward over changed substrate.
- Conformance re-confirmed after the fix: **57/57**.

Acceptance (c) — "recorded scope auditable, home named" — now met concretely (was the BLOCK).
