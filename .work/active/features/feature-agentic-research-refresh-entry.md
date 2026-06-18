---
id: feature-agentic-research-refresh-entry
kind: feature
stage: review
tags: [skill]
parent: epic-agentic-research-reengagement
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-18
updated: 2026-06-18
---

# Prior-artifact-as-lens re-authoring entry for `research-orchestrator`

## Brief

The **lynchpin** of the re-engagement epic. Add an entry path to `research-orchestrator`
that takes a *prior research artifact* as input and re-authors it, rather than starting a
fresh engagement from a seed. The entry:

- accepts a prior artifact (a `.research/` analysis/precis/position) as input;
- registers the `refresh` change-mode + `supersedes-prior` temporal_contract (both already
  vendored — `research-discipline/SKILL.md:99`, `templates/dispatch.md`, `catalogs.json`);
- treats the prior artifact as a **LENS, not substrate** (ARD SPEC §4.6): the old artifact
  is a reading aid for re-engaging the *real* sources, never itself cited as a source —
  this is the anti-fabrication guard that stops a refresh from laundering the prior
  artifact's unsourced claims into the new one;
- re-authors over current sources, producing a superseding artifact with a clean chain.

Both front-half features depend on this: `convert-bootstrap` hands legacy
(`inferred-from-legacy`) artifacts to it; `native-refresh` hands ARD-native artifacts to it
when acquisitions land or substrate goes stale.

## Epic context

- Parent epic: `epic-agentic-research-reengagement`
- Position: dependency root (`depends_on: []`). The shared orchestration primitive both
  front-halves build on. This is the **anti-fabrication surface** of the epic — LENS-not-
  substrate (SPEC §4.6) is the whole point; design it first with adversarial care.

## Design decisions

- **Entry form: a MODE of `research-orchestrator`, not a sibling skill.** The refresh entry
  is a "prior-artifact-in-hand" branch grafted onto the orchestrator's existing walk, not a
  new skill. Keeps one engagement engine — the discipline propagation (§5 inline-into-dispatch),
  the verification stack (§7), and the registration contract (§9) all apply unchanged. A sibling
  skill would duplicate the kickoff/registration machinery and risk the discipline bundle not
  propagating identically. The graft point is the existing **`substrate-check`** decision-point
  (it already "surveys `.research/` for overlapping prior work").
- **LENS enforcement: an explicit pre-flight lens check, not prose+lint alone.** Before the
  re-authoring dispatch, the mode records the prior artifact's path in a **known-lens set**
  (excluded from `[handle]{N}` citation targets) and prepends that exclusion into the authoring
  dispatch alongside the verbatim lens-not-substrate guard (already in the discipline bundle,
  `research-discipline/SKILL.md:34`). `lint-citations.py` remains the backstop (a handle
  resolving to the prior analytical-tier artifact already fails the citation-chain check), but
  the pre-flight check catches the violation at author time, structurally. **This is
  plugin-local orchestration, not an ARD change** — it operationalizes the *existing* universal
  guard for this engagement's specific prior artifact; the discipline rule itself is unchanged.
- **Attestation handling: branch on input state, one walk.** An *ARD-native* artifact carries a
  clean attestation set → re-validate it against current sources (URLs move/update) and extend
  with new acquisitions. A *legacy* (`inferred-from-legacy`) artifact carries none → build the
  chain from scratch. Same walk; the only difference is the starting attestation set. This is
  what lets one primitive serve both front-halves without splitting.
- **Verification: re-run the stack at dialed rigor over the NEW substrate.** The prior
  artifact's old verdicts never carry forward unexamined — a refresh is a real engagement, not
  a diff-and-patch. `supersedes-prior` means the output is a new authoritative artifact.

## Architectural choice

A **refresh branch in the orchestrator walk**, with the detailed procedure in a new
`references/refresh-reengagement.md` (the orchestrator SKILL.md is already near the repo's
300/500-line skill budget — the SKILL.md gains a compact mode-branch + a pointer; the procedure
lives in the reference, mirroring how `research-specialist.md` / `adversarial-reader.md` /
`evaluator.md` already carry the dispatch-role detail).

Rejected: (a) a standalone `research-refresh` sibling skill — duplicates registration + risks
divergent discipline propagation (decided above); (b) putting the lens pre-flight check in the
ARD kernel discipline — it's engagement-specific orchestration, not a universal rule, so it
stays plugin-local (no ARD bump, preserving the dual-pin invariant).

