# Managed Workbench Instructions

Maintain one marked Workbench section in the canonical root `AGENTS.md`:

```markdown
<!-- workbench:start -->
## Workbench

This repository is Workbench-owned. For stateful work, read
`.work/CONVENTIONS.md`, relevant foundations, and the selected skill. Follow
required references when their conditions apply; reuse unchanged context.
Never run setup without explicit user direction. Keep unrelated requests outside
Workbench; loose designs and reviews use project calibration without ledger mechanics.

Use `work` to own a continuous outcome, drawing on `design` for consequential
choices and `deliver` for ready implementation. Use `ideate` for early exploration,
`scan` for opportunities without remediation, `park` for selected findings, and
`release` only for a requested versioned summary.

The user's request and effective autonomy define scope. Ask about consequential
requirements; do not invent them or treat repository aspirations as current work.
Use features by default and `work/references/lifecycle.md` for hierarchy and cleanup.
Keep independent items parallel; `blocked_by` needs a real dependency.
Agents maintain `.work/`: reconcile encountered stale records and close verified
finished work in the same run, without separate housekeeping approval. Preserve
unmet requirements and live ownership; commit never-recorded items atomically
before completion or trimming, then apply configured retention.

Before any design or review, apply the current `## Overbuilding calibration` from
conventions. Pass it explicitly to delegated roles. The work item carries the
contract: designers author and revise it; implementers read it directly; the
outcome owner adjudicates scope and acceptance. Reviewers propose, not decide.

`.work/` holds operational state. Foundations hold durable repository or sub-project
truth, not delivery history. Write only durable artifacts named by the workflow;
keep questions, proposals, progress, and reports in chat. Preserve user-owned
roadmaps rather than rewriting them incidentally.

Apply configured execution, review, simplification, and commit postures; unset
execution means `inline-first` under `work/references/execution-posture.md`.
Align optional design review once per run and choose coherent implementation checkpoints.
Use `work/references/review.md` for concrete Workbench reviews. Verify each unit
promptly; keep pending review visible until acceptance. Before closure, reconcile
affected foundations and indexes and complete the lifecycle sweep. Use another
context when it adds enough value or is requested; do not restart settled work.
Park valuable adjacent findings instead of silently adding them to scope.
<!-- workbench:end -->
```

Add confirmed repository-specific invariants outside or within this section as
appropriate. Keep the managed block as a compact, high-salience operating
contract. Conditional mechanics, schemas, exact review convergence, roadmap
rules, and release cleanup belong in the skills and references that own them,
not in `AGENTS.md`. Do not duplicate rules across agent-specific files.
