---
name: implement-orchestrator
description: >
  ALWAYS invoke when the user asks to implement substrate items, work through stage:implementing
  items, drain the queue, or implement a feature or epic scope. Coordinates implementation from the
  unified dependency graph, derives worker ownership and execution waves from repository shape and
  risk, verifies every wave, rolls eligible parents to review, and continues through the review lane
  by default. Use implement instead when one cohesive delivery is safer to keep in the host context.
---

# Implement-Orchestrator

Coordinate one or more substrate items from `stage: implementing` through their
appropriate review outcome. Derive the execution topology from the work in front
of you rather than applying fixed bundle sizes, wave widths, or worker recipes.

The orchestrator adds value through complete grounding, dependency-aware
scheduling, explicit write ownership, fresh worker context, integration
verification, and conservative lifecycle roll-up. Delegation is authorized when
this skill is active, but it is useful only where separate ownership, isolation,
or parallel execution improves the result.

## Outcomes

A successful run leaves:

- every selected item either advanced through review to `done`, explicitly left
  at `review` by a `stop-at-review` request, bounced with durable review
  findings, or documented with a blocker;
- every implementation transition backed by passing verification;
- every changed item represented by its own commit;
- eligible parent features advanced from `implementing` to `review` only after
  all their children are terminal-or-review;
- run notes that explain scope resolution, execution topology, worker
  capability, effective review weight, verification, and deviations.

Reaching `review` is not the default handoff boundary. Invoke the review skill
for the advanced scope in the same run, passing the effective `review_weight`,
unless the caller says `stop at review`, `leave at review`, `hand off for
review`, or a stable project convention sets that boundary. Review owns
approval, bounce handling, and the `review → done` ancestor roll-up. Do not
replace that lane with inline self-approval.

## Scope arguments

Accept the orchestration argument shapes defined in `principles` Part V:

- no argument or `--all` selects the full implementing queue;
- a feature id selects its implementing children, or the feature itself when it
  has no children;
- an epic id selects implementing descendants transitively;
- an id list selects those items across kinds and parents;
- a lone story id selects that story without implicitly advancing its parent;
- a natural-language filter is interpreted against implementing items and its
  interpretation is recorded.

Treat a value as an id only when a matching active item exists. Treat
`stop-at-review` as a lifecycle modifier, not part of the item filter.

## Invariants

These constraints govern every topology the orchestrator derives.

### Grounding and freshness

- Read every selected item and every distinct parent feature in full before
  dispatch. Cross-feature scope increases the grounding obligation.
- Read referenced foundation and research documents, project instructions,
  `.agents/rules/*.md`, and the concrete code and tests that define each
  integration boundary.
- Probe locally with `work-view`, file listing, search, and direct reads before
  using exploratory sub-agents. Delegate exploration only for named unknowns or
  independent surfaces that local probes do not resolve.
- Re-read project instructions, force-loaded rules, and relevant pattern
  sources immediately before dispatch. Re-check the working tree and item
  stages before each wave; concurrent work may have changed assumptions.
- Record the dispatch rationale when it affects ownership, grouping, isolation,
  or concurrency.

### Dependency integrity

- Build one unified `depends_on` graph for the selected work. Parent boundaries
  do not partition scheduling, and cross-feature dependencies are valid.
- Validate that every dependency id exists and that the graph is acyclic before
  dispatch.
- An item is ready only when every dependency is terminal-done or was completed
  and verified by an earlier wave.
- If a dependency outside the selected scope is not terminal, drop the dependent
  item from this run and record the unmet dependency. Never bypass or silently
  rewrite the edge.
- Recompute readiness after each verified wave rather than relying on the
  initial graph snapshot.

### Ownership and concurrency

- Derive worker groupings and waves from dependency layers, write sets,
  repository shape, coupling, uncertainty, runtime capacity, and verification
  cost. Item count alone does not determine parallelism.
- Parallel workers must have independent write sets and explicit ownership.
  Serialize or combine work when write sets overlap or when coherence matters
  more than isolation.
- Use worktree isolation when overlap is hard to predict or when large,
  disjoint write paths are safer to reconcile independently.
- Tell every worker that other agents may be editing disjoint files. Workers
  must preserve unrelated changes and stop rather than expanding their write
  scope silently.
- Dependency ordering is never weakened by grouping. A worker may process
  related items sequentially only when each item becomes ready in that order.

### Verification and commits

- Verify each item within its worker scope and verify the integrated repository
  after every wave using the project's authoritative checks.
- Do not dispatch the next wave until the current wave's item transitions,
  commits, and integration checks are verified.
- Keep one commit per item, including separate commits for parent stage
  transitions. Never batch multiple item transitions into one commit and never
  push.
- A partial wave is valid only when completed items remain independently
  verified and committed; preserve untouched items at their current stage and
  durably record every bounce or blocker.
- Treat test gaming as a blocking verification failure, not a successful wave.

### Conservative parent roll-up

After verified children reach `review` or a terminal stage, inspect every
parent feature touched by the run. Advance a parent from `implementing` to
`review` only when all of its children, including children outside the selected
scope, are terminal-or-review. Append an implementation summary and
verification result, then commit that parent transition as its own item commit.
Leave an ineligible parent unchanged.

The subsequent review lane decides whether reviewed items and ancestors reach
`done`; do not duplicate or pre-empt review's roll-up contract here.

## Worker capability

Choose worker capability from the risk and scope of the owned delivery. Consider
reasoning depth, cross-module impact, migration or generated-contract risk,
uncertainty, and prior failed attempts. Honor an explicit capability or model
choice from the caller, an autopilot caller note, or a stable project convention
when present; otherwise make the choice yourself. Record the chosen capability
and rationale in run notes before dispatch, and do not ask a routine tier
question or re-ask between waves.

