---
name: design
description: >
  Design or stress-test concrete Workbench implementation-shaping work before execution. Use only
  when .work/CONVENTIONS.md declares owner: workbench and the request targets a Workbench outcome;
  ignore this skill otherwise. Use after the outcome and basic success shape are understood, or
  when the user explicitly asks to go directly to design; route valuable initial exploration of a
  substantial or cross-cutting initiative through ideate first. Applies a design lens, records a
  proportionate design, and reviews it at the configured weight.
---

# Design

Within a concrete Workbench delivery workflow, design reasoning is always
required. Keep it inline when repository evidence and brief reasoning can
resolve local, reversible choices confidently. Use this dedicated skill when
that Workbench outcome's implementation shape needs meaningful discovery,
alternatives, boundary definition, or adjudication before execution. This is
conditional routing, not a size threshold or mandatory project stage. A direct
design request stops after the reviewed design; `work` may route here and then
continue through implementation.

## Confirm activation and context

First confirm that an upward-found `.work/CONVENTIONS.md` declares
`owner: workbench`. If it does not, ignore this skill and handle the request
without Workbench; do not offer setup unless the user explicitly asks to adopt
or initialize Workbench.

When active, read `.work/CONVENTIONS.md` and apply
[setup's version-compatibility guidance](../setup/references/version-compatibility.md)
before any stateful action; mention useful upgrade/setup guidance on mismatch
without blocking work. Then read the target item, project
instructions, foundation documents, relevant code and tests, and
`.knowledge/index.json` when present. Foundation documents generally live in
root `docs/`, with sub-project truth in `<sub-project>/docs/` or
`docs/<sub-project>/` following repository convention. Reconcile stale item
claims against the repository before designing.

Read [../work/references/autonomy.md](../work/references/autonomy.md) and resolve
the effective autonomy posture. Autonomy governs how decisions are discussed,
not whether design quality, review, safety, or authority boundaries apply. Read
[../work/references/execution-posture.md](../work/references/execution-posture.md)
and resolve who performs design and review. Formal design remains required when
the implementation shape warrants it even under `inline`. Read
[../work/references/simplification.md](../work/references/simplification.md) and
resolve the effective simplification posture for the design. Read
[../work/references/assurance-machinery.md](../work/references/assurance-machinery.md)
and apply it while shaping correctness, accounting, verification, state, and
determinism choices.

Unless an instruction names a repository path or artifact, communicate with the
user in the current conversation, including questions, offers, proposals,
recommendations, explanations, summaries, and reports. Do not create report
files or durable no-op records unless the user requests them.

## Decide whether to ideate

Before formal design, route through `ideate` when the user asks for initial
exploration, when a short collaborative pass could materially change what
should be designed, or when the outcome, ownership boundary, or success shape
cannot yet form coherent work. Prefer that pass for a substantial new
initiative, cross-cutting change, early design with unsettled outcomes,
boundaries, non-goals, or competing directions, or several coupled product,
domain, or business decisions that materially reshape one another or the scope.

Size alone is not decisive: a large mechanical change with an established
outcome can proceed directly to design. Bypass ideation when the user explicitly
asks to go straight to design or repository truth already settles the outcome
and exploration is unlikely to change it. Do not route away merely because a
small number of mostly local choices remain. The bare use of “design” does not
by itself mean the user wants to skip discovery.

## Set the design boundary

Treat the user's original intent, later clarifications, explicit exclusions,
and the accepted item outcome as the design boundary. Applicable foundation
documents provide current or explicitly intended truth and constraints inside
that boundary; they do not authorize pulling every adjacent aspiration into the
current work. Design may resolve necessary implementation detail, but it must
not invent product requirements, adjacent capabilities, or a broader quality
bar to satisfy the designer's preferred ideal state.

Keep a clear narrow request narrow. Calibrate the design to the project's actual
type, maturity, audience, deployment context, and stated risks. Do not add
enterprise, platform, production, extensibility, compatibility, operational, or
validation machinery unless the authorized outcome or repository evidence
requires it. If a clear request has no active item, create the smallest coherent
feature or story needed to hold durable design state, following
[../work/references/lifecycle.md](../work/references/lifecycle.md). Do not create
hierarchy merely to represent design activity.

## Select lenses

Read [references/lenses.md](references/lenses.md). Select one primary lens:

- new work;
- prototype or feasibility;
- refactor or cleanup;
- performance;
- defect or reliability;
- UI/UX;
- data, migration, or integration.

Apply only relevant risk overlays: security, privacy, accessibility, operations,
compatibility, and testing. State the selected lens in the item. If the work
mixes materially different lenses, separate independently verifiable outcomes
or name which lens governs each unit.

## Resolve decisions

Separate facts, requirements, assumptions, and decisions. Learn discoverable
facts from the repository. Do not re-ask choices already settled by the user,
the item, or foundation truth.

Use substantive external investigation through an available `research` skill.
If none is available, disclose the degraded mode and do not turn unattested
external claims into committed design evidence.

Ask the human about product direction, supported behavior, external contracts,
irreversible choices, or expensive trade-offs only they can settle, then pause
for the answer. Resolve routine reversible implementation choices with judgment
and include rationale in the active item's design only when it helps future
implementation or review.

Prefer the simplest coherent design that reaches a maintainable intended state.
Measure simplicity in durable concepts, operating cost, and verification cost,
not diff size. Apply the effective simplification posture to the affected
design boundary; at `structural`, question whether existing files and modules
should remain the decomposition. Do not choose a hack merely because it touches
fewer files.

In collaborative work, discuss ideal states and appropriately scoped options
before binding the design. In adaptive work, recommend the ideal state when it
materially affects the current choice. In autonomous work, choose the strongest
maintainable design inside the authorized outcome and park improvements that
would expand it. Use a workaround only when a real constraint requires it, and
record the constraint, consequence, and better future direction in the active
item because they constrain future work.

Name meaningful alternatives when the choice is consequential; do not
manufacture options for obvious local work.

Require every proposed assurance mechanism to name the product failure or
durable invariant it protects, its authority, and why a simpler boundary check,
derived state, recovery path, or existing mechanism is insufficient. Include
its synchronization, migration, false-positive, blocked-state, and recovery
costs. Preserve required correctness and credible verification; the goal is the
smallest durable mechanism that protects them, not weaker guarantees.

For formal design, follow the effective execution posture. Under `inline`, the
main agent performs the full design in the current context. Under `adaptive`,
keep smaller coherent designs inline and use a dedicated designer when fresh
context, consequence, breadth, specialization, or a clean handoff earns the
cost. Under `orchestrated`, prefer a dedicated design agent when available.
When assigning one, select it using
[../work/references/model-roles.md](../work/references/model-roles.md), matching
technical precision or creative taste to the design lens rather than choosing
by rank alone. Give it raw requirements, relevant repository truth, constraints,
the target item, and an explicit instruction not to invent requirements or
expand the outcome beyond the user's intent and rational scope of this project
type. Ask it to identify overbuilding as a design defect and to separate useful
out-of-scope ideas as non-blocking follow-ups. Do not give it a proposed answer.
The outcome owner retains final synthesis and adjudication. Do not add
delegation overhead merely to enact a role split.

## Record the design

Keep outcome-specific design in the active item rather than a parallel design
document. Add only useful sections:

```markdown
## Design

**Primary lens:** <lens>

### Outcome and constraints
<requirements, exclusions, and success evidence>

### Chosen approach
<boundaries, contracts, data flow, and rationale>

### Alternatives
<meaningful rejected options and trade-offs, when consequential>

### Implementation units
<coherent units, owned surfaces, dependencies, and integration points>

### Verification
<behavior, contract, benchmark, migration, or journey evidence>

### Risks and recovery
<failure modes, assumptions, rollback, fallback, or observability>
```

Use exact paths, interfaces, or schemas only when they reduce implementation
ambiguity. Avoid speculative code listings that merely pre-write the change.
Write the design prose in the plain technical style of
[../work/references/writing-style.md](../work/references/writing-style.md).
Apply that reference's concept-grounding rules to data models, interfaces, and
provider vocabulary. Use a concrete scenario when relationships remain
abstract, and use `research` when a provider ontology materially shapes the
design.

Design the smallest credible verification approach alongside implementation.
Reuse existing tests, commands, fixtures, environments, and observability
first. Add lightweight evidence when its confidence clearly exceeds its upkeep.
Do not invent a test framework, benchmark platform, mock service, simulation,
synthetic environment, or other substantial validation system without
discussing it with the user, unless the addition is demonstrably small, cheap,
and contained.

Read
[../work/references/foundation-truth.md](../work/references/foundation-truth.md).
Update root or sub-project foundation assertions only when the design settles
durable current or intended truth. Reconcile them in place and rebuild the
knowledge index when required by that reference. A design that settles a
contract, schema, or protocol names its intended structural authority —
code-owned, document-owned, or a generated mix — following that reference.

## Review the design

For this concrete Workbench design, read
[../work/references/review.md](../work/references/review.md). Resolve the
effective `review_weight` from an explicit user instruction, then
`.work/CONVENTIONS.md`, then `standard`. Do not apply that setting to unrelated
planning, explanation, or review requests.

Always self-check the design against requirements, repository evidence, the
selected lens, effective simplification posture, verification feasibility,
unnecessary complexity, the assurance-machinery lens, reversal cost, and
unauthorized scope growth. Apply
review at the effective weight and execution posture before implementation
becomes expensive to reverse. Give
the reviewer raw requirements, `.work/CONVENTIONS.md`, repository-wide and
applicable scope-owned principles, the design, relevant foundations and code,
known evidence, and the effective simplification posture. Apply conventions and
principles as lenses within the authorized outcome, never as permission to add
requirements. Include the mandatory
non-expansion instruction from the review reference; do not lead with a
suspected verdict.

Require the reviewer to check whether proposed foundation changes accurately
represent ownership, boundaries, current truth, and explicitly intended truth,
whether any affected foundation was missed, and that no proposed document
duplicates structural truth that code owns. The reviewer must also apply the
foundation-altitude test: reject work tracking, implementation plans,
qualification mechanics, receipt paths, evidence history, and item-specific
mechanisms. A convention-authorized `docs/ROADMAP.md` is user-owned and
free-form: do not reject its metadata, discourse, or status language. Instead,
verify that proposed operational conclusions come from `.work/` and that the
agent is not rewriting the roadmap incidentally.

Adjudicate findings rather than accepting them blindly. Revise confirmed
material problems. Explain rejected material proposals and the
repository-grounded reason in the current conversation. When the reason reflects
a durable constraint, fold that constraint into the design's `Chosen approach`
or `Risks and recovery` rather than recording the adjudication.

## Reply or return control

For a direct design request, reply in the current conversation with the chosen
approach, decisive trade-offs, effective review weight and evidence, unresolved
decisions, and the next implementation boundary. This reply is not a separate
design report artifact. Do not implement unless the user also requested
delivery.

When called from `work`, return control after the design and its required
review are coherent. `work` owns implementation, integration, verification,
closure, and the full requested finish line.
