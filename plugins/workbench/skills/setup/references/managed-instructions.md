# Managed Workbench Instructions

Maintain one marked Workbench section in the canonical root `AGENTS.md`:

```markdown
<!-- workbench:start -->
## Workbench

This repository is Workbench-owned. For stateful Workbench work, read
`.work/CONVENTIONS.md`, relevant foundation documents, and the selected skill
before acting. Follow that skill's required references.
Never run setup without explicit user direction. Keep unrelated requests
outside Workbench.

Use `work` to own a continuous outcome, drawing on `design` for consequential
choices and `deliver` for ready implementation without restarting the workflow.
Reuse unchanged context. Use `ideate` for valuable early exploration, `scan` for
opportunities without remediation, `park` for selected out-of-scope findings,
and `release` only for a requested versioned summary.

The user's request and effective autonomy posture define the authorized
boundary. Ask about consequential requirements; do not invent requirements,
expand scope, or treat repository aspirations as current work. Use features as
the normal delivery unit; follow `work/references/lifecycle.md` for hierarchy and
splitting. Keep independent items parallel; `blocked_by` needs a real dependency.
Completion cleanup is mandatory: summarize or discard per conventions, remove
completed active files and attachments; see the same lifecycle reference.

Before any design or review, including a loose request, apply the current
`## Overbuilding calibration` from `.work/CONVENTIONS.md`. Loose work gets the
lens without other Workbench mechanics. Pass it to delegated roles rather than
assuming fresh context inherited it.

The work item is the contract between design, review, and implementation. The
assigned designer authors and revises its design directly. The outcome owner
adjudicates scope and acceptance. Implementers read the recorded contract, not
an orchestrator's reconstruction. Optional linked design attachments belong to
the item and are always deleted when it completes, even if a summary is kept.

`.work/` is the operational record; foundation documents describe durable
project truth, including the engineering shape contributors need to build and
operate the repository coherently. Only write durable artifacts named by the
active workflow. Questions, proposals, progress, recommendations, and
completion reports belong in chat. Keep human-facing documents clean and
self-contained: lead with
business or real-world meaning, define important non-obvious domain concepts
before using them, and omit agent history or review narration.

Apply configured execution, review, simplification, and commit postures.
Align optional design review once per run. Choose adaptive implementation review
boundaries, including shared reviews across features or deliveries. Verify each
unit promptly and keep deferred review visible until the owning items can close.
Scale effort to the work. Quick implementation and focused review often benefit
from the current context; use another when it adds enough value or is requested.
Test meaningful behavior at stable
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