## Implementation Units

Single cohesive stride — no child stories (the orchestrator edit, the reference, and the
input-contract wiring are one tightly-coupled skill change, one author). Three artifacts.

### Unit 1: refresh branch in the orchestrator walk
**File**: `plugins/agentic-research/skills/research-orchestrator/SKILL.md` (edit)

Add a **prior-artifact-in-hand** branch to the walk (§"The walk"). At `substrate-check`, when
the engagement is *handed* a prior artifact (vs. discovering an overlap), route into the refresh
branch:

1. **KICKOFF** registers `refresh` change-mode + `temporal_contract: supersedes-prior` (existing
   enums; no new vocabulary). The handed artifact path + input-state (`ard-native` | `legacy`)
   are part of the registration.
2. **Pre-flight lens check** — record the prior artifact path in the known-lens set; this set is
   injected into every authoring dispatch as an explicit "NEVER cite these paths" exclusion,
   atop the verbatim lens-not-substrate guard already in the discipline bundle.
3. **Seed = the prior artifact's claim set** (read AS LENS) — the topology to re-engage is the
   prior artifact's held claims, not a fresh seed. For `native-refresh`, the `Completes:` join
   scopes which claims a landed acquisition re-engages.
4. **Attestation start-state branch** — `ard-native`: load the existing attestation set,
   re-validate against current sources, extend; `legacy`: empty start, build from scratch.
5. **Normal walk resumes** — attest → synthesize → lint → verify at dialed rigor over the
   *current* substrate. Output is a superseding artifact (`supersedes` pointer to the prior).

**Implementation Notes**:
- Keep the SKILL.md addition compact — a labeled branch in the walk + a one-line pointer to the
  reference. Do not inline the full procedure (budget).
- The branch reuses the existing dispatch-composition step verbatim; the only addition to the
  dispatch is the known-lens exclusion list.

**Acceptance Criteria**:
- [ ] The walk documents a prior-artifact-in-hand branch entered at `substrate-check`
- [ ] KICKOFF for the branch registers `refresh` + `supersedes-prior` and records input-state
- [ ] The dispatch composition for the refresh branch includes the known-lens exclusion
- [ ] SKILL.md stays under the 500-line hard cap (verify line count post-edit)

### Unit 2: the refresh procedure reference
**File**: `plugins/agentic-research/skills/research-orchestrator/references/refresh-reengagement.md` (new)

The full procedure the SKILL.md branch points at: the prior-artifact-as-lens loading protocol,
the known-lens exclusion mechanism, the `ard-native` vs `legacy` attestation start-state branch,
the `Completes:`-scoped claim re-engagement (for the native-refresh consumer), and the
`supersedes`-pointer output shape. Under 200 lines per repo skill-style; ToC if >100.

**Acceptance Criteria**:
- [ ] Documents both input states (ard-native re-validate+extend / legacy build-from-scratch)
- [ ] Documents the known-lens pre-flight check + dispatch exclusion concretely
- [ ] Names the `supersedes` output pointer and the prior-artifact-retained-as-record rule
- [ ] Under 200 lines; harness-neutral wording per `.agents/skills/repo-skill-style/`

### Unit 3: input-contract wiring for the two consumers
**File**: `plugins/agentic-research/skills/research-orchestrator/SKILL.md` (same edit as Unit 1) +
a one-line note in `plugins/agentic-research/docs/ARCHITECTURE.md` or `HANDOFF.md` if a
re-engagement entry belongs in the plugin's own docs (owned here, light touch).

Define the **input contract** the front-halves call: `{prior_artifact_path, input_state:
ard-native|legacy, completes_claims?: [...]}`. `convert-bootstrap` passes `legacy` +
`inferred-from-legacy` artifacts; `native-refresh` passes `ard-native` + the `Completes:` claim
scope. This is the seam both siblings depend on — pin it precisely so their designs build on a
fixed contract.

**Acceptance Criteria**:
- [ ] The input contract (path + input-state + optional completes-scope) is documented in the SKILL.md branch
- [ ] Both consumer entry shapes (legacy / ard-native) are named so the sibling features design against a fixed seam

## Implementation Order
1. Unit 2 (the reference procedure — the detailed logic, written first so the SKILL.md branch can point at a real file)
2. Unit 1 (the SKILL.md walk branch — compact, points at Unit 2)
3. Unit 3 (input-contract wiring — folds into the Unit 1 edit + a doc note)

