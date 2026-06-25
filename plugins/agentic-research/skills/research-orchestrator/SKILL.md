---
name: research-orchestrator
description: >
  Dynamic research-engagement entry point for the .research/ substrate. Reads the engagement's dials
  (scope_authority, verification_rigor), sets them with the user at kickoff, discovers fan-out
  topology from the seed (one inline pass to N specialists), and walks the ARD decision-graph at the
  dialed verification depth. Use for any grounded research engagement: focused single-pass, breadth
  survey, multi-specialist decomposition, or program-scale. Honors the ARD SPEC invariants
  (anti-fabrication floor, verification stack, registration); this is one deployment of ARD on the
  Claude agent system.
---

# Research Orchestrator

One dynamic entry for research engagements in `.research/`. You read the engagement's
**dials**, set them *with the user*, discover **fan-out topology from the seed**, and walk
the ARD decision-graph at the dialed verification depth — from a one-agent inline brief to
an N-specialist campaign. The anti-fabrication discipline binds the work regardless of
which surface invokes it.

This is **one deployment of ARD**, not the framework. The control-space model (ARD SPEC §3),
the dial-space (§8), the verification stack (§7), the registration contract (§9), and the
decision-graph ordering (§10.1) are the **invariant architecture** — this skill enacts them;
it does not re-derive them. Read the SPEC for the model; this skill is the operational walk.
There is no preset to pick: the recognizable shapes (focused, breadth-survey, decomposed,
program-scale) are **activation-profiles** (§3.2) — named starting points across all controls,
which this one orchestrator spans by reading dials and discovering topology.

## Discipline propagation (the §5 invariant — read this first)

Every authoring sub-context must carry the anti-fabrication discipline (ARD SPEC §5); a
sub-context that authors without it reintroduces the failures the framework fences. **This
deployment's mechanism is inline-into-dispatch.** Whenever you spawn an authoring sub-agent,
you compose its prompt through **one mandatory step**:

> **Dispatch composition** = `[verbatim discipline bundle]` + `[role brief]` + `[engagement params]`
> - **discipline bundle** — `ard-core/kernel/discipline.md` (sections 1–6), inlined
>   **verbatim**. Read it once at engagement start; prepend it to every authoring dispatch.
>   Do not paraphrase it. (The `research-discipline` skill is the wrapper that points here —
>   inline the canonical file, not the wrapper.)
> - **role brief** — the relevant file under `references/` (`research-specialist.md` /
>   `adversarial-reader.md` / `evaluator.md`).
> - **engagement params** — the facet/seed/paths/rigor for this specific dispatch.

On the **light path** (no fan-out) you author inline in your own context, with the discipline
already present because **you read it at engagement start** (`ard-core/kernel/discipline.md` —
read it explicitly; do not assume it is auto-loaded, since skills are not guaranteed to auto-invoke).
So no separate inlining is needed on the light path. **Never author or dispatch authoring without the
discipline present** — that is the §5 fence.

## Reading the dials (ARD SPEC §8)

Two stored dials drive the engagement; you set them *with the user* at kickoff (propose +
discuss + settle), never silently.

- **`scope_authority`** — `pre-registered` / `mixed` / `in-engagement-judgment` (default when
  the seed carries none). Governs whether `decompose` is emergent (you draft + confirm) or
  honored from a declared decomposition, and whether in-flight re-scoping is permissioned.
- **`verification_rigor`** — `floor` / `standard` / `full`. Governs **which verification gates
  fire** (see Verification depth) — *not* how wide the fan-out is. Infer from how much rigor
  the output warrants; surface your inference at kickoff.
