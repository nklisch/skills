# Execution and Continuation

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

Before assigning a unit, inspect its item and affected repository surfaces for
design readiness. A decomposed or accepted item is not necessarily designed.
Keep local, reversible choices inline when repository evidence and brief
reasoning can resolve them confidently. When meaningful discovery, alternatives,
boundary definition, or adjudication remains, use `design` and complete its
review before a sub-agent begins. Prefer a dedicated fresh-context design agent
when available, while keeping final synthesis with the orchestrator.

Assign non-overlapping write surfaces and explicit output evidence. Use
worktrees when isolation materially improves collision avoidance or rollback,
not merely because several units exist.

Give each delegate the conventions, required checks, effective review weight,
effective simplification posture, and writing guidance that apply to its unit.
Do not make a delegate rediscover
the rules that the orchestrator already loaded.

The orchestrator must inspect returned changes, reconcile interfaces and
assumptions, run integrated checks, and continue across completed units until
the user's full boundary is satisfied.

Before a context limit, interruption, or deliberate handoff, update affected
active items with settled requirements, current repository evidence, delivered
outcomes, remaining next actions, and blockers. On resume, compare that state to
Git and code before continuing.
