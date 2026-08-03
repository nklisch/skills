---
id: epic-workbench-research-hardening-authoring-guards
kind: story
status: active
tags: [plugin, skill, prose]
parent: epic-workbench-research-hardening
blocked_by: []
related_to: []
research_refs: []
mock_refs: []
created: 2026-07-28
updated: 2026-07-29
---
# Close the verified discipline gaps in one prose pass

## Brief

Add the verified-missing authoring guards to
`plugins/workbench/skills/research/references/discipline.md` (and the parent
`research` SKILL.md where it duplicates the floor), in a single prose pass.
The gap evidence is the parent epic's `## Gap analysis`; each guard below is
sized to what is actually missing from the current text, not to the ARD
section it descends from.

1. **Substrate test (generalized).** Every committed research artifact — not
   only attestations — remains usable without the producing project's hidden
   context, and reads as engagement with its subject rather than narration of
   the agent task or authoring history. Leaked project framing moves
   downstream; leaked task instructions or session narration are removed. The
   wording distinguishes reusable research context from prohibited hidden task
   context; it does not ban a brief from naming its explicit decision boundary.
2. **Source-bound acquisition.** A source recommended as worth acquiring is
   grounded in a fetched source that identifies it, not in model memory.
   "Unavailable" claims distinguish content absence from shallow or transient
   access failure and require proportionate alternative access attempts first.
   This complements the discipline's `source_url` rule (omit and explain the
   access surface when no public reference exists): that rule covers the
   attestation field; this guard covers what the agent *claims* about
   availability. Material acquired locally but not yet attested is not citable
   from memory —
   it is read and attested first. This is an authoring boundary, not a request
   to restore ARD's acquisition queue, offgas artifacts, or refresh scanner.
3. **Change integrity.** Correcting an artifact reaches the downstream claim
   it corrects rather than living only in review notes or conversation. A
   materially changed conclusion preserves and links the prior position
   instead of silently rewriting history — without restoring temporal-contract
   enums or a refresh workflow.
4. **Claim-level uncertainty, two buckets.** Authors mark a claim when plain
   `inference` would misstate it; the mark means "uncertain or contested" and
   unresolved ambiguity, standing contestation, incommensurability, or reduced
   source-engagement confidence may be named in prose as reason. No fixed
   marker syntax or closed category list. Directly attested claims stay
   unmarked; the rule must not create annotation noise.
5. **Honest cite-through asymmetry (one sentence).** Where a fetched source
   attributes a claim to an unfetched source without supplying fuller
   bibliographic metadata, cite-through to the fetched source is *sufficient* —
   the existing floor already forbids inventing the missing metadata from
   memory — and visible citation asymmetry is the honest result, not a
   formatting defect.

## Acceptance

- All five guards land as one reviewable diff to `references/discipline.md`
  (plus any duplicated wording in the `research` SKILL.md).
- The guards are prose authoring boundaries: no new stage, checkpoint,
  template, marker vocabulary, or validator is added unless a concrete
  enforcement need is demonstrated during implementation.
- The uncertainty guard adds no fixed marker syntax or closed category list;
  ordinary directly attested claims remain unmarked.
- The acquisition guard adds no acquisition queue, registration fields, or
  mandatory orchestration steps.
