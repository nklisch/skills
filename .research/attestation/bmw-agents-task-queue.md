---
source_handle: bmw-agents-task-queue
fetched: 2026-06-15
source_url: https://arxiv.org/abs/2406.20041
provenance: source-direct
---

# BMW Agents: A Framework for Task Automation Through Multi-Agent Collaboration

## Summary

BMW Agents is a multi-agent framework for task automation that uses a Planner Agent to decompose user requests into a dependency-aware Task Queue, which is then drained by specialized agents selected via semantic and mention matching.

## Key passages and findings

**Task Queue population**: The Planner Agent takes in a user instruction, decomposes it into simpler tasks, and identifies dependencies between tasks in a Directed Acyclic Graph (DAG) structure. The Planner makes a single LLM call instructing the model "to generate a response in structured JSON format that will be parsed to extract all tasks and populate the Task Queue."

**Agent selection mechanisms**: The framework employs multiple matching strategies:
- Semantic Matching: selects agents based on task relevance using similarity comparison between task descriptions and agent expertise
- Mention Matching: uses "@AgentName" notation where agents explicitly indicate which colleague should continue work, enabling dynamic agent selection during conversational workflows
- Iterative Matching: cycles through predefined agent sequences for structured workflows like actor/critic patterns

**Dependency-driven execution ordering**: Tasks are held in the queue with dependency metadata. "Results of tasks 6 and 7 are made available to an agent when solving task 8" (direct dependencies). The system supports asynchronous execution: "all tasks that are ready to be executed (all of their dependencies have been completed) are completed asynchronously." Indirect dependencies are handled through semantic retrieval from Episodic Memory.

**Execution pathway**: user request → Planner Agent → Task Queue → Executor (coordinates agent selection) → Agent execution with tool access → task completion → dependency propagation.

**No explicit priority signal**: The framework does not describe an explicit priority scoring mechanism. Tasks become eligible based on dependency satisfaction (readiness), and eligible tasks are matched to agents by capability. Within the set of ready tasks, ordering appears to be capability-match driven rather than value-driven.

## Structural metadata

- Domain: enterprise task automation via multi-agent collaboration
- Task ordering: dependency-graph readiness (DAG topological order) + capability matching
- Priority signal: absent as an explicit concept; readiness is the gating condition
- Key insight: for an agent queue, "priority" collapses to "readiness" (dependency satisfaction) as the primary scheduling signal, with capability matching as the secondary selector
