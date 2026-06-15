---
source_handle: ai-metropolis-priority-queue
fetched: 2026-06-15
source_url: https://arxiv.org/abs/2411.03519
provenance: source-direct
---

# AI Metropolis: Scaling LLM-Based Multi-Agent Simulation with Out-of-Order Execution

## Summary

AI Metropolis is a simulation framework that executes LLM-based multi-agent workloads using out-of-order execution to exploit parallelism. The system uses dependency graph analysis to determine which agents can proceed independently and which must wait for prior simulation steps.

## Key passages and findings

**Priority queue architecture**: The system maintains two queues — a `ready_queue` holding clusters prepared for execution, and an `ack_queue` for confirming completed work. Both are priority queues that automatically sort tasks by simulation step, giving smaller step counts higher execution priority.

**Rationale for step-based priority**: The paper states: "requests with smaller [step] counts have higher execution priority." The justification is explicitly causal-chain based: "a write operation in a prior step can block many reads in subsequent steps; intuitively, the smaller the time step, the more future actions it can potentially block." Priority assignment is therefore derived from blocking-chain analysis, not from semantic assessment of task importance.

**Scheduling mechanism**: The controller (1) identifies unblocked agents via the dependency graph, (2) groups coupled agents into spatial clusters, (3) places ready clusters into the priority queue, (4) retrieves completion confirmations from the acknowledgment queue, and (5) updates the dependency graph on completion.

**Measured impact of priority**: Enabling priority scheduling produced "up to 15.7% speedup" vs. disabled. An oracle baseline showed minimal gains since its dependency graph was already sparse, confirming priority scheduling matters most when blocking chains are dense.

**Decoupled architecture**: The controller and worker processes are separated, preventing controller bottlenecks while maintaining ordering guarantees through transactional database updates.

## Structural metadata

- Domain: multi-agent simulation scheduling
- Task selection mechanism: dependency-graph readiness + step-count priority
- Priority basis: causal blocking-chain depth, not semantic value
- Key insight: priority as a machine-readable structural property (what blocks the most downstream work), not a social or business-value signal
