---
id: story-reframe-research-dials-commissioning-subset
kind: story
stage: done
tags: [docs, plugin]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-25
updated: 2026-06-25
---

# Reframe the four-field research_dials block as the "commissioning subset" across cross-plugin surfaces

## Origin

Plan peer review (Codex, high effort, 2026-06-25) of the v0.7 ten-field registration
propagation (`story-propagate-v07-ten-field-registration`). Split out as a separate,
lower-severity follow-on: the surfaces below describe the four-field `research_dials:`
block as "the registration." That phrasing is **defensible** (on a `[research]` work
item the block genuinely is that item's registration carrier — the four fields are the
scoping subset), so it is **not** the v0.7 contract blocker the propagation story fixed.
But against the now-corrected ten-field framing it reads as imprecise, and one surface
regenerates another, so it is worth a consistency pass.

## The imprecision (cross-plugin — outside the agentic-research plugin)

These call the four-field block "the [engagement] registration" without the
"commissioning subset" qualifier the agentic-research surface now uses:

- `AGENTS.md:203` (root) — "carries the engagement registration in a `research_dials:`
  block (scope_authority, verification_rigor, intent, output_kind)".
- `README.md:154` (root) — the routing table's `agentic-research:research-orchestrator`
  row: "Reads the item's `research_dials:` registration block (…four fields)".
- `plugins/agile-workflow/skills/convert/SKILL.md:~551-567` — the schema + tag-semantics
  template the `convert` skill writes into an adopter's AGENTS.md. **This regenerates the
  AGENTS.md text**, so editing AGENTS.md alone would drift back on the next `convert` run —
  the template is the source of truth and must be edited too.

## Acceptance criteria

- Each surface above reframes "the registration" → "the **commissioning subset** of the
  registration" (or equivalent), making clear the four fields are the scoping subset, not
  the full ten-field shape. Minimal wording change — do NOT restate all ten fields in these
  cross-plugin mentions (that is agentic-research's surface to carry, not root docs or the
  convert template).
- The `convert` SKILL.md template is edited (not just AGENTS.md), and AGENTS.md is updated to
  match so current state and regen agree.
- `decision_relevance` is NOT added to these four-field descriptions — it is a dispatch-time
  field, not a `research_dials` block field (settled on the propagation story).
- If `convert` is bumped, follow the repo's commit-before-bump discipline; note this touches
  the **agile-workflow** plugin, so it is a separate version bump from agentic-research.

## Notes

Deferred from `story-propagate-v07-ten-field-registration` on a scope call (2026-06-25):
that story fixed Drift 1 (the flatly-wrong "remaining five" arithmetic + the missing
`decision_relevance` kickoff gate, all inside the agentic-research plugin). This story is
Drift 2 (defensible-but-imprecise phrasing, cross-plugin). Keeping them separate avoids
folding an agile-workflow plugin bump into a v0.7-contract PR.

## Done (2026-06-25) — absorbed into PR #28

Not done as separate deferred work: PR #28's multi-model reviewer requested this reframe be
fixed in-PR (the convert template regenerates AGENTS.md, so the stale wording would recur on
next bootstrap). Operator chose to fold it in. Commit `5292266` on branch
`feat/v07-ten-field-registration-propagation`; agile-workflow bumped 0.14.11 → 0.14.12.

Reframed "the registration [block]" → "the commissioning subset of the registration (the four
scoping fields …)" across AGENTS.md, README.md, agile-workflow `docs/SPEC.md`,
`skills/convert/SKILL.md` (schema note + the embedded tag-semantics block — the regen source),
and `skills/feature-design/SKILL.md`. Left `autopilot:166` + `feature-design:24` unchanged
(epic-vs-feature contrast, not the four-field-block-as-full-registration imprecision).

Cross-model reviewed (Codex, approve, no findings): regen parity between the convert template
and AGENTS.md confirmed, so the drift will not recur.
