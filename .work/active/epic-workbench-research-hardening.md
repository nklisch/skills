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
updated: 2026-07-28
---
# Preserve research discipline while keeping Workbench lightweight

## Brief

Harden Workbench's new research capability after an adversarial comparison with
the canonical ARD discipline. Preserve Workbench's low-ceremony posture: this is
not a request to restore research-orchestrator's registration, dials,
checkpoints, verification topology, or four-tier storage layout.

The work instead restores four compact authoring guards that were lost when the
discipline was compressed, then addresses two adjacent architecture risks: the
unified knowledge index can grant evidence-shaped metadata through path
placement, and Workbench has no explicit composition seam for repositories such
as `SNC/games/library` where the knowledge substrate and reader are the product.

The existing `epic-ard-okf-representation-convergence` remains the broader
agentic-research representation decision. This epic is Workbench-specific and
does not decide whether ARD itself adopts, exports, or rejects an OKF-shaped
storage representation.

## Outcomes

- Workbench's concise discipline again carries the substrate test,
  no-footnote-fabrication, source-bound acquisition, and uncertainty/change
  integrity without importing operational ceremony.
- `.knowledge/index.json` is enforceably a derived discovery projection rather
  than an alternate evidence authority or permissive knowledge store.
- A research-substrate owner/profile seam lets Workbench support both
  decision-support research and knowledge-base-as-product repositories without
  silently rewriting one schema into the other.

## Exclusions

- Reintroducing ARD's ten-field registration or positioning dials.
- Mandating specialist fan-out, decomposition artifacts, or a fixed gate stack.
- Making Workbench's two-tier research layout identical to agentic-research.
- Resolving the broader OKF adoption/interchange decision tracked by the related
  representation epic.

## Acceptance evidence

- Each child outcome is independently reviewable and covered by focused skill,
  script, or fixture tests appropriate to its surface.
- Workbench documentation clearly separates discipline, operationalization,
  representation, and knowledge-product concerns.
- Existing lightweight Workbench research remains valid without migration.
