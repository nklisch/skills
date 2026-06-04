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

## Arrow 1 — `.work/` → `.research/` (coordination; the primary entry)

The operational tier commissions and consumes research. A work item that needs grounding —
"research X to inform decision Y" — *tracks* a research engagement:

- The work item triggers a research engagement (`research-orchestrator`), which runs under ARD
  discipline and writes its artifacts into `.research/` (attestations, briefs, positions).
- The work item **references** the research it tracks via a `research_refs:` field (handles or
  analysis slugs) and may `depends_on` the research output, so it stays blocked until the
  grounding exists.
- This is **read-only**: the work item *awaits* and *cites* the research record; it does not
  write into `.research/`. Authority stays with the research tier.

This is the common operational entry point — work coordinates; research grounds.

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

Both are part of the `.work/` item schema (added by the `fields` feature, coordinated with
`agile-workflow`) and are queryable via `work-view`:
- `work-view --research-origin <slug>` — items emitted by a research engagement
- `work-view --research-refs <slug>` — items that commission or cite a research engagement

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

## Status — Arrow 2 live; Arrow 1 designed, not yet live

**Arrow 2** (`/agentic-research:research-handoff`) is **live** — operator-confirmed emission
from completed engagements to `.work/` items is implemented as described above.

**Arrow 1** (commissioning convention — `.work/` items commissioning and citing research) is
**designed but not yet live** as a documented convention. Implementation is the
`epic-research-work-handoff-live-coordination` follow-on.

See [ARCHITECTURE.md](ARCHITECTURE.md) for where the tiers sit.
