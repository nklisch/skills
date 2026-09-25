---
id: feature-workbench-craft-and-delegation-sub-agents
kind: feature
status: active
parent: epic-workbench-craft-and-delegation
created: 2026-09-25
updated: 2026-09-25
tags:
  - skill
---
# Consolidate sub-agent guidance into one reference

`work/references/sub-agents.md` becomes the single reference for using other
agent contexts: when to use one (execution postures), choosing models, what to
hand over, what each role may write, no nesting, handling returned work, and
what to do when an agent is unavailable or not allowed.

Scope:

- Absorb `execution-posture.md`, `role-handoffs.md`, `model-tendencies.md`,
  and the delegation paragraphs of `execution.md`; fold in the scan dispatch
  contract and backlog-grooming helper rules that repeat the shared rules.
- Each skill keeps a very short line for the rules that matter most, plus a
  link to the reference.
- A user or project rule that forbids spawning is handled like an unavailable
  agent: review inline and disclose that it was not independent.
- `delivery-topology.md`, `model-notes.md`, and the coordination parts of
  `execution.md` stay, linking to the new reference.
- The managed `AGENTS.md` template names the new reference.

Excluded: user-specific rules, model names, or harness tool names.

Acceptance: no link to the three retired files remains; every skill that can
dispatch links to `sub-agents.md`; the managed template and this repository's
managed block agree.
