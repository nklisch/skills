---
id: feature-backlog-grooming-skill
kind: feature
stage: review
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

## Design decisions

- **Output: report-first + per-finding operator-confirmed transitions.** `/agile-workflow:groom`
  writes a triage report (`.work/scratch/` or a project scratchpad: `groom-report-<date>.md`)
  listing each flagged item + classification + the signal that flagged it. It then asks per
  finding before applying any transition; destructive acts (archive/merge/delete) are never
  automatic. *Rejected: emitting N `.work/` proposal items* — it would add items to the backlog a
  grooming tool exists to shrink. *Rejected: report-only zero-mutation* — loses the convenience of
  applying a confirmed transition; the confirmed-transition step keeps the human in the loop
  without making them do every move by hand.
- **Detection: mechanical signals + a grounded semantic sub-agent pass.** Mechanical (cheap,
  deterministic): `work-view --stale`, missing-field checks, items citing a feature/release that
  is now `done`. Semantic (a deep read-only sub-agent reads bodies): proposes
  DUPLICATE/SUPERSEDED/MERGEABLE clusters **with quoted grounding** — no classification without a
  citation to the overlapping text, per the anti-fabrication discipline. All semantic findings are
  proposals the human confirms.
- **Skill-only v1; scan-library seam deferred.** Ship the standalone skill with built-in
  detection. *Rejected for v1: the `gate-refactor`-style scan-library seam* (deployment-supplied
  grooming heuristics) — speculative until real demand for custom heuristics appears; defer to a
  follow-on. Revisit if a deployment needs project-specific grooming rules.

## Architectural choice

**A user-invocable standalone skill (`/agile-workflow:groom`), report-producing — NOT a release
gate.** Grooming is not release-bound (it audits the backlog, which has no release binding), so it
does not belong in `gates_for_release` / `release-deploy`. It borrows the gates' *item-producer
discipline* (delegate the hard pass to a deep sub-agent; produce findings, never silent mutation)
and is structured like `park`/`scope` (user-invocable, operates on `.work/backlog/`, verifies
substrate first). Opt-in is satisfied two ways: the skill only runs when invoked (no-op
otherwise), and its staleness face is inert unless the consumed `backlog_staleness_days` key is set
(the dependency feature's contract). Schedulability (a recurring sweep) is a deployment concern —
the skill is invocable by a scheduler but does not impose a cadence.

## Implementation Units

### Unit 1: The `groom` skill — orchestration + report
**File**: `plugins/agile-workflow/skills/groom/SKILL.md` (+ channel metadata if the plugin
requires per-skill manifest entries — check `.claude-plugin` / `.codex-plugin` / `package.json`
skill lists).

Skill workflow (portable, harness-neutral prose):
1. **Verify substrate** — `.work/CONVENTIONS.md` present; else halt with the convert hint (mirror
   `park` Phase 1).
2. **Mechanical pass** — read backlog items; run `work-view --stale` (consumes
   `backlog_staleness_days`; if absent, report that the staleness face is inert and continue with
   the other mechanical checks); flag missing-required-field items; flag items whose body cites a
   feature/release id that is now `stage: done` (cross-reference via `work-view`).
3. **Semantic pass (optional, default on)** — dispatch one read-only deep sub-agent over the
   backlog bodies to propose DUPLICATE/SUPERSEDED/MERGEABLE clusters, **each with quoted grounding
   from both items**. The sub-agent prompt carries the anti-fabrication instruction: no
   classification without a citation to the overlapping text; uncertain → propose as a question,
   never assert. (If the host has no sub-agent path, run inline and note reduced isolation, mirror
   the gate skills.)
4. **Write the report** — `groom-report-<date>.md` to the project scratchpad: per finding, the
   item id, classification (DONE/SUPERSEDED/DUPLICATE/STALE/MERGEABLE/VALID), the signal, and (for
   semantic findings) the grounding quote.
5. **Per-finding confirmation** — for each non-VALID finding, ask the operator before acting.
   Disposition of confirmed DONE/SUPERSEDED items routes through the deployment's **terminal-tier
   retention convention** (read `terminal-tier retention` from CONVENTIONS — `delete-refs` vs
   `retain-bodies`); do not re-decide it. MERGEABLE → fold detail into the kept item, then dispose
   the absorbed one per the same convention. Nothing is moved without confirmation.

**Acceptance Criteria**:
- [ ] With no `.work/CONVENTIONS.md`, halts with the convert hint (no writes).
- [ ] Mechanical pass surfaces stale items (via `--stale`), missing-field items, and
      cites-done-work items, each with the triggering signal named.
- [ ] With `backlog_staleness_days` absent, the staleness face reports inert and the other
      mechanical checks still run.
- [ ] Semantic findings each carry a quoted grounding from the items involved; no ungrounded
      DUPLICATE/SUPERSEDED claim is emitted.
- [ ] No item is moved/archived/merged/deleted without explicit per-finding operator confirmation.
- [ ] Confirmed DONE/SUPERSEDED disposition follows the project's terminal-tier retention
      convention (does not hardcode close-vs-archive).

### Unit 2: Channel metadata + docs
**Files**: the plugin's per-channel skill registration (`.claude-plugin/plugin.json`,
`.codex-plugin/plugin.json`, `package.json` — wherever the plugin enumerates skills),
`agents/openai.yaml` for the new skill (Codex picker text + invocation policy), and a one-line
entry wherever the plugin indexes its skills (README / docs skill list).

