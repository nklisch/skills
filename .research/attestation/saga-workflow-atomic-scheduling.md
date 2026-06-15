---
source_handle: saga-workflow-atomic-scheduling
fetched: 2026-06-15
source_url: https://arxiv.org/abs/2605.00528
provenance: source-direct
---

# SAGA: Workflow-Atomic Scheduling for AI Agent Inference on GPU Clusters

## Summary

SAGA introduces "program-level" scheduling for AI agent workloads, treating entire agent workflows as first-class schedulable units rather than treating each LLM inference call independently. The paper argues that current systems discard gigabytes of intermediate state (KV cache) between execution steps, inflating latency by 3–8×.

## Key passages and findings

**Workflow-atomic concept**: SAGA shifts from request-level to workflow-level scheduling. The core observation is that agent workloads exhibit predictable patterns — thought-action-observation loops, branching paths — that enable online scheduling to approximate offline-optimal cache decisions. Traditional request-level schedulers assume independence and memoryless arrivals, which violates agent workload characteristics: sequential dependencies, KV cache continuity needs, and bursty correlated request patterns.

**Agent Execution Graphs (AEGs)**: SAGA captures workflow structure through directed graphs representing LLM steps and their dependencies. These enable predictive cache retention across tool-call boundaries. The system achieves within 1.31× of Bélády's optimal offline caching policy.

**Agent Fair Share (AFS)**: Rather than equal resource allocation, SAGA prioritizes based on task urgency — assigning priority proportional to remaining work divided by deadline proximity. This provides formal completion-time fairness guarantees via Lyapunov drift analysis, achieving 99.2% SLO attainment under multi-tenant interference.

**Session-affinity batching**: Routes related requests to the same worker to preserve cache locality, with work-stealing mechanisms maintaining cluster-wide load balance while preventing thrashing.

**Empirical result**: SAGA achieves 1.64× task completion time reduction versus state-of-the-art baselines on production benchmarks (SWE-bench 500 tasks, WebArena 812 tasks, and synthetic multi-tenant workloads).

**Key insight**: The fundamental problem is that scheduling strategies designed for stateless request streams fail for stateful agentic workloads. Agent workflows have internal structure that a scheduler must understand to make efficient decisions.

## Structural metadata

- Domain: GPU cluster scheduling for AI agent inference
- Priority mechanism: urgency = remaining work / deadline proximity (Agent Fair Share)
- Key architectural claim: workflow-level scheduling outperforms request-level scheduling for agents
- Relevance: demonstrates that "priority" for an agent queue is a structural/temporal property (urgency, dependency depth, cache locality) rather than a semantic business-value judgment
