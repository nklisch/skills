# ARCHITECTURE: agentic-research

This plugin introduces a second substrate tier — research — that runs parallel to the
operational work tier, and documents how the two relate.

## Two substrates

| Substrate | Plugin | Holds | Tracks |
|---|---|---|---|
| `.work/` | agile-workflow | epics, features, stories | what we *decide and build* |
| `.research/` | agentic-research | references, attestations, precis, analysis | the grounded *source material* analysis rests on |

They are parallel by design: `.research/` carries external source material and the syntheses
built from it; `.work/` carries the operational decisions. The plugin's verification floor
(the citation-chain lint) and the tier's working contract live with the tier — see
`.research/CONVENTIONS.md`.

## The cleavage — analysis informs work, never the reverse

ARD separates the research substrate from the operational one, and the dependency runs one
way: **analysis informs operational decisions; operational state never rewrites the research
record.** Within `.research/`, reads are **down-gradient only**:
`reference → attestation → precis → analysis`. A higher tier may read lower tiers; never the
reverse (*ARD SPEC §4.6, §10.2*). This directionality is the tier-level anti-fabrication
guard — it keeps a synthesis from laundering project framing back into the source record.

## The pairing — research ↔ work handoff

The two substrates pair through two read-only reference arrows across the authority boundary
(designed, not yet live): **`.work/` → `.research/`** — a work item commissions/tracks/consumes
research (the primary operational entry) — and **`.research/` → `.work/`** — a finding emits a
tracked work item, gate-style. The invariant: **work never rewrites the research record** (the
cleavage above); both arrows are references/commissions, not writes. It **degrades gracefully**
when no `.work/` substrate is present (precedent: `repo-eval` files `.work/` items only when a
substrate exists). Full contract: [HANDOFF.md](HANDOFF.md). The `.research/` tier definition
itself is the `substrate-tier` feature.

## Our `.research/` vs ARD's

ARD's *own* repository uses `.research/` in a narrower sense — a curated "defensibility trace"
of positions only, bibliographic-only for IP reasons. Here, `.research/` is the **full
four-tier substrate** (reference → attestation → precis → analysis), the live working tier for
disciplined research in this repo.
