# Parallel Drafts

An optional drafting mode for `prose-draft`: recruit several writers of
different model classes, have each write a full draft of the same document
against the same brief and reader path, then merge the drafts into one
whose voice is deliberately blended from the collision. This moves the
model diversity of `prose-refine` back to genesis: the merged draft is
born multi-voiced instead of being de-toned later.

## Contents

1. When to use it, and when not to
2. Recruiting writers
3. Briefing and spawning
4. The merge: beat-anchored fusion
5. Scratch retention and review
6. Handing off to refine

## 1. When to use it, and when not to

User-selected, never silent. Worth it when the document matters enough to
spend N× the drafting cost — a README carrying the project, a foundational
explainer, a landing page. Overkill for a two-paragraph note; the
proportionality rule from the interview applies.

Requires the ability to run at least two different model classes. If the
harness cannot, or the user declines, run the ordinary single-draft path
and say which path you took.

## 2. Recruiting writers

- **Default**: fresh-context sub-agents of different model classes, one
  writer per slot. Two is the floor; three is plenty.
- **External bridges**: where the host provides peer agents or additional
  CLIs, offer them to the user as extra genesis sources — a different
  vendor's model family adds more voice distance than a second slot on the
  same family. Use what the user selects.
- Name the writers by model class in your report so the merge is
  auditable.

## 3. Briefing and spawning

Every writer receives the identical package: the full brief (including
structure pattern and style profile with deltas), the reader path, the
universal floor (`style-contract.md`), and the venue obligations
(`doc-types.md`). Same package, same prompts — divergence should come
from voice and judgment, not from different instructions.

Spawn writers in parallel where the harness supports it. Each returns one
complete draft. Do not let writers see each other's output; independence
is the point.

## 4. The merge: beat-anchored fusion

The reader path anchors the merge; without it, N drafts are not
comparable. Walk the plan's beats. Within each beat, fuse freely: a
paragraph may carry sentences from three drafts. Take the strongest
phrasing wherever it lives, preferring the least model-toned option — the
version most different from what the writers collectively converge on.

Invariants, enforced across the whole merge:

- **Must-keeps** survive verbatim.
- **Beat order** holds — the merged draft walks the same journey.
- **Define-before-use** holds — no term does work before the merged text
  defines it (merging can move definitions; recheck the map).

After the beats are fused, run one voice-normalization pass across the
seams: read the merged draft end to end and repair register shifts,
rhythm breaks, and terminology wobble at contribution boundaries. Use the
model-voice signatures (`prose-refine`'s `references/model-voice/`) to
check the result: it should read as one author, and as a third voice —
neither source family should be identifiable anywhere.

## 5. Scratch retention and review

The source drafts are scratch artifacts. Keep them — all N, plus the
merged draft's beat-by-beat provenance notes if you kept any — until a
review pass over the merged draft completes. Review needs them: the
structure lens checks merge fidelity (content present in a source that
the merge dropped becomes a material finding), and the voice lens works
comparatively, tracing provenance and hunting seams against the actual
sources.

Clean the scratch when review completes. The merged draft then carries
the brief per the usual lifecycle; the sources do not travel with it.

## 6. Handing off to refine

A merged draft has already been through one full multi-model pass. Enter
`prose-refine` at round-2 scope (targeted rewrite, tells and profile fit)
instead of round 1, and say you did. Expect convergence in one or two
rounds.
