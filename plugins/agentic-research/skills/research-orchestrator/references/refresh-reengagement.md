# Refresh re-engagement — prior-artifact-as-lens re-authoring

The procedure the orchestrator walk's **refresh branch** points at. A *refresh* re-authors an
existing research artifact over revised substrate (ARD's Refresh change-mode — "re-authors the
whole artifact in place over revised substrate; position-agnostic"). Unlike a fresh engagement,
the engagement is *handed a prior artifact* rather than discovering topology from a seed.

The prior artifact is a **LENS, not substrate**: a reading aid for re-engaging the real sources,
never itself a `[handle]{N}` citation target. Citing it would launder its claims into apparent
source-attestation — the highest-recurrence sub-context failure the discipline fences
(`research-discipline` §lens-not-substrate guard). This procedure makes that guard *enforced*, not
merely stated.

## Contents

- [When this runs](#when-this-runs)
- [Input contract](#input-contract)
- [The pre-flight lens check](#the-pre-flight-lens-check)
- [Attestation start-state branch](#attestation-start-state-branch)
- [The re-authoring walk](#the-re-authoring-walk)
- [Output: the superseding artifact](#output-the-superseding-artifact)

## When this runs

The orchestrator enters the refresh branch at **`substrate-check`** when the engagement is
*handed* a prior artifact (an input contract carrying a `prior_artifact_path`), as opposed to
merely discovering an overlap during the survey. Two callers hand artifacts in:

- **legacy import** (`convert`/bootstrap) — an artifact swept in from outside ARD, marked
  `inferred-from-legacy`, with no citation chain.
- **ARD-native refresh** (`native-refresh`) — an artifact authored under ARD whose substrate has
  gone stale, or for which a landed acquisition completes held claims.

## Input contract

The calling front-half passes:

```yaml
prior_artifact_path: <.research/ path of the artifact to re-author>
input_state: ard-native | legacy        # who knows: the caller sets it, never inferred
completes_claims: [<claim id/handle>, ...]   # optional; native-refresh scopes which held
                                             # claims a landed acquisition re-engages
intended_output_kind: <output_kind>          # optional; the destination tier/shape the uplift
                                             # should produce (e.g. precis, position, synthesis-brief)
```

- `input_state` is **set by the caller**, not detected: `convert` knows its artifacts are
  `legacy`; `native-refresh` knows its artifacts are `ard-native`. Inferring it risks trying to
  re-validate attestations that do not exist (see Risks on the feature).
- `completes_claims` is the `Completes:` join from the acquisition manifest — "acquired source →
  exactly these held claims to re-engage." Absent it, the refresh re-engages the whole artifact.
- `intended_output_kind` is **optional and additive** — the caller's confirmed destination for the
  uplifted artifact (an ARD `output_kind` value, mapping to a `.research/` path binding). `convert`
  carries the operator's confirmed target tier through it so the uplift produces the right artifact
  shape. **Absent, the refresh falls back to the discovered-shape default** (the output_kind the
  engagement would pick on its own) — so an existing caller that omits it is unaffected.

## The pre-flight lens check

The known-lens pre-flight check is the **sole structural guard** against the prior artifact's
claims laundering into the refreshed output. The lint is **not** a backstop here — see the
warning below — so this check must be concrete and complete.

**Build the known-lens set on entering the refresh branch** (at `substrate-check`, once the
input contract is read):

1. `known_lens_paths = [prior_artifact_path]` initially.
2. **The set is live, not built-once.** Whenever a **sibling lens** is loaded later in the walk —
   any other analytical-tier artifact pulled in *as a reading aid* (a related position, a campaign
   synthesis), i.e. loaded for framing and NOT a source-direct attestation in
   `.research/attestation/` — **add it to `known_lens_paths` at load time**, before the next
   authoring or revision dispatch. The update rule is the invariant: a path becomes a lens the
   moment it is loaded for framing, and it must be in the set before any dispatch that follows.
3. **Attach the exclusion to the dispatch-composition step, re-reading the set each time** — the
   same step that already prepends the verbatim discipline bundle (the §5 fence: `[discipline
   bundle] + [role brief] + [engagement params]`). Because every authoring dispatch *and every
   revision-pass dispatch* (a `NEEDS-REVISION` re-author is composed through this same step) reads
   the **current** `known_lens_paths`, a sibling lens added mid-walk is excluded from every dispatch
   after its load — there is no window where a later dispatch misses it. The refresh branch adds one
   block to the composition, immediately after the discipline bundle:

   ```
   KNOWN-LENS EXCLUSION — these paths are framing, NOT sources.
   Never cite them as [handle]{N}; read them for framing only:
     - <prior_artifact_path>
     - <each sibling lens path>
   ```

   Because the exclusion rides the *same* composition step the discipline bundle already flows
   through, "every authoring dispatch" is satisfied by the existing §5 mechanism — there is no
   separate completeness obligation to track. A dispatch that carries the discipline bundle
   carries the exclusion.

> **The lint is NOT a backstop for this violation.** A handle resolving to an analytical-tier
> artifact (a position, a campaign parent/specialist) is status **`intra-program-resolved`**,
> which `lint-citations.py` treats as **non-broken at `severity: none`** by design — it is a
> *legitimate* intra-program reference, not an error. The prior artifact being refreshed is
> always analytical-tier, so citing it would resolve `intra-program-resolved` and **pass lint
> clean**. The lint only catches a genuinely *broken* handle (one resolving to nothing), never
> intra-program self-citation. Therefore the pre-flight exclusion above is the only structural
> guard; do not rely on the lint to catch a lens violation.

This check is **plugin-local orchestration**: it operationalizes the *existing* universal
lens-not-substrate rule (in the discipline bundle) for this engagement's specific prior artifact.
It does not change the discipline rule, so it needs no ARD-kernel change.

## Attestation start-state branch

One walk; the only difference is the starting attestation set. `input_state` is set by the
**caller**, never inferred (`convert` knows its artifacts are `legacy`; `native-refresh` knows
`ard-native`).

**Pre-flight `input_state` assertion** (before branching) — a mis-set `input_state` sends the
walk down the wrong path (e.g. trying to re-validate attestations that do not exist). The guard
checks **claim-level resolution**, not just presence (a *partially* attested legacy artifact
mislabeled `ard-native` would pass a bare "≥1 attestation exists" test yet still have unattested
cited claims): if `input_state: ard-native`, confirm that the `[handle]{N}` citations **for the
claims being re-engaged** (the whole artifact, or the `completes_claims` subset) resolve to
source-direct attestations in `.research/attestation/`. If any cited claim in scope has no
source-direct attestation, the artifact is not cleanly `ard-native`. On mismatch —
interactively, surface it and ask the caller to correct (or proceed treating the unattested
claims as `legacy` — build those from scratch); under autonomous delegation, **hard-halt**
(mirrors the orchestrator's malformed-dials posture — proceeding on a wrong input_state corrupts
the engagement). A `legacy` artifact with *some* attestations present is not a hard error (treat
it as legacy; the attested claims simply get re-validated rather than rebuilt), but note it.

- **`ard-native`** — the prior artifact carries a clean attestation set. **Re-validate** each
  existing attestation by:
  1. probing the source for **liveness** (the `source_url` still resolves);
  2. if alive **and unchanged** (the cited specific is still present at the source) → **reuse** the
     attestation as-is — no re-fetch;
  3. if alive **but changed** (content moved/updated such that the cited specific shifted) →
     **re-fetch and write a fresh attestation**, re-pointing the citation;
  4. if **dead** (404 / removed) → mark the claim a **gap**, attempt a replacement source, and
     emit the gap to the acquisition offgas (a dead source is an acquisition candidate, not a
     silent drop).

  Then **extend** with attestations for any new acquisitions (`completes_claims` scopes which held
  claims a landed acquisition re-engages). The point of the `ard-native` branch is to *reuse* still-
  valid attestations rather than re-fetch wastefully — only changed/dead sources cost a fetch.
- **`legacy`** — the prior artifact has *no* attestation set (`inferred-from-legacy`). **Build the
  chain from scratch**: every claim worth keeping must earn a fresh source-direct attestation, or
  be dropped/marked as unsupported. The prior artifact only frames *what to look for*.

## The re-authoring walk

After the pre-flight check and the start-state branch, the **normal orchestrator walk resumes**
over the *current* substrate, at the dialed `verification_rigor`:

1. **KICKOFF** registered `refresh` + `temporal_contract: supersedes-prior` (existing enums). The
   prior artifact's held claims (read as lens) are the topology to re-engage — not a fresh seed.
2. **attest** — per start-state branch above (per-source attestation files, before any prose).
3. **synthesize** — re-author the artifact over the now-current attestations.
4. **lint** — `lint-citations.py`; validates the citation chain (every `[handle]{N}` resolves to a
   source-direct attestation, no broken handles). Note it does **not** catch a lens violation — a
   handle to the prior analytical-tier artifact resolves `intra-program-resolved` (clean); the
   pre-flight exclusion is what prevents that, not the lint.
5. **verify** — adversarial-read (rigor ≥ standard) / evaluate (rigor = full) / spot-check
   (always), at the dialed rigor over the **new** substrate. The prior artifact's old verdicts do
   **not** carry forward unexamined — a refresh is a real engagement, not a diff-and-patch.

## Output: the superseding artifact

The refresh produces a new authoritative artifact with a **`supersedes` pointer** to the prior.
The prior artifact is **retained as the historical record** (consistent with ARD's reversal/refresh
distinction — refresh re-authors in place over revised substrate; the superseded version remains
reachable). The output stands on its own clean citation chain; nothing in it cites the prior
artifact as a source.
