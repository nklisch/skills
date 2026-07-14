---
name: implement-orchestrator
description: >
  ALWAYS invoke when the user asks to implement substrate items, work through stage:implementing
  items, drain the queue, or implement a feature or epic scope. Coordinates implementation from the
  unified dependency graph, uses one feature-owning worker as the baseline, bundles related features
  or splits unusually large ones when justified, verifies every wave, closes story checkpoints
  directly, and runs standalone-story, feature, and epic reviews at the appropriate depth. Use implement instead when one cohesive delivery is safer
  to keep in the host context.
---

# Implement-Orchestrator

Coordinate one or more substrate items from `stage: implementing` through their
kind-appropriate completion outcome. **One implementation agent per feature is
the baseline.** That worker owns the feature context and treats child stories as
design, ordering, and acceptance checkpoints—not as default implementation
assignments. Bundle multiple related features into one sequential worker when
shared context and coherence reduce handoff cost, while preserving separate
feature transitions and reviews. Split an unusually large feature only when
coherent write ownership, dependency layers, or isolation make the additional
integration cost worthwhile.

The orchestrator adds value through complete grounding, dependency-aware
scheduling, explicit write ownership, fresh worker context, integration
verification, and conservative lifecycle roll-up. Delegation is authorized when
this skill is active, but fan-out is useful only where separate ownership,
isolation, or parallel execution improves the result.

## Outcomes

A successful run leaves:

- every selected child story advanced directly from `implementing` to `done`
  after green verification, or documented with a blocker;
- every standalone story advanced through bounded inline review without an
  independent/cross-model reviewer, unless an explicit boundary applies;
- every completed feature advanced to `review` and through its selected review
  lane to `done`, unless an explicit `stop-at-review` boundary applies;
- every changed item represented by its own commit;
- eligible parent epics advanced to their own deeper aggregate review after all
  child features are terminal, then to `done` only on epic approval;
- run notes that explain scope resolution, feature bundles, any justified
  feature split, worker capability, effective review weight, verification, and
  deviations.

Child stories never enter `review`. Standalone stories receive bounded inline
review but never an independent, fresh-context, or cross-model reviewer. Feature
review is the normal integration-review boundary. Reaching feature `review` is
not the default handoff boundary: invoke the review skill for each advanced
feature in the same run, passing the effective `review_weight`, unless the caller
sets an explicit review boundary. Do not replace that lane with inline
self-approval.

## Scope arguments

Accept the orchestration argument shapes defined in `principles` Part V:

- no argument or `--all` selects the full implementing queue;
- a feature id selects the feature and all implementing child-story checkpoints
  as one default ownership bundle;
- an epic id selects implementing descendants transitively, grouped by feature;
- an id list selects those items across kinds and parents, then regroups child
  stories under their owning feature where possible;
- a lone story id selects that checkpoint; use direct host ownership or the
  parent-feature worker when one is already active rather than manufacturing a
  one-story fan-out wave;
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
- An item is implementation-ready when every dependency is terminal, was
  completed and verified by an earlier wave, or is an item at `review` whose
  implementation verification is green. Review must not
  serialize the next dependency layer.
- If a dependency outside the selected scope has not reached one of those
  implementation-ready states, drop the dependent item from this run and record
  the unmet dependency. Never bypass or silently rewrite the edge.
- Recompute readiness after each verified wave rather than relying on the
  initial graph snapshot.

### Ownership and concurrency

- Start with one worker owning each ready feature and all of its child-story
  checkpoints. This is the normal implementation bundle because the feature is
  the design, integration, verification, and review boundary.
- Bundle multiple related features into one worker when they share substantial
  context or benefit from coherent sequential ownership. Keep readiness checks,
  evidence, commits, and feature reviews separate for every bundled feature.
- Split one unusually large feature only when dependency layers, independent
  write sets, repository shape, coupling, uncertainty, runtime capacity, or
  verification cost justify the coordination overhead. Story count alone never
  determines parallelism, and stories do not map one-to-one to workers.
- Parallel workers must have independent write sets and explicit ownership.
  Serialize or combine work when write sets overlap or when coherence matters
  more than isolation.
- Use worktree isolation when overlap is hard to predict or when large,
  disjoint write paths are safer to reconcile independently.
