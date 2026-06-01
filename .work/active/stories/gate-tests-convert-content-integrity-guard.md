---
id: gate-tests-convert-content-integrity-guard
kind: story
stage: implementing
tags: [testing]
parent: null
depends_on: []
release_binding: 0.9.0
gate_origin: tests
created: 2026-05-31
updated: 2026-05-31
---

# Structural guard test: convert destructive sites reference the content-integrity gate; family skills ground on .agents/rules

## Priority
Low

## Spec reference
Items: `epic-agents-rules-autoload-convert-safety`,
`epic-agents-rules-autoload-skill-grounding`
Acceptance criterion: "before any destructive op, verify the content is present
at its canonical replacement" (enforced across destructive sites in
convert/SKILL.md); skill-grounding: "each enumerated skill's grounding phase now
reads `.agents/rules/*.md`."

## Gap type
missing test for invariant (structural guard)

## Detail
These are markdown-skill edits where read-through is the primary test, but two
invariants are cheaply machine-checkable and currently unguarded: (a) the
content-integrity gate is defined and referenced near destructive verb sites in
`convert/SKILL.md`; (b) the enumerated design/implement/review-family skills
contain the `.agents/rules/*.md` grounding line. A future edit could silently
drop one. `convert-install-routing.test.sh` already demonstrates the
prose-assertion pattern in this repo, so a structural grep test is idiomatic.

## Suggested test
```bash
# scripts/tests/convert-content-integrity.test.sh
# assert convert/SKILL.md defines the content-integrity gate once AND each destructive
#   keyword block (git rm | git mv | shim | symlink | mirror replace | managed-section overwrite)
#   sits near a "content-integrity" reference
# assert the enumerated family SKILL.md files contain "agents/rules" in a grounding phase
```

## Test location (suggested)
new `plugins/agile-workflow/scripts/tests/convert-content-integrity.test.sh`
