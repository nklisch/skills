# Foundation Authoring

Use this reference when creating or reshaping foundation documents, including a
greenfield ideation handoff. Follow the project's confirmed layout and naming.
For routine reconciliation of existing assertions, use
[foundation truth](foundation-truth.md); do not reopen the document format.

## Contents

- Document contract
- Engineering foundation coverage
- Choose the smallest useful set

## Document contract

Every foundation document:

- starts with one clear title and identifies the repository or sub-project scope
  it owns when that is not obvious from its path;
- stays at repository or sub-project altitude: durable purpose, boundaries,
  principles, high-level architecture, observable behavior, guarantees, and
  explicitly intended direction;
- excludes work-item ids and status, delivery-unit numbering, implementation
  plans, qualification commands or runners, receipt and evidence paths, and
  item-specific mechanisms; those belong in Workbench active or backlog items
  or their owning code, scripts, tests, and focused references;
- never carries progress narration, migration history, or session history;
- defines each load-bearing term before relying on it and begins from user,
  domain, or business meaning before technical representation;
- keeps one assertion in one authoritative location and links across scopes
  rather than duplicating contract truth;
- uses sections selected for the document's purpose rather than a universal
  template.

Foundation altitude means durable repository or sub-project truth, not
conceptual-only prose. Useful technical specificity belongs here when it shapes
how contributors build, connect, verify, or operate the system after the current
work item disappears.

## Engineering foundation coverage

A software project's foundations cover its durable engineering shape. At bootstrap,
resolve consequential choices or explicitly defer them. A small project may keep
this in `ARCHITECTURE.md`; a larger or operationally distinct scope may use `ENGINEERING.md`,
`TECHNICAL-FOUNDATION.md`, or a repository-native equivalent. The name and split
follow the confirmed documentation convention. Coverage may include:

- selected languages, runtimes, frameworks, and major infrastructure, including
  each one's role and consequential constraints;
- repository, solution, and project topology; component ownership; and allowed
  dependency direction;
- runtime or host composition, deployment environments, CI/CD targets, and
  release ownership;
- API, OpenAPI, schema, protocol, and generated-code authority;
- persistence boundaries, migration ownership, and durable data-flow rules;
- testing layers and the stable behaviors or boundaries each layer protects;
- generated-code policy and formatting, linting, compiler, analyzer, or other
  required engineering gates; and
- framework-wide conventions that materially shape composition, messaging,
  middleware, lifecycle, or failure behavior.

This is a coverage guide, not a required heading checklist. Omit inapplicable
topics, combine small cohesive truth, and split scopes whose owners or audiences
differ. Record unresolved choices as unresolved rather than asserting guesses.

Use the representation that makes relationships easiest to verify:

| Information | Preferred representation |
|---|---|
| Repository or solution shape | compact tree |
| Ownership or contract authority | table |
| Component dependencies or data flow | Mermaid or repository-native graph |
| Runtime and deployment topology | Mermaid, C4-style, or repository-native diagram |
| CI/CD flow | pipeline diagram or compact table |
| Decisions, invariants, and rationale | short prose or dense bullets |

Markdown with Mermaid is the portable default, not a mandate. A project may use
PlantUML, Structurizr, Draw.io, or another source-controlled format it already
supports. Keep a discoverable Markdown foundation that defines the diagram's
meaning and links to its source; do not make an opaque rendered image the only
authority or add a diagram toolchain solely for compliance.

Mechanical style remains authoritative in formatter, linter, compiler, and
analyzer configuration. Put only durable non-mechanical engineering decisions
in the foundation, concise cross-agent rules in `AGENTS.md`, and detailed proven
recurring implementation shapes in `.agents/skills/patterns/`.

## Choose the smallest useful set

Choose the smallest useful foundation set. Common document contracts are:

- `VISION.md` — audience, problem, desired outcomes, boundaries, and non-goals;
- `PRINCIPLES.md` — binding decision rules, each with enough rationale to apply
  it when trade-offs arise;
- `ARCHITECTURE.md` — settled ownership boundaries, major components, data or
  control flow, integration points, structural constraints, and—when cohesive
  at this size—the engineering foundation;
- `ENGINEERING.md` or `TECHNICAL-FOUNDATION.md` — durable stack roles,
  repository and runtime topology, dependency rules, deployment and CI/CD
  shape, contract and persistence authority, testing layers, generation policy,
  and engineering gates;
- `SPEC.md` — normative behavior, invariants, authority boundaries, schemas or
  protocols whose semantics are document-owned, and conformance expectations;
- `JOURNEYS.md` or `WORKFLOWS.md` — actors, triggers, observable paths,
  decisions, failure paths, and completion conditions.

These names are examples, not a required bundle. Combine documents when their
truth is small and cohesive; split them when scopes or audiences own materially
different assertions. Code remains the structural authority for
repository-internal contracts unless the confirmed convention says otherwise.
