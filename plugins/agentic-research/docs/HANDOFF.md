# HANDOFF: research ↔ work pairing

How the research substrate (`.research/`) and the operational substrate (`.work/`) pair.

## Authority vs coordination — keep them separate

The pairing is easy to mis-frame because two different axes get conflated. Pull them apart:

- **Authority** — *who owns the record, and who may rewrite it.* ARD's substrate cleavage
  (*ARD SPEC §1, §4.6*) constrains exactly this: **analysis informs operational decisions;
  operational state never rewrites the research record.** `.research/` is authoritative and
  discipline-bound; `.work/` must never mutate it.
- **Coordination** — *who tracks, commissions, and sequences the work.* ARD says nothing here.
  In an operational project, `.work/` is the natural coordinator — it tracks what we decide and
  build, including *deciding to do research*.

Separating the axes resolves the apparent paradox ("does work reference research, or research
reference work?"): **both**, in opposite directions, and neither rewrites the other. There are
two read-only reference arrows across the authority boundary.

## Arrow 1 — `.work/` → `.research/` (coordination; the primary entry) — **live**

The operational tier commissions and consumes research. A work item that needs grounding —
"research X to inform decision Y" — *tracks* a research engagement. This is the commissioning
recipe:

### Commissioning recipe

1. **Commission the engagement.** Run `/agentic-research:research-orchestrator <seed>` to start
   the grounded research engagement. The orchestrator runs under ARD discipline and writes its
   artifacts into `.research/` (attestations, briefs, positions, campaigns).

2. **Optionally track the engagement as a `.work/` commissioning story.** If you want the work
   item to be gateable on research completion, create a `.work/` story that represents the
   research task (e.g., `story-ground-feature-x-in-research`). This story reaches `done` when
   the engagement surfaces its findings.

3. **Cite the result.** Once the research artifact exists, set `research_refs: [<slug>]` in the
   grounded work item's frontmatter (where `<slug>` is the analysis artifact's slug — the
   `slug:` frontmatter value on positions/briefs, or the campaign dir name). This is the
   machine-queryable citation: `work-view --research-refs <slug>` finds all items grounded in
   that engagement.

4. **To gate the work item on research completion**, set `depends_on:
   [<commissioning-work-item-id>]` — pointing at the `.work/` commissioning story from step 2,
   not at the `.research/` slug directly.

   **CRITICAL:** `depends_on` must target a `.work/` item id, never a bare `.research/` slug.
   `work-view` resolves dependency ids only against `.work/` items — an unknown id (including a
   `.research/` slug) is treated as a non-terminal dep and **blocks the item forever**. Route
   gating through the `.work/` commissioning story; cite the `.research/` artifact via
   `research_refs:`.

5. **Add a body citation.** In the work item body, note the research grounding: artifact path,
   slug, and one sentence on how it informs the item.

This is **read-only**: the work item *awaits* and *cites* the research record; it never writes
into `.research/`. Authority stays with the research tier.

This is the common operational entry point — work coordinates; research grounds.

### Registration-carrying `[research]` items — the work-nature module

The recipe above commissions an engagement *alongside* a work item. The richer pairing makes the
**commissioning work item carry the engagement's registration**, so the act of scoping the item
*is* the dispatch act — and `.research/` is left holding clean output substrate only.

A `[research]`-tagged work item carries the dials in a `research_dials:` frontmatter block — the
**commissioning subset** of the registration (ARD SPEC §9):

```yaml
research_dials:
  scope_authority: pre-registered        # pre-registered | mixed | in-engagement-judgment
  verification_rigor: standard           # floor | standard | full
  intent: build-substrate                # the ARD intent (SPEC §9)
  output_kind: synthesis-brief           # expected output_kind (single value or a [list])
```