- Tell every worker that other agents may be editing disjoint files. Workers
  must preserve unrelated changes and stop rather than expanding their write
  scope silently.
- Dependency ordering is never weakened by grouping. A feature worker may mark
  related story checkpoints complete sequentially only when each becomes ready
  in that order.

### Verification and commits

- Verify each completed story checkpoint within its feature-worker scope, then
  verify the integrated feature and repository after every wave using the
  project's authoritative checks.
- Do not dispatch the next wave until the current wave's checkpoint transitions,
  commits, and integration checks are verified.
- Keep one commit per item, including separate commits for parent stage
  transitions. Never batch multiple item transitions into one commit and never
  push.
- A partial wave is valid only when completed items remain independently
  verified and committed; preserve untouched items at their current stage and
  durably record every bounce or blocker.
- Treat test gaming as a blocking verification failure, not a successful wave.

### Conservative lifecycle roll-up

A verified child story advances directly from `implementing` to `done`; it never
passes through `review`. A standalone story advances to bounded inline review.
After child-story checkpoints become terminal, inspect every
parent feature touched by the run. Advance a feature from `implementing` to
`review` only when all of its children, including children outside the selected
scope, are `done` and the integrated feature verification is green. Append an
implementation summary and verification result, then commit that feature
transition as its own item commit. Leave an ineligible feature unchanged.

The review lane decides whether a feature reaches `done`. Once all child
features of an epic are `done`, advance the epic from `implementing` to `review`
with an aggregate completion note. Epic review is intentionally deeper at the
larger capability boundary; it is not a duplicate of child-feature review.

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

Determine or receive one effective `review_weight` for completed feature and
epic reviews and the final autopilot completion pass. Precedence is: explicit
caller or autopilot override, then stable project convention, then
**`standard`**. Record the effective value and its source in run notes and pass
it to feature review. `standard` is the normal single-pass path: one independent
review, then adjudicate, fix, verify, and finish without re-review. Only
`thorough` and `maximum` enable multi-pass convergence. The principles and
review skill own the full matrix. Child-story completion never consumes this
weight: green verification moves child stories directly to `done`. Standalone
stories always use bounded inline review regardless of weight.

## Worker self-containment

Craft each worker brief dynamically from the implementer posture in
[principles/references/subagents.md](../principles/references/subagents.md).
Do not assume an installed agile-workflow worker role, shared conversation
context, or fixed prompt wording. The brief must carry all information required
to execute safely:

- the owned feature id, child-story checkpoint ids, exact allowed write scope,
  forbidden scope, feature design context, acceptance criteria, relevant paths,
  verified patterns, and current repository discrepancies;
- dependency readiness and the instruction to return without advancing when a
  dependency is unmet;
- land-mode detection: inspect whether the implementation already exists,
  reconcile the item body to as-built reality, fill meaningful test gaps, and
  verify before advancing;
- the design-flaw escape hatch: record an `## Implementation discovery`, move
  the affected item back to `drafting`, and return rather than forcing a flawed
  design through;
- project verification commands, required implementation notes, direct
  `implementing → done` transitions for completed child stories, bounded
  `implementing → review` for standalone stories, the feature's
  `implementing → review` transition after integrated verification, and exactly
  one `implement: <item-id>` commit per completed item with no push;
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
include enough feature and checkpoint intent that the worker does not need the
orchestrator's private context. A feature worker retains separate readiness
checks, notes, direct-to-done transitions, verification evidence, and commits
for each story checkpoint, then records integrated feature verification before
making the feature review-ready.

## Workflow

### 1. Resolve and ground the work set

Resolve the argument to concrete active items and note distinct parent features.
Read the full item and parent bodies, referenced docs, project rules, and current
integration code. Confirm the designs still match repository reality.

Create a concise sizing note covering feature boundaries, likely write roots,
dependency layers, known coupling, risk, remaining unknowns, and whether direct
reading or focused exploration is justified. Default each feature to one worker.
This note must justify every departure from that baseline; it is evidence for
the topology, not a numerical recipe.

### 2. Build and validate the graph

Construct the unified dependency graph, validate ids and cycles, classify
external dependencies, and remove dependents whose external prerequisites are
not implementation-ready (terminal or a verified item at `review`). Record
every exclusion. Compute the currently ready layer.

