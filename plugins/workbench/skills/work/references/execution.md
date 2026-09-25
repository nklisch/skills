# Orchestration and Continuation

Use `deliver`'s contract for ready features or stories inside the owned outcome.
Reuse it across units in the same context rather than reenacting a handoff.
This reference owns coordination, integration, and continuation across units.
Use [sub-agents](sub-agents.md) only for actual context boundaries.

For an ordinary multi-unit boundary, write only the coordination detail needed
to maintain ownership and integration in the relevant active item:

```markdown
## Execution approach

- **Unit** — outcome and owned write surface
  - Produces:
  - Blocked by:
  - Related context:
  - Isolation:
  - Verification:
```

A hard dependency belongs in `blocked_by` only when proceeding would make useful
execution invalid. A soft dependency means coordination would help, but the unit
can proceed under an explicit assumption and reconcile later; record it as
related context, never as an edge.

When an epic or broad feature set earns durable continuation or integration
state, read [delivery-topology.md](delivery-topology.md). Choose one owner and
keep its `## Delivery topology` current as evidence changes the run.

Choose contexts under [sub-agents](sub-agents.md#when-to-use-another-agent). A
multi-unit outcome does not itself authorize delegation, and several sub-agents
need the user's model agreement first.

Before assigning a unit, inspect its item and affected repository surfaces for
current premises and design readiness. A decomposed or accepted item is not
necessarily current or designed.
Keep local, reversible choices inline when repository evidence and brief
reasoning can resolve them confidently. When meaningful discovery, alternatives,
boundary definition, or adjudication remains, use `design` and follow the run's
aligned optional design-review approach. Complete selected reviews before
expensive dependent implementation. Designer context follows the effective
execution posture. The designer writes and revises the owning item's design.
The outcome owner adjudicates readiness and checks that accepted decisions and
consequential review corrections are recorded before dependent implementation.

For an actual assignment, [hand over](sub-agents.md#hand-over) the owning item
and its recorded design with a non-overlapping write surface and explicit return
evidence. The item must contain the decisions the assigned work needs. Resolve
missing or conflicting consequential decisions there before dependent
implementation, while independent work continues. Deliverers report stale
patterns and promotion candidates; the shared pattern catalog stays in the
outcome owner's write surface so parallel units do not collide.

The orchestrator [handles returned work](sub-agents.md#handle-returned-work) and
continues across completed units until the user's full boundary is satisfied. Use [review-boundaries.md](review-boundaries.md)
to batch compatible deliveries for integrated review and correction. Assigned units
return verified work without premature closure when review is deferred. Keep
pending review in existing item prose and close units after shared acceptance.
At each integration checkpoint, apply delivery evidence to the owning items and
close every eligible unit immediately; do not accumulate closure for one final
campaign step. The owner closes accepted parents when their final children and
integrated acceptance are complete. A later session may recover missed closure
from repository evidence without needing the original session to return.

Before a context limit, interruption, or deliberate handoff, update affected
active items with settled requirements, current repository evidence, delivered
outcomes, remaining next actions, and blockers. For a topology-owned run, also
record integrated commits, reusable evidence, and the next dispatch or integration
point. Commit the owned continuation state under [Git posture](git-posture.md)
before handoff. On resume, compare it to Git and code before continuing.