- **engagement-unit** is emergent (discovered at read-time — do not pre-commit it);
  **disconfirmation-mode** is derived from `scope_authority` (you don't set it). Per §8, the
  framework retires derivable fields rather than storing them.

**Scale / fan-out is a separate control** (how many specialists), discovered at `decompose`
and revisited post-campaign — never inferred from the rigor dial (§7).

## The walk (ARD SPEC §10.1 — ordering is invariant)

Activate the applicable subset of decision-points in this fixed order:

```
  → [KICKOFF]              set the dials WITH the user — every path, BEFORE decompose (← turn)
                           commissioned by a [research] work item? READ its research_dials + confirm
dispatch-time-registration record the settled dials (commissioning item if present; else transcript / dispatch.md)
  → substrate-check        survey .research/ for overlapping prior work; surface the outcome
                           HANDED a prior artifact? → REFRESH BRANCH (see §Refresh re-engagement):
                           register refresh + supersedes-prior, load prior AS LENS, then resume at attest
  → decompose              emergent: draft ≥3 candidates + comparative assessment + self-flag
                           (scope_authority — set at kickoff — governs emergent-draft vs. honor-declared)
  → [CHECKPOINT A]         confirm the decomposition / framing (multi-path) (← turn)
  → BRANCH on fan-out width discovered at decompose:
      ── light (0–1 facet):  attest → synthesize  INLINE (no spawn)
      ── multi (2+ facets):  parallel Agent × N research-specialist (one message)
                              each: attest (per-source files) → synthesize {within}
  → lint                   python3 plugins/agentic-research/ard-core/kernel/lint-citations.py <out> --attestation-dir .research/attestation/
  → [CHECKPOINT B]         surface contradictions before the cross-join (multi-path only)
  → synthesize {cross}     lead composition across specialist briefs → parent.md (multi-path)
  → acquisition-offgas     consolidate specialist acquisition candidates → acquisitions.md
                           (research-side persist always); propose queue promotion at the
                           handoff gate — operator-confirmed (verification-INDEPENDENT; see §Acquisition offgas)
  → adversarial-read       if rigor ≥ standard (dispatch the adversarial-reader brief)
  → evaluate               if rigor = full (dispatch the evaluator brief, ISOLATED context)
  → spot-check             always; lead-context categorical check across lint pattern categories
  → [user-validation]      when the user is the committing party
  → [promote]              when converged substrate warrants a cross-arc lift
```

For multi-specialist walks, `lint` fires against within-specialist briefs *before* cross
synthesis, and `adversarial-read` *after* it (§10.1).

## Refresh re-engagement (re-authoring a prior artifact)

When the engagement is **handed a prior artifact** rather than seeded fresh — a `convert`/bootstrap
import or a `native-refresh` enrichment — `substrate-check` routes into the **refresh branch**. The
prior artifact is a **LENS, not substrate**: it frames *what to re-engage*, but is NEVER a
`[handle]{N}` citation target (citing it launders its claims into apparent source-attestation — the
lens-not-substrate guard in the discipline bundle). The branch:

1. **Register** `refresh` + `temporal_contract: supersedes-prior` (existing enums — no new vocabulary).
2. **Pre-flight lens check (the SOLE structural guard).** Build a `known_lens_paths` set on entering
   the branch (the prior artifact + any sibling analytical-tier artifacts loaded as framing), and
   attach a "NEVER cite these paths" exclusion to the **dispatch-composition step** — riding the same
   §5 step that prepends the verbatim discipline bundle, so every authoring dispatch carries it. The
   lint is **NOT** a backstop here: a handle to the prior (analytical-tier) artifact resolves
   `intra-program-resolved`, which the lint treats as clean by design — so the pre-flight exclusion
   is the only thing preventing a lens violation.
3. **Attestation start-state branches on `input_state`** (caller-set, asserted pre-flight) —
   `ard-native`: re-validate the prior's attestations (probe liveness → reuse unchanged / re-fetch
   changed / gap+offgas dead) + extend with new acquisitions; `legacy`: build the chain from scratch
   (no prior attestations exist).
4. **Resume the normal walk** (attest → synthesize → lint → verify) over the **current** substrate at
   the dialed rigor. The prior's old verdicts do not carry forward. Output is a superseding artifact
   with a `supersedes` pointer; the prior is retained as the historical record.

**Input contract** the front-halves call with: `{prior_artifact_path, input_state:
ard-native|legacy, completes_claims?: [...], intended_output_kind?}`. `intended_output_kind` is
optional/additive — the caller's confirmed destination shape for the uplifted artifact (absent ⇒
discovered-shape default). `input_state` is set by the **caller** (convert knows
`legacy`; native-refresh knows `ard-native`), never inferred. `completes_claims` is the acquisition
manifest's `Completes:` join, scoping which held claims a landed acquisition re-engages. Full
procedure: [`references/refresh-reengagement.md`](references/refresh-reengagement.md).

## Kickoff + checkpoints (conversational HITL)

