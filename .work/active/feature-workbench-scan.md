---
id: feature-workbench-scan
kind: feature
status: active
tags: [plugin, skill]
parent: epic-workbench-scanning-and-release-gates
blocked_by: []
related_to: []
research_refs: []
mock_refs: []
created: 2026-08-23
updated: 2026-08-23
---

# Adaptive opportunity discovery through Workbench scan

Add a `scan` skill for requests to look for, investigate, or propose improvements in a bounded project surface. It selects useful postures from the question and repository, verifies and clusters findings, and asks the user which opportunities should survive.

## Scope

- Focused inline, medium fresh-context, and large decomposed campaign shapes.
- Verified defects, evidence gaps, drift, hypotheses, and architectural provocations remain visibly distinct.
- Bundled lens references plus project-defined `scan-*` skills and one-off user concerns.
- Conversation-first opportunity deck with explicit discard, investigate, park, activate, or accept dispositions.
- Selected product-level backlog stubs only; no automatic remediation and no item-per-warning flood.

## Acceptance

- Ordinary lookups and implementation requests do not route through scan.
- Before substantial inspection or fan-out, scan states its proposed brief and
  confirms consequential goals, boundaries, result posture, and materiality
  choices the request did not already settle.
- Scan writes no durable report by default.
- Large multi-session campaigns may track the discovery outcome without treating findings as accepted work.
- Release can reuse the scan contract over a release-bounded scope.
