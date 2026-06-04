---
name: research-orchestrator
description: "Dynamic research-engagement entry point for the .research/ substrate. Reads the engagement's dials (scope_authority, verification_rigor), sets them with the user at kickoff, discovers fan-out topology from the seed (one inline pass to N specialists), and walks the ARD decision-graph at the dialed verification depth. Use for any grounded research engagement: focused single-pass, breadth survey, multi-specialist decomposition, or program-scale. Honors the ARD SPEC invariants (anti-fabrication floor, verification stack, registration); this is one deployment of ARD on the Claude agent system."
argument-hint: "[seed] [--scope-authority pre-registered|mixed|in-engagement-judgment] [--rigor floor|standard|full]"
allowed-tools: Read, Write, Glob, Grep, Bash, WebSearch, WebFetch, Agent
model: opus
user-invocable: true
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
> - **discipline bundle** — the body of the `research-discipline` skill
>   (`skills/research-discipline/SKILL.md`, sections 1–6), inlined **verbatim**. Read it once
>   at engagement start; prepend it to every authoring dispatch. Do not paraphrase it.
> - **role brief** — the relevant file under `references/` (`research-specialist.md` /
>   `adversarial-reader.md` / `evaluator.md`).
> - **engagement params** — the facet/seed/paths/rigor for this specific dispatch.

On the **light path** (no fan-out) you author inline in your own context; the discipline
auto-loads via the `research-discipline` skill, so no inlining is needed. **Never author or
dispatch authoring without the discipline present** — that is the §5 fence.

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
dispatch-time-registration
  → substrate-check        survey .research/ for overlapping prior work; surface the outcome
  → decompose              emergent: draft ≥3 candidates + comparative assessment + self-flag
  → [KICKOFF + CHECKPOINT A] set the dials, then confirm the decomposition/framing (turns)
  → BRANCH on fan-out width discovered at decompose:
      ── light (0–1 facet):  attest → synthesize  INLINE (no spawn)
      ── multi (2+ facets):  parallel Agent × N research-specialist (one message)
                              each: attest (per-source files) → synthesize {within}
  → lint                   python3 plugins/agentic-research/scripts/lint-citations.py <out> --attestation-dir .research/attestation/
  → [CHECKPOINT B]         surface contradictions before the cross-join (multi-path only)
  → synthesize {cross}     lead composition across specialist briefs → parent.md (multi-path)
  → adversarial-read       if rigor ≥ standard (dispatch the adversarial-reader brief)
  → evaluate               if rigor = full (dispatch the evaluator brief, ISOLATED context)
  → spot-check             always; lead-context categorical check across lint pattern categories
  → [user-validation]      when the user is the committing party
  → [promote]              when converged substrate warrants a cross-arc lift
```

For multi-specialist walks, `lint` fires against within-specialist briefs *before* cross
synthesis, and `adversarial-read` *after* it (§10.1).

## Kickoff + checkpoints (conversational HITL)

The human-in-the-loop points are **conversational turns**, not tool calls — surface the
content as a message, wait for the reply, honor it. **Do not use `AskUserQuestion`** (it is
deliberately absent from `allowed-tools`).

- **Kickoff** (every path, before `decompose`) — propose the dials + reasoning + the
  trade-offs; settle them with the user. Mispositioned dials cost the whole engagement.
- **Checkpoint A** (after `decompose`, multi-path) — present the ≥3 decomposition candidates +
  comparative assessment + chosen sample + self-flag; confirm/adjust/reframe.
- **Checkpoint B** (before the cross-join, multi-path) — surface candidate `## Contradictions`
  and any high-severity lint findings before composing the parent synthesis.

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
- **`lint`** — `python3 plugins/agentic-research/scripts/lint-citations.py <synthesis-path> --attestation-dir .research/attestation/`. Default lint-only-warn; `--exit-code-on high` to block. Run before `adversarial-read`.
- **`adversarial-read`** — dispatch the [adversarial-reader](references/adversarial-reader.md) brief with full access (synthesis + briefs + attestations + lint output). Returns a checklist + `APPROVED`/`NEEDS-REVISION`.
- **`evaluate`** — dispatch the [evaluator](references/evaluator.md) brief with **isolated context: ONLY the synthesis output + the seed.** Do not pass briefs, attestations, or the decomposition rationale — the isolation is the FR.1 fence, enforced by what you hand it.
- **`spot-check`** — you (lead, full substrate access) sample across all lint pattern categories + load-bearing semantic claims, consuming lint + adversarial + evaluator findings. Corrections in place.

A `NEEDS-REVISION` from either gate triggers a revision pass at the indicated scope; a
second-pass `NEEDS-REVISION` is surfaced to the user, not looped silently.

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

Set the controls at dispatch via the nine-field registration in
[`templates/dispatch.md`](../../templates/dispatch.md). Persistence is a deployment choice:
the conversation transcript suffices for a light/single-pass walk; persist a `dispatch.md` at
the campaign root (`.research/analysis/campaigns/<slug>/`) for multi-specialist and
program-scale walks. Registration informs the engagement; it is **not** carried into the
artifacts' own frontmatter (artifacts stand on their own metadata).

## Output paths (this deployment's `.research/` map)

- Per-source attestation → `.research/attestation/<handle>.md` (always, before any synthesis prose).
- Light / single-pass / breadth-survey brief → `.research/analysis/briefs/<slug>.md` (`-landscape.md` for breadth-survey).
- Multi-specialist / program campaign → `.research/analysis/campaigns/<slug>/` (`dispatch.md`, `parent.md`, `specialists/<facet>.md`, `verification-checklist.md`, `campaign-evaluation.md`).
- Promoted positions → `.research/analysis/positions/<slug>.md`; staged hypotheses → `.research/analysis/hypothesis/`.
- Citations are `[handle]{N}`, resolving by number against the per-corpus bibliography; the chain is brief claim → attestation → fetched source (the lint enforces it).

## Related

- **ARD SPEC** — the invariant architecture: §3 (control-space) · §5 (discipline propagation) · §7 (verification stack) · §8 (dials) · §9 (registration) · §10.1 (decision-graph). Canonical upstream; see `docs/ADOPTION.md`.
- **ARD CATALOGS** — §4 (adversarial-reader jobs) · §5 (evaluator components) · §6 (decision-point catalog), grounding the role briefs.
- [`research-discipline`](../research-discipline/SKILL.md) — the verbatim anti-fabrication bundle this orchestrator inlines into every authoring dispatch.
- `references/` — the three dispatch role briefs (research-specialist, adversarial-reader, evaluator).
- `.research/CONVENTIONS.md` — the substrate's frontmatter contracts + the down-gradient read rule.