The human-in-the-loop points are **conversational turns**, not tool calls — surface the
content as a message, wait for the reply, honor it. **Do not use `structured question tool`** (it is
deliberately absent from `allowed-tools`).

- **Kickoff** (every path, before `decompose`) — propose the dials + reasoning + the
  trade-offs; settle them with the user. Mispositioned dials cost the whole engagement.
  **When a `[research]` work item commissioned this engagement** — it carries a
  `research_dials:` registration block (scope_authority, verification_rigor, intent,
  output_kind) — the dials are *already set by the act of scoping that item*: read them,
  confirm/adjust with the user, then proceed; don't re-propose from scratch. Scoping the work
  item IS the dispatch act (see §Work-coordination entry).
  **Under autonomous delegation** (an autopilot/queue-driver goal dispatched this engagement
  and its contract forbids mid-run questions): the registration-carrying item is the coherent
  case — the dials were user-confirmed at scope time, so kickoff confirmation is already
  satisfied; state the read dials and proceed. The checkpoints below then degrade to
  **surface-and-proceed**: narrate the content, persist the durable half (Checkpoint A's
  decomposition rationale per §10.6; Checkpoint B's contradictions in the synthesis), and
  continue — judgment logged, never silently skipped. This degradation is a **deliberate
  choice**, not a loss of rigor: the durable half is always persisted and the dials were
  pre-confirmed at scope time, so proceeding loses only the live turn. A deployment that wants
  hard-halt-on-contradiction (block the engagement until a human resolves a Checkpoint-B
  contradiction) would gate that separately — it is not this orchestrator's default. Without a
  registration-carrying item, autonomous dispatch has no user-set dials to read; treat that as a
  hard-halt condition under the delegation contract rather than silently self-setting the dials.
  **A present-but-invalid block is never treated as authoritative** (an unknown enum value or
  wrong shape — e.g. a scalar where `output_kind` expects a value-or-list — present in the block):
  interactively, surface the defect and re-confirm corrected dials; under autonomous
  delegation, hard-halt exactly like the no-dials case — proceeding on malformed dials costs
  the whole engagement. An **omitted** dial is *not* malformation — a field simply absent from
  the block takes its default (see Per-dial defaults below); the hard-halt is for present-but-invalid
  values, never for omission.
- **Checkpoint A** (after `decompose`, multi-path) — present the ≥3 decomposition candidates +
  comparative assessment + chosen sample + self-flag; confirm/adjust/reframe.
- **Checkpoint B** (before the cross-join, multi-path) — surface candidate `## Contradictions`
  and any high-severity lint findings before composing the parent synthesis.

### Per-dial defaults (omission ⇒ default)

A `research_dials:` block may carry any subset of the four commissioning fields; an **absent**
field is not malformation — it takes its default, consistent with the standalone-walk defaults
(§Reading the dials). Confirm any inferred value at kickoff when interactive.

| dial (omitted) | ⇒ default |
|---|---|
| `scope_authority` | `in-engagement-judgment` (the standalone default) |
| `verification_rigor` | inferred per the standalone inference rules (how much rigor the output warrants); surfaced + confirmed at kickoff when interactive |
| `intent` | inferred from the commissioning item body (its seed/intent prose) |
| `output_kind` | the orchestrator's default for the discovered engagement shape (brief / campaign / position) |

**Enum extensibility:** `scope_authority` and `verification_rigor` are **closed enums** (their
value sets are ARD architecture — ARD SPEC §8); `intent` and `output_kind` are **open inventory**
an adopter may extend (with `output_kind`→`.research/` path bindings being deployment choices, not
ARD's). Omission of an open-inventory dial still resolves to its default above; an unknown *value*
in a closed enum is the present-but-invalid hard-halt case.

## Verification depth (ARD SPEC §7 — the rigor control)

A subset-select gate catalog with a hard-floor core, not a monolithic switch:

| `verification_rigor` | `lint` | `adversarial-read` | `evaluate` | `spot-check` |
|---|---|---|---|---|
| `floor` | ✓ floor | — | — | ✓ floor |
| `standard` | ✓ floor | ✓ | — | ✓ floor |
| `full` | ✓ floor | ✓ | ✓ | ✓ floor |

- **`lint` + `spot-check` are the hard floor** — they always fire. `adversarial-read` +
  `evaluate` are selectable; "go custom" (activate one independent of the profile) is
  first-class.
- **Escalate upward freely on evidence** (a lint/adversarial finding can pull a higher gate
  in mid-engagement); **never prune below the floor** (§3.1). The only legitimate "less" is the
  reachability prune — e.g. `evaluate` (the cross-specialist FR.1 fence) is out of a
  single-pass scout's floor because no cross-synthesis artifact exists for it to fence; it
  re-enters the floor of any cross-specialist synthesis shape.
- **`lint`** — `python3 plugins/agentic-research/ard-core/kernel/lint-citations.py <synthesis-path> --attestation-dir .research/attestation/`. Default lint-only-warn; `--exit-code-on high` to block. Run before `adversarial-read`.
- **`adversarial-read`** — dispatch the [adversarial-reader](references/adversarial-reader.md) brief with full access (synthesis + briefs + attestations + lint output). Returns a checklist + `APPROVED`/`NEEDS-REVISION`.
- **`evaluate`** — dispatch the [evaluator](references/evaluator.md) brief with **isolated context: ONLY the synthesis output + the seed.** Do not pass briefs, attestations, or the decomposition rationale — the isolation is the FR.1 fence, enforced by what you hand it.
- **`spot-check`** — you (lead, full substrate access) sample across all lint pattern categories + load-bearing semantic claims, consuming lint + adversarial + evaluator findings. Corrections in place.

A `NEEDS-REVISION` from either gate triggers a revision pass at the indicated scope — a revision
dispatched to a sub-agent is composed per **Dispatch composition** (the discipline is inlined
again, never skipped on a re-author). A second-pass `NEEDS-REVISION` is surfaced to the user, not
looped silently.

## Fan-out (the scale control)

Width is **discovered at `decompose`**, not preset — the number of facets is the number of
specialists.

- **0–1 facet → light path (inline, no spawn).** Attest + synthesize in your own context.
- **2+ facets → multi path.** Spawn that many [research-specialist](references/research-specialist.md)
  dispatches as **parallel `Agent` calls in one message**, await all, then `lint`. Each
  dispatch is composed per **Dispatch composition** above (discipline bundle + specialist brief
  + its facet/seed/paths). Suggested model: `sonnet` for specialists, `opus` for
  adversarial-reader / evaluator.

When a decomposition lands 7+ facets across 3+ domains, escalate to **program-scale**
(decompose into campaigns, each a nested decomposed walk) rather than over-widening one fan-out.

## Registration (ARD SPEC §9)

Set the controls at dispatch via the ten-field registration shape in
[`ard-core/kernel/templates/dispatch.md`](../../ard-core/kernel/templates/dispatch.md). Persistence is a deployment choice
(SPEC §9) — and *where* the registration lives tracks whether a work substrate is present:

- **Commissioned by a `[research]` work item** → the registration rides the work item as a
  `research_dials:` block (the commissioning subset: scope_authority, verification_rigor,
  intent, output_kind — the fields the scoping act fixes; you settle the remaining five at
  dispatch as on any standalone walk, since they are engagement-time judgment, not scoping
  decisions). **Scoping the
  item IS the dispatch act.** `.research/` then holds *clean output substrate only* — no
  `dispatch.md`. See §Work-coordination entry + `docs/HANDOFF.md` Arrow 1.
- **Standalone, light / single-pass** → the conversation transcript suffices.
- **Standalone, heavy (multi-specialist / program-scale)** → persist a `dispatch.md` at the
  campaign root (`.research/analysis/campaigns/<slug>/`). This is the **standalone fallback** —
  it carries the registration when there is no work item to carry it, preserving the standalone
  invariant (ARD research runs with no work substrate at all).

Registration informs the engagement; it is **not** carried into the artifacts' own frontmatter
(artifacts stand on their own metadata).

A **refresh re-engagement** (handed a prior artifact) registers `refresh` +
`temporal_contract: supersedes-prior` and additionally records the prior artifact path +
`input_state` (the refresh input contract above); see §Refresh re-engagement.

## Output paths (this deployment's `.research/` map)

- Per-source attestation → `.research/attestation/<handle>.md` (always, before any synthesis prose).
- Light / single-pass / breadth-survey brief → `.research/analysis/briefs/<slug>.md` (`-landscape.md` for breadth-survey).
- Multi-specialist / program campaign → `.research/analysis/campaigns/<slug>/` (`parent.md`, `specialists/<facet>.md`, `acquisitions.md`, `verification-checklist.md`, `campaign-evaluation.md`; plus `dispatch.md` **only on the standalone-heavy path** — a work-item-commissioned campaign carries its registration on the item).
- Promoted positions → `.research/analysis/positions/<slug>.md`; staged hypotheses → `.research/analysis/hypothesis/`.
- Citations are `[handle]{N}`, resolving by number against the per-corpus bibliography; the chain is brief claim → attestation → fetched source (the lint enforces it).

## Acquisition offgas (ARD SPEC §4.1)

Specialists return **acquisition candidates** — `blocking` gaps (load-bearing sources they could
not fetch) and `enriching` candidates (the *proactive lookout*: sources that would deepen a facet
beyond the web layer). Consolidating them is a **verification-independent offgas**: a source you
could not fetch is a gap whether or not the synthesis passes adversarial-read, so it does **not**
gate on the verification stack — consolidate at synthesis-time regardless of the gate outcomes.

- **Candidates persist research-side first, always.** Multi-specialist / program walks
  consolidate the specialists' returns into
  `.research/analysis/campaigns/<slug>/acquisitions.md` (one entry per source, classed +
  urgency-tagged + `completes`-joined; fill from [`templates/acquisitions.md`](../../templates/acquisitions.md)).
  Light / single-pass walks have no campaign bundle: skip the file and carry the gaps in the
  engagement record. This research-side write is unconditional and needs no confirmation — it is
  output substrate, not a cross-band write.
- **Promotion into `.work/` is operator-confirmed** — never a silent auto-write, matching the
  Arrow-2 contract (`research-handoff` NEVER auto-fires, always asks). The promotion target is the
  standing **`research-acquisition-queue`** backlog item (a stable slug, so dedup has a defined
  target); promoting **merges** each candidate into it by source (merge `completes`, never re-add).
  The push is one-way — the manifest carries no link back to the queue (a `.research/` artifact does
  not link into `.work/`).
  - **Interactive runs** — ask before writing the queue; on confirmation, create/merge the
    `research-acquisition-queue` item.
  - **Autonomous runs** — never write the queue silently. Surface the candidates in the engagement
    record and **propose** promotion at the handoff gate (`/agentic-research:research-handoff`),
    leaving the write to the operator.
  - **No `.work/` substrate present** — surface the candidates to the user instead (the same
    degrade-gracefully posture as the research→work handoff).
- **The anti-recall fence** (carried in the discipline bundle, ARD SPEC §4.1): an `enriching`
  candidate must point at a fetched source that names it — never training-recall (`AQ.3`). A
  `blocking` candidate is self-grounding (a fetch was attempted and failed).
- **The offgas writes the queue; `refresh-scan.py` drains it.** The standing
  `research-acquisition-queue` is append-only — `blocking` candidates accumulate as
  acquisition-gated claims. The drain mechanism is the lint-shaped detector
  `scripts/refresh-scan.py` (run it like `lint-citations.py`): it re-probes the queue + cited
  sources, classifies (re-acquirable / stale / still-dead), and prints a batch worklist. It writes
  nothing — the operator triages, and accepted items drive the refresh branch (above). See
  `docs/HANDOFF.md` §Acquisition-queue drain loop.

## Work-coordination entry

A `.work/` item may commission an engagement and cite it back — two patterns, both
**read-only** across the authority boundary (operational state never rewrites `.research/`):

- **Plain commissioning** — a work item that needs grounding runs this skill, then sets
  `research_refs: [<slug>]` in its frontmatter to cite the resulting artifact. To gate the
  item on research completion, `depends_on:` a `.work/` commissioning story (not a `.research/`
  slug — `work-view` resolves dep ids only against `.work/` items).
- **Registration-carrying `[research]` item** — a `[research]`-tagged work item carries the
  dials in a `research_dials:` block; **scoping it IS the dispatch act**. The orchestrator reads
  the dials from the commissioning item at kickoff (confirm, don't re-propose), and `.research/`
  stays clean output substrate (no `dispatch.md`). This is the operational pairing of this
  orchestrator with a `[research]` work-nature module.

**Engagement completion closes the commissioning item — this orchestrator owns that
transition.** When the dialed gates have passed and the output is persisted, advance the
commissioning `[research]` item and append a short engagement record to its body (fan-out, gate
outcomes, output paths). **Where it advances to is CONVENTIONS-configurable** — read
`research_completion` from `.work/CONVENTIONS.md` (like the agile-workflow keys):

- **`close-to-done`** (default) — flip the item straight to `stage: done`. Verification ran inline
  in the orchestrator's stack (ARD SPEC §7), so review→bind adds nothing; closing to `done` is the
  deliberate posture, not a skipped step.
- **`route-to-review`** — advance the item to `stage: review` instead, for deployments whose review
  stage carries sign-off / governance meaning (a human signs research off before consumers proceed).
  A reviewer then closes it.

Either way the verification already ran inline, so the item never flows through a review→bind
*release* path. Note that a `[research]` item left non-terminal blocks its `depends_on` consumers —
but that is ordinary non-terminal-substrate behavior, true of any item, not a special hazard of this
seam; `research_completion` just lets a deployment choose where the human sits. Never flip on
unresolved gates: a second-pass `NEEDS-REVISION` leaves the item at its current stage with the
blocker surfaced.

**The registration carrier is feature/story-level — one `research_dials:` block = one
engagement.** The positive pattern this implies is the **research program**: an *epic* whose
children are `[research]` **features**, each a separately-registered engagement carrying its own
`research_dials:` block. The arcs are sequenced work-side via `depends_on` (a later arc consumes an
earlier arc's positions), consumer items interleave between them, and cross-arc artifacts (campaign
bundles, cross-arc ledgers) live research-side in `.research/analysis/`. An epic tagged `[research]`
therefore means *"decompose me into `[research]` feature engagements"* — work-side epic
decomposition, the work substrate's own flow — never an epic-level registration. (Under
`scope_authority: pre-registered`, a declared decomposition maps naturally onto that
epic→feature split — but the split is made work-side, not by this orchestrator.)

See `docs/HANDOFF.md` Arrow 1 for the full commissioning recipe + the registration contract.

**Decomposition-rationale home (ARD §10.6 — the PR.2 fence) follows `scope_authority`:**
- `pre-registered` → the decomposition is a scoping decision; it rides the work item with the
  dials.
- `in-engagement-judgment` → you draft the ≥3 candidates mid-engagement at `decompose`; the
  chosen rationale persists *back* onto the commissioning item, or stays a research-side record
  when there is no work item.
- `mixed` → both homes: the declared portion (pre-registered coverage) rides the item from
  scoping; the emergent portion's chosen rationale persists *back* onto the item at
  `decompose`, exactly as on the in-engagement path.

## Next step after a completed engagement

When an engagement surfaces actionable output — a campaign or position with
`output_kind: adoption-recommendations`, a staged hypothesis to validate, a
recommendation to implement — suggest to the operator:

> Run `/agentic-research:research-handoff <slug>` to emit operator-confirmed
> `.work/` items grounded in this engagement's findings.

The handoff skill is the Arrow 2 emission gate (see `docs/HANDOFF.md`). It is
**never auto-fired** — the operator decides whether and when to emit work items.
If no `.work/` substrate is present in the project, the handoff skill no-ops
silently; the research record stands on its own.

## Related

- **ARD SPEC** — the invariant architecture: §3 (control-space) · §5 (discipline propagation) · §7 (verification stack) · §8 (dials) · §9 (registration) · §10.1 (decision-graph). The plugin's internal discipline; canonical prose at `ard-core/SPEC.md` — see `docs/ADOPTION.md`.
- **ARD CATALOGS** — §4 (adversarial-reader jobs) · §5 (evaluator components) · §6 (decision-point catalog), grounding the role briefs (`ard-core/CATALOGS.md`).
- [`research-discipline`](../research-discipline/SKILL.md) — the anti-fabrication bundle (wrapping `ard-core/kernel/discipline.md`, the single source) this orchestrator inlines unaltered into every authoring dispatch.
- [`research-handoff`](../research-handoff/SKILL.md) — the Arrow 2 emission gate: operator-confirmed `.work/` item emission from actionable research findings.
- `references/` — the three dispatch role briefs (research-specialist, adversarial-reader, evaluator).
- `.research/CONVENTIONS.md` — the substrate's frontmatter contracts + the down-gradient read rule.