## Testing
No code; verification is structural/static (consistent with how the plugin's other skill work is verified):
- **Skill-style conformance** — run the repo skill-style audit checklist on the edited SKILL.md
  and new reference (frontmatter unchanged, line budgets, harness-neutral wording, no Claude-only
  tool names).
- **Discipline-bundle integrity** — confirm the refresh branch's dispatch still inlines the
  verbatim discipline bundle (the §5 fence is not bypassed by the new branch).
- **Lens-enforcement walk-through** — trace a worked refresh (a sample prior artifact) on paper:
  confirm the prior path lands in the known-lens set and that a `[handle]{N}` pointing at it
  would be both pre-flight-excluded AND lint-rejected (belt and suspenders).
- **Lint backstop live** — `python3 plugins/agentic-research/scripts/lint-citations.py` over a
  sample refreshed artifact reports a clean chain (no handle resolving to the prior artifact).
- **Both input states covered** — the reference + branch name both `ard-native` and `legacy`
  start-states; a reviewer confirms neither consumer is left without a path.

## Implementation notes
- **Files changed**: `plugins/agentic-research/skills/research-orchestrator/SKILL.md` (refresh
  branch annotation in the walk diagram at `substrate-check`; new `## Refresh re-engagement`
  section with the input contract; a refresh note in `## Registration`).
- **Files created**: `plugins/agentic-research/skills/research-orchestrator/references/refresh-reengagement.md`
  (the full procedure — when-this-runs, input contract, pre-flight lens check, attestation
  start-state branch, the re-authoring walk, superseding-artifact output; 104 lines, ToC).
- **Discrepancies from design**: *Unit 3's optional plugin-docs note was skipped.* The design
  said a one-line note in `docs/ARCHITECTURE.md`/`HANDOFF.md` "if a re-engagement entry belongs
  in the plugin's own docs." ARCHITECTURE.md is altitude-high (substrates / cleavage / pairing)
  and does not enumerate orchestrator entry modes; forcing a note there would be out-of-altitude
  noise. The input contract lives where it's used (the SKILL.md branch), which is the correct
  home — so the doc edit was not manufactured (per document-evolution: don't add edits that don't
  earn their place). The input contract (Unit 3's substance) IS delivered, in the SKILL.md branch.
- **Adjacent issues parked**: none. (Noted but NOT fixed — out of scope: the orchestrator SKILL.md
  carries two pre-existing skill-style stale-term hits — `allowed-tools` at L131, "Suggested
  model: sonnet/opus" at L221 — both predate this change and describe existing Claude-native
  behavior; not touched.)
- **Verification**: line budgets OK (SKILL 372 < 500, reference 104 < 200, ToC present);
  frontmatter unchanged (name+description); reference link resolves; new prose harness-neutral;
  discipline guard confirmed at `research-discipline/SKILL.md:34` (citations accurate);
  belt-and-suspenders lens enforcement present in both surfaces; lint backstop runs (the
  pre-existing 87-broken `.research/` count is disjoint from this `plugins/`-only edit — no
  regression introduced). Lens-enforcement paper walk-through passes: a handle to the prior
  artifact is both pre-flight-excluded (known-lens set) and lint-rejected (analytical-tier ≠
  source).

## Risks

- **Lens-not-substrate is the whole ballgame.** If the pre-flight check or the dispatch exclusion
  is wrong, a refresh launders the prior artifact's unsourced claims into the new one — the exact
  GR.1-analogue the discipline fences (`research-discipline/SKILL.md:34`). Mitigation: belt-and-
  suspenders (pre-flight exclusion + lint backstop) and a paper walk-through in Testing. This is
  why the feature is the epic's dependency root and gets adversarial design care.
- **Orchestrator size budget.** The orchestrator SKILL.md is already large; the branch must stay
  compact (procedure in the reference). Mitigation: verify the 500-line hard cap post-edit; move
  anything heavy into `references/refresh-reengagement.md`.
- **Input-state mis-detection.** If a legacy artifact is mis-tagged `ard-native`, the mode tries
  to re-validate attestations that don't exist. Mitigation: input-state is set by the *calling
  front-half* (convert knows it's legacy; native-refresh knows it's ard-native), not inferred —
  the contract carries it explicitly (Unit 3).
- **Scope creep into the consumers.** This feature defines the doorway + contract only; the
  discovery sweep (convert) and the acquisition/staleness wiring (native-refresh) are the
  siblings' work. Mitigation: the input contract is the hard boundary — this feature stops at the
  seam.
