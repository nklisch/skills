---
id: epic-workbench-craft-and-delegation
kind: epic
status: active
created: 2026-09-25
updated: 2026-09-25
tags:
  - skill
---
# Give Workbench a code-craft skill, one sub-agent reference, and catalog upkeep at large reviews

Workbench gains the general code-quality guidance that grew inside a consuming
game engine, consolidates how agents use other agent contexts into one
reference, keeps each repository's pattern catalog current at large review
boundaries, and makes the machinery forecast a proactive design step.

Features:

- [feature-workbench-craft-and-delegation-code-craft](feature-workbench-craft-and-delegation-code-craft.md)
- [feature-workbench-craft-and-delegation-sub-agents](feature-workbench-craft-and-delegation-sub-agents.md)
- [feature-workbench-craft-and-delegation-catalog-pass](feature-workbench-craft-and-delegation-catalog-pass.md)
- [feature-workbench-craft-and-delegation-machinery-forecast](feature-workbench-craft-and-delegation-machinery-forecast.md)

Cross-feature decisions:

- Workbench names no consuming project and no other plugin. Examples are
  generic.
- Nothing user-specific ships: no model names, harness tool names, or personal
  rules. User and project instructions override Workbench defaults.
- The pathology catalog of a repository lives at
  `.agents/skills/patterns/references/pathologies.md`; the code-craft skill owns
  its entry shape and limits, and maintenance owns when it is written.

Integrated acceptance: the four features are delivered; every Markdown link
inside the Workbench plugin resolves; `validate-workbench.py .` and the
Workbench script tests pass; the Workbench README and spec describe the new
skill, reference, and catalog timing.
