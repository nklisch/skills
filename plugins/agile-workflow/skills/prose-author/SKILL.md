---
name: prose-author
description: >
  ALWAYS invoke this skill when picking up a feature tagged [prose] at stage:drafting — a
  no-code-surface deliverable (docs, conventions, rules, research prose, copy, config-as-prose) whose
  design and implementation collapse into a single inline authoring act. Confirms the brief is a
  sufficient spec, fleshes the feature body inline if needed, and advances drafting to implementing
  WITHOUT exploratory sub-agents, a pre-mortem, or a structured question tool design gate. The no-code authoring lane:
  the design-family routing layer forks [prose] work here the way it forks [refactor]/[perf] to
  refactor-design/perf-design — but this lane authors, it does not design. Collapses to one inline
  stride for the common case; large multi-section prose can still flow through drafting to
  implementing to review as real draft/write/revise steps. Misroutes anything with a real code surface
  back to feature-design. Pairs with implement's no-coordination inline path.
---

# Prose-Author

You handle a feature tagged `[prose]` at `stage: drafting` — work whose
deliverable is **prose with no real code surface** (documentation, an AGENTS.md
/ convention / rule edit, a research write-up, marketing copy, a changelog, or a
config file that carries no logic). For this class of work the design pass and
the implementation collapse into a single inline authoring act: there is no
interface to pin, no architecture to choose, no integration seam to map. The
brief *is* the design.

This is the **no-code authoring lane** — not a design step. The design-family
routing layer (the "am I the right skill" fork that `feature-design` owns)
forks `[prose]` work to this lane the way it forks `[refactor]`/`[perf]` to
`refactor-design`/`perf-design`:
- `epic-design` — `kind: epic`
- `feature-design` — `kind: feature`, no specialized tag
- `refactor-design` — `kind: feature` with `tags: [refactor]`
- `perf-design` — `kind: feature` with `tags: [perf]`
- `prose-author` (this lane) — `kind: feature` with `tags: [prose]`

Where `feature-design` runs exploratory sub-agents, a pre-mortem, and an
`structured question tool` design gate to leave `drafting`, `prose-author` does none of
that — for prose that ceremony has no payoff, because there is no code surface
to design against. It still advances `drafting → implementing` at the same seam,
so the stage machine and `autopilot` are unchanged; the lane just authors the
brief directly instead of designing.

**Collapse by default, graduate when the prose is large.** The common case is a
single inline authoring stride (`drafting → implementing` here, then inline
`implement` to `review`). But the lane does not *force* a one-shot: a large
multi-section deliverable (a long spec, a multi-part guide) can use the shared
`drafting → implementing → review` stages as real **draft → write → revise**
steps — an `## Outline` in `drafting`, the writing in `implementing`, a
coherence/tightening pass at `review`. These are the same advisory stages every
item has (no new vocabulary, no parallel pipeline) — prose just gets to skip the
*ceremony*, not the *stages*. Reach for the staged rhythm only when the
deliverable's size earns it; most prose does not.

## The [prose] black-box test (misroute check)

`[prose]` is a **work-nature** tag, not a domain tag. Apply the test before
acting: **does this feature have a real code surface or a genuine design
ambiguity?** A real code surface means a caller-visible interface, types to pin,
an integration seam, an error path, or an architectural choice between
approaches. If YES, the item is misrouted — it wants `feature-design`'s design
pass, not this lane.

