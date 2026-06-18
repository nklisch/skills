---
id: feature-agentic-research-refresh-entry
kind: feature
stage: done
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
  `research-discipline/SKILL.md:34`). The pre-flight exclusion is the **SOLE structural guard**
  — `lint-citations.py` is NOT a backstop for this violation: a handle resolving to the prior
  analytical-tier artifact is status `intra-program-resolved`, which the lint treats as
  non-broken at `severity: none` by design (verified `lint-citations.py:97,313`), so it passes
  clean. The pre-flight check catches the violation at author time, structurally. **This is
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
  confirm the prior path lands in the known-lens set and that a `[handle]{N}` pointing at it is
  caught by the pre-flight exclusion (the SOLE guard — lint does NOT catch it: a handle to the
  analytical-tier prior artifact resolves `intra-program-resolved`, treated as clean).
- **Lint citation-chain check** — `python3 plugins/agentic-research/scripts/lint-citations.py` over a
  sample refreshed artifact reports a clean chain (no *broken* handles). NB: lint validates the
  chain; it is not the lens guard — it would pass a handle to the prior artifact, so it is not
  evidence the lens exclusion held.
- **Both input states covered** — the reference + branch name both `ard-native` and `legacy`
  start-states; a reviewer confirms neither consumer is left without a path.

## Review 3 (2026-06-18, cross-model GPT-5.5 — confirmation pass)

**Verdict**: **Approve** — same cross-model reviewer (GPT-5.5 via `codex exec`), second pass over
the now-fixed state. All three Review-2 findings **RESOLVED**, **no new findings**, "clean enough to
advance to done." Notably it walked the Important-2 worst case (a sibling lens loaded immediately
before a revision-pass dispatch): inserted at load time + the revision dispatch re-reads the current
set at composition ⇒ exclusion re-attached, no laundering window. The known-lens guard is sound.

Two cross-model passes total: the first found real gaps (Important-1/2 + Nit), the second confirms
they are closed with nothing new. Advanced `review → done`.

## Review 2 (2026-06-18, cross-model GPT-5.5)

**Verdict**: Request changes — deep lane, **cross-model** fresh-context reviewer (GPT-5.5 via
`codex exec -m gpt-5.5`, a genuinely different model class from the Opus author; peeragent not
installed, so codex was invoked directly — a stronger cross-model path than the local-sub-agent
fallback). **No blockers**; 2 Important + 1 Nit, all applied (see the cross-model review-fix pass
notes above).

- Independently re-confirmed **B1** against the lint source (cited the same `lint-citations.py:97`
  + `:313` — `intra-program-resolved` ∈ `DEFAULT_NON_BROKEN` at `severity: none`), agreeing the
  first fix was correct and lint is rightly no longer treated as a guard.
- Confirmed **B2/I1/I2 materially fixed** (concrete dispatch-composition attach point, operational
  re-validation, pre-flight `input_state` assertion) and skill-style passing (376 / 161+ToC /
  portable frontmatter).
- **Important-1** (stale false-contract language in the feature item) + **Important-2** (known-lens
  set update rule undefined) + **Nit** (presence-only `input_state` check) — all fixed this pass.

**Notes**: Cross-model review is the deep-review reference's *preferred* path ("different model
class through peeragent when available"); peeragent isn't installed here, so codex was wired
directly via Bash — same effect, genuinely off-model. Both of GPT-5.5's Important findings were
real and accepted; its B1 re-confirmation gives independent cross-model agreement on the
highest-stakes fix. Bounced `review → implementing` for the fix, now re-advanced.

## Review 1 (2026-06-18)

**Verdict**: Request changes — deep lane, fresh-context independent reviewer (local sub-agent;
peeragent not available — recorded per deep-review degradation).

**Blockers** (fixed in the next implement pass — they are spec/prose corrections, not separate
story items):

