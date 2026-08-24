---
id: story-sol-calibration-stop-boundaries
kind: story
status: active
tags: [plugin, skill]
parent: null
blocked_by: []
related_to: []
research_refs: []
mock_refs: []
created: 2026-08-23
updated: 2026-08-23
---

# Add optional stop-boundaries module to sol-calibration

Sol often needs reasonable stop boundaries. Add an optional, user-approved
section to the calibrate-posture managed block: before starting an ambiguous
task where the user should likely clarify things first, the agent asks the
user when it should stop and what to clarify — instead of charging ahead.

Opt-in because pre-task questions are friction some users don't want; the
interview offers it, the user approves or declines, and the block records the
choice. proportionality-check's disposition pass honors it when present.

Design is inline: small additive section to `calibrate-posture` (interview
offer + block template), one question in the interview guide, one line in
`proportionality-check`'s disposition pass. Then a patch version bump per
repo rules.

## Acceptance

- Stop boundaries appear in the posture block only when the user approved
  them in the interview; the block records the approved or declined state.
- The behavior is scoped: ambiguous tasks with likely user-clarifiable
  unknowns — not a prompt to interrogate every task.
- `proportionality-check` references the stop-boundaries section when a
  posture block contains one.
