---
id: story-propagate-v07-ten-field-registration
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

# Propagate ARD v0.7 ten-field registration (decision_relevance) into the live orchestrator + HANDOFF

## Origin

Cross-model epic review (Codex, high effort, 2026-06-25) of `epic-agentic-research`
and `epic-agentic-research-reengagement`. Verified against `ard-core` SPEC §9.
Blocker on both epics — foundation/contract drift introduced by the ARD absorption
(commits #25/#26 bumped `ard-core` to Snapshot 0.7.0 but did not propagate the v0.7
registration contract into the live plugin surface).

## The drift

The absorbed `ard-core` is at **Snapshot 0.7.0**. SPEC §9
(`plugins/agentic-research/ard-core/SPEC.md:249`) now mandates a **ten-field**
registration, always present: `intent`, `output_kind`, `consumer`,
`verification_rigor`, `temporal_contract`, `primitives_extends`,
`primitives_opts_out`, **`decision_relevance`**, plus `scope_authority` and
`analytical_artifact_type`. `decision_relevance` is the v0.7 value-of-information
gate — a free-text yield hypothesis naming the decision a finding would change;
**SPEC §9 requires a kickoff gate that it be stated before depth is set.** The
dispatch template (`ard-core/kernel/templates/dispatch.md:10`, `ARD-Version: 0.7.0`)
carries the full ten-field shape.

The live plugin surface is stale against this:
- `skills/research-orchestrator/SKILL.md:237` says "ten-field registration shape"
  (correct header) but then describes the commissioning subset as four fields
  (`scope_authority, verification_rigor, intent, output_kind`) plus "settle the
  remaining **five**" (`SKILL.md:242`). **4 + 5 = 9, not 10** — the math is off by
  one, and the missing field is exactly `decision_relevance`.
- `docs/HANDOFF.md:79` Arrow-1 describes the same four-field commissioning subset
  and "remaining five," with no `decision_relevance`.
- `grep decision_relevance plugins/agentic-research/skills/ plugins/agentic-research/docs/`
  returns **zero matches** — the field and its kickoff gate are entirely absent
  from the live orchestrator and handoff docs.

## Acceptance criteria

- The orchestrator SKILL.md and HANDOFF.md describe the v0.7 **ten-field**
  registration with the correct arithmetic (commissioning subset + remaining =
  ten), and name `decision_relevance` explicitly.
- The orchestrator's kickoff sequence enforces the §9 gate: `decision_relevance`
  (the yield hypothesis) is stated/confirmed before verification depth is set.
- The `[research]` commissioning `research_dials:` contract is reconciled: decide
  whether `decision_relevance` is a scoping-time field (carried in the block) or a
  dispatch-time field the orchestrator settles — and state it consistently in
  SKILL.md, HANDOFF.md, and `.work/CONVENTIONS.md` §Linkage / research_dials.
- `grep decision_relevance` over `skills/` + `docs/` resolves; no remaining
  "remaining five" / nine-field arithmetic.
- Conformance still passes: `python3 plugins/agentic-research/ard-core/kernel/conformance/run.py`.
- Plugin version bumped (patch) per repo convention after the fix lands.

## Notes

This is the propagation tail of the ARD absorption, not net-new design — the
contract already exists upstream in `ard-core`; the live skill/docs simply need to
catch up to v0.7. Pairs with `story-record-refresh-verification-scope` (the other
v0.7 drift blocker from the same review).