- **B1 — the "belt-and-suspenders" lint backstop claim is FALSE for the prior-artifact case.**
  *Independently verified in `plugins/agentic-research/scripts/lint-citations.py`*: `intra-program-resolved`
  is in `DEFAULT_NON_BROKEN` (line 97-98) and carries `severity: none` (line 313). A `[handle]{N}`
  resolving to an analytical-tier artifact (position, campaign parent/specialist) is treated as
  **clean, not broken** — by design (the lint comment at line 20 names it a legitimate
  intra-program reference). The prior artifact being refreshed is *always* analytical-tier, so
  citing it would resolve `intra-program-resolved` and **pass lint**. The lint is therefore NOT a
  backstop against the lens violation — the **pre-flight known-lens check is the SOLE guard**, not
  a redundant second one. Fix: rewrite the claim in `references/refresh-reengagement.md`
  (§the-pre-flight-lens-check, §the-re-authoring-walk) and the SKILL.md branch to stop calling lint
  a backstop for this case; state that the pre-flight exclusion is the primary and sole structural
  guard, and that lint only catches the unrelated *broken-handle* case (a handle resolving to
  nothing), not intra-program self-citation. Update the feature's own "belt-and-suspenders"
  language in Implementation notes + Risks to match.
- **B2 — the pre-flight known-lens check is under-specified, and B1 makes it load-bearing.** With
  lint removed as a backstop, "inject into every authoring dispatch as an explicit exclusion" is the
  only guard and must be concretely implementable. Fix: in `references/refresh-reengagement.md`
  specify the mechanism — the `known_lens_paths` set is built at refresh-engagement start (entering
  the refresh branch), and the dispatch-composition step (the §5 verbatim-bundle + role-brief +
  params step) gains a concrete prepended block: `KNOWN-LENS EXCLUSION — these paths are framing,
  NOT sources; never cite as [handle]{N}: <paths>`. Name *when* it is built, *where* it attaches in
  the dispatch composition, and that "every dispatch" means the same composition step the discipline
  bundle already flows through (so completeness rides on the existing §5 mechanism).

**Important** (fold into the same next implement pass):

- **I1 — `ard-native` re-validation is operationally vague.** "Re-validate each existing
  attestation against current sources" does not say *what* re-validation does (HEAD-probe the URL?
  re-fetch and compare content? re-confirm the claim still holds?). The `native-refresh` consumer
  depends on this contract. Fix: spell out the re-validation procedure in
  `references/refresh-reengagement.md` §attestation-start-state-branch (e.g. probe source liveness →
  reuse if unchanged; re-fetch + fresh attestation if changed; mark gap + offgas if dead).