**Implementation Notes**:
- Portable `SKILL.md` frontmatter is `name` + `description` only (repo skill-style contract);
  Codex presentation/policy goes in `agents/openai.yaml`.
- Description must lead with trigger phrases ("groom the backlog", "audit backlog hygiene", "find
  stale/duplicate/dead backlog items").

**Acceptance Criteria**:
- [ ] The skill is registered across all channels the plugin ships (parity check).
- [ ] `SKILL.md` frontmatter carries only `name` + `description`; no harness-specific fields.

## Implementation Order
1. Unit 1 (the skill itself — the substance)
2. Unit 2 (registration + docs — mechanical, follows the skill existing)

Single feature, no child stories: the two units are one cohesive authoring stride (a skill plus its
registration), tightly coupled and verified together. (Reconsider splitting only if Unit 1's
semantic-pass design grows large enough to warrant its own resume point.)

## Testing
- This is a **prose/skill deliverable** (a `SKILL.md` of agent instructions), not code — there is
  no unit-test surface for the skill body itself. Verification is: (a) the skill-auditor /
  repo-skill-style check passes on the new `SKILL.md`; (b) channel-parity check (the skill appears
  in every channel manifest); (c) a manual dry-run of `/agile-workflow:groom` against a fixture
  backlog confirms the mechanical pass consumes `--stale` correctly and the report + confirmation
  gates behave. The one genuinely code-adjacent dependency — `work-view --stale` — is already
  tested under the dependency feature.

## Risks
- **Semantic-pass fabrication** — a sub-agent could assert SUPERSEDED/DUPLICATE without real
  grounding. Mitigation: the quoted-grounding requirement is an acceptance criterion, and findings
  are proposals, not auto-applied — the human is the backstop.
- **Report scratchpad location** — confirm where transient reports belong in the deployment
  (a scratchpad tier vs `.work/`); a report is transient, not a durable item, so it must not
  pollute the backlog it audits. Resolve against the project's scratchpad convention at
  implementation time.
- **Cadence creep** — the skill must not impose or assume a sweep cadence (continuous-vs-batch is a
  deployment choice per the research). Keep it invocation-driven; document schedulability as a
  deployment option, not a built-in.

## Implementation notes (landed)

Both units done. The skill is a prose/skill deliverable (no code-test surface); verification was
the repo skill-style contract + an independent skill-auditor pass + channel-parity.

- **Unit 1 (`groom` skill):** `plugins/agile-workflow/skills/groom/SKILL.md` (155 lines). Phases:
  verify substrate → mechanical pass (`work-view --stale`, missing-field, cites-done-work) →
  grounded semantic sub-agent pass (DUPLICATE/SUPERSEDED/MERGEABLE, quoted grounding required,
  skippable) → write triage report to scratchpad (explicit `.work/scratch/` → `.memory/scratchpad/`
  → inline order; never `.work/backlog/`) → per-finding operator-confirmed disposition (DONE/
  SUPERSEDED via terminal-tier retention; MERGEABLE hands off to `scope`). Propose-not-prune
  operationalized in Phase 5 + guardrails.
- **Unit 2 (channel registration):** all three channels (`.claude-plugin`, `.codex-plugin`,
  `package.json`) point at `./skills/` directory-level — **auto-discovered**, no per-skill manifest
  enumeration needed. Added `agents/openai.yaml` (display_name/short_description/default_prompt;
  `allow_implicit_invocation: true` — a discoverable hygiene utility). No `commands/` dir in the
  plugin, so `SKILL.md` + `openai.yaml` is the full surface.

**Verification:** repo skill-style contract passes (frontmatter = name+description only; 971-char
description leading with triggers; 155 lines). skill-auditor verdict SHIP WITH NITS — the one nit
(scratchpad path discovery order underspecified) fixed inline. Boundary scan clean.

**Note for release:** depends_on `feature-backlog-item-updated-contract` (now `done`). This is the
user-facing capability — the version bump ships once this lands done.
