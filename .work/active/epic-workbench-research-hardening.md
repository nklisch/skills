---
id: epic-workbench-research-hardening
kind: epic
status: active
tags: [plugin, skill]
parent: null
blocked_by: []
related_to: [epic-ard-okf-representation-convergence]
research_refs: [.research/briefs/okf-format-assessment-against-ard-substrate.md]
mock_refs: []
created: 2026-07-28
updated: 2026-07-29
---
# Preserve research discipline while keeping Workbench lightweight

## Brief

Harden Workbench's new research capability after an adversarial comparison with
the canonical ARD discipline. Preserve Workbench's low-ceremony posture: this is
not a request to restore research-orchestrator's registration, dials,
checkpoints, verification topology, or four-tier storage layout.

The work closes the verified gaps between Workbench's compressed research
discipline and the ARD grounding floor it was compressed from (see
`## Gap analysis`), stabilizes citation anchors, and makes the knowledge index
enforceably discovery-only. A small owner guard stops Workbench from silently
rewriting foreign research substrates; the larger knowledge-product profile
seam is blocked pending the agentic-research representation decision.

The existing `epic-ard-okf-representation-convergence` remains the broader
agentic-research representation decision. This epic is Workbench-specific and
does not decide whether ARD itself adopts, exports, or rejects an OKF-shaped
storage representation.

## Gap analysis (verified 2026-07-29)

Scope amended after an adversarial review diffed each "lost guard" claim
against `plugins/workbench/skills/research/references/discipline.md` at
`69536c3` (origin/main). Verified gaps, not remembered ones:

- **Substrate test — genuinely lost.** The floor guards attestations only
  ("keep project framing, recommendations, and cross-source synthesis out of
  attestations"); nothing binds briefs against task-narration or hidden-context
  leak.
- **Source-bound acquisition — genuinely absent.** Nothing governs remembered
  acquisition suggestions, "source unavailable" claims after a shallow or
  transient access failure, or acquired-but-unattested material cited from
  memory.
- **Change integrity — genuinely absent.** Nothing requires a correction to
  reach the downstream claim it corrects, or a material reversal to preserve
  the prior position's lineage.
- **Uncertainty marking — partially present.** The floor already labels
  inference and already classifies source disagreement as "contradiction,
  tension, qualification, or incommensurability." The gap is claim-level
  uncertainty marking — two buckets (directly attested vs. uncertain or
  contested), not ARD's marker taxonomy.
- **No-footnote-fabrication — mostly NOT lost.** Cite-through is already
  mandated and model memory is already forbidden as a bibliographic source.
  The only novel content: cite-through is *sufficient*, and visible citation
  asymmetry is the honest result, not a formatting defect. One sentence, not an
  item.

The original decomposition mirrored ARD's discipline sections (seven children).
It has been re-scoped to the work's actual shape: one prose-guards story, one
anchor-contract feature, one index-authority feature, one owner-guard story,
and the deferred profile seam.

## Outcomes

- Workbench's concise discipline closes the verified gaps — substrate test,
  source-bound acquisition, change integrity, claim-level uncertainty, honest
  cite-through asymmetry — without importing operational ceremony.
- Workbench citation anchors remain stable across insertion, correction,
  retirement, splitting, and merging.
- `.knowledge/index.json` is enforceably a derived discovery projection rather
  than an alternate evidence authority or permissive knowledge store.
- Workbench never silently initializes or rewrites a foreign research
  substrate; the full owner/profile seam follows once the agentic-research
  profile it must compose with has settled.

## Decomposition

- `epic-workbench-research-hardening-authoring-guards` (story) — the four
  verified prose guards plus the one-sentence cite-through clarification, in
  one pass over `references/discipline.md`.
- `epic-workbench-research-hardening-citation-anchor-stability` (feature) —
  the pre-decided append-only anchor contract plus lint enforcement.
- `epic-workbench-research-hardening-knowledge-index-authority` (feature) —
  the pinned validated-only indexing invariant; edge semantics remain open.
- `epic-workbench-research-hardening-research-owner-guard` (story) — owner
  declaration + stop/delegate rule; lands now.
- `epic-workbench-research-hardening-knowledge-product-profile` (feature,
  blocked) — the extension-point seam; blocked on the agentic-research
  ARD-on-OKF profile specification.

## Exclusions

- Reintroducing ARD's ten-field registration or positioning dials.
- Mandating specialist fan-out, decomposition artifacts, or a fixed gate stack.
- Making Workbench's two-tier research layout identical to agentic-research.
- Resolving the broader OKF adoption/interchange decision tracked by the related
  representation epic.

## Acceptance evidence

- The authoring guards land as one reviewable diff to the discipline, with no
  new stage, checkpoint, template, marker vocabulary, or validator unless a
  concrete enforcement need is demonstrated during implementation.
- Anchor stability and index authority are covered by focused lint/builder
  regression tests.
- Workbench documentation clearly separates discipline, operationalization,
  representation, and knowledge-product concerns.
- Existing lightweight Workbench research remains valid or receives an explicit,
  deterministic migration path.
