# Adaptive Delivery Topology

Use this reference when an epic or broad feature set needs durable continuation
or has enough integration complexity to justify shared operational state. Item
tier and feature count are signals, not gates. A smaller boundary may qualify
when integration risk is high. A large mechanical boundary may not qualify when
one context can finish it safely.

## Contents

1. [Validate before scheduling](#validate-before-scheduling)
2. [Choose one topology owner](#choose-one-topology-owner)
3. [Record the living topology](#record-the-living-topology)
4. [Build a role-fit loadout](#build-a-role-fit-loadout)
5. [Communicate before execution](#communicate-before-execution)
6. [Arrange adaptive waves](#arrange-adaptive-waves)
7. [Replan from evidence](#replan-from-evidence)
8. [Integrate and retire](#integrate-and-retire)

## Validate before scheduling

Treat backlog text and earlier plans as claims about the current tree. Before
choosing agents or order:

- Inspect the named items, foundations, patterns, code, and relevant Git history.
- Compare evidence pointers and claimed inventories with the current repository.
- Use a few bounded read-only sub-agents for thematic slices when breadth earns
  the cost. Do not assign one agent per item.
- Verify cross-slice overlap, stale premises, delivered prerequisites, and new
  consumers.
- Ask for consequential human-only decisions before a dependent wave starts.

Update the active item when corrected facts affect delivery. Remove stale
counts, call-site claims, compatibility premises, and dependencies.

## Choose one topology owner

Apply [lifecycle.md](lifecycle.md) when selecting an item and its relationships.
Keep one durable owner for requirements, integration, and topology:

1. Use the active epic when it owns the full boundary.
2. Otherwise use the active feature that owns wider integration.
3. Create one top-level feature tagged `coordination` only when several named
   top-level outcomes produce one observable integrated result and no existing
   item can own it.

A coordination feature states the combined behavior and acceptance evidence
that make it a real feature. Cross-session persistence alone does not earn the
item. It is not a parent above epics or a wrapper for completion tracking. Use
chat or an existing owner when no separate integration outcome exists. Keep
temporary agent assignments inside topology prose rather than child items.

## Record the living topology

Use one `## Delivery topology` section in the topology owner. Use headings that
fit the work. Preserve these concepts:

- **Boundary and finish line** — Name the units, integration owner, exclusions,
  and completion condition.
- **Validated state** — Record current-tree corrections, settled human choices,
  and design-readiness conclusions.
- **Loadout** — Record current roles, authority, and model choices that matter
  to continuation.
- **Waves** — Group ready units by prerequisites, write overlap, integration
  cost, and evidence boundaries.
- **Gates and evidence** — Name design or formal gates, targeted checks,
  integration checks, human journeys, and reusable evidence.
- **Adaptation state** — Name the next dispatch or integration point, current
  blockers, and events that require replanning.

For each unit, name its outcome, write surface, expected artifact, dependencies,
isolation, checks, review target, and return evidence. After return, add a commit
or artifact pointer only when it helps continuation. Do not copy command
inventories or agent transcripts into the item because they obscure the current
plan.

## Build a role-fit loadout

Follow [execution posture and model alignment](execution-posture.md) before
assigning agents, including initial read-only discovery agents. Record the
aligned role, model, and thinking assignments so
continuation preserves the user's choices. Treat them as current assignments,
not a permanent allowlist. Preserve project restrictions from their owning authority.

Pass delegated roles the shared context and boundary instruction from
[role-handoffs.md](role-handoffs.md). The outcome owner retains requirements,
synthesis, adjudication, integration, and closure.

## Communicate before execution

When building a topology, explain the execution model in chat before implementation
or broad dispatch. Summarize the owner, roles, proposed models and thinking
levels, parallelism, meaningful isolation, review, and next integration point.
Follow [model alignment](execution-posture.md#align-models-before-multi-subagent-execution)
for every task requiring multiple sub-agents, even when no durable topology is
needed. Align before initial discovery dispatch, not only implementation.

Apply the effective [autonomy posture](autonomy.md):

- **Collaborative:** propose the plan and wait for alignment before binding it.
- **Adaptive or autonomous:** announce routine execution choices and proceed
  inside the authorized boundary and aligned model/effort choices. Creating
  topology does not itself require another approval of settled choices.

Ask before a plan introduces a consequential commitment not already authorized:
material spending or resource use, changed isolation or data exposure, external
actions, requirements, or scope. Ordinary use of available agents within the
agreed resources and local write boundaries is an execution choice. An explicit
request to approve the plan still takes precedence. Ask only about the unsettled
commitment, not the entire workflow. Continue independent authorized work when
it does not depend on that decision.

Record settled corrections in the existing topology. Apply the same authority
boundary when replanning so an announced plan cannot quietly acquire new costs
or permissions.

## Arrange adaptive waves

Route each unit by actual design readiness. Local reversible work may go directly
to delivery. Give consequential ownership, persistence, concurrency, migration,
UI, or integration choices the design work they need.

Parallelize only when independent ownership and integration payoff justify it.
Choose the writer count from collision risk, system resources, verification
cost, and integration capacity. Keep tightly coupled changes in one context.
Use worktrees only when they improve rollback or collision avoidance.

Use `blocked_by` for a hard prerequisite or when serial delivery materially
reduces rework, ambiguity, or integration risk. Keep soft order and shared
verification context in topology prose so independent items remain runnable.

Follow [review.md](review.md) for pass depth and
[git-posture.md](git-posture.md) for commit ownership. Review stable targets, not
moving branches. Correct and verify accepted findings before another authorized
review pass. Integrate returned commits or diffs deliberately. Run combined
evidence once at the owning boundary instead of replaying the largest suite in
every worker.

## Replan from evidence

The topology is an execution hypothesis, not a requirement or fixed schedule.
Update it when repository state, design, write overlap, verification, review,
agent returns, or an external blocker disproves an assumption.

Interrupt or replace a stalled agent when more waiting does not earn its cost.
Retain only independently verifiable partial evidence. Continue unrelated ready
units. Give a replacement the current topology and focused evidence.

Before a handoff, record integrated outcomes, remaining units, blockers,
reusable evidence, and the next action. Record branches or commits when they
help continuation. On resume, reconcile this state against Git and the current
repository before dispatch.

## Integrate and retire

The topology owner inspects every return and resolves interface assumptions. It
runs wider evidence, reconciles foundations and indexes, and closes the named
units. Finish required cleanup, but offer optional maintenance separately under
[maintenance.md](maintenance.md). Unselected extraction does not delay closure.

Close a coordination feature only after its observable integration evidence
passes and every named outcome is integrated and closed. Do not preserve the
topology as a retrospective artifact because an expired plan misstates current
project truth.
