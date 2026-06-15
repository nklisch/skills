---
source_handle: dyntaskmas-priority-calculation
fetched: 2026-06-15
source_url: https://arxiv.org/abs/2503.07675
provenance: source-direct
---

# DynTaskMAS: A Dynamic Task Graph-driven Framework for Asynchronous and Parallel LLM-based Multi-Agent Systems

## Summary

DynTaskMAS introduces a dynamic task graph framework for asynchronous parallel execution of LLM-based multi-agent workloads. The Execution Queue Manager uses a formal priority formula based on critical-path analysis, and the Load Balancer distributes work proportionally to agent capability and current load.

## Key passages and findings

**Priority calculation formula**: DynTaskMAS determines task priority using:

P(vi) = C(vi) / max_{vj∈Succ(vi)}(W(vi,vj) + P(vj))

This metric favors tasks with high computational cost relative to their successors' total weight, ensuring critical-path work receives precedence. This is a graph-theoretic structural property, not a business-value or semantic priority score.

**Dependency resolution and ready-state transition**: The Execution Queue Manager identifies ready tasks by checking predecessor completion:

R ← {v∈V : Pred(v) = ∅}

Once all predecessors finish, tasks transition to ready status and enter the priority queue with calculated priorities.

**Agent-task matching (Load Balancer)**: The Load Balancer employs weighted allocation considering both task priority and agent availability:

Allocation(ai,t) = (wi·Load(ai,t) / Σj(wj·Load(aj,t))) · TotalResources(t)

This distributes work proportional to agent workload and priority weights, matching capable agents to suitable tasks while maintaining load balance.

**Dynamic priority recalculation**: Rather than fixed priorities, the system continuously updates queue priorities as tasks complete and the graph evolves. This enables adaptive scheduling that responds to changing conditions and resource availability in real time.

**Reported performance**: The framework reports 21–33% execution time reduction, 35.4% resource utilization gains, and 3.47× throughput improvement for 4× agents.

## Structural metadata

- Domain: asynchronous parallel LLM multi-agent task execution
- Priority mechanism: dynamic critical-path calculation (formally: cost-to-successor-weight ratio)
- Readiness gate: predecessor completion check (empty predecessor set)
- Key insight: priority in agent queues is a continuously recalculated structural property of the task graph, not a pre-assigned label; this is fundamentally different from human-team priority pointing, which assigns priority as a stable categorical score at planning time
