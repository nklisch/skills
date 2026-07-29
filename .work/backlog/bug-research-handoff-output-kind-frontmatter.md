---
id: bug-research-handoff-output-kind-frontmatter
created: 2026-07-23
updated: 2026-07-23
tags: [bug, plugin]
---

# research-handoff reads output_kind from artifact frontmatter; SPEC §9 says registration is dispatch-time

## Symptom

`plugins/agentic-research/skills/research-handoff/SKILL.md` looks for
`output_kind` in the **artifact's frontmatter** when resolving a completed
engagement's source artifacts.

SPEC §9 (registration contract) is explicit: "Registration is dispatch-time,
not artifact-time" — the ten registration fields live in the dispatch /
commissioning item, and the orchestrator does not copy them into output
artifact frontmatter.

So handoff's lookup reads a field that conformant engagements never write. It
happens to work only where authors leaked registration fields into artifacts
anyway.

## Context

Found during the `epic-ard-okf-representation-convergence` plugin audit
(2026-07-23). Update 2026-07-29: that convergence program (and its Q3
registration-ceremony review) was retired unshipped when agentic-research
entered maintenance — this stands as maintenance errata: fix when
research-handoff is next touched, or document as a known limitation.
