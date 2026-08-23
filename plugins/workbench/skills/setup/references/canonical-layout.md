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
roadmap: true|false  # optional; missing means false
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

### Optional roadmap convention

`docs/ROADMAP.md` is the sole optional exception to the no-tracking boundary.
It is useful for larger projects that need a small, information-dense,
human-facing ordering of explicitly agreed longer-horizon goals. Every roadmap
entry links exactly one `.work/backlog/` item, which owns the details. The
roadmap may add a short directional statement and group entries into horizons or
milestones, but it never tracks active work, delivery status, implementation,
qualification, receipts, or evidence. When a backlog item becomes active,
remove its roadmap entry in the same transition.

Setup may offer this convention when repository evidence suggests longer-horizon
organization would help, but records `roadmap: true` and creates or adopts
`docs/ROADMAP.md` only after explicit user approval. Never infer consent from
project size or an existing roadmap-like file, and never create it as a default.
If setup discovers such a file without approval, classify its contents under
normal migration rules; do not silently grant it foundation authority. Missing
`roadmap` means `false`; when false, `docs/ROADMAP.md` must not exist.

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

Every item starts with a Markdown title. It then includes outcome, scope, and
observable acceptance meaning under
headings that fit the work. Add other body sections only when they carry useful
state.

Use `blocked_by` when another active item should finish first because serial
work materially reduces rework, ambiguity, or integration risk. Independent
work remains edge-free. Explain non-obvious ordering in ordinary item prose only
when it adds useful context; no dedicated section is required. An item with an
edge or an external `## Blocker` is `blocked`. Otherwise it is `active`.

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

Backlog items start with a title. Do not invent missing requirements or priority
during capture or migration.

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
