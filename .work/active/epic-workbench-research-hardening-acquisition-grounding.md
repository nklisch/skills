---
id: epic-workbench-research-hardening-acquisition-grounding
kind: story
status: active
tags: [plugin, skill, prose]
parent: epic-workbench-research-hardening
blocked_by: []
related_to: []
research_refs: []
mock_refs: []
created: 2026-07-28
updated: 2026-07-28
---
# Extend source grounding to acquisition suggestions and unavailable-source claims

## Brief

Close the upstream form of recall fabrication in Workbench's research
discipline. A source proposed as worth acquiring should be grounded in a fetched
source that identifies it, not merely remembered by the agent. Likewise, a
single transport or tool failure should not be described as proof that a source
is unavailable when proportionate alternative access modes remain.

The discipline should also distinguish material already acquired locally from
material actually attested: possession alone does not make a remembered detail
citable. This is an authoring boundary, not a request to restore ARD's
acquisition queue, offgas artifacts, or refresh scanner.

## Acceptance

- Proactive source recommendations obey the same fetched-source boundary as
  citations and bibliographic metadata.
- Blocking/unavailable language distinguishes content absence from shallow or
  transient access failure and requires proportionate access attempts.
- Acquired-but-unattested material is not cited from memory; it must first be
  read and attested under the owning research profile.
- The change does not add acquisition queues, registration fields, or mandatory
  orchestration steps.
