---
id: feature-skilltap-removal-write-tool-skill
kind: story
stage: implementing
tags: [plugin]
parent: feature-skilltap-removal
depends_on: []
release_binding: null
gate_origin: null
created: 2026-05-30
updated: 2026-05-30
---

# Remove the tap.json-generation capability from write-tool-skill

## Scope
`write-tool-skill` (nates-toolkit) currently includes a phase that generates a
`tap.json` entry when publishing a skill to a tap. Per the literal-total-scrub
decision, remove that capability so the skill targets `SKILL.md` + marketplace
authoring only.

## Files
- `plugins/nates-toolkit/skills/write-tool-skill/SKILL.md` (4) — remove
  "Phase 6: Generate tap.json entry" and any references to it; renumber the
  remaining phases; remove the `tap.json entry` line from the outputs list.
- `plugins/nates-toolkit/skills/write-tool-skill/references/spec-quick-ref.md` (2)
  — remove tap.json references.

## Acceptance
- [ ] `rg -i 'skilltap|tap\.json' plugins/nates-toolkit/skills/write-tool-skill/`
      → no matches.
- [ ] Phase numbering is contiguous and the workflow reads coherently without
      the removed phase.

## Notes
This is a behavior change to a product skill (a capability is removed), so it
bumps nates-toolkit via `scripts/bump-version.sh` at release. Tradeoff accepted:
skilltap-tap authors lose this skill's tap.json help.
