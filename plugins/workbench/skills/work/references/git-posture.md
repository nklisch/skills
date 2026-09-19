# Git Posture

A writing agent hands back committed work. This floor applies to all repository
writes, including loose edits, design, research, setup, and ledger maintenance;
it does not turn unrelated requests into tracked Workbench outcomes. Convention
postures shape history above that floor, not whether the agent commits.

Resolve the history-shaping posture from an explicit request, the optional
`commit_posture` in `.work/CONVENTIONS.md`, then `adaptive`.

## Contents

- Postures
- Commit before handing back
- Preserve items before trimming
- Stable review targets
- Consolidation and orchestration

## Postures

- `adaptive` — infer coherent boundaries from repository practice, ownership,
  change size, review needs, and concurrent agents.
- `feature` — prefer a coherent final feature history when consolidation is safe.
- `checkpoint` — retain meaningful, independently verifiable checkpoints.
- `batch` — consolidate related outcomes at the integration owner's boundary.
- `preserve` — retain natural history without squashing or reorganizing it.

Missing configuration means `adaptive`. No posture requires a particular commit
count or permits leaving owned changes uncommitted at handoff.

## Commit before handing back

Before review, delegation that consumes the changes, a planned pause/context
handoff, or the final response:

1. Finish the applicable checks and update useful continuation state. Incomplete
   work may be checkpointed, but record remaining work and failed or unrun checks
   honestly; a commit does not establish acceptance.
2. Stage only owned changes, inspect the staged diff, and commit them. Include
   relevant item state, documentation, generated indexes, corrections and cleanup,
   not just code. Never absorb another actor's edits to make the tree look clean.
3. Confirm commit success and check for remaining owned changes. The commit is
   the last content-changing repository action before handoff. Read-only checks,
   reporting, and authorized transfer of those commits may follow; if a later
   action changes files, commit that delta
   before handing back. Give the recipient the commit id or base/head range.

Routine item transitions within continuing work do not each need a commit; handoff
is the boundary. Read-only work and no-change runs create no empty commits. A
reviewer reports findings against the supplied commits and does not commit merely
to end its session. Use partial checkpoints before a foreseeable interruption,
not a promise to recover uncommitted progress later.

Explicit no-commit instructions, missing Git, a failed commit, or overlapping
ownership are concrete exceptions—not reasons to silently substitute a dirty
handoff. Preserve the files, identify the exact limitation and next action, and
continue independent work where possible. Coordinate or use authorized isolation
rather than taking over shared edits. Do not initialize Git, bypass commit hooks,
rewrite history, or claim committed completion merely to satisfy this floor.
A local commit never grants permission to push, merge, publish, or deploy.

## Preserve items before trimming

Before moving an item to completed, replacing it with a summary, deleting it,
or trimming substantive context, inspect its Git history, including prior paths.
Staging or an add-and-delete inside one uncommitted change preserves no history.

A never-committed item needs an atomic commit containing its full pre-trim record
and useful owned attachments before changing or removing them. Prefer including
that snapshot in a coherent implementation commit; otherwise make a preservation
commit. Include the outcome or disposition and useful evidence, not an empty
placeholder. Reuse existing committed history for recorded items; preserve
substantial new decisions or evidence that would otherwise be lost without
snapshotting every status edit.

Apply retention and cleanup in a later change and commit it before handing back.
Keep the snapshot recoverable: do not squash creation and deletion into a history
where the item never existed. This floor overrides preferred feature/batch counts
and needs no receipt, archive directory, or schema field. If preservation is
prevented by an exception above, retain the record and disclose incomplete cleanup.

## Stable review targets

A distinct design or implementation review uses an identified commit or base/head
range. Commit the candidate before dispatch; reviewers inspect that snapshot and
its diff, not a moving branch, index, or working tree. Give them the item and
attachment versions belonging to the same target. Scope-bound review findings
must cite that committed state; local uncommitted changes are not review evidence.

If a candidate cannot be committed, disclose the exception and resolve authority
or ownership before claiming its review obligation satisfied. Do not silently
fall back to a working-tree review. An explicit request to inspect uncommitted
work may still receive advisory feedback, clearly labeled as such rather than
acceptance of a committed candidate.

Commit accepted corrections after affected verification, then self-check them.
New commits do not themselves authorize another distinct review pass; the review
policy still owns that budget. Close and commit remaining ledger cleanup before
reporting completion.

## Consolidation and orchestration

Conventions may suggest grouping or squashing above this floor. `feature` and
`batch` can consolidate at a safely owned boundary; `checkpoint` and `preserve`
retain meaningful natural history; `adaptive` follows repository evidence.
Squashing is optional, never an acceptance criterion, and cannot erase required
item snapshots. Workers commit their own handoffs even under `batch`; the
integration owner—not each worker—decides any later consolidation.

Never rewrite shared, published, or concurrently owned history for an ideal
shape. Exclusive ownership requires local unshared history or explicit
coordination, not merely a personal-looking branch name. Do not force-push or
perform an elaborate rebase without repository authority. Preserve safe history
when clean separation is impractical and explain the result.
