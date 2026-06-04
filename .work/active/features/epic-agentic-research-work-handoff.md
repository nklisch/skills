---
id: epic-agentic-research-work-handoff
kind: feature
stage: review
tags: [docs]
parent: epic-agentic-research
depends_on: [epic-agentic-research-substrate-tier]
release_binding: null
gate_origin: null
created: 2026-06-03
updated: 2026-06-04
---

# research→work handoff (designed + documented, not live)

## Brief
Design and document — but do NOT implement live, per the epic's tier-pairing
strategic decision — the research→work handoff that makes `.research/` pair with
`.work/`. Specify how a research engagement's output (e.g. an `analysis/` position
or campaign carrying `output_kind: adoption-recommendations`) can emit `.work/`
items gate-style, degrading gracefully to a no-op when no work substrate is
present (precedent: `repo-eval` files `.work/` items only when a substrate
exists). Capture the contract: which research artifact triggers a handoff, the
`.work/` item shape it produces, the directionality guard (analysis informs
operational decisions, never the reverse — ARD's substrate cleavage), and the
graceful-absence behavior.

The deliverable is a design/spec document in the plugin docs, not working code —
it is the first-class "pairing story" for the proposal without the integration
risk of a live implementation. Live implementation is an explicit follow-on epic.

Does NOT cover: live handoff code, or any change to `.work/`'s own tooling.

## Epic context
- Parent epic: `epic-agentic-research`
- Position in epic: consumer of `epic-agentic-research-substrate-tier`; the
  documented `.work/` pairing. Parallel with `research-view`.

## Foundation references
- `/tmp/ARD/SPEC.md` — §1 substrate cleavage + directionality; registration `output_kind`
- `AGENTS.md` — Agile-Workflow Substrate section (`.work/` item shape)
- `plugins/nates-toolkit/skills/repo-eval/` — graceful cross-tier-degradation precedent
  (SKILL.md Phase 4: file `.work/` items only when `.work/CONVENTIONS.md` exists, operator-
  confirmed via `AskUserQuestion`; "If no substrate exists, skip this phase silently")
- `epic-agentic-research-substrate-tier` — the tier this hands off from
- `plugins/agentic-research/docs/ARCHITECTURE.md` — the existing "The pairing" stub this expands
- ARD SPEC §1 / §4.6 — the substrate cleavage + directionality (the authority invariant)

## Design decisions
- **REFRAMED (2026-06-04): bidirectional pairing, not research→work emission only.** The
  original brief framed the handoff one-way (a research campaign emits `.work/` items). User
  review surfaced that this conflates two axes — **authority** vs **coordination**. ARD's
  cleavage (SPEC §1/§4.6) constrains *authority* only: *operational state never rewrites the
  research record.* It says nothing about coordination. Separating them yields **two read-only
  reference arrows** across the authority boundary:
  - **`.work/` → `.research/` (coordination)** — a work item commissions/tracks/consumes
    research ("research X to inform Y"); the *primary operational entry*. The work item
    references the research it tracks.
  - **`.research/` → `.work/` (grounding)** — research findings inform work; a finding can emit
    a tracked work item (gate-style). The emitted item back-points to its research origin.
  - **Invariant**: work never *rewrites* the research record — both arrows are
    commissions/citations, not writes into `.research/`.
- **Doc home: dedicated `docs/HANDOFF.md`.** A focused contract doc; the ARCHITECTURE.md
  pairing stub points at it (keeps ARCHITECTURE a high-level map; extends the small-mirror-set).
- **Linkage contract: two `.work/` frontmatter fields, mirroring `gate_origin`.**
  `research_refs:` (what research a work item tracks/consumes — the coordination arrow) and
  `research_origin:` (what research spawned a work item — the grounding arrow). Machine-greppable,
  symmetric with how gates tag produced items. **Proposed contract only** — this feature does
  NOT add them to `.work/` tooling (that's the live follow-on, coordinated with agile-workflow).
- **Design-only.** HANDOFF.md is the contract for a future live implementation (a named
  follow-on epic); no code/skill implements it this PR.

## Architectural choice
A dedicated `docs/HANDOFF.md` specifying the bidirectional pairing contract (design-only), plus
two doc-wiring edits (ARCHITECTURE.md stub → bidirectional + link; README pending-line). Chosen
over: (a) expanding ARCHITECTURE.md inline (bloats a high-level map with a detailed not-yet-live
spec); (b) single-arrow framings (the reframe established both arrows are real and the
work-coordinates arrow is the primary operational one). HANDOFF.md is a *contract/principles*
doc — the invariant + the two arrows + the proposed linkage fields — explicitly marked
design-only, not a field-by-field schema the live impl is bound to verbatim.

## Implementation Units
Single-stride; one new doc + two wiring edits.

### Unit 1: docs/HANDOFF.md — the bidirectional pairing contract
**File**: `plugins/agentic-research/docs/HANDOFF.md`
Sections:
- **Authority vs coordination** (the key distinction): ARD §1/§4.6 constrains authority — work
  never rewrites the research record; it does not constrain who coordinates. Lead with this.
- **Arrow 1 — `.work/` → `.research/` (coordination, the primary entry)**: a work item
  commissions/tracks/consumes a research engagement; trigger ("a work item that needs grounding");
  the engagement runs under ARD discipline (`research-orchestrator`) and writes `.research/`
  artifacts; the work item references them via `research_refs:` and may `depends_on` the research
  output. Read-only — work awaits/cites, never writes into `.research/`.
- **Arrow 2 — `.research/` → `.work/` (grounding/emission)**: a completed engagement with
  actionable findings (e.g. `output_kind: adoption-recommendations`, a staged hypothesis, a
  recommendation) can emit `.work/` items gate-style — **operator-confirmed** (mirroring
  repo-eval's `AskUserQuestion`), defaulting to backlog (lowest commitment). Emitted items carry
  `research_origin:` + a body citation to the source artifact.
- **The linkage contract**: `research_refs:` (coordination) + `research_origin:` (grounding) on
  `.work/` items, mirroring `gate_origin`. Proposed — not added to `.work/` tooling here.
- **Graceful degradation**: no `.work/` substrate → emission is a silent no-op (repo-eval
  precedent); the plugin's research capability stands alone. No `.research/` → work simply has
  nothing to commission/cite.
- **Directionality guard**: restate ARD §4.6 — down-gradient within `.research/`; cross-tier,
  research informs work and work never rewrites the research record; both arrows are
  references/commissions, not writes.
- **Not live + the follow-on**: this is the contract; live implementation is a named follow-on
  epic (a handoff skill/gate + the `.work/` field additions, coordinated with agile-workflow).
**Acceptance**:
- [ ] Both arrows documented with the authority-vs-coordination distinction leading; the invariant (work never rewrites the research record) stated explicitly
- [ ] Linkage fields (`research_refs`, `research_origin`) specified as *proposed* contract mirroring `gate_origin`; graceful-degradation + directionality guard covered; marked design-only with the live follow-on named
- [ ] All internal links resolve; references ARD SPEC §1/§4.6 + repo-eval by name

### Unit 2: ARCHITECTURE.md pairing stub → bidirectional + link
**File**: `plugins/agentic-research/docs/ARCHITECTURE.md`
The "The pairing" section currently describes only the research→work arrow. Update to name both
arrows (work coordinates ↔ research grounds; work never rewrites research) in 2-3 sentences and
point at `HANDOFF.md` for the full contract.
**Acceptance**: stub names both arrows + the invariant; links `HANDOFF.md`.

### Unit 3: README pending-line
**File**: `plugins/agentic-research/README.md`
The adoption-status "Pending" lists "the designed research→work handoff." Update: the handoff is
now **designed** (`docs/HANDOFF.md`); only its *live* implementation is pending (a follow-on epic).
Drop `research-view`? No — research-view is still pending. Result: "Pending: the `research-view`
query binary; the live research↔work handoff (designed in `docs/HANDOFF.md`)."
**Acceptance**: README reflects the handoff design as landed, live impl as the follow-on; `research-view` still pending.

## Implementation Order
1. `docs/HANDOFF.md` (the contract)
2. `docs/ARCHITECTURE.md` stub (bidirectional + link)
3. `README.md` pending-line
**No child stories** — one cohesive doc + two small wiring edits; single-stride, one author.

## Testing
Docs — mechanically checkable at implement time: all internal links resolve (esp. ARCHITECTURE
↔ HANDOFF cross-links); HANDOFF leads with authority-vs-coordination and states the invariant;
both arrows + both linkage fields present; explicitly marked design-only (no liveness claim);
references ARD §1/§4.6 + repo-eval accurately.

## Risks
- **Over-specifying a not-live contract.** A future live impl may diverge. Mitigation: keep
  HANDOFF a contract/principles doc, mark it design-only, name the live follow-on; don't
  over-engineer field schemas.
- **`research_refs`/`research_origin` touch `.work/`'s schema (agile-workflow-owned).**
  Mitigation: document as *proposed*; the live impl coordinates with agile-workflow; this PR
  adds nothing to `.work/` tooling.
- **Directionality confusion** (the issue the reframe resolved). Mitigation: HANDOFF leads with
  the authority-vs-coordination distinction so a reader doesn't re-conflate the axes.

## Implementation notes
- **Files created**: `docs/HANDOFF.md` — the bidirectional pairing contract, leading with the
  authority-vs-coordination distinction, then Arrow 1 (`.work/`→`.research/` coordination, the
  primary entry), Arrow 2 (`.research/`→`.work/` grounding/emission), the `research_refs`/
  `research_origin` linkage contract (proposed, mirroring `gate_origin`), graceful degradation,
  the directionality guard, and a "designed, not live + follow-on epic" status section.
- **Files changed**: `docs/ARCHITECTURE.md` (pairing stub → both arrows + the invariant + link
  to HANDOFF.md); `README.md` (HANDOFF listed as landed; the *live* handoff is the follow-on;
  `research-view` still pending).
- **Discrepancies from design**: none — followed the design as written.
- **Tests added**: none (docs). **Verification**: all cross-links resolve (HANDOFF↔ARCHITECTURE,
  README→HANDOFF); HANDOFF leads with authority-vs-coordination and states the invariant ("work
  never rewrites the research record"); both arrows + both linkage fields + `gate_origin` mirror
  + repo-eval + ARD SPEC §1/§4.6 present; no liveness overclaim (marked design-only, follow-on
  named); conformance 15/15 (pure docs).
- **Adjacent issues parked**: none.
