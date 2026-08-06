# Canonical Workbench Layout

## Contents

- Authority boundaries
- Workbench conventions
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

Foundation names follow the repository's confirmed documentation conventions.
Common shapes are `VISION.md` for product intent, `ARCHITECTURE.md` for settled
system structure, `PRINCIPLES.md` for binding principles, `SPEC.md` for a
normative contract, and `JOURNEYS.md` or `WORKFLOWS.md` for supported user
journeys and operating flows. These are examples, not a required set — from one
consolidated document to several focused ones, the names should fit the
project.

The research capability ships with Workbench. Setup may omit `.research/` and
`.knowledge/` until the project has research worth retaining.

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

Confirm `owner: workbench` in `.work/CONVENTIONS.md`. Track active outcomes in
`.work/active/` and deferred context in `.work/backlog/`. Treat natural-language
requests as the workflow. Consult `.knowledge/index.json` when present. Use
features as the normal delivery unit; reserve epics for multiple feature
outcomes and stories for narrow slices. Preserve `epic → feature → story` when
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

Test behavior at stable interfaces, verify the full requested boundary,
reconcile affected foundation truth, rebuild the knowledge index when indexed
documentation changes, apply the configured review weight to substantive design
and implementation, and remove or summarize completed items immediately.
<!-- workbench:end -->
```

Add confirmed repository-specific invariants outside or within this section as
appropriate, but do not duplicate them across agent-specific files.
