---
name: prose-review
description: >
  Review a human-facing document (README, foundation doc, web article,
  guide, or reference page) through editorial lenses and report
  severity-tagged findings with concrete fixes. Lenses: audience, structure,
  clarity, accuracy, voice, accessibility. Traces structure against the
  draft's reader-path plan (deriving the path when absent), checks audience
  fit against the curse of knowledge, and checks word choice for
  model-family voice. Use for a single-pass review of an existing draft.
  Findings are proposals for the author to adjudicate, not verdicts. For a
  full draft-review-revise cycle with sub-agent reviewers, use prose-refine.
---

# Prose Review

Conduct one pass with the selected lenses and return actionable findings. Do
not edit the document.

## Inputs

- **The draft** (a path). Read the whole thing once for context before
  judging any part.
- **The brief**: audience, venue, purpose, structure pattern, style profile,
  must-keeps. Look for a brief carried with the draft (an HTML comment at
  the top, or a companion note). Published documents normally carry no
  brief — `prose-draft` strips the working comment at publication — so a
  missing brief is expected, not a defect. If none exists, re-pin the full
  six-field brief: recover what the document itself states, ask the user
  for what it doesn't, and label any field you inferred so the user can
  correct it. If a brief exists but
  lacks any of the six fields, treat it as incomplete: pin the missing
  fields the same way before judging.
- **The reader path**, carried with the brief (same comment or companion
  note). If the draft carries no plan, the structure lens derives the
  draft's actual beats and judges that derived path — saying it was derived.
  Never invent a plan and then fault the draft for deviating from it.
- **Lens selection.** Default (standard): audience, structure, clarity,
  accuracy. The user may name lenses or ask for all six.
- **Source drafts (parallel-drafts mode only).** If the draft was produced
  by merging parallel drafts, the source drafts must be available as
  scratch: the structure and voice lenses check the merge against them.
  Missing sources make those two checks no-ops — say so rather than
  guessing at provenance.

## Review

Read `references/lenses.md` for the checklists. Review one lens at a time,
in the order listed there. The accuracy lens may and should leave the
document to check commands, paths, and claims against the actual project.

Rules:

- Judge against the brief, not your taste. A deliberate, documented style
  choice by the author is not a finding.
- Every finding names a location (section heading or quoted anchor) and a
  concrete fix. "Consider improving the flow" is not a finding.
- Severity must be honest. **material** means a reader would be misled,
  blocked, or lose trust. Do not inflate polish into material to look thorough. Do
  not soften material into polish to be kind.

## Report

1. Findings grouped by lens, in the format from `references/lenses.md`.
2. A verdict line: N material, M polish.
3. One short paragraph on the draft as a whole: what already works, so the
   author protects it during revision.

Do not edit the draft. Findings are proposals; the author or the
`prose-refine` loop adjudicates and revises.
