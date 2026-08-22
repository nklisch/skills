---
id: feature-prose-craft-parallel-drafts
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
# prose-craft: optional parallel-genesis draft mode with semantic merge

## Brief
Add an env-gated, user-selected parallel-drafts mode to prose-draft: the
orchestrating agent recruits N writers of different model classes and has
each write a full draft of the same document against the same brief +
reader path, then semantically merges them into one draft whose voice is
deliberately blended from the collision. Drafting diversity moves from
refine's rewrite rounds back to genesis; refine then enters cheaper at
round-2 scope. Sequenced after feature-prose-craft-dogfood-pass (files
under in-flight review must not be edited).

## Settled design (user-confirmed)
- **Home**: an option inside prose-draft's draft step, not a new skill. New
  `references/parallel-drafts.md` covers recruiting + spawning + the merge
  procedure. Interview, brief, and reader path are unchanged and shared by
  all drafts.
- **Recruiting**: in-harness sub-agents of different model classes by
  default; where the host offers external bridges (peer agents, CLIs), the
  agent offers those to the user as additional genesis sources. Harness-
  neutral wording in the skill; specifics live in host layers.
- **Env gating / fallback**: mode requires the ability to run ≥2 model
  classes. Unavailable or user declines → ordinary single-draft path,
  stated. Degraded path, never a refusal.
- **Merge mechanic — beat-anchored fusion**: merge walks the plan's beats;
  within each beat, fuse freely (a paragraph may carry sentences from three
  drafts); then one voice-normalization pass across seams. Invariants:
  must-keeps, beat order, define-before-use.
- **Scratch lifecycle extension**: the N source drafts are scratch and are
  maintained until a review pass over the merged draft completes; only then
  cleaned (amends the strip rule with this earlier gate).
- **Review gains two scratch-conditional checks**. When source drafts
  exist as scratch, the reviewer receives the merged draft AND every source
  draft as inputs — the checks are comparative, not merged-text-only:
  - *Merge fidelity* (structure lens): scan source drafts for load-bearing
    content absent from the merged draft; drops become material findings.
  - *Voice fusion* (voice lens): with sources in hand, trace sentence
    provenance where possible and hunt seams at contribution boundaries —
    register shifts, rhythm breaks, terminology wobble between merged
    segments. Nitpicking seam quality is in scope as polish findings. The
    merged draft must read as one author with NEITHER source voice
    identifiable anywhere. Failure modes (material): one family's
    signatures dominating; both surviving in patches; visible seams
    (register shifts aligned with merge boundaries). Check via
    model-voice family files (cluster rule) + side-by-side source
    comparison. Success = a third voice; neither source really appears.
- **Refine stacking**: after a merge, refine may enter at round-2 scope and
  typically converges in 1–2 rounds; state the entry scope.

## Acceptance criteria
- prose-draft SKILL.md names the mode as an option with env gating and
  fallback, gated on user selection, never silent.
- parallel-drafts.md documents recruiting (incl. external bridges),
  spawning, and the beat-anchored fusion procedure with its invariants.
- Review lenses carry the two scratch-conditional checks (fidelity +
  voice-fusion) with the neither-source-appears success criterion.
- Scratch rule in prose-draft's lifecycle section extended: source drafts
  persist until review completes.
- prose-refine notes round-2 entry after a merge.
- Skills validate; portable wording throughout; minor version bump.

## Implementation notes
Build only after the dogfood pass commits (in-flight reviewer is reading
these files). The voice-fusion check reuses model-voice/ family files and
the cluster rule; external-bridge recruiting stays generic in SKILL.md
("peer agents or CLIs where the host provides them") per repo skill style.
