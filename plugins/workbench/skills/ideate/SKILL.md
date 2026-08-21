---
name: ideate
description: >
  Collaboratively explore, clarify, or stress-test work before committing to scope or design. Use
  for brainstorming, challenge, initial exploration of a substantial or cross-cutting initiative,
  early design exploration that could materially change what should be designed, or coupled
  product, domain, or business decisions. May run before Workbench adoption because it remains
  conversational and write-free; create project state only after the user explicitly chooses a
  Workbench, research, backlog, or foundation handoff.
---

# Ideate

Help the user discover what they actually want before turning the conversation
into project state.

Ideate may run before or after Workbench adoption. When an upward-found
`.work/CONVENTIONS.md` declares `owner: workbench`, read its conventions and
relevant ledger state as context. Otherwise explore conversationally without
creating `.work/`, `.research/`, or other Workbench state and without treating
the plugin's availability as consent to adopt it. A durable Workbench, research,
or backlog handoff requires the user's explicit adoption choice first.

When setup routes directly here after a greenfield bootstrap, read setup's
[foundation document contract](../setup/references/canonical-layout.md#foundation-document-contract)
and [principle candidates](../setup/references/principle-candidates.md) before
exploration. Treat the documentation layout, naming, contract-truth ownership,
and principles already confirmed during setup as settled inputs; do not ask for
them again or invent a parallel foundation format.

## Explore

Inspect relevant files, documents, code, `.knowledge/index.json` when present,
and recent decisions before asking questions the repository can answer.

Match discovery to its expected decision value. For focused ambiguity, identify
the most consequential open decision, ask one question at a time, and follow
that thread deeply before moving sideways. For a substantial, cross-cutting, or
early-stage initiative, first make a short
breadth-first survey of the desired outcome, settled constraints, open
decisions, dependencies, and unresolved in-scope questions that are not yet
precise enough to scope. Do not turn the survey into a tracker or artifact. Then
choose the decision whose answer most changes the rest and follow that thread
deeply.

Include a working recommendation and rationale when it gives the user something
useful to challenge. When the user asks to be grilled, increase the pressure on
assumptions and trade-offs without changing the workflow.

Select only useful lenses:

- intent, audience, and desired outcome;
- scope, exclusions, and success evidence;
- ownership boundary and relationship to sibling or root projects;
- domain vocabulary, conflicting terms, and concrete real-world scenarios;
- prior art and alternatives;
- whether a small prototype could resolve an important uncertainty;
- feasibility and dependencies;
- failure, safety, and operations;
- evidence gaps;
- privacy, compliance, and data handling.

For an architectural rethink, bold refactor, deep simplification, or "what
single idea would make this much simpler?" request, read
[references/provocation.md](references/provocation.md) and apply its
provocation lenses, including its human-approval gate for existing systems and
its behavior-change callout rule.

Use current-source research for unstable facts, but hand substantive
investigation to an available `research` skill.

Every several exchanges, summarize in the current conversation:

- settled decisions;
- open decisions that can be stated precisely;
- unresolved in-scope questions that are not yet ready to scope;
- explicitly deferred decisions;
- the decision thread currently under examination.

Challenge overloaded or conflicting domain terms when they would change the
work. Use a short concrete scenario to test an abstract boundary before adding
formal vocabulary or structure.

Treat a prototype as a learning instrument. Name the decision it should inform,
the smallest representative behavior needed, the evidence that would answer the
question, and whether the result should be discarded, revised, or adopted. Do
not mistake prototype output for production-ready implementation. If building
the prototype requires repository changes, offer it as an explicit Workbench
handoff rather than crossing the no-write boundary.

Stop when the desired outcome and ownership boundary are understandable,
important alternatives have been considered when relevant, and every remaining
question is either precise enough for work, design, or research or explicitly
deferred. If a brief preflight shows that exploration would not materially
change what should be designed, say so and offer the next route without
manufacturing a longer ideation phase. Stop earlier when the user stops the
process.

## Preserve the no-write boundary

Do not create files, edit foundations, bootstrap a project, or scope work during
exploration. Conversational summaries are not project artifacts. At the end,
offer only relevant handoffs:

- offer Workbench adoption and wait for explicit acceptance before invoking
  `setup`, then activate an item; when already adopted, activate one directly,
  including a prototype whose explicit outcome is learning;
- park the idea when Workbench is already adopted, or adopt it first;
- commission Workbench research when adopted, or use an ordinary conversational
  research route without creating its substrate;
- write root foundation documents for repository-wide truth;
- write sub-project foundation documents for a durable, independently coherent
  scope within a monorepo or larger repository.

Write only the handoffs the user explicitly selects. When entered from a
greenfield setup, continue until the project's initial direction is coherent
enough to offer the smallest useful foundation set under setup's
[foundation document contract](../setup/references/canonical-layout.md#foundation-document-contract).
Include any still-open project-specific principles among the decisions to
settle, using setup's
[principle candidates](../setup/references/principle-candidates.md). Adopting
those principles or writing initial foundations remains an explicit foundation
handoff, not an ideation write.

Place a sub-project foundation at that scope's established documentation
location, such as `<sub-project>/docs/` or `docs/<sub-project>/`, and follow its
local instructions. Use unscoped root foundations only for repository-wide
truth. Link the levels where their contracts meet; do not duplicate the same
assertion across locations or create a competing foundation for a scope that
has no durable ownership boundary.
