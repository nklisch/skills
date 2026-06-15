---
source_handle: thebotcompany-self-organizing-mas
fetched: 2026-06-15
source_url: https://arxiv.org/abs/2603.25928
provenance: source-direct
---

# Self-Organizing Multi-Agent Systems for Continuous Software Development

## Summary

This paper introduces TheBotCompany, a framework for continuous multi-agent software development. Unlike single-session systems (ChatDev, SWE-agent), it sustains development over days, organizing work through a three-phase state machine managed by permanent manager agents who dynamically hire and retire worker agents based on current milestone demands.

## Key passages and findings

**Three-phase lifecycle**: The system cycles through Strategy → Execution → Verification phases. Three permanent manager agents govern each phase: Athena (Strategy/planning), Ares (Execution/implementation), Apollo (Verification/quality).

**Strategy phase (Athena)**: The planning manager assesses overall progress by reviewing project specifications, issue trackers, codebase state, and prior verification feedback. Athena defines concrete next milestones with specific objectives and allocates a cycle budget.

**Execution phase (Ares)**: The implementation manager receives the milestone definition and must achieve it within budget. The paper states: "each cycle, Ares assesses progress and emits a schedule, which is an ordered list of workers and their tasks." Task ordering is determined by the manager agent's current-state assessment, not by static priority scores assigned at backlog-creation time.

**Verification phase (Apollo)**: An independent verification agent evaluates whether claimed milestones actually meet objectives. Apollo can reject incomplete work, generating structured feedback that triggers corrective cycles with halved budgets on subsequent attempts.

**Dynamic team composition**: Only the three manager roles are permanent. Worker agents are defined by skill files — persistent Markdown documents specifying role, reporting manager, and LLM model tier. These files persist across cycles, allowing team composition to evolve as project needs change.

**Information control and task visibility**: When scheduling workers, managers specify a visibility mode — Full (all open issues), Focused (only manager-specified issues), or Blind (no issue context, for independent verification). This prevents workers from being biased by irrelevant context.

**SQLite-backed issue tracker**: All agent coordination flows through a SQLite-backed issue tracker modeled on GitHub Issues. Agents access it via CLI commands like `issue list --status open`. The paper notes this avoids GitHub API rate limits and external noise.

**Milestone hierarchy with dotted notation**: Milestones are organized hierarchically (1, 1.1, 1.1.2), allowing the system to automatically decompose unachievable milestones into smaller tasks.

**Budget-driven scheduling**: "When a project falls below a safety threshold, the orchestrator introduces adaptive sleep intervals between agents to spread expenditure over the remaining time horizon." Once budgets are exhausted, the system sleeps until the next budget window begins.

**Feedback-driven anti-pattern accumulation**: In one case study, accumulated rejection feedback generated a documented list of "anti-patterns" — confirmed failing approaches that constrained future planning across subsequent milestones. This is a form of cross-session backlog hygiene: the system learns which approaches are stale/failed.

**Asynchronous human oversight**: Users file issues in the project tracker; managers consume them at phase boundaries rather than interrupting in-progress work. No ceremony-based synchronization points (standups, grooming sessions) are required.

**Separation of concerns**: "No single agent both produces and judges its own output." Manager agents make orchestration decisions through structured directives embedded in natural language responses.

## Structural metadata

- Domain: continuous multi-agent software development
- Task ordering mechanism: manager agent assessment of milestone progress at each cycle, not static priority
- Backlog hygiene mechanism: verification feedback + anti-pattern accumulation across cycles
- Human synchronization: asynchronous issue-filing, consumed at phase boundaries
- Key insight: priority is a dynamic assessment by the orchestrating manager at runtime, not a pre-assigned score; backlog hygiene is a continuous automated process rather than a scheduled ceremony
