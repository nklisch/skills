# Orchestration and Continuation

Use Workbench's `deliver` skill in orchestrated mode for each ready feature or
story. This reference owns coordination, integration, and continuation across
units.

For a multi-unit or multi-epic boundary, write only the coordination detail
needed to maintain ownership and integration in the relevant active item:

```markdown
## Execution approach

- **Unit** — outcome and owned write surface
  - Produces:
  - Blocked by:
  - Related context:
  - Isolation:
  - Verification:
```

Keep tightly coupled work in one context. Delegate or parallelize only when
independent focus, specialized capability, isolation, or throughput exceeds
handoff and integration cost. When selecting a delegate, use
[model-roles.md](model-roles.md) to match capability and reasoning level to the
role rather than spending a top design model on routine execution by default.
Apply [execution-posture.md](execution-posture.md) first. Under `inline`, the
main agent performs every unit sequentially in its current context while still
owning the wider integration boundary. Under `adaptive`, stories and small
coherent features normally remain inline; larger or cross-cutting units use
dedicated or mixed roles only when the handoff earns its cost. Under
`orchestrated`, prefer dedicated role agents when available.

Before assigning a unit, inspect its item and affected repository surfaces for
design readiness. A decomposed or accepted item is not necessarily designed.
Keep local, reversible choices inline when repository evidence and brief
reasoning can resolve them confidently. When meaningful discovery, alternatives,
boundary definition, or adjudication remains, use `design` and complete its
review before implementation begins. Whether a dedicated designer performs that
work follows the effective execution posture; the outcome owner always retains
final synthesis.

Assign non-overlapping write surfaces and explicit output evidence. Use
worktrees when isolation materially improves collision avoidance or rollback,
not merely because several units exist.

Give each deliverer the explicit orchestrated mode, parent outcome, accepted
scope, owned write surface, integration contract, relevant conventions and
patterns, required checks, effective review weight, effective simplification
posture, effective execution posture, and return evidence. Do not make a deliverer rediscover rules the
orchestrator already loaded. Deliverers report stale patterns and promotion
candidates. Keep the shared pattern catalog in the outcome owner's write surface
so parallel units do not collide.

The orchestrator must inspect returned changes, reconcile interfaces and
assumptions, run integrated checks, and continue across completed units until
the user's full boundary is satisfied.

Before a context limit, interruption, or deliberate handoff, update affected
active items with settled requirements, current repository evidence, delivered
outcomes, remaining next actions, and blockers. On resume, compare that state to
Git and code before continuing.
