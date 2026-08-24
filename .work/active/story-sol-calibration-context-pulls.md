---
id: story-sol-calibration-context-pulls
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

# Name context pulls during calibrate-posture interview

Even with a posture block in AGENTS.md, other context can over-index the
agent toward a heavier posture: domain vocabulary (medical, finance, legal,
"formal verification", "invariant", "compliance"), heavy test/CI
infrastructure, harness- or plugin-injected instructions, existing AGENTS.md
rigor rules, long-session drift. The interview should name these pulls to
the user and record approved counterweights in the block, so the posture
holds against its own context instead of silently losing to it.

Design is inline: one short section in `calibrate-posture` (identify + name
pulls, ask which to counterweight), a counterweights line in the block
template, one question in the interview guide. Patch bump per repo rules.

## Acceptance

- The interview names concrete, repo- and session-specific pulls — not a
  generic lecture about bias.
- Counterweights land in the block only for pulls the user explicitly
  chooses to override; acknowledged-but-kept pulls stay out.
- The posture block template shows where counterweights live.
