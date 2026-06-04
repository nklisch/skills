---
id: epic-research-work-handoff-live-emission-gate
kind: feature
stage: review
tags: [skill]
parent: epic-research-work-handoff-live
depends_on: [epic-research-work-handoff-live-fields]
release_binding: null
gate_origin: null
created: 2026-06-04
updated: 2026-06-04
---

# Arrow 2 — `.research/` → `.work/` emission gate (operator-confirmed)

## Brief
Make Arrow 2 of the HANDOFF.md contract live: a completed research engagement
carrying actionable findings can **emit `.work/` items gate-style**. A new
`agentic-research` skill/gate that, when a research engagement surfaces something
operational — a campaign or position carrying `output_kind:
adoption-recommendations`, a staged hypothesis to validate, a recommendation to
implement — proposes `.work/` items, **operator-confirmed**, mirroring
`repo-eval`'s emission precedent exactly. Each emitted item carries
`research_origin:` (the source campaign/position slug, recognized by the schema
the `fields` feature ships) plus a body citation back to the grounding artifact.

Behavioral contract, all inherited from established precedent:
- **Operator-confirmed via `AskUserQuestion`** — never a silent automatic write
  (repo-eval Phase 4 / "agile-workflow gates produce items" precedent).
- **Default target `.work/backlog/`** (lowest commitment); active stories or
  features only when scope warrants.
