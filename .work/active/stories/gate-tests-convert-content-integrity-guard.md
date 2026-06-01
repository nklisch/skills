---
id: gate-tests-convert-content-integrity-guard
kind: story
stage: done
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

## Implementation notes

Test file: `plugins/agile-workflow/scripts/tests/convert-content-integrity.test.sh`
(new). Structural grep guard in the prose-assertion style of
`convert-install-routing.test.sh`. Anchors were taken from the ACTUAL current
content of the files (verified by reading), not invented.

Assertions (42, exit 0):
- (a) `convert/SKILL.md`: the canonical gate-definition line
  "Content-integrity gate (before any destructive op)" appears exactly once;
  the gate is stated as a "hard precondition, not advice"; the gate block
  enumerates each governed op kind (git rm/delete, git mv/move,
  replace-with-symlink, replace-with-shim, managed-section overwrite, mirror
  replacement); the Hard-rules summary restates "Content integrity is mandatory
  before every destructive op".
- (a, proximity) every destructive-op site (matched on this skill's operative
  phrasings: shim/removal, managed-section overwrite, mirror replacement,
  source-eliminating op, "replace the file with the ... shim",
  "replace-with-symlink / replace-with-shim") is gate-guarded — it is either
  inside the gate's own Phase 1.8 defining section OR within +/- 8 lines of a
  "content-integrity" reference. (Phase 1.8 bounds are computed dynamically from
  the "### Phase 1.8" / "### Phase 2" headings.)
- (b) each of the 9 enumerated family skills (feature-design, epic-design,
  refactor-design, perf-design, e2e-test-design, implement,
  implement-orchestrator, review, fix) references the `.agents/rules/*.md` path
  AND grounds it with a "force-loaded" descriptor within +/- 2 lines of the path
  (window-based so it tolerates the line-wrapping that implement-orchestrator and
  review use, where "force-loaded" and "agent rules" land on adjacent lines).

Run output: `convert-content-integrity.test.sh: Results: 42 passed, 0 failed`,
exit 0.

No invariant violations / no doc bugs discovered: the current docs DO satisfy
both invariants. (Two earlier red runs during authoring were test-construction
issues — a BRE-vs-ERE parenthesis-escaping bug in the gate-definition match, and
an initially over-broad destructive-site detector that flagged the gate's own
self-describing enumeration lines; both fixed by matching the real content, not by
weakening assertions.)

## Review (2026-05-31)
Verified by re-running the suite in the release-deploy drain: passes green, no gaming patterns, bump-version isolation confirmed not to touch real manifests. Advanced review -> done.
