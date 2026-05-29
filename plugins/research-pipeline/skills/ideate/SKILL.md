---
name: ideate
description: >
  Research-grounded project ideation — a super-layer over Nathan's agile-workflow:ideate.
  Produces all four foundation docs (VISION.md, SPEC.md, ARCHITECTURE.md, PRINCIPLES.md)
  PLUS research-plan.md PLUS an auto-call to /scout for prior art discovery. Respects
  existing foundation docs (does not overwrite). Identifies domains needing /research,
  /deep-research, or /research-program. The canonical first step for new projects in
  this workflow.
user-invocable: true
disable-model-invocation: false
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion, Task, Skill
model: opus
---

# Ideate (super-layer)

You workshop a new project's foundation from a rough idea or vision. Output is the
**four foundation docs** the substrate expects (VISION + SPEC + ARCHITECTURE + PRINCIPLES)
plus **research-plan.md** (which research/deep-research/research-program invocations
should run before architecture firms up).

**This is the merged version** of Nathan's `agile-workflow:ideate` (foundation-doc workshop:
VISION + SPEC + ARCHITECTURE) and Andrew's `ideate` (north-star + research planning + scout
auto-call). It behaves as a strict super-layer: produces everything Nathan does plus more,
and respects his foundation-doc layout (no separate `north-star.md`; the role splits into
VISION + parts of SPEC).

**You follow the build process at `/dev/skills-v2/plugins/research-pipeline/docs/build-process.md`.** Read it before starting.

**Read `/dev/skills-v2/plugins/research-pipeline/docs/first-principles.md` for consideration.** Apply Open and Synthesize especially — deeply explore the problem space; synthesize from multiple angles before converging.

**If ideation gets stuck, load `/dev/skills-v2/plugins/research-pipeline/docs/oblique-strategies.md`.** 10 lateral thinking moves across Reframe → Constrain → Stimulate. Use them when the conversation has been circular for 3+ exchanges, every solution feels like a variation of the same idea, or the problem seems over-constrained.

## When to use

- Starting a brand-new project from a rough idea
- Joining a project that has only informal docs and needs formalization
- A major scope expansion that warrants re-grounding (`/expand` is preferred for routine expansions)

For ds-engine and other established projects: don't run this. Existing nested docs
(`docs/architecture/north-star-*.md`) work fine; declare them as foundation docs in
`.work/CONVENTIONS.md` instead.

## Model Assignment

Per [model-selection-pattern.md](/dev/skills-v2/plugins/research-pipeline/docs/model-selection-pattern.md):

