# Project-Owned Engineering Principles

Workbench knows how to discover and elicit engineering principles, but it does
not install a universal code-design doctrine. The resulting
`docs/PRINCIPLES.md` belongs to the project and is governed by the same
current-or-intended-future truth rule as other foundation documents.

## Discovery before interview

Read existing foundation documents, project instructions, representative source
and tests, dependency boundaries, schemas, generated artifacts, published-
package metadata, externally consumed surfaces, durable data stores, lint/build
configuration, and any existing pattern or refactor catalogs. Identify:

- principles already stated explicitly;
- architectural decisions consistently expressed in code;
- places where current practice conflicts with written direction;
- consequential choices that remain genuinely open.

Do not infer a principle from one implementation. Repository evidence sharpens
the question; the user confirms the standing philosophy.

## Candidate themes

Discuss only themes that matter to this project:

- **Boundary independence** — whether domain behavior should remain independent
  from infrastructure and where that separation is worth its cost.
- **Authoritative definitions** — where variants, schemas, configuration, or
  contracts should have one source from which consumers derive behavior.
- **Generated or inferred contracts** — which system boundaries should derive
  types or clients from schemas, routers, or models.
- **Meaningful boundary validation** — where untrusted input and consequential
  contracts are validated, and how much internal defensive checking is useful.
- **Code economy** — the project's tolerance for layers, extension points,
  duplication, abstraction, and speculative flexibility.
- **Tests earning upkeep** — which interfaces, risks, regressions, and complex
  units deserve tests, and which testing styles create more maintenance than
  confidence.
- **Leaving touched areas simpler** — when cohesive deletion, consolidation, or
  behavior-preserving cleanup belongs inside feature work.
- **Compatibility posture** — which surfaces, if any, have verified external
  consumers (published packages with real downstream users, public APIs,
  services operated by third parties) or substantial real data requiring
  preservation or transformation, versus surfaces the project owns outright
  where schemas and APIs change in place. The default is no compatibility
  work: absent a project declaration of external consumers, agents should
  never version project-owned schemas (v1/v2/v3) or keep compatibility shims,
  and real-data migrations are planned by the agent but approved and executed
  by the user for production data. Agent tooling such as MCP servers,
  internal services, and unpublished libraries has no external consumers by
  default.

These are interview frames, not Workbench defaults. The project may adopt,
modify, reject, or add themes. Ask about concrete trade-offs discovered in the
repository rather than asking whether the user agrees with attractive slogans.

Honor the effective `interaction` preference, but principle creation is usually
a user-owned directional choice. Use the structured question tool when
available; otherwise ask inline and pause. Under autonomous interaction, preserve
an existing clear principle, but do not silently invent a new architectural
philosophy from ambiguous code.

## Writing `docs/PRINCIPLES.md`

Write a selective, high-level document. For each confirmed principle include:

```markdown
## <Principle name>

<Short statement of the preferred engineering direction.>

### Why

<The project-specific trade-off this resolves.>

### Implications

- <High-level design or review consequence>
- <Another consequence when useful>

### Boundaries

<Where this does not apply or what competing concern can override it.>
```

Keep implementation examples, file paths, thresholds, and framework recipes out
of this document. Those belong in code, `.agents/skills/patterns/`, project
instructions, or tool configuration. Do not restate Workbench substrate rules as
project engineering principles.

A project may legitimately have only two or three principles. Do not fill the
file to make it look complete.

## Existing-project setup

When an existing `docs/PRINCIPLES.md` is already project-owned:

1. preserve confirmed current principles;
2. identify false, historical, implementation-specific, or contradictory text;
3. propose focused edits;
4. ask before replacing a meaningful engineering value.

When no file exists, a short setup conversation may create one. If the user does
not want to settle engineering philosophy yet, omit the file and report that
principles remain implicit.

## Source-workflow migration

A source workflow may bundle code-design doctrine with substrate rules. Separate
project-confirmed principles through a concise keep/change/drop proposal:

- **Keep** when the user confirms it as project philosophy and repository
  direction supports it.
- **Change** when the underlying value fits but its scope or trade-off should be
  project-specific.
- **Drop** when it was plugin doctrine, no longer reflects the project, or
  duplicates implementation detail.

Preserve independently authored project principles and reconcile them in place.
Keep source-workflow substrate mechanics out of the project principles document;
Workbench's managed instructions carry its substrate invariants.

## Initial pattern catalog

Patterns are empirical implementation knowledge, not principles. If the project
already has `.agents/skills/patterns/`, preserve and validate it separately. If
setup can demonstrate genuinely recurring structures that would help future
agents, initialize the portable project skill:

```markdown
---
name: patterns
description: >
  Project-specific recurring code structures. Use when designing, implementing,
  reviewing, or refactoring this repository to follow established patterns and
  notice meaningful drift.
---

# Project Patterns

- `<slug>.md` — <one-line pattern summary>
```

Do not create an empty pattern skill merely for symmetry. Do not convert style
preferences or unconfirmed architectural doctrine into patterns. Concrete
pattern discovery and maintenance are governed by the Workbench maintenance
reference.
