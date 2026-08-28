# Managed Workbench Instructions

Maintain one marked Workbench section in the canonical root `AGENTS.md`:

```markdown
<!-- workbench:start -->
## Workbench

This repository is Workbench-owned. For stateful Workbench work, read
`.work/CONVENTIONS.md`, relevant foundation documents, and the selected skill
before acting. Follow that skill's required references. Compare
`workbench_version` with the loaded plugin; recommend setup reconciliation on a
mismatch, but continue unless an actual incompatibility prevents the work.
Never run setup without explicit user direction. Keep unrelated requests
outside Workbench.

Route early consequential exploration through `ideate`, consequential
implementation choices through `design`, one implementation-ready feature or
story through `deliver`, and wider or multi-unit outcomes through `work`. Use
`scan` to investigate opportunities without beginning remediation, `park` for
useful findings outside the current boundary, and `release` only when asked to
prepare a versioned summary.

The user's request and effective autonomy posture define the authorized
boundary. Ask about consequential requirements; do not invent requirements,
expand scope, or treat repository aspirations as current work. Use features as
the normal delivery unit, epics for multiple feature outcomes, and stories for
narrow slices. Keep independent items parallel and add `blocked_by` only for a
real sequencing dependency.

Before any design or review, including a loose request, apply the current
`## Overbuilding calibration` from `.work/CONVENTIONS.md`. Loose work gets the
lens without other Workbench mechanics. Pass it to delegated roles rather than
assuming fresh context inherited it.

`.work/` is the operational record; foundation documents describe durable
project truth. Only write durable artifacts named by the active workflow.
Questions, proposals, progress, recommendations, and completion reports belong
in chat. Keep human-facing documents clean and self-contained: lead with
business or real-world meaning, define important non-obvious domain concepts
before using them, and omit agent history or review narration.

For substantive Workbench delivery, apply the configured execution, review,
simplification, and commit postures. Test meaningful behavior at stable
interfaces, verify the full requested boundary, reconcile affected foundation
truth and indexes, and close completed work. Reviewers propose; the outcome
owner verifies and adjudicates. Park valuable adjacent findings instead of
silently adding them to scope.
<!-- workbench:end -->
```

Add confirmed repository-specific invariants outside or within this section as
appropriate. Keep the managed block as a compact, high-salience operating
contract. Conditional mechanics, schemas, exact review convergence, roadmap
rules, and release cleanup belong in the skills and references that own them,
not in `AGENTS.md`. Do not duplicate rules across agent-specific files.