- **Ideator (this skill's main loop)** — Orchestration. Opus high effort. Runs in parent context.
- **Scout auto-call (Phase 2)** — Skill chain via `Skill` tool. Spawns Sonnet workers internally.

Vision and architecture decisions cascade through every downstream phase — Opus warrants. /scout handles its own model selection.

## Anti-patterns

- **Don't write more than the user has thought.** If they describe a vague idea, surface gaps via questions, don't paper over with plausible-sounding content.
- **Don't overwrite existing foundation docs.** If `docs/VISION.md` exists, read and enhance gaps only.
- **Don't skip /scout.** Auto-call is by design — prior art shapes the doc, even if the user thinks the project is novel.
- **Don't lock architecture early.** Phase 4 produces a HIGH-LEVEL architecture only; detailed architecture happens later via `/architecture` after research lands.
- **Don't pre-create epics.** That's `/epicize`'s job, after foundation docs and research are ready.

## Workflow

### Phase 0: Pre-flight check for existing foundation docs

Scan `docs/` for foundation docs:
- `docs/VISION.md`
- `docs/SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/PRINCIPLES.md` (optional)
- `docs/research-plan.md` (ours)

For each that exists: read it, log as "inherited."
For each that's missing: log as "will be produced."

**If ALL exist**: ask via `AskUserQuestion`:
> "All foundation docs already exist. Re-ideate (will not overwrite — only enhance gaps) or skip?"

If user picks "skip": exit gracefully with summary.

### Phase 1: Workshop the vision (interactive)

Use `AskUserQuestion` to surface:
- What problem does this project solve?
- Who is it for?
- What does success look like (one concrete scenario)?
- What's out of scope (explicit non-goals)?

Capture into draft VISION.md content. Reference any inherited VISION.md content — probe for gaps and confirm before adding.

### Phase 2: Auto-call /scout (OURS — load-bearing)

If `/scout` is installed (research-pipeline plugin), invoke via `Skill` tool with the project topic:

```
Skill(scout, "<project topic + key keywords>")
```

Receive landscape brief. Surface 2-3 most relevant pieces of prior art to the user via `AskUserQuestion`:
> "Scout found these related projects: [list]. Do any of these match the shape of what you're building, or are you intentionally diverging?"

Capture the answer; it informs ARCHITECTURE.md choices (build-on-existing-pattern vs greenfield).

If `/scout` is not installed: log "scout skipped (not installed)" and continue.

### Phase 3: Workshop scope + capabilities + NFRs

Use `AskUserQuestion` to surface:
- What does the system actually DO? (3-7 capabilities)
- What domain entities are involved? (the domain model — a few key nouns)
- What constraints matter most? (performance, security, scale, regulatory — pick 2-3)
- What are the explicit non-functional requirements? (uptime, response time, etc.)

Capture into draft SPEC.md content. Reference any inherited SPEC.md content — enhance gaps only.

### Phase 4: Workshop initial high-level architecture

This is NOT detailed architecture — that's `/architecture`'s job after research. Here, sketch:
- 3-7 module names (one-line descriptions each)
- How data flows between them (one-paragraph)
- Key external dependencies (services, libraries you're committing to)
- The biggest architectural risk (one sentence)

Use `AskUserQuestion` to confirm each major choice.

Capture into draft ARCHITECTURE.md content. Reference any inherited ARCHITECTURE.md — enhance gaps only.

### Phase 5: Workshop design principles (optional)

If the user has principles they want to surface (decision heuristics, trade-off preferences), capture into PRINCIPLES.md. Skip if user has no specific principles — don't manufacture them.

Examples of principles that go here:
- "Optimize for read latency over write latency"
- "Prefer explicit over magic"
- "Strict types at module boundaries; flexible inside"

NOT good principle content:
- Generic best practices (every project has those)
- Vague aspirations ("be clean")

### Phase 6: Identify research domains (OURS — load-bearing)

For each domain mentioned in vision/scope/architecture, classify:

| Classification | Trigger | Action |
|---|---|---|
| Well-understood | User has shipped similar before; library/API is mainstream | No research needed |
| Needs `/research` | Single-domain investigation, focused question, library has docs but the user hasn't used it | Invoke `/research` later |
| Needs `/deep-research` | Multi-faceted domain, 5+ orthogonal aspects, requires decomposition | Invoke `/deep-research` later |
| Needs `/research-program` | Megatopic spanning multiple distinct domains, each big enough to be its own campaign | Invoke `/research-program` later |

Capture into `docs/research-plan.md` with routing recommendations:

```markdown
# Research Plan

## Pre-architecture research (BEFORE /architecture)

1. **<Domain>** — `/research`
   - Question: <specific>
   - Rationale: <why this needs research>
   - Output: brief at `.research/briefs/<topic>/parent.md`

2. **<Domain>** — `/deep-research`
   - Topic: <broad>
   - Facets: <5-7 orthogonal aspects>
   - Output: campaign at `.research/briefs/<topic>/`

## Optional follow-ups (post-architecture, per-phase)

- <Domain> — `/brief` when a phase needs curated context
```

### Phase 7: Add knowledge-index frontmatter

Each produced doc gets conformant frontmatter:

```yaml
---
name: <slug>
description: <"when do I read this?" hook>
type: north-star  # or "spec", "architecture", "principles", "research-plan"
kind: planning
summary: <1-2 sentences on what's in the doc>
decisions: [<5-9 highest-leverage commitments — required for kind:planning>]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

See `/dev/skills-v2/plugins/research-pipeline/docs/knowledge-storage-pattern.md` for the full schema.

### Phase 8: Write docs (Write tool — never overwrite if existing)

For each doc that was missing in Phase 0:
- `docs/VISION.md` — from Phase 1
- `docs/SPEC.md` — from Phase 3
- `docs/ARCHITECTURE.md` — from Phase 4
- `docs/PRINCIPLES.md` — from Phase 5 (only if user surfaced principles)
- `docs/research-plan.md` — from Phase 6

For each doc that was INHERITED in Phase 0:
- Use `Edit` to add new sections only — never overwrite existing content
- Log each addition: "Added § <section> to docs/<doc>.md"

### Phase 9: Run /knowledge-index

Invoke via `Skill` tool to regenerate the index:

```
Skill(knowledge-index)
```

This populates `docs/knowledge-index-nav.yaml` so subsequent skills can find these foundation docs by frontmatter.

### Phase 10: Commit

```bash
git add docs/*.md
git commit -m "ideate: foundation docs for <project-name>"
```

If only enhancements (not new docs): `git commit -m "ideate: enhance gaps in <doc-names>"`.

### Phase 11: Output next-step recommendations

In conversation, surface:

- **Foundation docs produced/enhanced**: list paths
- **Scout findings**: 2-3 most relevant prior art links (inform downstream architecture)
- **Research plan**: ordered list of `/research`, `/deep-research`, `/research-program` calls to make
- **Suggested first move**:
  - If research plan has entries: `/research <topic>` (or `/deep-research`, `/research-program`)
  - If no research needed: `/architecture` to firm up modules
  - After architecture firms up: `/agile-workflow:convert` to bootstrap substrate; then `/epicize`

## Output

In conversation, structured summary:

```
Foundation docs:
  ✓ docs/VISION.md (created)
  ✓ docs/SPEC.md (created)
  ✓ docs/ARCHITECTURE.md (created — high-level)
  ✓ docs/PRINCIPLES.md (created — 3 principles)
  ✓ docs/research-plan.md (created)

Scout findings: [topic] - 2 related projects identified ([names])

Research plan (3 entries):
  1. /research <domain-A>     (question scale)
  2. /deep-research <domain-B> (domain scale — 5 facets)
  3. /research <domain-C>     (question scale)

Next: /research <domain-A>
After research: /architecture, then /agile-workflow:convert, then /epicize
```

## Guardrails

- **Detect-existing-docs is non-negotiable.** Never overwrite VISION.md, SPEC.md, ARCHITECTURE.md, PRINCIPLES.md, or research-plan.md if they already exist. Enhance gaps only.
- **Don't skip /scout.** Prior art shapes architecture; auto-calling is by design.
- **Phase 4 is HIGH-LEVEL only.** Detailed architecture comes from `/architecture` after research lands. Don't pre-empt that work here.
- **Don't manufacture principles.** PRINCIPLES.md is optional — if the user doesn't have surfaceable principles, skip the file entirely.
- **Don't pre-create epics or substrate items.** Epicize runs after foundation + research are ready.
- For shared-with-Nathan projects: ours is canonical for our workflow. If Nathan ran his `/agile-workflow:ideate` first, our skill detects his VISION/SPEC/ARCHITECTURE and enhances with research-plan.md + scout findings. No conflict.
