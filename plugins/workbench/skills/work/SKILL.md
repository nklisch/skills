---
name: work
description: >
  Scope, clarify, groom or prioritize a backlog, build or evaluate a prototype, implement, fix,
  refactor, simplify, clean up, review, continue, finish one epic, drive several epics to done, or
  complete ready work
  inside a named delivery boundary. Use only when .work/CONVENTIONS.md declares owner: workbench and
  the request is a concrete Workbench workflow. Ignore this skill otherwise; do not offer setup or
  force unrelated requests into Workbench. Route valuable early exploration of substantial or
  cross-cutting initiatives through ideate before design unless the user requests direct design or
  execution. Gather consequential requirements, route substantial design through design and ready
  units through deliver, coordinate integration, and continue until the full boundary is complete.
---

# Work

Carry the user's natural-language boundary to its requested finish line. Never
require them to design a phase, worker topology, or workflow skill.

## Confirm activation

First confirm that an upward-found `.work/CONVENTIONS.md` declares
`owner: workbench`. If it does not, ignore this skill and handle the request
without Workbench; do not offer setup unless the user explicitly asks to adopt
or initialize Workbench.

When active, read `.work/CONVENTIONS.md` and apply
[setup's advisory version-compatibility guidance](../setup/references/version-compatibility.md)
before any stateful action; mention useful upgrade/setup guidance on mismatch
without blocking work. Then read relevant work items,
project instructions, foundation documents, `.knowledge/index.json` when
present, and affected code before structural decisions. Foundation documents
usually live in root `docs/` for repository-wide truth, with sub-project truth
in `<sub-project>/docs/` or `docs/<sub-project>/` following repository
convention.

Unless an instruction names a repository path or artifact, communicate with the
user in the current conversation, including questions, offers, proposals,
recommendations, explanations, summaries, and reports. Do not create report
files or durable no-op records unless the user requests them.

## Ordinary delivery path

For a clear, bounded request:

1. Read current project truth and settle the outcome, exclusions, and acceptance evidence.
2. Use the smallest useful item, normally one feature. Resolve local, reversible design choices inline.
3. Route the ready item through `deliver`, in the same context unless delegation earns its cost.
4. Verify behavior and reconcile affected truth before the configured review. Then close the item.
5. Report the result and meaningful evidence in chat.

For one ready item, `deliver` owns steps 3–5. Do not repeat its checks or review
merely because control returns to `work`. For several items, retain wider
integration and acceptance here.

This is the normal route, not a reduced-quality mode. Add exploration, formal
design, topology, research, or maintenance only when the request needs them.

## Conditional routes and references

Route through `ideate` when the intended outcome, ownership boundary, or basic
success shape is too ambiguous to form coherent work. Also prefer it for the
initial exploration of a substantial new initiative, cross-cutting change, or
early design when a short collaborative pass could materially improve what gets
designed, and when several coupled product, domain, or business decisions
materially reshape one another or the scope. Large size alone is insufficient:
an established mechanical outcome can remain in `work`. Skip the ideation pass
when the user explicitly requests direct design or execution, or existing items
and foundation truth already make exploration unlikely to change the outcome.
Do not create or reshape work items while ideating; resume `work` only after the
user explicitly selects a Workbench handoff.

Load references when their condition applies. Reuse guidance already read in
this context across skill handoffs. Reread it when it changes or is no longer
available, not merely because the skill name changes. Fresh contexts load their
own governing guidance. Always reconcile current items and repository facts on
resume.

- resolving decision authority or runner choice →
  [references/autonomy.md](references/autonomy.md) and
  [references/execution-posture.md](references/execution-posture.md);
- requirements or consequential ambiguity →
  [references/requirements.md](references/requirements.md);
- item creation, relationships, blocking, completion, or summaries →
  [references/lifecycle.md](references/lifecycle.md);
- backlog walkthrough, grooming, grouping, deduplication, or prioritization →
  [references/backlog-grooming.md](references/backlog-grooming.md);
- multi-unit or multi-epic orchestration →
  [references/execution.md](references/execution.md) and the shared
  [references/role-handoffs.md](references/role-handoffs.md);
- epic delivery or delivery across many features needing durable continuation
  or integration state →
  [references/delivery-topology.md](references/delivery-topology.md);
- any task requiring multiple sub-agents →
  [pre-execution model alignment](references/execution-posture.md#align-models-before-multi-subagent-execution);
- nontrivial UI or journey uncertainty →
  [references/ui-ux.md](references/ui-ux.md);
- every design, implementation, and Workbench review →
  [references/simplification.md](references/simplification.md);
- embedded cleanup, stale patterns, or credible extraction candidates →
  [references/maintenance.md](references/maintenance.md);
- implementation completion or review →
  [references/verification.md](references/verification.md),
  [references/review.md](references/review.md), and
  [references/git-posture.md](references/git-posture.md);
- durable project truth, foundation changes, or implementation completion →
  [references/foundation-truth.md](references/foundation-truth.md);
- durable prose in items, design sections, foundation docs, or release
  summaries →
  [references/writing-style.md](references/writing-style.md).

When substantive external investigation is necessary, use an available
`research` skill. If none is available, explain the degraded mode and limit
current-source lookup to conversational support. Do not create an ungrounded
project note.

## Resolve the requested boundary

Read [references/autonomy.md](references/autonomy.md) and resolve the effective
autonomy posture before deciding when to ask, act, or continue. Autonomy does
not broaden the requested boundary or authorize production, real-data,
irreversible, or external actions.

Keep narrow requests narrow. Treat “finish,” “drive to done,” and “handle end
to end” as instructions to reach the requested finish line, not permission to
invent requirements or enlarge it. Applicable foundation documents constrain
and clarify that outcome; they do not automatically pull adjacent intended work
into the current boundary.

A request to groom, walk through, organize, deduplicate, or prioritize existing
backlog outcomes stays in `work` and follows
[references/backlog-grooming.md](references/backlog-grooming.md). Keep it
conversation-first, scale large-backlog synthesis with bounded cheap read-only
sub-agents when useful, and apply only user-confirmed dispositions.

A request to look for problems, investigate a quality concern, scan a project
surface, or propose improvements without starting remediation routes through
`scan`. If the user later selects an opportunity for active work, resume here or
in `design` with that explicit handoff. Use `ideate` instead when the uncertainty
is primarily about what product or project outcome the user wants rather than
what opportunities exist in the current system.

A concrete review of a named Workbench outcome remains read-only. Report the
result in the current conversation and change nothing unless the user also asks
for a change. General code review, explanation, diagnosis, and other loose
requests are not Workbench workflows and do not acquire ledger, closure, or
configured review-weight obligations merely because the repository uses
Workbench. In an adopted repository, apply the current `## Overbuilding
calibration` to any loose design or review as a proportionality lens, while
leaving ledger, review-weight, convergence, formal review packet, and closure
mechanics out. Delegated loose design or review receives the calibration explicitly rather
than assuming fresh context inherited it; use the concise contract in
[references/role-handoffs.md](references/role-handoffs.md).

For an epic, include required children and integration. For several epics,
resolve the complete named target set. For a delivery outcome, discover
necessary work inside that boundary without silently draining unrelated queues.
If the boundary is unclear, ask which items are in scope. A multi-epic request
does not require a synthetic program item.

## Gather requirements from the human

Learn discoverable facts from the repository and current sources. Gather human
input for product direction, preferences, supported behavior, consequential
trade-offs, or other choices only the user can settle. In collaborative work,
surface ideal states and meaningful alternatives. In adaptive work, ask only
when the answer materially affects the outcome. In autonomous work, treat
settled request language and prior answers as requirements, but still pause for
missing human-only direction. Never treat missing structured-question tooling
as permission to guess or continue.

Record accepted outcomes, constraints, exclusions, and acceptance evidence in
the relevant active item without manufacturing a large template.

An active stateful Workbench workflow may apply a directly confirmed,
evidence-backed calibration refinement when concrete work exposes stale or
missing guidance. It replaces the stale prose rather than appending incident
history. A loose request proposes a refinement only, unless the user explicitly
asks to edit `.work/CONVENTIONS.md`.

## Shape durable work

Use one active item for one coherent outcome. A feature is the default delivery
and integrated review unit. Use an epic only when at least two independently
meaningful feature outcomes can be named. Use a story for a narrow independently
verifiable slice. Create child files only when separate status or cross-session
relationships matter. Temporary agent units belong in an execution approach,
not automatically in `.work/active/`.

Nested hierarchy follows `epic → feature → story` without skipping a tier.
Read [references/lifecycle.md](references/lifecycle.md) before choosing an item
kind or relationship.

Use `blocked_by` when another active item should finish first because serial
work materially reduces rework, ambiguity, or integration risk. Leave
independent work edge-free so it can run in parallel. Explain non-obvious order
in ordinary item prose only when useful. Use `related_to` for non-ordering
context.

A standalone cleanup, simplification, refactor, or pattern-extraction outcome is
normal Workbench work when it has a coherent boundary and observable completion
evidence. Use tags such as `cleanup`, `refactor`, or `pattern`; do not add another
item kind. Split independent subsystems only when their status or verification
can meaningfully diverge. A maintenance feature belongs under the active epic
when that epic owns the large boundary; otherwise it is top-level. Never nest a
feature under another feature.

A prototype is normal Workbench work when its coherent outcome is learning.
Record the decision or assumption it tests, the smallest representative surface,
the evidence needed, and the expected disposition: discard, revise, or adopt.
Tag it `prototype`; do not add another item kind or present exploratory output as
production-ready behavior. Before closing, record what the prototype established
and its disposition. Carry material learning into the foundation or active item
whose future direction it changes. Remove prototype code marked for discard;
revising or adopting it requires an explicit next outcome.

## Execute to the requested finish line

Order work from real prerequisites. Resolve the effective execution posture
from explicit user direction, the optional project convention, then `adaptive`.
For a multi-unit boundary, act as the outcome owner and orchestrator even when
every unit runs inline. For small coherent work, execute directly unless the
effective posture and actual work make a role handoff worthwhile. Under
`inline`, spawn no separate design, implementation, or review agents.

Before implementing or delegating each feature, story, or other coherent unit,
read [references/simplification.md](references/simplification.md), resolve the
effective simplification posture, and apply it within the affected boundary.
Then read the unit's current scope and assess design readiness against the
repository. An item's existence, acceptance criteria, or place in an epic does
not mean its implementation shape has been designed. Keep design inline when
repository evidence and brief reasoning can confidently resolve local,
reversible choices. Route through Workbench's `design` skill when meaningful
discovery, alternatives, boundary definition, or adjudication must be settled
first, and complete its required review before delegation or implementation. Do
not use a size label alone as the gate. A direct user request to design stops
after design, while an end-to-end delivery request resumes implementation
afterward.

Route each ready feature or story through Workbench's `deliver` skill. Skill
routing does not itself require a new agent context: under `inline`, the main
agent performs the deliver workflow directly. Resolve the effective Git posture
from explicit user direction, the optional project convention, then `adaptive`.
For one ready item, direct mode lets `deliver` own
item-level implementation, review, reconciliation, and closure. For a wider
boundary, use orchestrated mode with the parent outcome, non-overlapping write
surface, integration contract, effective Git posture, effective execution
posture, and return evidence. The deliverer may be the main agent or a role agent.
Under `batch`, `work` owns the wider commit boundary; deliverers must not reshape
the wider history independently. Orchestrated deliverers report stale patterns
and credible promotion candidates instead of writing the shared pattern catalog.
When candidates arise, retain useful continuation context in the existing
parent's `## Maintenance evidence` section. Follow
[references/maintenance.md](references/maintenance.md) without creating an empty
section or an extraction obligation. Do not repeat a completed item-level
review. Review only substantive wider integration behavior not covered there.

Research only to the depth needed. Parallelize only genuinely independent units
with clear ownership and integration points.

Inspect actual changes and returned evidence. The orchestrating agent owns
integration, acceptance, and the full requested scope. Do not stop because one
child finished, implementation ended before review, a worker returned, or a
former stage boundary was reached.

Pause when discovered work materially exceeds the requested boundary, requires
a new epic-sized outcome, or reaches an irreversible, production, or real-data
action. Use `park` to capture useful findings outside the current scope with
evidence instead of expanding silently.

Continue until every item in the requested boundary is complete or a concrete
external blocker prevents meaningful progress.

## Verify, review, and close

For the concrete Workbench delivery outcome, verify behavior at stable
interfaces, run required project checks, and exercise meaningful user journeys.
When maintenance candidates exist, distinguish required cleanup from optional
learning using [references/maintenance.md](references/maintenance.md). Finish
cohesive cleanup needed for the accepted outcome. Offer useful optional
extraction separately, even when recurrence is strong. It requires a selected
outcome, not a surprise completion dependency. An unanswered offer does not
block closure. Preserve selected follow-ups through `park` and discard rejected
coincidence. Do not manufacture a maintenance pass when no candidate exists.

Before establishing the stable review target, read
[references/foundation-truth.md](references/foundation-truth.md) and reconcile
affected assertions against the integrated result. Apply its altitude test:
foundations keep durable project truth, not work tracking, implementation plans,
or qualification evidence. Rebuild `.knowledge/index.json` when indexed
documentation changed. Include relevant reconciliation evidence in the completion reply.

Read [references/review.md](references/review.md) and apply the effective review
weight, simplification posture, and current calibration to that coherent target.
Include the canonical boundary instruction from
[references/role-handoffs.md](references/role-handoffs.md) in every formal review
prompt. User direction overrides defaults. Verify and adjudicate findings.
Reject invented requirements and offer useful out-of-scope proposals separately.
After corrections, rerun affected verification and self-check affected foundations.
Do not add a distinct pass beyond the configured review policy.

Close every completed item immediately:

- `completed_items: summarize` → replace it with a compact completed stub;
- `completed_items: discard` → remove it.

Before closing, remove the completed id from remaining `blocked_by` and
`related_to` lists. A parent cannot close while active children remain. Run
`validate-workbench.py`
after creating, reshaping, or closing ledger items.
Resolve the validator's plugin root using setup's identity-verification rule;
stop rather than guessing among ambiguous installations. Never leave completed
items active.

Before interruption, handoff, or context loss, update affected items with
settled requirements, completed outcomes, current evidence, next actions, and
blockers. On resume, reconcile that state against Git and code before acting.
Workbench item transitions do not require their own commits. Commit and any
safe consolidation follow [references/git-posture.md](references/git-posture.md),
never item-count or stage-transition mechanics.

Reply to the user in the current conversation with a concise completion summary:
completed outcomes, meaningful decisions, verification, closure disposition,
blockers, and intentionally parked follow-ups. This reply is chat prose, not a
repository artifact. Do not create a completion-report file or add reporting
sections to work items or foundation documents unless the user requests them.