The orchestrator **reads these dials from the commissioning item at kickoff** (confirm/adjust with
the user, don't re-propose) and runs the engagement; the block carries only the subset the scoping
act fixes — the orchestrator settles the remaining five registration fields at dispatch, as on any
standalone walk (they are engagement-time judgment, not scoping decisions). A present-but-invalid
block is never treated as authoritative: re-confirm interactively, hard-halt under autonomous
delegation. The seed/intent prose and any pre-registered decomposition live in the item
**body** (richer than frontmatter); the dials live in the **block** (machine-read by the
orchestrator). `work-view` tolerates the block harmlessly (it parses only its own known fields);
the item is discoverable by its `[research]` tag.

Why this is ARD-conformant: ARD classifies `dispatch-time-registration` as a **tier-M coordination
act** (CATALOGS §6) whose **persistence is a deployment choice** (SPEC §9). *Where* the dials live
is below the architecture line — so moving them onto the commissioning work item is a legitimate
deployment binding, not a divergence. ARD's registration shape (`templates/dispatch.md`) stays
substrate-agnostic and verbatim; the work-item carrier is this deployment's binding layered on top.

Consequences of the registration riding the work item:

- **`.research/` holds clean output substrate only** — no `dispatch.md`. The `dispatch.md` template
  demotes to the **standalone fallback**: it persists the registration only when there is *no* work
  item to carry it (standalone heavy walks), preserving the standalone invariant (ARD research runs
  with no `.work/` substrate at all).
- **`[research]` does not bind to a release.** Research is an *input* that grounds other work, not a
  shippable bundle member. The item simply never acquires a `release_binding` (it routes through the
  orchestrator, not the review→bind flow).
- **Gates run inline** in the orchestrator's verification stack (ARD SPEC §7). Research never reaches
  `release-deploy`, so its verification cannot defer to a release gate — it fires during the
  engagement.
- **The orchestrator closes the item.** At engagement completion (gates passed at the dialed
  rigor, output persisted) the orchestrator advances the commissioning item to `stage: done` with a
  short engagement record — it owns that transition, since the item never passes a review→bind
  flow. A `[research]` item left non-terminal permanently blocks every `depends_on` consumer.
- **The tag is feature/story-level.** An epic is never the direct commissioner: epic decomposition
  is the work substrate's own flow, and each child `[research]` feature carries its own
  `research_dials:` block.
- **Decomposition-rationale home (ARD §10.6) follows `scope_authority`:** `pre-registered` → the
  decomposition rides the work item with the dials; `in-engagement-judgment` → the orchestrator
  drafts the ≥3 candidates mid-engagement and persists the chosen rationale *back* onto the item
  (or research-side when no work item is present); `mixed` → both homes — the declared coverage
  rides the item from scoping, the emergent portion persists back at `decompose`.

**Two satisfiers, kept distinct** (this matters for how the capability is adopted):

- **(B) the `research_dials:` block read by the orchestrator** — a convention *within* this plugin.
  It delivers the clean-`.research/` win with **no change to agile-workflow's routing**: any work
  item can carry the block and the orchestrator reads it.
- **(A) the `[research]` work-nature routing tag** in agile-workflow — adds first-class
  auto-dispatch (the full module): a `[research]`-tagged feature routes to
  `agentic-research:research-orchestrator` the way `[refactor]` routes to `refactor-design`. This is
  the agile-workflow half of the pairing.

This contract is owned **here** (the agentic-research plugin's `research-handoff` skill + this
HANDOFF), mirroring `research_refs:` / `research_origin:` — it is deliberately **not** an ARD
contract, because ARD's research record stays substrate-agnostic and cannot know about `.work/`
tags or item schemas.

## Arrow 2 — `.research/` → `.work/` (grounding; emission) — **live**

Research informs work. A completed engagement that surfaces *actionable* findings — a campaign
or position carrying `output_kind: adoption-recommendations`, a staged hypothesis to validate,
a recommendation to implement — can **emit** tracked work items, gate-style, via
`/agentic-research:research-handoff <slug>`:

- **Operator-confirmed**, mirroring `repo-eval` (which asks before filing and defaults to the
  lowest-commitment target): the emission proposes items and the operator confirms — it is never
  silent automatic write.
- Default target is `.work/backlog/` (lowest commitment); active stories/features when the scope
  warrants.
- Each emitted item carries `research_origin:` (the source campaign/position slug) plus a body
  citation to the grounding artifact. Emitted items are queryable via
  `work-view --research-origin <slug>`.
- **Silent no-op** when `.work/CONVENTIONS.md` is absent — the research capability stands alone
  without an operational substrate.

This mirrors how agile-workflow's gates produce items with `gate_origin:` — a research engagement
is, in this sense, a grounding gate over `.work/`.

## The linkage fields

Two `.work/` frontmatter fields, mirroring the existing `gate_origin:` convention:

| Field | Arrow | Meaning |
|---|---|---|
| `research_refs:` | `.work/` → `.research/` | the research artifact(s) this work item tracks / consumes |
| `research_origin:` | `.research/` → `.work/` | the research artifact that spawned this work item |
| `research_dials:` | `.work/` → orchestrator | the commissioning registration block a `[research]` item carries (read at dispatch) |

The two scalar/list fields (`research_refs:` / `research_origin:`) are part of the `.work/` item
schema (added by the `fields` feature, coordinated with `agile-workflow`) and are queryable via
`work-view`:
- `work-view --research-origin <slug>` — items emitted by a research engagement
- `work-view --research-refs <slug>` — items that commission or cite a research engagement

`research_dials:` is a nested block read by the **orchestrator** at dispatch, not a `work-view`
filter dimension — `work-view` parses only its own known fields and ignores the block harmlessly
(items stay discoverable by their `[research]` tag). Adding it as a `work-view` query dimension is
a deferred enhancement (a Rust change), unneeded for the pairing.

## Graceful degradation

The pairing is optional and degrades to absent, never broken:

- **No `.work/` substrate** → Arrow 2 emission is a **silent no-op** (the `repo-eval` precedent:
  "if no substrate exists, skip this phase silently"). The plugin's research capability is fully
  usable without `.work/`.
- **No `.research/` engagement** → Arrow 1 simply has nothing to commission or cite; `.work/`
  operates normally.

Neither tier requires the other to function. The pairing adds value where both are present.

## Directionality guard

Restating the invariant so it is not re-eroded: within `.research/`, reads are **down-gradient
only** (`reference → attestation → precis → analysis`; *ARD SPEC §4.6, §10.2*). Across the tiers,
**research informs work, and work never rewrites the research record.** Both arrows above are
*references / commissions* — a work item cites or triggers research; a finding proposes a work
item — never a write into the other tier's authoritative record. The `work → research` arrow is
coordination, not authorship; it cannot launder operational framing back into a research artifact.

## Status — live

Both arrows are implemented:

- **Arrow 1** (commissioning convention) — **live**. Commission via
  `/agentic-research:research-orchestrator`; cite with `research_refs:`; gate via a
  `.work/` commissioning story in `depends_on`. Recipe above.
- **Arrow 1, registration-carrying `[research]` items** (the work-nature module) —
  **experimental**. The orchestrator reads a `research_dials:` block from the commissioning item;
  `.research/` stays clean output substrate; `dispatch.md` demotes to the standalone fallback. The
  `(B)` block-read half is self-contained in this plugin; the `(A)` `[research]` routing tag is the
  agile-workflow half. Validated end-to-end (2026-06-09) for the work-item-blocked-on-research edge
  within one substrate — autopilot dispatch, inline gates, dependent-item consumption; the
  cross-project `[code]` consumer (a code item in one sub-project reading research output across a
  project boundary) remains untested.
- **Arrow 2** (emission gate) — **live**. Run
  `/agentic-research:research-handoff <slug>` after a completed engagement;
  operator-confirmed; emits `.work/` items carrying `research_origin: <slug>`.

See [ARCHITECTURE.md](ARCHITECTURE.md) for where the tiers sit.
