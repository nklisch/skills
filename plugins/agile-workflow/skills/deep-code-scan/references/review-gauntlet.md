# The Review Gauntlet — multi-round adversarial culling before any fix ships

Auto-generated scan findings have three characteristic failure modes, and **all three produce
"fixes" that are worse than leaving the code alone**:

1. **False positives** — the finding isn't real. A misread, a theoretical case that can't occur, or
   something already handled elsewhere.
2. **Context-ignorant fixes** — the finding is locally real but the proposed remediation ignores the
   broader system: it breaks an invariant a caller relies on, duplicates an existing abstraction, or
   "fixes" a symptom whose cause lives elsewhere.
3. **Goal-fighting fixes** — the worst kind. The "fix" undoes a *deliberate* design choice. It
   swaps the repo's hand-rolled, dependency-free parser for a library the project intentionally
   avoids; it adds `thiserror` to a codebase whose convention is hand-written `Display`; it
   "hardens" a fail-open probe that is fail-open *on purpose*. These regress the project while
   looking like diligence.

The gauntlet exists to kill all three **before findings become fix items, and again on the drafted
fix epic**. It is iterative on purpose — one pass rationalizes; several passes in fresh context
converge on what's actually true.

## The three lenses (every round applies all of them at `rigor ≥ standard`)

- **Reality** — *Is this a real problem that can actually occur here?* Re-read the cited code in
  context. Reject theoretical-only, defensive-only-with-no-trigger, and already-mitigated findings.
- **Context** — *Does the fix respect the broader system?* Check the finding's `fix locality`
  against callers, invariants, and existing abstractions. A `local` fix that violates a `module`- or
  `cross-cutting`-level contract is rejected or escalated to the right altitude.
- **Intent** — *Does the finding or its fix fight the repo's actual goals?* Cross-check against the
  project's stated intent and deliberate choices:
  - `docs/VISION.md`, `docs/SPEC.md`, `docs/ARCHITECTURE.md` (or the project's foundation docs)
  - `.work/CONVENTIONS.md` (tag taxonomy, design conventions)
  - `.agents/skills/patterns/` and `.agents/rules/` — **documented deliberate patterns are not
    findings**; a finding that contradicts a catalogued pattern is rejected unless it shows the
    pattern itself is being misapplied.
  - In-code comments that explain *why* (an explicit "intentionally fail-open" / "no deps by
    design" comment is binding intent, not an oversight).

  A finding that survives Reality and Context but fails Intent is **dropped with a note**, not
  emitted — and the note feeds back so future scanners learn the boundary.

## The loop

Run rounds until convergence or the rigor cap. **Independence is everything** — each round must be
genuinely fresh, or it just agrees with itself.

1. **Round 1 — cross-model cull.** Hand the full finding set (with evidence + the project intent
   sources above) to an independent reviewer, per agile-workflow's **advisory-review policy**: when a
   *different* model class is available, use `peeragent` (pre-approved for cross-review); otherwise
   fall back to a fresh-context same-harness sub-agent. The cross-model path is preferred but
   **optional** — the gauntlet degrades to fresh-context review, never skips. Either way the reviewer
   scores every finding `keep | revise | drop` on all three lenses, with a one-line reason each, and
   the ledger (below) is written regardless of which path ran.
2. **Apply.** Drop the rejects. Revise the salvageable (often: re-scope the fix to the right
   altitude, or soften "replace X" to "the real issue is Y"). Record every drop + reason in the
   campaign ledger — dropped findings are evidence the gauntlet worked, not waste.
3. **Round 2 — fresh-context re-review of survivors.** A *new* reviewer (different model again where
   possible, no memory of round 1) reviews only the survivors. Does it still agree? New objections?
   New drops/revisions restart the convergence check.
4. **Repeat** until a round produces **no new drops or revisions** (converged) or the cap is hit:
   - `rigor: floor` → 1 combined pass (Reality lens minimum).
   - `rigor: standard` → ≥ 2 rounds, all three lenses, cross-model.
   - `rigor: full` → rounds until convergence, cap 4, all three lenses, cross-model, fresh context
     each round.
5. **Persistent dissent → advisory, not forced.** A finding that keeps drawing objections across
   rounds without resolving does **not** get forced into the fix epic. Demote it to an advisory note
   on the scan epic ("flagged but contested — needs human judgment") so a person decides, rather
   than shipping a fix the reviewers couldn't agree was correct.

## Two gates, same gauntlet

- **Gate 1 — pre-consolidation** (end of Phase 4 / start of Phase 5): the raw finding set runs the
  gauntlet so consolidation clusters only survivors.
- **Gate 2 — the drafted fix epic** (end of Phase 5, before emission): the *clustered plan* runs one
  more gauntlet pass. Reviewers need a concrete artifact, so consolidation first persists a
  **fix-epic draft packet** at `.work/scan-artifacts/scan-<goal>/fix-draft.md` — hand that path to
  the reviewer. Clustering can introduce new context/intent problems (a feature that bundles three
  findings may, as written, fight a goal none of the three did alone). The fix epic is materialized
  into real `.work/` items **only after the packet passes**. After the durable `.work/` items and
  campaign record are written, the artifact root is deleted.

### Gate 2 verdict schema (per cluster)

Gate 2 reviews *clusters*, not raw findings, so it gets a verdict vocabulary to match. For each
proposed fix feature the reviewer returns one of:

- **keep** — cluster and its sequencing are sound.
- **revise** — keep the cluster, but the body/scope/Intent-constraints need the listed edits.
- **split** — the cluster bundles findings that don't share a remedy; break it into the named
  sub-clusters.
- **drop** — the cluster shouldn't be fix work at all (its findings failed re-review on Reality/Intent
  at the plan level; demote to advisory).

Each verdict carries its lens reason(s) and, for `revise`/`split`, the **required edits**.
**Convergence = a pass where no cluster needs `revise`/`split`/`drop`** (all `keep`), or the rigor
cap. Apply the edits to the packet between rounds; the packet — not your memory — is the artifact
that converges.

## What lands in the ledger

For auditability, the scan epic body records, per round: how many findings entered, how many were
dropped and why (by lens), how many revised, and the convergence outcome. The point of the gauntlet
is partly the surviving fixes and partly the **documented reasons** the rejected ones didn't make
it — that record is what keeps the next campaign (and the human reading it) from re-litigating the
same non-issues.
