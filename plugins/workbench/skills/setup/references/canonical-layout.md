# Canonical Workbench Layout

## Contents

- Authority boundaries
- Workbench conventions
- Foundation document contract
- Project pattern catalog
- Active-item frontmatter
- Backlog frontmatter
- Completion
- Managed instructions

## Authority boundaries

```text
.work/
├── CONVENTIONS.md
├── active/.gitkeep
├── active/<id>.md
├── backlog/.gitkeep
├── backlog/<id>.md
├── completed/.gitkeep
├── completed/<id>.md
├── releases/.gitkeep
└── releases/<version>.md
.mockups/<work-item-id>/index.html
.research/
├── CONVENTIONS.md
├── attestations/.gitkeep
├── attestations/<handle>.md
├── briefs/.gitkeep
├── briefs/<id>.md
└── bibliography.yaml
.knowledge/index.json  # committed, deterministic discovery index
docs/<repository-wide foundations>
<sub-project>/docs/<scope-owned foundations>
docs/<sub-project>/<scope-owned foundations>
.agents/skills/patterns/  # canonical project pattern index and references
.claude/skills/patterns  # relative symlink when CLAUDE.md exists
AGENTS.md
CLAUDE.md                # optional relative symlink to AGENTS.md
```

- `.work/` holds outcomes the project may decide and deliver.
- `.research/` holds fetched external evidence and grounded synthesis.
- unscoped root `docs/` foundations hold repository-wide truth; a durable
  sub-project may own foundations in either its local documentation root or a
  scoped directory under root `docs/`, following established repository
  convention.
- `.agents/skills/patterns/` always holds the portable pattern index and holds
  focused references only after evidence-backed extraction work.
- `.knowledge/index.json` is generated discovery metadata with no independent
  authority.

Foundation names follow the repository's confirmed documentation conventions;
the contracts and examples below determine how to choose and shape them.

The research capability ships with Workbench. Setup may omit `.research/` and
`.knowledge/` until the project has research worth retaining.

## Workbench conventions

```yaml
---
owner: workbench
schema: 1
workbench_version: <exact-loaded-plugin-semver>
completed_items: summarize|discard
review_weight: none|light|standard|thorough|maximum
simplification_posture: hygiene|balanced|structural
autonomy: adaptive|collaborative|autonomous
---
```

`workbench_version` records the exact verified plugin release that last adopted
or reconciled the project. Read
[version-compatibility.md](version-compatibility.md) for mismatch handling.

Keep the body limited to authoritative verification commands, delivery rules,
and Workbench-specific project guidance. Put repository-wide agent invariants
in `AGENTS.md`, engineering principles in `docs/PRINCIPLES.md`, and detailed
recurring implementation shapes in `.agents/skills/patterns/`. Existing
substrates without `review_weight` resolve it as `standard`, those without
`simplification_posture` resolve it as `balanced`, and those without `autonomy`
resolve it as `adaptive`; setup writes user-confirmed values when refreshing
them.

## Foundation document contract

Setup chooses and records the repository's foundation layout and naming
convention. In a greenfield bootstrap, `ideate` uses this section directly when
turning settled project intent into initial foundations; it does not invent a
second document format.

Every foundation document:

- starts with one clear title and identifies the repository or sub-project scope
  it owns when that is not obvious from its path;
- states durable current behavior or explicitly intended project truth, never
  progress narration, migration history, session history, or a roadmap;
- defines each load-bearing term before relying on it and begins from user,
  domain, or business meaning before technical representation;
- keeps one assertion in one authoritative location and links across scopes
  rather than duplicating contract truth;
- uses sections selected for the document's purpose rather than a universal
  template.

Choose the smallest useful foundation set. Common document contracts are:

- `VISION.md` — audience, problem, desired outcomes, boundaries, and non-goals;
- `PRINCIPLES.md` — binding decision rules, each with enough rationale to apply
  it when trade-offs arise;
- `ARCHITECTURE.md` — settled ownership boundaries, major components, data or
  control flow, integration points, and structural constraints;
- `SPEC.md` — normative behavior, invariants, authority boundaries, schemas or
  protocols whose semantics are document-owned, and conformance expectations;
- `JOURNEYS.md` or `WORKFLOWS.md` — actors, triggers, observable paths,
  decisions, failure paths, and completion conditions.

These names are examples, not a required bundle. Combine documents when their
truth is small and cohesive; split them when scopes or audiences own materially
different assertions. Code remains the structural authority for
repository-internal contracts unless the confirmed convention says otherwise.

## Project pattern catalog

Use [project-patterns.md](project-patterns.md) for the canonical catalog's stub,
authority, format, adoption, and maintenance boundary.

## Active-item frontmatter

```yaml
---
id: <stable-kebab-id>
kind: epic|feature|story
status: active|blocked
tags: []
parent: null
blocked_by: []
related_to: []
research_refs: []
mock_refs: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

Only active and blocked may rest in `.work/active/`. A feature is the default
delivery and integrated review unit. An epic is top-level and groups at least
two nameable feature outcomes. A story is a narrow independently verifiable
slice. Features may be top-level or belong to epics. Stories may be top-level
or belong to features. Nested work follows `epic → feature → story` without
skipping a tier.

Every item starts with a Markdown title followed by this exact line:

> Workbench version mismatch: stop and offer setup upgrade.

It then includes outcome, scope, and observable acceptance meaning under
headings that fit the work. Add other body sections only when they carry useful
state.

Use `blocked_by` when another active item should finish first because serial
work materially reduces rework, ambiguity, or integration risk. Each edge has
one reason in an exact `## Sequencing` section. Independent work remains
edge-free. An item with an edge or an external `## Blocker` is `blocked`.
Otherwise it is `active`.

Keep `.gitkeep` in every canonical state directory even while it contains
items. Git does not preserve empty directories.

## Backlog frontmatter

```yaml
---
id: <stable-kebab-id>
tags: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

Every backlog item includes the same exact version guard line immediately after
its title. Do not invent missing requirements or priority during capture or
migration.

## Completion

With `completed_items: summarize`, replace a completed item with a temporary
`.work/completed/<id>.md` outcome stub. With `completed_items: discard`, remove
it after verification. In both postures, keep `.work/completed/.gitkeep` and
`.work/releases/.gitkeep`. A successful release writes one version summary and
removes every completed outcome file.

## Managed instructions

Maintain the canonical root `AGENTS.md` block from
[managed-instructions.md](managed-instructions.md). Add confirmed
repository-specific invariants at their narrowest authority without duplicating
them across agent-specific files.
