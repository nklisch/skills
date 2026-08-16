# Canonical Workbench Layout

## Contents

- Authority boundaries
- Workbench conventions
- Foundation document contract
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
corpora/<corpus-slug>/  # optional repo-named collection root — see Collection roots
docs/<repository-wide foundations>
<sub-project>/docs/<scope-owned foundations>
docs/<sub-project>/<scope-owned foundations>
AGENTS.md
```

- `.work/` holds outcomes the project may decide and deliver.
- `.research/` holds fetched external evidence and grounded synthesis.
- unscoped root `docs/` foundations hold repository-wide truth; a durable
  sub-project may own foundations in either its local documentation root or a
  scoped directory under root `docs/`, following established repository
  convention.
- `.knowledge/index.json` is generated discovery metadata with no independent
  authority.
- a collection root holds a curated source collection — acquisition
  manifests, licensing posture, fetch recipes, and gitignored raw fetches —
  as product substrate rather than evidence.

Foundation names follow the repository's confirmed documentation conventions;
the contracts and examples below determine how to choose and shape them.

The research capability ships with Workbench. Setup may omit `.research/` and
`.knowledge/` until the project has research worth retaining.

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

## Collection roots

A repository whose product includes a curated source collection — per-corpus
manifests, licensing and provenance records, fetch recipes, and gitignored
raw fetches — keeps it in a peer collection root instead of `.research/`.
The directory name is the repository's (`corpora/` is one convention); setup
records it in `.work/CONVENTIONS.md` project guidance when one is adopted.

A collection root is product substrate, not evidence, and placement keeps
the two apart: an attestation warrants a claim about what an engagement
actually fetched; a corpus manifest describes an acquired source. Attestations
cite into the collection by handle. The root carries no Workbench machinery
of its own — no frontmatter contract, no validator requirements.

When setup moves a legacy `reference/` tier into a collection root, it moves
raw fetches together with their manifests (raws are never deleted by
conversion) and rewrites inbound references that target the old path —
gitignore patterns, render and build pipelines, scripts, and indexes.

## Workbench conventions

```yaml
---
owner: workbench
schema: 1
completed_items: summarize|discard
review_weight: none|light|standard|thorough|maximum
autonomy: adaptive|collaborative|autonomous
---
```

Keep the body limited to authoritative verification commands, delivery rules,
and Workbench-specific project guidance. Put repository-wide agent invariants
in `AGENTS.md` and engineering principles in `docs/PRINCIPLES.md`. Existing
substrates without `review_weight` resolve it as `standard`, and those without
`autonomy` resolve it as `adaptive`; setup writes user-confirmed values when
refreshing them.

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

Every item starts with a Markdown title and includes outcome, scope, and
observable acceptance meaning under headings that fit the work. Add other body
sections only when they carry useful state.

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

Do not invent missing requirements or priority during capture or migration.

## Completion

With `completed_items: summarize`, replace a completed active item with a compact
`.work/completed/<id>.md` outcome stub containing identity, completion date, and
delivered outcome. Remove its id from active relationships before closing it. A
release summary replaces selected completion stubs. With
`completed_items: discard`, remove the completed active item after verification.

## Managed instructions

Maintain one marked Workbench section in the canonical root `AGENTS.md`:

```markdown
<!-- workbench:start -->
## Workbench

This repository is Workbench-owned (`.work/CONVENTIONS.md`). Route concrete
Workbench workflows through its skills and prefer ideate before design when
early exploration of substantial or cross-cutting work could materially improve
what gets designed, unless the user requests direct design or execution.
Unrelated requests stay outside Workbench. Track active outcomes in
`.work/active/` and deferred context in `.work/backlog/`. Consult
`.knowledge/index.json` when present. Use features as the normal delivery unit;
reserve epics for multiple feature outcomes and stories for narrow slices. Preserve `epic → feature → story` when
items nest. Ask the human about consequential requirements according to the
effective autonomy posture. Designs and reviews must not invent requirements or
expand the user's original scope; apply foundation truth and the rational needs
of the actual project type, flag overbuilding, and park useful adjacent findings
instead.

Durable state is limited to work items, foundation documents, research
attestations and briefs, mockups, generated indexes, completion stubs, release
summaries, and repository conventions; write these whenever a workflow names
them. Everything else—questions, proposals, recommendations, explanations,
progress summaries, and completion reports—belongs in your reply, not in a new
file or a no-op record.

Keep human-facing documents and designs clean and self-contained. Do not expose
agent work history, review-correction notes, or revision narration. Agent-facing
documents may retain process prose only when it adds material value.

Frame human-facing documents from real-world and business meaning before
technical representation. Define load-bearing data, domain, and interface
concepts before using them. When provider terms matter, map the provider term to
the project concept and a generic real-world term at the object level before
field details. Do not define ordinary terms the intended audience can safely
know.

Keep independent items parallel by default. Add `blocked_by` only when serial
work reduces rework, ambiguity, or integration risk, and record the reason in
`## Sequencing`.

For concrete Workbench workflows, test behavior at stable interfaces, verify
the full requested boundary, reconcile affected foundation truth, rebuild the
knowledge index when indexed documentation changes, apply the configured review
weight to substantive Workbench design and implementation, and remove or
summarize completed items immediately. Do not apply that review weight to every
review, audit, planning discussion, explanation, or loose request in the
repository.
<!-- workbench:end -->
```

Add confirmed repository-specific invariants outside or within this section as
appropriate, but do not duplicate them across agent-specific files.