### 3. Derive feature ownership and waves

For the ready layer, group story checkpoints under their parent features and
assign one worker per feature by default. Bundle related features into one
sequential worker when shared context clearly reduces handoffs. Identify
conflicts across feature write sets. Choose serialization, direct-host execution,
or parallel feature-owning workers accordingly. Split an unusually large
feature only after recording the independent ownership and integration
rationale. Select and record worker capability. Refresh rules, stages, and
working-tree state before sending self-contained briefs.

### 4. Execute and verify a wave

Dispatch only ready work. On return:

1. inspect each result and the actual diff;
2. confirm every completed story checkpoint contains implementation notes and
   reached `done` when it is a child, every completed standalone story reached
   `review`, and every completed feature reached `review`; otherwise
   confirm a design flaw or blocker is durably recorded;
3. confirm exactly one commit exists for each completed item and that it does
   not include unrelated ownership;
4. run authoritative integration checks across the combined wave;
5. inspect test changes for integrity violations.

Fix a bounded integration issue in the owning item context or dispatch a focused
follow-up with the same boundary contract. Do not accept an unverified wave.

### 5. Make completed features review-ready

For each touched feature, apply the conservative lifecycle roll-up invariant.
Record completed story checkpoints, deviations, and integrated verification in
the feature body before its own `implementing → review` commit.

### 6. Schedule review without blocking implementation

Unless `stop-at-review` applies, resolve the effective `review_weight` and start
review as each feature, epic, or standalone story reaches `review`. Never invoke
review for child stories. Review-ready features and epics may be reviewed concurrently
when reviewer capacity and independent scopes allow; standalone stories use only
the bounded inline lane. Reviews do not need to serialize with one another or
with the next implementation wave.

Immediately recompute dependency readiness after every transition to `review`.
A reviewed item with verified implementation satisfies downstream dependencies,
so dispatch the next dependency layer without waiting for its review verdict.
Continue collecting review results between implementation waves. With `none`,
perform the administrative feature review from integrated verification evidence.

Honor each feature review result:

- approved features advance to `done` under review's contract;
- under `light` or `standard`, implement and verify the one pass's
  receiver-confirmed blockers, then close without another independent pass; if
  fixes are deferred, later closure verifies that named fix set only;
- under `thorough` or `maximum`, corrected features return for another
  independent pass until one yields no receiver-confirmed material current-cycle
  blockers; smaller findings are parked or noted by receiver judgment;
- blocked features retain a durable `## Blocker` and the run reports the
  blocker.

Corrective review work does not automatically invalidate downstream work. If a
fix changes an interface or assumption already consumed downstream, mark the
affected verification stale and re-run it after the fix. Otherwise continue
unrelated implementation. Never turn `standard` corrective work into a review
loop; never stop `thorough`/`maximum` convergence while receiver-confirmed
material current-cycle blockers remain. Smaller findings do not hold the loop
open.

### 7. Recompute, continue, and close epics

Refresh item stages, review results, and the dependency graph after every wave.
Continue while executable implementation or pending feature review remains. If
progress stops, record the exact unmet dependency, design bounce, failed
verification, review blocker, or ownership conflict rather than declaring
success.

After all child features are `done`, move the eligible epic to `review` and run
its broader aggregate lane at the same effective weight. Epic scope broadens the
lenses; it does not add passes to `standard`. The run is complete only after
required feature, standalone-story, and epic reviews reach terminal outcomes.

## Output

Report:

- resolved scope and any dropped items with unmet external dependencies;
- feature ownership bundles, dependency waves, any large-feature splits,
  isolation decisions, and their rationale;
- worker capability choices and override source, if any;
- effective `review_weight` and whether it came from the caller, autopilot,
  project convention, or default;
- child-story checkpoints advanced directly to done or blocked;
- standalone stories, features, and epics reviewed, bounced, blocked, or left at review
  by explicit request;
- parent features and epics advanced or left implementing, with the eligibility
  reason;
- per-wave and final verification results;
- commits created, one per item;
- feature review outcomes and remaining executable next step.

Do not prescribe a manual feature-review invocation as the default next step:
review is part of this run unless the caller explicitly chose that boundary.
Child stories never stop at review; standalone stories may.
