---
id: feature-backlog-grooming-skill
kind: feature
stage: drafting
tags: [skill, plugin]
parent: null
depends_on: [feature-backlog-item-updated-contract]
release_binding: null
gate_origin: null
research_origin: priority-and-grooming-shapes-for-agentic-substrates
created: 2026-06-15
updated: 2026-06-15
---

# Backlog grooming / hygiene skill — propose-not-prune, mechanizing what date/metadata supports

## Brief

A backlog accretes entropy: dead, superseded, duplicate, and stale items pile up with no tooling
to detect them. No current skill audits the backlog for hygiene (`park` adds, `scope` promotes,
design skills decompose active work, gates operate on release-bound items). This feature adds a
grooming capability that detects hygiene problems and **routes findings as proposals for
human triage — it never auto-prunes**.

## What it does (grounded shape)

Per-backlog-item, against item metadata and (where cheap) item content, classify and route as
**proposals**:

- **DONE / SUPERSEDED / DUPLICATE / STALE / MERGEABLE** — surfaced with the signal that flagged
  them (age, last-touched, similarity, missing fields) and explanatory context.
- **VALID** — survives.

Destructive acts (archive / merge / delete) stay **operator-confirmed** — mirroring how the
plugin's gates and the research handoff already produce items/findings rather than mutating state
silently.

## Design constraints from the research (load-bearing — read before designing)

The grounding sharpened several choices; honor them rather than re-deriving:

- **Mechanize only what date/metadata arithmetic supports, and claim no more.** Mechanizable
  without NLP: item age, time-since-last-update, presence of owner / release-binding / exempt
  label — the canonical stale-bot signal set (mark→close lifecycle, reactivation-on-update,
  dry-run, graduated exemptions, "mark-never-close" mode). **Partially** mechanizable (embedding
  similarity, human confirms): duplicate / near-duplicate. **Not** mechanizable without an explicit
  link or human judgment: supersession and content-relevance.
- **Propose-not-prune is non-negotiable** — the most strongly-sourced finding across the whole
  engagement (maintainer-survey preference for "a second pair of eyes," approve-before-acting
  tooling, human-gated selection retained even in autonomous systems).
- **Disposition inherits the terminal-tier retention convention** — do NOT re-decide
  close-as-cleanup vs. archival-with-memory (a genuine `contradicts` in the literature, bridged by
  mark-without-close). Route DONE/SUPERSEDED through whatever terminal-tier retention the
  deployment's CONVENTIONS already defines.
- **Cadence is configurable, not assumed-continuous.** Continuous hygiene is cheap for an agent but
  can flood the ready queue faster than it drains ("acceleration whiplash"); leave continuous vs.
  wave/batch to the deployment.
- **Optional / opt-in.** No-op when a project doesn't invoke or schedule it.
- **Respect the anti-fabrication discipline** where it cross-references code/items (no "superseded"
  claim without grounding — kin to substrate-before-stance).

## Home (to weigh at design)

Two plausible homes, per the original capture: a standalone skill (`/agile-workflow:groom` — an
agent sweep that reads the backlog, cross-references, emits a triage report and/or proposed
transitions; user-invocable + schedulable) vs. a scan-library/gate seam (mirror `gate-refactor`:
plugin ships the mechanism, deployment supplies detection heuristics). Likely the skill is the
primary surface; the scan-seam is the extensibility hook.

## Dependency

`depends_on: feature-backlog-item-updated-contract` — the last-touched signal is grooming's hard
precondition; staleness detection is impossible without it.

## Research grounding

**Source**: `.research/analysis/positions/priority-and-grooming-shapes-for-agentic-substrates.md`
(slug: `priority-and-grooming-shapes-for-agentic-substrates`), Position 2.

A grooming capability is warranted as a propose-not-prune surface mechanizing only date/metadata
(with partial, human-confirmed duplicate detection). Full landscape — mechanizable-vs-not table,
the closure-vs-archival contradiction, the propose-not-prune convergence across three literatures
— in the synthesis brief `workflow-priority-grooming-for-agentic-substrates-landscape` and the
`backlog-grooming-discipline-landscape` facet brief. (This feature supersedes the earlier
parking-lot capture `backlog-grooming-skill`, now retired.)
