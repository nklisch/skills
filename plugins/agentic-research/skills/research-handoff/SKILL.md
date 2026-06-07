---
name: research-handoff
description: "Operator-confirmed emission gate: takes a completed research engagement (analysis slug or campaign dir) and proposes .work/ items grounded in its actionable findings. Each emitted item carries research_origin: <slug> plus a body citation back to the .research/ artifact. Silent no-op when .work/CONVENTIONS.md is absent. NEVER auto-fires — always operator-invoked and always asks before writing."
argument-hint: "<slug-or-campaign-dir>"
allowed-tools: Read, Glob, Grep, Write, Bash, AskUserQuestion
user-invocable: true
---

# Research Handoff

Arrow 2 of the research↔work handoff: a completed research engagement with actionable
findings can **emit tracked `.work/` items**, operator-confirmed and gate-style. This
skill is the emission gate. It is **operator-invoked and never auto-fires** — the
`research-orchestrator` suggests it as a next step, but emission is always a
deliberate operator act.

The directionality invariant (non-negotiable): this gate writes **only to `.work/`**.
It never writes into `.research/`. Research informs work; operational state never
rewrites the research record (ARD SPEC §1/§4.6). Every step below that touches a
file is either a read from `.research/` or a write to `.work/`.

## Phase 1 — Locate the source artifact(s)

Resolve the operator's argument to one or more analysis artifacts:

- **Slug** — look under `.research/analysis/` in all four sub-tiers:
  `positions/<slug>.md`, `briefs/<slug>.md`, `campaigns/<slug>/parent.md`
  (or the campaign dir itself), `hypothesis/<slug>.md`. The slug is the
  `slug:` value in the artifact's YAML frontmatter (or the dir name for campaigns).
- **Campaign dir** — if the argument is a path like
  `.research/analysis/campaigns/<slug>/`, read `parent.md` as the synthesis
  and `dispatch.md` for the registration (which carries `output_kind`).

From each resolved artifact, extract:
1. The actionable findings — sections or bullet points that represent
   recommendations, adoption proposals, hypotheses to validate, or implementation
   candidates.
2. The artifact's `output_kind` field (from frontmatter or the campaign's
   `dispatch.md`). Values that signal actionability: `adoption-recommendations`,
   `staged-hypothesis`, `recommendation`. Note it — it guides the proposed item
   kind.
3. The artifact's `slug` — this is the citation key for `research_origin:`.
4. The artifact file path — this is the body citation target.

If no artifact is found at the resolved path, report clearly and stop.
The finding stands in `.research/` and no `.work/` write is attempted.

## Phase 2 — Substrate presence check

Check whether `.work/CONVENTIONS.md` exists in the working tree.

**If `.work/CONVENTIONS.md` is absent:** report that the finding stands in
`.research/` (path + slug) and that no operational substrate is present for
emission. **Stop silently** — no `.work/` write is attempted, no error.
The plugin's research capability is fully intact without `.work/`.

This is the `repo-eval` precedent: "if no substrate exists, skip this phase silently."

Only proceed to Phase 3 if `.work/CONVENTIONS.md` is present.

## Phase 3 — Propose and confirm via AskUserQuestion

Present the operator with:
- A summary of the source artifact (slug, path, `output_kind`, brief description).
- The list of actionable findings you extracted (numbered, one per proposed item).
- The proposed item kind for each (story or feature, per scope; default to story
  for narrow/surgical findings, feature for findings that need a design pass).

Ask: **where should these findings be filed?**

Options (present all three, state the default):
- **Backlog** (default, lowest commitment) — each finding becomes
  `.work/backlog/<id>.md` for later scoping. Recommend this unless the operator
  has a specific reason to promote immediately.
- **Active** — each finding becomes `.work/active/stories/<id>.md` (narrow,
  surgical) or `.work/active/features/<id>.md` (needs design pass), per scope.
- **Skip** — leave findings in the report only, no `.work/` write.

Honor the operator's choice exactly. If they select **skip**, stop here with no
`.work/` write.

**CRITICAL**: Do not write any `.work/` items before receiving confirmation.
This skill never auto-writes.

## Phase 4 — Emit the confirmed items

For each confirmed finding, write one item file. Follow the `.work/` substrate
frontmatter convention (from `.work/CONVENTIONS.md`):

```yaml
---
id: <generated-id>
kind: story          # or feature, per the operator's selection and finding scope
stage: drafting
tags: [<domain-tag>]
parent: null
depends_on: []
release_binding: null
gate_origin: null
research_origin: <slug>
created: <today-iso>
updated: <today-iso>
---
```

**`research_origin: <slug>`** — set to the source artifact's slug (the citation key
the `fields` feature added to the substrate schema). This is the machine-queryable
link: `work-view --research-origin <slug>` will find this item once the fields
feature has landed.

**Item body** — write the finding text (verbatim or lightly formatted for clarity)
followed by a citation block:

```
## Research grounding

**Source**: `<path-to-artifact>` (slug: `<slug>`)

<one-sentence summary of the finding and why it is actionable>
```

**Tags**: derive from the finding's domain (e.g., `[adoption]`, `[security]`,
`[testing]`, `[architecture]`). Use the source artifact's domain context as a guide.

**Target path**:
- Backlog (default): `.work/backlog/<id>.md`
- Active story: `.work/active/stories/<id>.md`
- Active feature: `.work/active/features/<id>.md`

Generate ids with the prefix `research-handoff-<slug>-<N>` (N = 1, 2, …) unless
the operator provides their own id scheme.

All writes target `.work/`. Nothing is written into `.research/`.

## Phase 5 — Commit and report

Commit the emitted items:

```
research-handoff: filed <N> items from <slug> (research_origin)
```

Report in conversation:
- **Items filed**: count + each item's id and path.
- **Next**: `/agile-workflow:scope` to cluster and prioritize the filed findings,
  or start an autopilot goal to drain them.

## Behavioral invariants

- **No `.work/` write before confirmation.** Phase 3's AskUserQuestion is mandatory.
- **No `.research/` writes anywhere.** This gate is read-only against `.research/`;
  every write targets `.work/`.
- **Silent no-op without `.work/CONVENTIONS.md`.** Phase 2 stops before any write
  attempt when the substrate is absent.
- **One item per actionable finding** (default). Umbrella items only if the operator
  explicitly requests consolidation.
- **`research_origin:` is always set** on emitted items (the schema field the
  `fields` feature ships). Body always carries a citation to the source artifact path
  + slug.

## Related

- [`research-orchestrator`](../research-orchestrator/SKILL.md) — the engagement
  entry point that produces the `.research/` artifacts this gate consumes. When an
  engagement surfaces actionable output, the orchestrator suggests running
  `/agentic-research:research-handoff <slug>`.
- `docs/HANDOFF.md` — the authoritative contract document for the research↔work
  pairing; Arrow 2 is this skill.
- `.work/CONVENTIONS.md` — the substrate frontmatter contracts; governs the emitted
  item shape.
- `work-view --research-origin <slug>` — queries emitted items by their source
  engagement once filed.
