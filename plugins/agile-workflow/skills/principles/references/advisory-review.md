# Advisory Review Mechanics

The detailed companion to the risk-driven invariants in
`principles/SKILL.md` Part IV. Model classes, host-to-peer pairing, and concrete
peer mechanism flags remain in [models.md](models.md).

## Review weight and scope defaults

Start from the effective `review_weight` in Part IV; when unset it is
**`standard`**. Risk and scope choose lenses and reviewer capability, but they
do not override the weight's closure policy:

| Weight | Completed feature, epic, or final-bundle policy |
|---|---|
| `none` | No independent pass; require green verification and acceptance evidence. |
| `light` | Zero or one focused pass as risk warrants; if run, adjudicate, fix, verify, and finish without re-review. |
| `standard` | Exactly one balanced fresh-context pass, then adjudicate, fix receiver-confirmed blockers, verify, and finish. This is the default. |
| `thorough` | Repeat review → adjudicate → fix → verify until a pass yields no receiver-confirmed material current-cycle blockers; park or note smaller findings. |
| `maximum` | Use the `thorough` convergence loop with complementary-then-adversarial, multi-model coverage when available. |

A deeper target changes what the pass inspects, not how many passes `standard`
gets. An epic's one standard pass is broader and more aggregate than a feature's
one standard pass. `--deep`, target size, and first-pass findings do not silently
escalate `standard`; multi-pass review requires explicit `thorough` or `maximum`.
Explicit caller and project rules still override the default.

Design-time advisory review remains risk-driven and non-blocking: small,
low-risk design can skip it; uncertainty may warrant one focused pass; deep or
complex design may use complementary and adversarial perspectives within the
caller-selected weight. Do not confuse design advice with the completed-artifact
closure policy above.

Child stories are never advisory-review targets. Once implementation and
required verification are green, advance them directly from `implementing` to
`done` and review the feature that integrates those checkpoints. A standalone
story receives a bounded inline review because no parent feature supplies that
boundary, but it never uses an independent, fresh-context, or cross-model
reviewer. Epics receive their own broader aggregate review after child features
are done.

## Pass and convergence mechanics

A **pass** evaluates one artifact snapshot. The receiving/orchestrating agent
then owns every disposition: verify proposals in repository context, fix or
activate only current-cycle blockers, park valid lower-priority concerns, and
reject unsupported claims with a reason.

For `light` and `standard`, that is the complete lifecycle: one pass at most,
then fix and verify accepted blockers and finish without commissioning another
independent pass. If a fix cannot be completed or verified, keep the item active
or blocked; do not disguise a second review as standard.

For `thorough` and `maximum`, run a real convergence loop:

1. Review the current artifact snapshot.
2. Adjudicate every proposal.
3. Fix receiver-confirmed material current-cycle blockers and verify the fixes.
4. Review the new snapshot again.
5. Stop when a pass yields no receiver-confirmed material current-cycle
   blockers.

The receiver—not the reviewer label—judges materiality from repository context.
Parked concerns, nits, and rejected proposals are already dispositioned and do
not keep the loop open. If a material blocker cannot be fixed, the item is
blocked rather than converged. When both perspectives run, completeness /
complementary review precedes adversarial attack. `maximum` should use different
model classes across those perspectives when available; disagreement is
evidence to investigate, not a vote.

## Recording the result

Summarize evidence and decisions in the item body; never paste transcripts:

```markdown
## Other agent review
- Invoked because: <risk or uncertainty>
- Phase 1 — advisory/completeness: <reviewer class and useful gaps>
- Phase 2 — adversarial: <reviewer class and failure modes>
- Fixed/active blockers: <material current-cycle risks and disposition>
- Parked: <valid lower-priority concerns and risk rationale>
- Rejected: <points and reasons with phase>
- Skipped/degraded: <phase and reason, if any>
```

If only one perspective or class was warranted or reachable, record that fact.
Limit normal design to one advisory pass per item per design stage unless the
effective weight explicitly requires more. The final autopilot completion
review is separate and follows the same weight-aware closure policy as feature
and epic review.
