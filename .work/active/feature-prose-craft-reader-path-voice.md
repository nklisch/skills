---
id: feature-prose-craft-reader-path-voice
kind: feature
status: active
tags: [prose, plugin]
parent: null
blocked_by: []
related_to: []
research_refs: []
mock_refs: []
created: 2026-08-21
updated: 2026-08-21
---
# prose-craft: reader-path planning, style selection, and model-voice blending

## Brief
Upgrade prose-craft from a silent plain-technical-English default to an
interview-first writing discipline with three additions:

1. **Alignment interview** (modeled on ideate) as the default entry of
   `prose-draft`: read the repo + request, state the *inferred* audience and
   venue and get confirmation, then propose 2–3 concrete directions (structure
   pattern + style profile + opening move) before writing. Proportionality:
   tiny/fully-specified docs collapse the interview to one named confirmation.
2. **Reader path**: a planning artifact modeling the reader's knowledge state
   and question chain through the doc — ordered beats (reader question →
   answer → setup), a define-before-use map, and importance tiers
   (first-screen / body / deep). Deliberately may diverge from the heading
   tree. Carries the same lifecycle as the brief (companion through
   draft/review/refine, stripped at publication); never left dangling.
3. **Style as selection + model-voice blending**: no silent style default. A
   styles catalog of *weighted example areas* (explicitly not mandates —
   choosing outside it is expected); today's plain technical-English contract
   becomes the named "plain tech-doc" profile; `style-contract.md` shrinks to
   a universal floor (honesty, runnable commands, term consistency).
   Reviewers check word choice + model-family voice tics via a new
   `model-voice/` reference with captured snippets per model family (glm-5.3,
   gpt-5.6-sol, gpt-5.6-luna, gemini-3.7-flash, claude-opus-4.6, kimi-k3;
   gpt-5.6-terra pending availability), and the refine weave blends so no
   single model's voice dominates the final output.

## Design
- `prose-draft/references/structure-patterns.md` (new) — reader-path
  principles, beat format, ~10 named structure patterns with fits/opening
  move/flow/failure-mode.
- `prose-draft/references/styles.md` (new) — ~14 named style profiles as
  weighted dimensions with a sample sentence each; usage section states they
  are examples of weighted areas, not mandates.
- `prose-draft/references/style-contract.md` — re-scoped to the universal
  floor; sentence/voice rules move into the styles catalog.
- `prose-draft/SKILL.md` — interview → brief (now records structure pattern +
  style profile & deltas) → reader path → draft → self-check; plan travels
  with the brief.
- `prose-review` — lenses: audience lens gains explicit theory-of-mind /
  curse-of-knowledge checks; structure lens becomes plan-aware (trace beats,
  question-chain, define-before-use, tier placement; derive the path when no
  plan exists and say so); voice lens gains model-family detection linking
  `prose-refine/references/model-voice/`.
- `prose-refine/SKILL.md` — re-writers receive plan + style profile + floor;
  plan changes surface to the user (alignment invariant, like must-keeps);
  weave rejects single-family voice dominance.
- `prose-refine/references/model-voice/` (new) — README (purpose, capture
  protocol, pending entries) + one file per captured model with snippets
  across four modalities (explain / instruct / opine / README opener) +
  honest signature-pattern notes.
- Plugin README updated; version bump minor (significant new capability).

## Acceptance criteria
- prose-draft no longer applies any style or structure silently; every draft
  names its structure pattern and style profile (confirmed, not assumed), and
  the audience is stated-and-confirmed rather than assumed.
- A reader-path plan exists for drafted docs, can diverge from headings, and
  is consumed by review (traced) and refine (invariant without user sign-off).
- The styles catalog explicitly frames entries as examples; the former
  default survives only as the named "plain tech-doc" profile.
- `model-voice/` contains same-prompt snippet sets for captured model
  versions — 8 at close (glm-5.3, gpt-5.6-sol, gpt-5.6-luna,
  gemini-3.7-flash, claude-opus-4.6, claude-opus-5, claude-sonnet-5,
  claude-opus-4-8) — with a documented recapture protocol (covering version
  changes, drift, and protocol deviations) and pending slots for gpt-5.6-terra
  and kimi-k3.
- Review voice lens + refine weave both reference model-voice and target
  "no single model family dominates".
- All SKILL.md files pass repo skill-style rules (< 300 lines practical,
  portable frontmatter, harness-neutral); references < 200 lines.

## Implementation notes
Voice capture ran as 5 parallel fresh-context subagents (glm-5.3, gpt-5.6-sol,
gpt-5.6-luna, gemini-3.7-flash, claude-opus-4.6) plus 3 via the claude CLI
after fresh auth (claude-opus-5, claude-sonnet-5, claude-opus-4-8) — 8 captured
versions total, all with an identical four-prompt protocol; snippets stored
verbatim with honest per-family signature notes.

Cross-model review (Opus 4.6, standard weight, fresh context): 2 material,
3 polish — all five adjudicated as real and fixed in-session: AC count
updated to 8 captured + 2 pending; "entry state" restored to the README's
reader-path description; ToC added to styles.md; protocol deviation added
as a recapture trigger (fixing the dangling citation in claude-opus-4.6.md);
reader path added to the README's carried comment. Consistency checks the
reviewer passed: six-field brief counted the same everywhere, floor/profile
split clean with no old-default leak, all cross-references resolve,
frontmatter portable, line limits met, versions matched across manifests.
Terra unavailable in capture environment; kimi-k3 auth-limited — both are
documented pending slots in `model-voice/README.md`. Opus capture ran with
thinking on high (off unavailable via that provider); noted in its file.
Notable capture finding: GLM-5.3 and Opus 4.6 independently produced the
identical verdict formula "Spaces, and it's not close." — recorded as the
convergence note, which directly motivates the weave's new definition of
strongest (least model-toned, most divergent from the re-writers' average).

Implemented: all three SKILL.md files, all references (2 new + 2 new
model-voice dirs), README, all three plugin manifests. Manifest descriptions
now state the interview-first shape; old five-field-brief / plain-language
wording removed everywhere. Validation: quick_validate passes on all three
skills; no stale harness terms; all references under 200 lines with ToCs at
100+. At stage: cross-model review (Opus 4.6, standard weight) running.
