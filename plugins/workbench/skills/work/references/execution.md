# Orchestration and Continuation

Use `deliver`'s contract for ready features or stories inside the owned outcome.
Reuse it across units in the same context rather than reenacting a handoff.
This reference owns coordination, integration, and continuation across units.
Use [role-handoffs.md](role-handoffs.md) only for actual context boundaries.

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

When an epic or broad feature set earns durable continuation or integration
state, read [delivery-topology.md](delivery-topology.md). Choose one owner and
keep its `## Delivery topology` current as evidence changes the run.

Keep tightly coupled work in one context. Delegate or parallelize only when
independent focus, specialized capability, isolation, or throughput exceeds
handoff and integration cost. Before multi-subagent execution, follow
[model alignment](execution-posture.md#align-models-before-multi-subagent-execution).
Apply [execution-posture.md](execution-posture.md) first. Under `inline`, the
main agent performs every unit sequentially in its current context while still
owning the wider integration boundary. Under `adaptive`, stories and small
coherent features normally remain inline; larger or cross-cutting units use
dedicated or mixed roles only when the handoff earns its cost. Under
`orchestrated`, prefer dedicated role agents when available.

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

Assign non-overlapping write surfaces and explicit output evidence. Use
worktrees when isolation materially improves collision avoidance or rollback,
not merely because several units exist.

For an actual assignment, point the deliverer to the owning item and its recorded
design, including relevant parent or linked contracts. Require it to read those
sources rather than rely on a rewritten summary. The item must contain the decisions
needed by the assigned work. Resolve missing or conflicting consequential decisions
there before dependent implementation, while independent work continues.

Supply assignment-specific delivery mode, parent outcome, owned write surface,
relevant conventions and patterns, current project calibration, required checks,
effective review weight, aligned design-review approach, implementation review
checkpoint and owner,
effective simplification posture, effective execution posture, and return evidence.
Use the shared context and canonical boundary instruction from
[role-handoffs.md](role-handoffs.md); do not make a deliverer rediscover rules
the orchestrator already loaded. Deliverers report stale patterns and promotion
candidates. Keep the shared pattern catalog in the outcome owner's write surface
so parallel units do not collide.

The orchestrator must inspect returned changes, reconcile interfaces and
assumptions, run integrated checks, and continue across completed units until
the user's full boundary is satisfied. Use [review-boundaries.md](review-boundaries.md)
to batch compatible deliveries for integrated review and correction. Assigned units
return verified work without premature closure when review is deferred. Keep
pending review in existing item prose and close units after shared acceptance.

Before a context limit, interruption, or deliberate handoff, update affected
active items with settled requirements, current repository evidence, delivered
outcomes, remaining next actions, and blockers. For a topology-owned run, also
record the integrated commits or branches when useful, reusable evidence, and
next dispatch or integration point. On resume, compare that state to Git and code
before continuing.
