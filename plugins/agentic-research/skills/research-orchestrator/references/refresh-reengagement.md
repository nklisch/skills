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
```

- `input_state` is **set by the caller**, not detected: `convert` knows its artifacts are
  `legacy`; `native-refresh` knows its artifacts are `ard-native`. Inferring it risks trying to
  re-validate attestations that do not exist (see Risks on the feature).
- `completes_claims` is the `Completes:` join from the acquisition manifest — "acquired source →
  exactly these held claims to re-engage." Absent it, the refresh re-engages the whole artifact.

## The pre-flight lens check

**Before any authoring dispatch**, record the prior artifact in a **known-lens set**:

1. Add `prior_artifact_path` (and any sibling artifacts loaded as framing) to a known-lens list
   for this engagement.
2. Inject that list into **every** authoring dispatch as an explicit exclusion — "NEVER cite
   these paths as `[handle]{N}` sources; they are lens, read for framing only" — *atop* the
   verbatim lens-not-substrate guard already carried in the discipline bundle.
3. The dispatch composition is otherwise unchanged (the §5 fence: verbatim discipline bundle +
   role brief + engagement params); the known-lens exclusion is the only addition.

This is **belt-and-suspenders** with the lint backstop: `lint-citations.py` already rejects a
handle that resolves to an analytical-tier artifact (the prior artifact is analytical-tier, not a
source-direct attestation), so a violation fails the citation-chain check. The pre-flight check
catches it earlier, at author time, structurally — the lint is the safety net, not the only guard.

This check is **plugin-local orchestration**: it operationalizes the *existing* universal
lens-not-substrate rule for this engagement's specific prior artifact. It does not change the
discipline rule, so it needs no ARD-kernel change.

## Attestation start-state branch

One walk; the only difference is the starting attestation set.

- **`ard-native`** — the prior artifact carries a clean attestation set. **Re-validate** each
  existing attestation against current sources (a URL may have moved, updated, or died) and
  **extend** with attestations for any new acquisitions (`completes_claims` scopes which). Valid
  attestations are reused, not re-fetched wastefully; changed sources get fresh attestations.
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
4. **lint** — `lint-citations.py`; confirms no handle resolves to the prior artifact (backstop).
5. **verify** — adversarial-read (rigor ≥ standard) / evaluate (rigor = full) / spot-check
   (always), at the dialed rigor over the **new** substrate. The prior artifact's old verdicts do
   **not** carry forward unexamined — a refresh is a real engagement, not a diff-and-patch.

## Output: the superseding artifact

The refresh produces a new authoritative artifact with a **`supersedes` pointer** to the prior.
The prior artifact is **retained as the historical record** (consistent with ARD's reversal/refresh
distinction — refresh re-authors in place over revised substrate; the superseded version remains
reachable). The output stands on its own clean citation chain; nothing in it cites the prior
artifact as a source.