- **I2 — `input_state` is caller-set but unasserted.** A caller mistakenly passing `ard-native` on
  a legacy artifact sends the walk into re-validating attestations that do not exist. Fix: add a
  cheap pre-flight assertion — `ard-native` ⇒ confirm the prior artifact has ≥1 attestation in
  `.research/attestation/`; on mismatch, interactive surface-and-correct / autonomous hard-halt
  (mirrors the orchestrator's existing malformed-dials posture).

**Nits** (optional, address if cheap):
- N1 — SKILL.md walk annotation "resume below" → "resume at the attest step" for precision.
- N2 — reference §the-pre-flight-lens-check "any sibling artifacts loaded as framing" is vague;
  define what counts as a sibling lens (other analytical-tier artifacts loaded as reading aids
  during this refresh).

**Notes**: Substrate mode, deep lane. Fresh-context reviewer was a local sub-agent (peeragent
unavailable — degraded per deep-review.md, recorded here). The reviewer's central claim (B1) was
**independently re-verified against the lint source** before acceptance, not taken on faith — it is
correct. B1 is the high-stakes finding: the epic's anti-fabrication lynchpin shipped a guard whose
advertised redundancy does not exist. Caught before two siblings built on the unsound contract,
which is exactly why the lynchpin was reviewed first. No code changed by this review; bounced
`review → implementing`.

## Implementation notes (cross-model review-fix pass, 2026-06-18)

Second review was **cross-model** (GPT-5.5 via `codex exec`, a different model class from the
author) — verdict Request changes, **no blockers**, two Important + one Nit. It *independently
re-confirmed B1 against the lint source* (same lines 97/313), agreeing the prior fix was right.
Findings applied:

- **GPT-5.5 Important-1 — stale false-contract language in the *feature item itself*** (fixed). The
  SKILL.md/reference were corrected last pass, but the feature body's live spec sections still read
  "lint backstop / belt-and-suspenders." Corrected **in place**: §Design decisions (lint is NOT a
  backstop; pre-flight is sole guard), §Testing (walk-through + lint-chain-check reworded), §Risks
  (mitigation reworded). The initial-pass implementation notes are now explicitly marked
  **SUPERSEDED / obsolete record** so their false language can't be read as the contract.
- **GPT-5.5 Important-2 — known-lens set had no update rule** (fixed). `references/refresh-reengagement.md`
  §the-pre-flight-lens-check now specifies the set is **live, not built-once**: a sibling lens
  loaded mid-walk is added at load time, and because every authoring *and revision-pass* dispatch
  re-reads the current set through the §5 composition step, there is no window where a later
  dispatch misses an exclusion.
- **GPT-5.5 Nit — `input_state` assertion was presence-only** (strengthened). The pre-flight
  assertion now checks **claim-level resolution** (the cited handles for the claims being
  re-engaged resolve to source-direct attestations), catching a *partially* attested legacy
  artifact mislabeled `ard-native`, not just a wholly-unattested one.

Re-verified: budgets OK (SKILL 376 < 500, reference 161 < 200, ToC present); the live spec sections
carry no false-backstop claim (remaining mentions are review-findings quoting it, or inside the
obsolete-marked block). Advanced implementing → review.

## Implementation notes (review-fix pass, 2026-06-18)

Applied the Request-changes punch-list from the §Review below. All six findings were
spec/prose corrections to the two files — no architecture change:

- **B1 (fixed)** — removed the false "belt-and-suspenders / lint backstop" framing from BOTH
  surfaces. The reference §the-pre-flight-lens-check now carries an explicit warning block: a
  handle to an analytical-tier prior artifact resolves `intra-program-resolved`, which
  `lint-citations.py` treats as non-broken at `severity: none` by design (re-verified at lint
  source lines 97 + 313) — so the lint is NOT a backstop. The pre-flight exclusion is named the
  **sole structural guard**. The SKILL.md branch + the re-authoring-walk lint step were corrected
  to match. The feature's own Risks/Implementation-notes "belt-and-suspenders" language is
  superseded by this note.
- **B2 (fixed)** — the pre-flight check is now concretely specified: `known_lens_paths` built on
  entering the refresh branch; a `KNOWN-LENS EXCLUSION` block attached to the §5 dispatch-
  composition step (so "every dispatch" rides the existing discipline-bundle mechanism — no
  separate completeness obligation). Mechanism documented in the reference + summarized in SKILL.md.
- **I1 (fixed)** — `ard-native` re-validation spelled out as a 4-step procedure (probe liveness →
  reuse unchanged / re-fetch changed / gap+offgas dead), then extend with new acquisitions.
- **I2 (fixed)** — added a pre-flight `input_state` assertion: `ard-native` ⇒ confirm ≥1
  source-direct attestation exists; mismatch → interactive surface-and-correct / autonomous
  hard-halt (mirrors the malformed-dials posture).
- **N1 (fixed)** — walk annotation "resume below" → "resume at attest".
- **N2 (fixed)** — "sibling artifacts loaded as framing" now defined (analytical-tier artifacts
  loaded for framing during this refresh; NOT a source-direct attestation).

Re-verified: line budgets OK (SKILL 376 < 500, reference 150 < 200, ToC present); no residual
false-backstop claim (all 3 "backstop" mentions are negations); corrected lint claim matches
source (intra-program-resolved ∈ DEFAULT_NON_BROKEN @ severity none). Advanced
implementing → review.

## Implementation notes (initial pass — SUPERSEDED by the review-fix pass above)

> **Obsolete record.** This block captures the *first* implementation pass, whose
> "belt-and-suspenders / lint backstop" verification claims were **false** (see Review B1).
> Kept as the historical record of what that pass did; the review-fix-pass notes above are the
> current state. Do NOT read the lint-backstop language below as the contract.

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
  GR.1-analogue the discipline fences (`research-discipline/SKILL.md:34`). Mitigation: the
  pre-flight known-lens exclusion is the **sole structural guard** (lint is NOT a backstop here —
  it passes a handle to the prior analytical-tier artifact as `intra-program-resolved`), so the
  exclusion must be built at branch entry, updated at lens-load time, and re-attached to every
  authoring/revision dispatch; plus a paper walk-through in Testing. This is why the feature is the
  epic's dependency root and gets adversarial design care.
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