Use the host's generic code-writing sub-agent mechanism. Do not use peeragent
for routine implementation fan-out. If no suitable worker adapter exists, keep
cohesive work in the host session while preserving the same ownership,
verification, item-update, and commit contracts.

## Effective review weight

Determine or receive one effective `review_weight` for the proactive review
handoff. Precedence is: explicit caller or autopilot override, then stable
project convention, then `standard`. Record the effective value and its source
in run notes and pass it to the review invocation. The principles and review
skill own the meaning and execution of each weight; do not recreate their
selection matrix here. A weight of `none` still requires green implementation
verification, then uses the review lane without an independent review pass.

## Worker self-containment

Craft each worker brief dynamically from the implementer posture in
[principles/references/subagents.md](../principles/references/subagents.md).
Do not assume an installed agile-workflow worker role, shared conversation
context, or fixed prompt wording. The brief must carry all information required
to execute safely:

- the owned item ids, exact allowed write scope, forbidden scope, parent design
  context, acceptance criteria, relevant paths, verified patterns, and current
  repository discrepancies;
- dependency readiness and the instruction to return without advancing when a
  dependency is unmet;
- land-mode detection: inspect whether the implementation already exists,
  reconcile the item body to as-built reality, fill meaningful test gaps, and
  verify before advancing;
- the design-flaw escape hatch: record an `## Implementation discovery`, move
  the affected item back to `drafting`, and return rather than forcing a flawed
  design through;
- project verification commands, required implementation notes, the
  `implementing → review` transition, and exactly one `implement: <item-id>`
  commit per completed item with no push;
- endpoint boundaries: no nested delegation or peeragent, no silent scope
  expansion, preserve unrelated concurrent changes, and report blockers;
- the full test-integrity rule: repair stale fixtures, drifted assertions,
  broken mocks, and outdated snapshots; park real production bugs and
  pre-existing flakes instead of folding them into the item; never weaken,
  delete, broadly skip, or rewrite a test merely to obtain green output; when a
  known bug prevents green verification, document the failure honestly and link
  the parked work rather than asserting whatever the code returns;
- emotional framing that invites pride in craft, careful verification, and
  candid blocker reporting without pressure or threat language.

Reference paths and signatures rather than pasting whole source files, but
include enough parent and item intent that the worker does not need the
orchestrator's private context. For a worker owning multiple sequential items,
retain separate readiness checks, notes, transitions, verification, and commits
for each item.

## Workflow

### 1. Resolve and ground the work set

Resolve the argument to concrete active items and note distinct parent features.
Read the full item and parent bodies, referenced docs, project rules, and current
integration code. Confirm the designs still match repository reality.

Create a concise sizing note covering likely write roots, dependency layers,
known coupling, risk, remaining unknowns, and whether direct reading or focused
exploration is justified. This is evidence for the topology, not a numerical
recipe.

### 2. Build and validate the graph

Construct the unified dependency graph, validate ids and cycles, classify
external dependencies, and remove dependents whose external prerequisites are
not terminal. Record every exclusion. Compute the currently ready layer.

### 3. Derive ownership and waves

For the ready layer, assign coherent write ownership and identify conflicts.
Choose serialization, shared sequential ownership, direct-host execution, or
isolated parallel workers according to the invariants above. Select and record
worker capability. Refresh rules, stages, and working-tree state before sending
self-contained briefs.

### 4. Execute and verify a wave

Dispatch only ready work. On return:

1. inspect each result and the actual diff;
2. confirm every completed item contains implementation notes and reached
   `review`, or that a design flaw, bounce, or blocker is durably recorded;
3. confirm exactly one commit exists for each completed item and that it does
   not include unrelated ownership;
4. run authoritative integration checks across the combined wave;
5. inspect test changes for integrity violations.

Fix a bounded integration issue in the owning item context or dispatch a focused
follow-up with the same boundary contract. Do not accept an unverified wave.

### 5. Recompute and continue

Refresh item stages and the dependency graph after verification. Continue with
newly ready work until the selected scope has no executable implementing items.
If progress stops, record the exact unmet dependency, design bounce, failed
verification, or ownership conflict rather than declaring success.

### 6. Roll up implementation readiness

For each touched parent, apply the conservative parent roll-up invariant. Record
children advanced, deviations, and verification in the parent body before its
own commit.

### 7. Continue through review

Unless `stop-at-review` applies, resolve the effective `review_weight` and
invoke `/agile-workflow:review` with it for each advanced parent and for
advanced items not covered by a parent review. Let the review skill interpret
the weight and perform any required fresh-context review. With `none`, require
the same green implementation verification and let review complete its stage
contract without an independent review pass.

Honor the review result:

- approved work advances to `done` under review's contract;
- bounced work returns to `implementing` with `## Review findings` and the run
  reports the bounce;
- blocked work retains a durable `## Blocker` and the run reports the blocker.

Do not loop blindly after a bounce. Resume implementation only when the finding
is bounded and still belongs to the current invocation; otherwise return the
review outcome as the honest completion boundary.

## Output

Report:

- resolved scope and any dropped items with unmet external dependencies;
- derived ownership, dependency waves, isolation decisions, and their rationale;
- worker capability choices and override source, if any;
- effective `review_weight` and whether it came from the caller, autopilot,
  project convention, or default;
- items advanced, bounced, blocked, or left at review by explicit request;
- parent features advanced or left implementing, with the eligibility reason;
- per-wave and final verification results;
- commits created, one per item;
- review lane outcomes and remaining executable next step.

Do not prescribe a manual review invocation as the default next step: review is
part of this run unless the caller explicitly chose the review boundary.
