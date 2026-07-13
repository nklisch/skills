# Advisory Review Mechanics

The detailed companion to the risk-driven invariants in
`principles/SKILL.md` Part IV. Model classes, host-to-peer pairing, and concrete
peer mechanism flags remain in [models.md](models.md).

## Review weight and scope defaults

Start from the effective `review_weight` in Part IV (`standard` when unset), then
adapt to risk. `light` narrows independent breadth, `thorough` raises
fresh-context scrutiny, and `maximum` permits multi-class multi-pass depth;
`none` skips this independent-review table without skipping implementation
verification or acceptance evidence. These are ceilings and intent, never fixed
reviewer or pass counts.

Apply the scope defaults below in both direct and autopilot design modes.
Explicit caller and project review rules override them.

| Scope and risk | Default |
|---|---|
| Small, low-risk | Skip advisory review. |
| Small or medium with material uncertainty | Optionally run one focused different-class pass. |
| Large, risky, or architectural, without prior `--only-questions` / `## Design decisions` alignment | Run one focused different-class pass when available. |
| Deep or complex | Use two different model classes across the two phases when available. |
| Completed feature or epic in a deep review lane | Use a fresh-context lens review; prefer different-class, otherwise strongest same-harness fresh context. Epic review emphasizes aggregate capability and integration. |
| Final autopilot completion | Run the required fresh-context completion path described in Part IV. |

Child stories are never advisory-review targets. Once implementation and
required verification are green, advance them directly from `implementing` to
`done` and review the feature that integrates those checkpoints. A standalone
story receives a bounded inline review because no parent feature supplies that
boundary, but it never uses an independent, fresh-context, or cross-model
reviewer. Epics receive their own deeper aggregate review after child features
are done. Review breadth should rise with scope: larger boundaries expose
integration and capability gaps that tiny checkpoint reviews miss, while
reviewing every child story encourages pedantry and over-engineering.

## Two-phase mechanics

Always run completeness before attack:

1. **Completeness / complementary / advisory.** Ask what is missing, which
   alternatives strengthen the artifact, and which questions or risks deserve
   weight. An open design gets one pass before decisions lock. A complete
   artifact can iterate until substantive findings stabilize; when a dedicated
   iterative mechanism exists, converge to nits and cap the loop at roughly five
   passes rather than chasing perfection.
2. **Adversarial.** After Phase 1, ask what is broken, contradictory, based on a
   false assumption, or likely to fail in operation. Open designs get a focused
   attack pass; completed artifacts may use the same bounded convergence shape.
   Verify concrete claims before accepting them.

The receiving/orchestrating agent owns the verdict on every returned finding.
Apply Part IV's material-risk threshold in repository context; do not inherit a
reviewer's severity label. Fix or activate only current-cycle blockers, park
valid lower-priority concerns in the unbound backlog, and reject unsupported
claims with a reason.

For deep or complex work, use a different model class for Phase 2 than Phase 1
when two classes are available. Their disagreement is evidence to investigate,
not a vote. For routine design, do not turn a focused advisory pass into a
multi-pass review loop.

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

If only one phase or class was warranted or reachable, record that fact. Limit
normal design to one advisory pass per item per design stage. The final
autopilot completion review is separate and follows the stricter completion
invariant in Part IV.
