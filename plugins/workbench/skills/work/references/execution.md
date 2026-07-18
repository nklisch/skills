# Execution and Agent Orchestration

Use agent orchestration when delegation improves focus, isolation, independent
judgment, or throughput.

## Decide whether to delegate

Honor the effective `execution` preference without treating it as permission to
ignore coupling. `cohesive` favors host-context and sequential work; `adaptive`
uses delegation only when its benefit exceeds handoff cost; `parallel` actively
seeks independent units and worktree isolation.

Keep work in the host context when continuity, a tightly coupled change, a small
write surface, or rapid user interaction matters more than fresh context.
Delegate when a bounded unit benefits from independent focus, specialized
capability, isolation, parallel progress, or a fresh review perspective.

Evaluate work along these dimensions:

- uncertainty and reasoning depth;
- breadth of context that must remain coherent;
- coupling and contract sensitivity;
- likely write overlap;
- verification and integration cost;
- consequence and reversibility;
- whether independent progress is actually possible.

Do not map item count, checklist count, or lines of code directly to agent count.

## Write a high-level execution approach

For substantial work, record only the plan needed to coordinate it:

```markdown
## Execution approach

- **Unit name** — outcome and owned write surface
  - Produces: artifact, behavior, or decision
  - Hard dependencies: work that must finish first
  - Soft dependencies: useful context or preferred order
  - Isolation: host, sub-agent, or worktree and why
  - Verification: evidence expected on return
```

A hard dependency means useful execution would otherwise be invalid. A soft
dependency means coordination helps but work can proceed with an explicit
assumption or later reconciliation.

## Parallelism and worktrees

Parallelize only independent ready units with sufficiently distinct write
surfaces. Serialize when shared design is unsettled, interfaces are moving, or
integration would cost more than concurrency saves.

Use worktrees when broad or unpredictable writes need isolation, independent
commits ease integration, or rollback safety matters. Avoid worktrees for tiny
edits, heavily overlapping files, or work that requires constant shared state.
Before dispatch, assign ownership and tell every worker to preserve unrelated
changes and stop before expanding scope.

## Integration ownership

The orchestrating agent must:

- give workers enough requirements, design, paths, constraints, and acceptance
  evidence to work without hidden context;
- inspect returned diffs and verify claims;
- reconcile interfaces and assumptions across units;
- run integrated checks after combining work;
- decide whether another implementation, requirement, mock, or review loop is
  needed;
- consolidate commits into coherent delivery units when safe and authorized.

Sub-agents do not spawn further sub-agents. Fresh reviewers do not implement
unless explicitly returned to an implementation unit.