Mirror of the `[refactor]` black-box discipline: when the test fails, don't
muscle through. Strip `prose` from the item's `tags`, append a one-line note
("Misrouted to prose-author; the work has a real code surface — retagged for
feature-design"), commit (`prose-author misroute: <id> retagged for
feature-design`), and return **without advancing the stage**. The caller
(autopilot or human) reroutes on the next pass.

Domain ≠ nature. A documentation *feature* that ships a docs-site generator has
a code surface → `feature-design`. A rule rewrite, an AGENTS.md edit, a research
brief, or release notes → `prose`.

**Config-with-no-logic criterion:** a config file is `[prose]` only when nothing
parses it as schema — e.g. a docs-site config (MkDocs, Docusaurus YAML),
`.editorconfig`, `.prettierrc`. A config with a typed or programmatic consumer
(env files read by a typed loader, OpenAPI specs consumed by a code-generator,
database migration configs, CI pipeline definitions) has an integration seam and
real failure paths → NOT `[prose]`; route through `feature-design`.

## Trigger

The agent picks this lane for a feature at `stage: drafting` with
`tags: [prose, ...]` and no `[refactor]`/`[perf]` tag. Common phrases:
- "author the docs feature", "this is just prose — advance it"
- "write up the <convention / rule / copy> feature"

## Invocation modes

| Invocation | Behavior |
|---|---|
| `<feature-id>` (default) | Confirm the brief, flesh the body inline if needed, advance `drafting → implementing`. |
| `<feature-id> --only-questions` | Question-only pass — surface any genuine ambiguity, capture under `## Design decisions`, do NOT advance. Mirrors feature-design's mode; interactive-only. Most prose items surface zero questions. |

## Workflow

### Phase 1: Read the feature item

Read `.work/active/features/<id>.md`. Confirm `kind: feature`, `stage:
drafting`, and `tags` includes `prose`. If `tags` also includes `refactor` or
`perf`, that specialized tag wins — log a misroute note and return without
advancing.

### Phase 2: Apply the black-box test

Run the `[prose]` black-box test above. If the item has a real code surface or a
genuine architectural ambiguity, misroute it back to feature-design per the
procedure above and return.

### Phase 3: Ground yourself (light)

Read only what the prose itself must stay consistent with — the parent epic body
if `parent` is set, the foundation docs (`docs/VISION.md`, `docs/SPEC.md`,
`docs/ARCHITECTURE.md`) and `AGENTS.md` / `CLAUDE.md` when the deliverable
touches conventions or project-facing claims, and any sibling doc the feature
revises. One pass, skim. **Do NOT** spawn exploratory sub-agents — there is no code
surface to map.

### Phase 4: Confirm the brief is a sufficient spec

The brief from `scope` is usually the whole spec for prose work. Read it and
decide:
- **Sufficient as-is** — the deliverable, its target path, and what "done" means
  are clear. Proceed to Phase 5.
- **Needs fleshing** — the brief leaves the shape of the prose open (which
  sections, which file, what claims). Flesh it **inline in the body** as a short
  `## Outline` (target path + section list + acceptance criteria), then proceed.
  This is authoring, not a design pass — keep it to what the writer needs. For a
  large multi-section deliverable the `## Outline` is also the structural draft
  step that lets the writing and a later revise pass run as distinct strides
  (see "Collapse by default, graduate when the prose is large" above).

Do NOT run a pre-mortem and do NOT open a `structured question tool` design gate. If a
genuine directional ambiguity exists (rare for prose), that is the signal the
item wanted `feature-design` — reconsider the Phase 2 misroute test. The one
exception: under `--only-questions`, capture the ambiguity and stop.

### Phase 5: Advance stage and commit

1. Edit the feature frontmatter: `stage: drafting → implementing`. The
   PostToolUse hook bumps `updated:`.
2. Commit:
   ```bash
   git add .work/active/features/<id>.md
   git commit -m "prose-author: <feature-id>"
   ```

Child stories are almost never warranted for prose — a single inline authoring
stride covers it. Spawn one only if the deliverable genuinely splits into
independent documents with separate acceptance (the feature-design Phase 7
"when to spawn stories" rule applies, but the bar is rarely met here).

## Handoff

The feature is now at `stage: implementing` with no code-surface design debt.
The matching implement path is **inline** `/agile-workflow:implement`: prose work
qualifies for the inline lane on **no-coordination** grounds regardless of size —
a 600-line convention rewrite is one authoring stride, not an orchestrated
fan-out. Do not route prose features to `/agile-workflow:implement-orchestrator`
(agent-spawning + worktrees) just because they exceed a line count; the
orchestrator's value is parallel coordination, which prose work does not need.

For a large deliverable, inline `implement` is the **write** stride and the
review lane is a genuine **revise/coherence** pass — never a rubber stamp. For a
small deliverable, the same review may be light, but it still evaluates the work.
In both cases, `/agile-workflow:implement` continues through that review lane to
`done` by default in one invocation, forwarding the effective review weight, or
returns with a documented bounce or blocker. Even when policy skips independent
review, closure still requires green verification and acceptance evidence. The
lane stops at `review` only when the caller explicitly requests `stop-at-review`
(or the project convention sets that boundary).

## Output

In conversation:
- **Advanced**: `<feature-id>` → `stage: implementing` (or **misrouted**: retagged for feature-design)
- **Brief**: sufficient as-is, or fleshed with a `## Outline`
- **Next**: `/agile-workflow:implement <feature-id>` (inline — not the orchestrator)

## Guardrails

- `[prose]` is work-nature, not domain. Verify no real code surface every time —
  the Phase 2 misroute test is the load-bearing check.
- No exploratory sub-agents, no pre-mortem, no design `structured question tool` gate. If you
  reach for any of them, the item probably wanted `feature-design` — misroute it.
- Never advance past `implementing` — that's `implement` / `review`'s job.
- The brief / outline lives in the feature body. NEVER create
  `docs/designs/<name>.md` — agile-workflow uses item-IS-the-work.
- Prose features implement **inline**, never via the orchestrator. Flag the
  no-coordination property so the implement step takes the lean path.