- **Silent no-op without `.work/`** — if no `.work/CONVENTIONS.md` is present,
  skip emission silently (repo-eval: "if no substrate exists, skip this phase
  silently"). The plugin's research capability stays fully usable standalone.
- **Reference-only, directionality preserved** — the gate writes only to
  `.work/`; it never writes into `.research/`. Research informs work; work never
  rewrites the research record (ARD SPEC §1/§4.6).

Owned by `agentic-research` → an `agentic-research` version bump, separate from
the `fields` feature's agile-workflow bump.

Does NOT cover: the `.work/` schema/flags (the `fields` feature owns those —
this feature *populates* `research_origin:` and assumes the substrate already
recognizes it); the Arrow 1 commissioning convention (separate feature).

## Epic context
- Parent epic: `epic-research-work-handoff-live`
- Position in epic: consumer of `epic-research-work-handoff-live-fields` — emits
  items carrying `research_origin:`, so it must land **after** the schema
  recognizes the field (else it would produce items the substrate can't query).
  Independent of the `coordination` feature → the two parallelize once `fields`
  is done.
- Implements the parent epic's foundation roll-forward for **Arrow 2 only**: flip
  HANDOFF.md's Arrow 2 / "Status — designed, not live" line to live for this
  arrow (see the parent epic's decomposition-risk note on avoiding a premature
  "fully live" claim before both arrows land).

## Foundation references
- `plugins/agentic-research/docs/HANDOFF.md` — "Arrow 2 — `.research/` → `.work/`
  (grounding; emission)" and "Graceful degradation": the contract this feature
  implements.
- `plugins/nates-toolkit/skills/repo-eval/SKILL.md` — the cross-tier
  graceful-degradation + operator-confirmed emission precedent (the
  `AskUserQuestion` checkpoint, `.work/CONVENTIONS.md` presence test, backlog
  default, "skip this phase silently").
- agile-workflow `gate-*` skills + `gate_origin:` — the gate-style item-emission
  precedent `research_origin:` mirrors (a research engagement as a "grounding
  gate" over `.work/`).
- `plugins/agentic-research/skills/research-orchestrator/SKILL.md` +
  `references/` — the engagement entry point this gate hangs off; the
  `output_kind` registration that signals "actionable."
- `epic-research-work-handoff-live-fields` — the schema/flag feature that must
  land first so emitted `research_origin:` is first-class.

## Design decisions
Resolved at design time (pinned by HANDOFF.md + the repo-eval precedent; the
epic already locked query-ownership and Arrow-1 depth):
- **Operator-invoked, never auto-firing.** A user-invocable skill the operator
  runs against a completed engagement; `research-orchestrator` *suggests* it as a
  next step but never triggers emission automatically. Rationale: HANDOFF's
  "operator-confirmed… never silent automatic write" + repo-eval (invoked, then
  asks before filing).
- **Skill name: `research-handoff`** (agentic-research), mirroring `docs/HANDOFF.md`
  and the plugin's `research-*` naming. Chosen over `emit-work`/`gate-handoff`.
- **One item per actionable finding** (default), with an operator option for a
  single umbrella item — mirrors repo-eval's per-recommendation filing.
- **Cite by `slug`.** `.research/` analysis artifacts carry their own `slug`
  frontmatter; emitted items set `research_origin: <slug>` (campaign dir name for
  campaign-scoped output) + a body citation to the artifact path.

## Architectural choice
A standalone agentic-research **skill** (`skills/research-handoff/SKILL.md`)
modeled on **repo-eval Phase 4** (the cross-tier graceful-degradation emission)
and the **gate-\*** item-producer shape. It is a thin operator-confirmed pipeline:
locate the source artifact → substrate-presence check → propose items → confirm →
emit to `.work/` with `research_origin:` + citation → commit. It writes **only**
to `.work/`; it never writes into `.research/` (the directionality invariant).

Chosen over: (a) folding emission into `research-orchestrator` (couples authoring
with operational write — blurs the authority boundary; orchestrator only
*suggests*); (b) a fully-automatic post-engagement hook (violates
operator-confirmed). Frontmatter follows the plugin's SKILL.md convention
(`name`, `description`, `argument-hint`, `allowed-tools`, `user-invocable: true`).

## Implementation Units
Single-stride, one author — no child stories (one skill + small doc wiring).

### Unit 1: `skills/research-handoff/SKILL.md`
**File**: `plugins/agentic-research/skills/research-handoff/SKILL.md`
Workflow phases:
1. **Locate source** — resolve the operator's argument (an analysis `slug` or a
   campaign dir) to artifact(s) under `.research/analysis/{positions,briefs,campaigns,hypothesis}/`;
   extract the actionable findings + their in-artifact citations. The engagement's
   registration `output_kind` (`adoption-recommendations` / staged hypothesis /
   recommendation) signals actionability; the artifact `slug` is the citation key.
2. **Substrate-presence check** — if `.work/CONVENTIONS.md` is **absent**, report
   that the finding stands in `.research/` and **stop silently** (repo-eval: "if
   no substrate exists, skip this phase silently"). No `.work/` write attempted.
3. **Propose + confirm** — `AskUserQuestion`: file findings as **backlog**
   (default, lowest commitment) / **active** (story|feature per scope) / **skip**.
4. **Emit** — for each confirmed finding write `.work/backlog/<id>.md` (or active),
   frontmatter `research_origin: <slug>`, body = the finding text + a citation to
   the `.research/` artifact (path + slug). Set `tags` per the finding domain.
5. **Commit** — `research-handoff: filed <N> items from <slug> (research_origin)`.
   Output: items filed (count + ids); next = `/agile-workflow:scope` to cluster.
**Acceptance**:
- [ ] Absent `.work/CONVENTIONS.md` → silent no-op; no `.work/` write; research capability intact
- [ ] Operator-confirmed via AskUserQuestion; backlog default; never auto-writes
- [ ] Emitted items carry `research_origin: <slug>` (recognized by the landed fields feature) + a body citation to the source artifact
- [ ] Writes only to `.work/`; nothing written into `.research/` (directionality invariant)

### Unit 2: wiring — orchestrator pointer + HANDOFF Arrow-2 status flip
**Files**: `plugins/agentic-research/skills/research-orchestrator/SKILL.md`,
`plugins/agentic-research/docs/HANDOFF.md`
- Add a "next step" note to `research-orchestrator`: a completed engagement with
  actionable output may run `/agentic-research:research-handoff <slug>`.
- Flip HANDOFF.md's **Arrow 2** description + the "Status — designed, not live"
  line to live **for Arrow 2** (leave Arrow 1 / the overall header to the
  coordination feature — see the parent epic's per-arrow roll-forward risk note;
  do not claim "fully live" until both land).
**Acceptance**: orchestrator points at the handoff skill; HANDOFF Arrow-2 marked
live without a premature "fully live" claim.

## Implementation Order
1. Unit 1 — the `research-handoff` skill.
2. Unit 2 — orchestrator pointer + HANDOFF Arrow-2 flip.
Then the `agentic-research` version bump (after the feature reaches review/done;
commit changes BEFORE `bump-version.sh`, per CLAUDE.md).

## Testing
Skill + docs — verified by inspection/dry-run since there is no code:
- **Degradation**: in a tree with no `.work/CONVENTIONS.md`, the skill stops
  silently (the load-bearing graceful-absence behavior) — verify the SKILL.md
  instructs the presence check before any write.
- **Emission shape**: a dry-run against an existing `.research/analysis/` slug
  produces a proposed `.work/backlog/` item carrying `research_origin: <slug>` +
  a resolvable citation; the field is queryable once the fields feature lands
  (`work-view --research-origin <slug>`).
- **Directionality**: grep the SKILL.md for any `.research/` write path — there
  must be none; all writes target `.work/`.
- **Links**: HANDOFF Arrow-2 + orchestrator cross-links resolve.

## Risks
- **Directionality erosion** — the gate must write only to `.work/`. Mitigation:
  the SKILL.md has no `.research/` write step; the test greps for one.
- **Premature liveness claim** — flipping the overall HANDOFF status to "fully
  live" before Arrow 1 lands. Mitigation: flip Arrow 2 only; coordination owns
  the header (per the epic's per-arrow roll-forward note).
- **Sequencing** — emitting `research_origin:` before the fields feature lands
  would produce items the substrate can't query. Mitigation: `depends_on:
  [epic-research-work-handoff-live-fields]` (already declared).

## Implementation notes

Implemented in one stride. Files created/changed:

- **NEW** `plugins/agentic-research/skills/research-handoff/SKILL.md` — the
  Arrow 2 emission gate skill. Five phases: (1) locate artifact under
  `.research/analysis/`; (2) substrate-presence check (silent no-op if
  `.work/CONVENTIONS.md` absent); (3) AskUserQuestion propose+confirm (backlog
  default / active / skip); (4) emit items with `research_origin: <slug>` +
  body citation; (5) commit + report. Frontmatter mirrors
  `research-orchestrator` (`name`, `description`, `argument-hint`,
  `allowed-tools`, `user-invocable: true`). `AskUserQuestion` in
  `allowed-tools`; no auto-writes anywhere.
- **MODIFIED** `plugins/agentic-research/skills/research-orchestrator/SKILL.md`
  — added "Next step after a completed engagement" section pointing at
  `/agentic-research:research-handoff <slug>`; added `research-handoff` to
  Related links.
- **MODIFIED** `plugins/agentic-research/docs/HANDOFF.md` — Arrow 2 heading
  marked **live**; invocation added (`/agentic-research:research-handoff <slug>`);
  queryability note added (`work-view --research-origin`); "linkage contract
  (proposed)" section renamed to "The linkage fields" (no longer proposed);
  overall intro paragraph updated to drop "design/contract document, not live
  code" claim; Status section updated to "Arrow 2 live; Arrow 1 designed, not
  yet live" (per-arrow flip only — the coordination feature owns the full
  "fully live" flip).

Directionality verified: `research-handoff/SKILL.md` has no step that writes
into `.research/`; all writes target `.work/`. The only `.research/` references
are read/locate steps in Phases 1–2.

Acceptance criteria met:
- Absent `.work/CONVENTIONS.md` → silent no-op (Phase 2)
- Operator-confirmed via AskUserQuestion (Phase 3); backlog default; never auto-writes
- Emitted items carry `research_origin: <slug>` + body citation (Phase 4)
- Writes only to `.work/`; nothing written into `.research/`
