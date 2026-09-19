# Canonical Workbench Layout

## Contents

- Authority boundaries
- Workbench conventions
- Overbuilding calibration
- Foundations
- Project pattern catalog
- Active-item frontmatter
- Backlog frontmatter
- Completion
- Managed instructions

## Authority boundaries

```text
.work/
├── CONVENTIONS.md
├── MODEL-NOTES.md               # optional, pruned model observations
├── active/.gitkeep
├── active/<id>.md
├── attachments/<id>/contract.md  # optional, deleted at item completion
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
.knowledge/index.json            # committed, deterministic discovery index
.knowledge/index-exclusions.txt  # optional tracked path-prefix exclusions
docs/<repository-wide foundations>
docs/spec/<provisional design contracts>  # optional greenfield-bootstrap opt-in
<sub-project>/docs/<scope-owned foundations>
docs/<sub-project>/<scope-owned foundations>
.agents/skills/patterns/  # canonical project pattern index and references
.agents/skills/scan-*/    # optional reusable project scan lenses
.claude/skills          # relative symlink to ../.agents/skills
AGENTS.md
```

- `.work/` holds outcomes the project may decide and deliver.
- `.research/` holds fetched external evidence and grounded synthesis.
- root `docs/` foundations own repository-wide truth; sub-project foundations
  follow the established local or root-scoped documentation convention.
- `.agents/skills/patterns/` always holds the portable pattern index and holds
  focused references only after evidence-backed extraction work.
- `.agents/skills/scan-*/` optionally holds reusable project-specific evidence
  lenses selected by scan or release gates; one-off concerns need no skill.
- `.knowledge/index.json` is generated discovery metadata with no independent
  authority.

Greenfield `docs/spec/` requires opt-in and follows
[provisional specs](../../work/references/provisional-specs.md). Ordinary design
stays in items and optional [attachments](../../work/references/design-attachments.md).
Neither temporary surface is durable foundation truth.

Recognize existing [model notes](../../work/references/model-notes.md), not as legacy
state. Do not seed empty files, model rankings, or inferred preferences during setup.

The research capability ships with Workbench. Setup may omit `.research/` and
`.knowledge/` until the project has research worth retaining.

`.research/CONVENTIONS.md` declares the provider; the bundled provider uses:

```yaml
---
owner: workbench-research
schema: 1
verification_rigor: adaptive|floor|standard|full
---
```

Missing `verification_rigor` means `adaptive`. Another owner may define a
different schema, rigor model, artifacts, indexing, and handoff. Core Workbench
interprets only the owner boundary: setup preserves alternate-owned research
and Workbench Research tooling never validates or modifies it.

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

Use [convention options](convention-options.md) for values, defaults, and confirmed
adoption choices. `workbench_version` records the verified plugin release that
last adopted or reconciled the project. Missing optional fields keep their defaults;
do not populate them merely for completeness.

Keep the body limited to authoritative verification commands, delivery rules,
and Workbench-specific project guidance, including optional review-boundary and
design-review preferences in prose. See [review boundaries](../../work/references/review-boundaries.md).
It may hold a confirmed
repository-specific delivery rule that has no narrower authority; frontmatter
remains a closed schema rather than an extension point. Put repository-wide
agent invariants in `AGENTS.md`, engineering principles in `docs/PRINCIPLES.md`,
and detailed recurring implementation shapes in `.agents/skills/patterns/`.

## Overbuilding calibration

An adopted repository may keep one concise `## Overbuilding calibration` section
in the conventions body. It is project-specific prose, not frontmatter, a
validator target, or an exhaustive checklist. Keep it short and evidence-backed:

- **Project context** — the project's type, audience, consequence, and other
  facts that set a proportionate complexity bar;
- **Likely overbuilding shapes** — recurring extra machinery that is not normally
  justified here;
- **Justified complexity** — capabilities or safeguards the project does need,
  and why; and
- **Revisit evidence** — concrete evidence that should cause the guidance to be
  refined or replaced.

The section guides every design and review in an adopted repository, including a
loose request, but it does not import Workbench's ledger, review-weight,
convergence, formal review packet, or closure mechanics into loose work. Missing
calibration degrades to current repository-evidence judgment. Setup establishes
or reconciles the section only with user confirmation: an existing section is
current project truth and is not ritually re-asked; a refinement replaces stale
guidance rather than appending incident history. No count or checklist semantics
are required.

## Foundations

Choose the repository's layout and naming with the user, using shared
[foundation authoring](../../work/references/foundation-authoring.md) for document
shape and engineering coverage and [foundation truth](../../work/references/foundation-truth.md)
for authority and reconciliation. Greenfield ideation uses the same contract.
The optional [roadmap convention](../../work/references/foundation-truth.md#optional-roadmap)
remains user-owned and requires explicit recognition.

## Project pattern catalog

Use [project-patterns.md](project-patterns.md) for the canonical catalog's stub,
authority, format, adoption, and maintenance boundary.

## Active-item frontmatter

```yaml
---
id: <stable-kebab-id>
kind: epic|feature|story
status: active|blocked
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

[Lifecycle](../../work/references/lifecycle.md) owns required and optional fields,
item tiers, readiness, relationships, and body shape. Preserve full-form existing
items without cosmetic rewriting. Setup converts actual structural differences,
not valid stylistic choices.

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

Apply the shared [completion sweep](../../work/references/lifecycle.md#completion-sweep)
after verification. Keep `.work/completed/.gitkeep` and `.work/releases/.gitkeep`.
Attachments are optional and need no `.gitkeep` or setup opt-in.

## Managed instructions

Maintain the canonical root `AGENTS.md` block from
[managed-instructions.md](managed-instructions.md). Keep it compact and put detailed
mechanics in their owning references, not duplicated across agent-specific files.
Add confirmed repository invariants at their narrowest authority.
