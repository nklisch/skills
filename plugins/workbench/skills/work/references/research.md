# Research Lens

Research supplies evidence for requirements and design when current facts,
unfamiliar systems, contested claims, or consequential technology choices affect
the work.

## Discipline

Calibrate evidence to the effective `rigor` preference. `lean` uses focused
primary evidence for a reversible decision; `standard` verifies load-bearing
claims; `rigorous` broadens source coverage, replication, and uncertainty
analysis. The anti-fabrication floor never changes.

- Start with the decision or requirement the research must inform.
- Prefer primary, current sources: official documentation, specifications,
  maintainers, source repositories, and direct measurements.
- Distinguish observed facts, source claims, inference, and recommendation.
- Verify load-bearing claims through a second source, source code, a local probe,
  or a reproducible experiment when proportionate.
- Cite enough detail that a future agent can recover the source and understand
  why it mattered.
- State uncertainty and freshness limits. Never fill a gap with plausible prose.

## Storage

Research lives in `.research/<id>.md`, separate from the work queue:

```yaml
---
id: <kebab-case-id>
question: <decision-relevant question>
status: current|superseded
work_refs: [<work-item-id>]
researched: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

The body records scope, findings with links or repository references, verification,
confidence, unresolved uncertainty, and consequence for requirements or design.
Keep it proportional: a narrow lookup can be short, while a consequential
comparison can carry a fuller evidence trail.

Add `.research/<id>.md` to the work item's `research_refs`. In the item body,
record only the decision or requirement the research informed; do not duplicate
the detailed evidence. Reuse an existing current artifact when it answers the
same question. Mark outdated evidence `superseded` and link its replacement
rather than silently rewriting what was observed at an earlier date.

## Interaction

Research factual unknowns before asking the user. Ask the user when evidence
leaves a genuine preference, risk tolerance, product direction, or adoption
choice. Present the evidence and consequence in plain language rather than
asking them to interpret raw sources.
