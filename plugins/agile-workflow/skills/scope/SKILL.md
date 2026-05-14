---
name: scope
description: >
  Promote an idea — from .work/backlog/ or a fresh user request — into the active tier
  as an epic, feature, or story with declared dependencies. For large scope (something
  that changes the project's vision/spec/architecture), also rolls foundation docs
  forward in the same stride. Triggers on "scope this", "promote this", "let's track
  this", "this needs to be a feature/epic", or when the user describes a new direction
  to formalize.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion
---

# Scope

You promote an idea to active substrate work. You decide the right kind (epic /
feature / story), declare dependencies, and — if scope is large enough to change the
project's standing context — roll foundation docs forward as part of the same operation.

## When to invoke

Trigger phrases:
- "scope this", "promote this to active"
- "let's track this as a feature"
- "this needs to be a feature/epic/story"
- A new direction surfaces and the user wants to formalize it

If the user wants to fix a bug, use `/agile-workflow:fix`. If they want to capture
an idea without acting on it, use `/agile-workflow:park`.

## Workflow

### Phase 1: Source the idea

The input is one of:
- A backlog item: `.work/backlog/<id>.md` exists. Read its body.
- A fresh request: the user is describing the idea directly. Distill it to a clear
  one-paragraph statement.

### Phase 1.5: Explore the idea (large-scope only)

For small or medium scope, skip this phase — go to Phase 1.7.

For large scope (something that may change vision/spec/architecture), have a
short freeform conversation before sizing. Cover:

- **What** — what does this add? What's the user-facing behavior or new
  capability?
- **Why** — what problem does it solve? What's the motivation?
- **Where** — where does it fit in the existing architecture? What does it
  touch?
- **Scale** — focused addition or significant new direction?
- **Dependencies** — external APIs, libraries, or internal features required?
- **Constraints** — performance, compatibility, security considerations?

Push for specificity. "Handle errors well" becomes "invalid input returns a 400
with a structured error body." When you can articulate the addition clearly,
summarize and ask: "Did I get this right?"

Then proceed to Phase 1.7.

### Phase 1.7: Surface strategic-level design ambiguities

Before sizing or writing the item, derive specific, concrete strategic
questions about *this* idea — directional choices at the vision / spec /
architecture / audience layer. These are the calls that, if locked in now,
will set the frame for the whole epic and any foundation-doc roll-forward.
The questions must come from the actual idea; examples of the *shape* only:

- "Is this aimed at our existing users or a new audience segment?"
- "Should this live as a new bounded context, or extend the existing
  domain model?"
- "Is real-time sync a v1 requirement, or is eventual-consistency
  acceptable?"
- "Do we expose this externally (public API surface) or keep it
  internal-only for now?"
- "Does this displace an existing capability, or sit alongside it?"

These sit a layer *above* `epic-design` Phase 4.7 and `feature-design`
Phase 4.5 — those resolve epic- and feature-internal direction. Phase 1.7
resolves the framing that determines what the epic even *is*. Skip anything
the foundation docs or the user's prompt already pin. Skip anything that is
safely an epic-design or feature-design call (decomposition, boundaries,
interfaces).

Aim for 2-5 questions. Zero is fine if the user's brief and foundation docs
already pin every strategic choice. For small (story) and medium (feature)
scope, the bar is higher — only ask if a strategic ambiguity genuinely
affects framing; otherwise skip directly to Phase 2.

Use `AskUserQuestion` to ask. Capture answers in the item body under a
`## Strategic decisions` section so the downstream design family inherits
the locked-in direction:

```markdown
## Strategic decisions
- **<question>**: <choice> — <one-line rationale>
```

For large scope, the answers here directly inform the foundation-doc
roll-forward in Phase 4.

Then proceed to Phase 2.

### Phase 2: Size the scope

Three sizes determine what gets created and whether foundation docs roll forward.

| Size | Signals | Outputs |
|---|---|---|
| **Small (story)** | Single-session work, no architectural change, fits in one feature's scope | One story file at `.work/active/stories/<id>.md`, `stage: implementing` (often skips drafting) |
| **Medium (feature)** | Spans multiple files, deserves a design pass, may have child stories, no foundation-doc impact | One feature file at `.work/active/features/<id>.md`, `stage: drafting` |
| **Large (epic + foundation roll)** | Changes the project's vision, spec, architecture, or audience; spans multiple features; introduces a new capability area | Epic at `.work/active/epics/<id>.md` plus updates to `docs/VISION.md`, `docs/SPEC.md`, and/or `docs/ARCHITECTURE.md` per the rolling-foundation principle |

**Size check** — ask yourself:
- Does this contradict or extend a current foundation-doc assertion? → at least medium, possibly large
- Will it introduce a new contract, new boundary, or new architectural component? → large
- Is it one cohesive change in one area? → small or medium

If unclear, lean smaller — easier to upgrade a story to a feature than to unwind a
premature epic.

### Phase 3: Declare dependencies

Ask the user (or surface from context): what items, if any, must be at `stage: done`
before this can start?

- For a backlog item the user mentions as a prerequisite: add to `depends_on`
- For a related in-flight feature in the same area: consider adding to `depends_on`
  if the new work's design assumes the in-flight feature's output

**Cycle check**: if `<id>` is the new item and `<dep>` is a candidate dependency,
verify that `<dep>` does not transitively depend on `<id>`. Run:

```bash
.work/bin/work-view --blocking <id> --paths
```

If `<dep>` is in that output, adding `<dep>` to `<id>`'s `depends_on` would create a
cycle. Report it and ask the user to resolve.

### Phase 4: Foundation-doc roll-forward (large scope only)

When the scope is large, first do an **impact assessment** along four axes:

1. **Architecture impact** — does the current architecture support this, or
   does it need to evolve? New layers, boundaries, integration points?
2. **Spec impact** — new technical constraints, interfaces, non-functional
   requirements?
3. **Vision impact** — does the project's purpose or audience change, or just
   capabilities?
4. **Principles impact** — does this new direction force a new substrate or
   code-design principle, or fit existing ones?

Run `/agile-workflow:research` first if the expansion uses unfamiliar
technology and you don't yet have research docs for it.

Then identify which foundation docs need updating:

- **VISION.md** — if scope changes audience, success criteria, or the project's purpose
- **SPEC.md** — if scope introduces a new technical constraint, interface, or
  non-functional requirement
- **ARCHITECTURE.md** — if scope adds a component, changes a boundary, or alters data flow
- **PRINCIPLES.md** — only when a genuinely new principle emerges (rare)

For each affected doc:
1. Read the current version in full
2. Edit the relevant sections to reflect the **new present** — extend, replace, restructure as needed
3. **Do NOT add "previously" notes, "in v1.x", or migration prose.** Git carries
   history; the doc carries truth (rolling-foundation principle)

### Phase 5: Write the item file

Per the SPEC.md frontmatter contract. Required fields for an item in active:

```yaml
---
id: <slug>
kind: epic|feature|story
stage: drafting    # or implementing for stories
tags: [<tag>, ...]
parent: <slug>|null
depends_on: [<slug>, ...]
release_binding: null
gate_origin: null
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# <name>

## Brief
<one to three paragraphs describing what this is and why it exists>

<!-- Subsequent sections (Design, Implementation Notes, etc.) accumulate as
work progresses. -->
```

If sourcing from `.work/backlog/<id>.md`, use `git mv` to move it:

```bash
git mv .work/backlog/<old-id>.md .work/active/<kind>s/<new-id>.md
```

Then edit the moved file to add full frontmatter and brief.

If a fresh request, just create the file directly with `Write`.

### Phase 6: Commit

```bash
git add .work/active/<kind>s/<id>.md docs/VISION.md docs/SPEC.md docs/ARCHITECTURE.md  # whichever exist + were changed
git commit -m "scope: <id> (<kind>, <size>)"
```

If foundation docs rolled forward, the commit message should note it:

```
scope: <id> (epic) + foundation roll-forward

Rolled forward: SPEC.md (added multi-tenancy section), ARCHITECTURE.md (added tenant boundary).
```

## Output

In conversation:
- **Scoped**: `<id>` as `<kind>` at `stage: <stage>`
- **Parent**: `<parent-id>` (or "none — top-level")
- **Depends on**: `[<id>, ...]` (or "no dependencies")
- **Foundation docs rolled forward**: list of files touched (or "none")
- **Next**: for features at `drafting`, the design family will pick this up
  (`/agile-workflow:feature-design`, `refactor-design`, or `perf-design` based
  on tags); for epics at `drafting`, `/agile-workflow:epic-design` decomposes
  into child features.

## Guardrails

- Foundation docs roll forward IN PLACE — never add "previously" or "originally"
  prose. Git is the audit trail.
- Cycle detection is mandatory for `depends_on`. Use `work-view --blocking` before
  writing.
- Do NOT pre-populate stages beyond what the size mapping specifies. Don't set a
  feature to `implementing` at scope time — `design` does that when it advances.
- Do NOT pre-bind to a release. `release_binding` stays `null` until
  `/agile-workflow:release-deploy` runs.
- If sizing is genuinely unclear after Phase 2, ask the user via AskUserQuestion
  rather than guessing.
