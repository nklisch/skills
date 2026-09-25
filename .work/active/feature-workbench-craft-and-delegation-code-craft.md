---
id: feature-workbench-craft-and-delegation-code-craft
kind: feature
status: active
parent: epic-workbench-craft-and-delegation
created: 2026-09-25
updated: 2026-09-25
tags:
  - skill
---
# Add a code-craft skill with named pathologies and the structure lens

A new `code-craft` skill gives agents one home for code quality while they
design, implement, and review in a Workbench-adopted repository.

Scope:

- `skills/code-craft/SKILL.md`: the stance (ceremony that hides the algorithm
  is the problem, not length), the working habits (find the repository's
  existing model first, design an abstraction with its first consumer, extract
  a block the second time it appears in your own change, name the pathology in
  review), and how to use the repository's pathology catalog.
- `references/pathologies.md`: general pathologies with memorable names,
  symptom, fix, and whether the fix is mechanical or needs design; worded for
  any language; no project examples.
- `work/references/structure.md` moves to `skills/code-craft/references/`.
  Structure questions that describe a named pathology point to it, and the
  "looks complex but is fine" guidance lives in one idiom table.
- The repository catalog shape: at most three current examples and one model
  to copy per pathology, one line per example, fixed examples deleted unless
  they become the model, pathologies with no live examples dropped, local-only
  pathologies named.
- Design lenses, review, spec, README, and `agents/openai.yaml` updated.

Excluded: game- or engine-specific pathologies; any project's examples.

Acceptance: the skill loads with valid portable frontmatter; design and review
link to it; no link to `work/references/structure.md` remains; the catalog
rules are stated once.
