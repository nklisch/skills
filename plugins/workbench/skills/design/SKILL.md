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

Unless an instruction names a repository path or artifact, communicate with the
user in the current conversation, including questions, offers, proposals,
recommendations, explanations, summaries, and reports. Do not create report
files or durable no-op records unless the user requests them.

## Resolve the design boundary

First confirm that an upward-found `.work/CONVENTIONS.md` declares
`owner: workbench`. If it does not, ignore this skill and handle the request
without Workbench; do not offer setup unless the user explicitly asks to adopt
or initialize Workbench.

When active, read `.work/CONVENTIONS.md`, the target item, project instructions,
foundation documents, relevant code and tests, and `.knowledge/index.json` when
present. Foundation documents generally live in root `docs/`, with sub-project
truth in `<sub-project>/docs/` or `docs/<sub-project>/` following repository
convention. Reconcile stale item claims against the repository before designing.

Read [../work/references/autonomy.md](../work/references/autonomy.md) and resolve
the effective autonomy posture. Autonomy governs how decisions are discussed,
not whether design quality, review, safety, or authority boundaries apply.

Treat the user's original intent, later clarifications, explicit exclusions,
and the accepted item outcome as the design boundary. Applicable foundation
documents provide current or explicitly intended truth and constraints inside
that boundary; they do not authorize pulling every adjacent aspiration into the
current work. Design may resolve necessary implementation detail, but it must
not invent product requirements, adjacent capabilities, or a broader quality
bar to satisfy the designer's preferred ideal state.

Before formal design, route through `ideate` when the user asks for initial
exploration or when a short collaborative pass could materially change what
should be designed. Prefer that pass for a substantial new initiative,
cross-cutting change, or early design with unsettled outcomes, boundaries,
non-goals, or competing directions. This is broader than inability to scope,
but size alone is not decisive: a large mechanical change with an established
outcome can proceed directly to design. Bypass ideation when the user explicitly
asks to go straight to design or repository truth already settles the outcome
and exploration is unlikely to change it. The bare use of “design” does not by
itself mean the user wants to skip discovery.

Keep a clear narrow request narrow. Calibrate the design to the project's actual
type, maturity, audience, deployment context, and stated risks. Do not add
enterprise, platform, production, extensibility, compatibility, operational, or
validation machinery unless the authorized outcome or repository evidence
requires it. Route through `ideate` if the outcome, ownership boundary, or
success shape cannot yet form coherent work, or if several coupled product,
domain, or business decisions materially reshape one another or the scope. Do
not route away merely because a small number of mostly local choices remain. If
a clear request has no active item, create the smallest coherent feature or
story needed to hold durable design state, following
[../work/references/lifecycle.md](../work/references/lifecycle.md). Do not create
hierarchy merely to represent design activity.

Use substantive external investigation through an available `research` skill.
If none is available, disclose the degraded mode and do not turn unattested
external claims into committed design evidence.

## Select lenses

Read [references/lenses.md](references/lenses.md). Select one primary lens:

- new work;
- prototype or feasibility;
- refactor or cleanup;
- performance;
- defect or reliability;
- UI/UX;
- data, migration, or integration.

Apply only relevant overlays such as security, privacy, accessibility,
operations, or compatibility. State the selected lens in the item. If the work
mixes materially different lenses, separate independently verifiable outcomes
or name which lens governs each unit.

## Resolve decisions

Separate facts, requirements, assumptions, and decisions. Learn discoverable
facts from the repository. Do not re-ask choices already settled by the user,
the item, or foundation truth.

Ask the human about product direction, supported behavior, external contracts,
irreversible choices, or expensive trade-offs only they can settle, then pause
for the answer. Resolve routine reversible implementation choices with judgment
and include rationale in the active item's design only when it helps future
implementation or review.

Prefer the simplest coherent design that reaches a maintainable intended state.
Measure simplicity in durable concepts, operating cost, and verification cost,
not diff size. Do not choose a hack merely because it touches fewer files.

In collaborative work, discuss ideal states and appropriately scoped options
before binding the design. In adaptive work, recommend the ideal state when it
materially affects the current choice. In autonomous work, choose the strongest
maintainable design inside the authorized outcome and park improvements that
would expand it. Use a workaround only when a real constraint requires it, and
record the constraint, consequence, and better future direction in the active
item because they constrain future work.

Name meaningful alternatives when the choice is consequential; do not
manufacture options for obvious local work.

For formal design, prefer a dedicated fresh-context design agent when one is
available. Give it raw requirements, relevant repository truth, constraints,
the target item, and an explicit instruction not to invent requirements or
expand the outcome beyond the user's intent and rational scope of this project
type. Ask it to identify overbuilding as a design defect and to separate useful
out-of-scope ideas as non-blocking follow-ups. Do not give it a proposed answer.
The orchestrating agent owns the final synthesis and adjudication. Do not add
delegation overhead when the design can be resolved well in the current
context.

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
For data models, domain objects, interfaces, and external integrations, establish
the real-world and business meaning before schemas or field mappings. If a
provider's vocabulary materially shapes the model, use `research` to compare
representative providers or standards. Map provider terms through the project's
concepts to generic real-world terms instead of adopting one provider's ontology
by default. Use a short real-world scenario when relationships remain abstract.

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
selected lens, verification feasibility, unnecessary complexity, reversal
cost, and unauthorized scope growth. Apply independent review as required by
the effective weight before implementation becomes expensive to reverse. Give
the reviewer raw requirements, the design, relevant foundations and code, and
known evidence. Include the mandatory non-expansion instruction from the review
reference; do not lead with a suspected verdict.

Require the reviewer to check whether proposed foundation changes accurately
represent ownership, boundaries, current truth, and explicitly intended truth,
whether any affected foundation was missed, and that no proposed document
duplicates structural truth that code owns.

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
