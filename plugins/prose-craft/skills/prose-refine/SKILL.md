---
name: prose-refine
description: >
  Drive a human-facing document such as a README, foundation doc, web article,
  or guide to publication quality through a multi-model rewrite-and-weave cycle.
  Use when a draft, or a topic that needs one, must be refined before publishing.
  In each round, fresh-context re-writer sub-agents from different model classes
  rewrite the draft in parallel. The orchestrator weaves the strongest sections
  into one voice. Scope narrows from a full rewrite to machine-prose tell hunting
  and then micro-edits, so the cycle converges within a 3-round cap — with
  structure held to the draft's reader-path plan and the woven voice blended
  so no single model family dominates.
---

# Prose Refine

Run the full cycle: establish the brief, draft, collect parallel rewrites from
different model classes, weave one voice, and repeat with narrower scope until
only micro-edits remain.

## Setup

1. If there is no draft, produce one with the `prose-draft` skill. Its brief
   and reader-path plan are required for all later steps. If a draft exists,
   recover both from an HTML comment at the top or a companion note. If the
   brief is missing or incomplete, pin it with the user before refining; if
   only the plan is missing, derive it from the draft, say you did, and
   confirm it with the user before round 1 — re-writers need a journey to
   hold the rewrite to, and a silently derived one is still a silent default.
2. Confirm the review weight. Use **standard** for 2 re-writers and the core
   lenses of audience, structure, clarity, and accuracy. Use **thorough** for 3
   re-writers and all six lenses. Default to standard when the user does not
   specify a weight.

## Re-writers, not just reviewers

Each round starts one fresh-context **re-writer** sub-agent per slot. Run them in
parallel where the harness supports it. Each re-writer returns a rewritten draft
and a per-section change log that states what changed and why. It does not
return a findings list. Use `prose-review` for review without rewriting.

**Diversify the model classes.** When the harness can access different model
classes, assign a different class to each re-writer. Different model families
expose different prose defaults and blind spots. When only one class is
available, assign distinct personas instead: a terse engineer, a longform
editor, and a domain skeptic (standard weight draws two; thorough uses all
three). When the harness cannot spawn sub-agents, perform
sequential self-rewrites under those personas and report the fallback.

Every re-writer receives the current draft, the full brief (including the
chosen structure pattern and the style profile with its deltas), the
reader-path plan, the universal floor
(`../prose-draft/references/style-contract.md`), the venue obligations
(`../prose-draft/references/doc-types.md`), and the lens checklists for the
selected weight (`../prose-review/references/lenses.md`).
The floor is not the style: re-writers write in the brief's style profile
and its recorded deltas, under the floor. Give every re-writer the
reader-path grounding rules explicitly — define essential domain terms
from real-world and business meaning before technical use, without
over-explaining terms the audience can safely know — as spelled out in the
define-before-use section of
`../prose-draft/references/structure-patterns.md`.

## The round loop (cap: 3 rounds)

Scope narrows each round to ensure termination:

- **Round 1: full rewrite.** Re-writers may restructure and rewrite freely
  within the brief and the plan's reader journey — the question chain, the
  define-before-use order, and the tier placement hold. Structural and
  sentence-level fixes are both in scope. A rewrite that wants to change
  the plan itself (reorder beats, retier content) returns that as a
  proposal for the user, not an unapproved change woven in.
- **Round 2: targeted rewrite.** Do not restructure unless a material defect
  requires it. Focus on machine-prose tells and fit with the document's
  chosen style profile. Give each re-writer `references/llm-tells.md` plus
  that model family's entry in `references/model-voice/` if one exists, so
  it can hunt its own family's signatures too. Every change requires a
  justification in the change log.
- **Round 3: micro-pass.** Only tells, word choice, and surface errors are in scope.

Each round:

1. **Spawn.** Start the re-writers as described above.
2. **Weave.** Compare the rewrites section by section. Evaluate competing
   versions against the brief, the plan, and project facts. Merge the
   strongest versions — where *strongest* means the least model-toned: the
   version most different from what the re-writers collectively converge on,
   the most human. When several re-writers land on near-identical phrasing,
   that convergence is the average machine voice, not a quality signal;
   prefer the version that strays from it while still serving the brief.
   Must-keeps are invariant. Reject any rewrite that changes one, repairing
   accidental alterations in place and noting the repair in the change log;
   a rewrite that deliberately argues against a must-keep is a genuine
   conflict — hold it out for the user instead of repairing it. Then normalize the voice of the woven draft so it
   reads as one author — and not as any one model family's default: check the
   weave against `references/model-voice/` signatures (and
   `references/llm-tells.md`) so the blend doesn't tip toward the loudest
   re-writer. Reject a rewrite that replaces the draft's tells with
   the re-writer's model-family tics. Keep change logs and reviewer process out
   of the woven document.
3. **Measure the delta.** Classify the accepted changes. If all are micro-edits,
   consisting of tell fixes, word swaps, or punctuation changes, the document
   has converged. Exit the loop. Otherwise, continue to the next round at its
   tighter scope. At the cap, exit regardless and report what remains open.

## Final pass

After the loop, run one low-cost proofread for typos, punctuation, formatting,
and link targets. Use one agent without lenses or re-writers.

## Guardrails

- The brief's must-keeps are invariant. Accidental must-keep changes are
  rejected and repaired; a rewrite that disputes a must-keep stops here —
  surface the conflict to the user. The reader path carries the same weight:
  re-writers propose plan changes (reordered beats, retiered content); the
  orchestrator surfaces those proposals to the user instead of weaving them in
  silently.
- The weave determines the final voice. Model diversity supplies alternative
  judgments, not multiple voices in the output. Reject changes that impose a
  re-writer's taste or model-family tics over the brief's intent. The result
  must sound like its author without retaining other authors' defaults — a
  blended voice in which no single model family's signatures dominate,
  verified against `references/model-voice/`, not by feel.
- Do not force convergence by classifying a substantive rewrite as a micro-edit.
  If substantive changes continue to appear at the cap, report them accurately.
- The loop is bounded by design. Scope narrows each round so the loop
  terminates. Do not add rounds beyond the cap. Park remaining ideas as notes
  for the user.

## Report

Report the rounds run. For each round, identify the re-writers used by model
class or persona. List accepted and rejected changes with reasons, give the
delta classification, and state what the weave used from each re-writer. If the
process reached the cap, report all remaining known issues. Report any
reader-path change proposals surfaced to the user and their decisions.
