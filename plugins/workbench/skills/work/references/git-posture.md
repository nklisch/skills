# Git Posture

Commit boundaries represent meaningful code changes, not Workbench item transitions. Resolve the effective posture from an explicit request, the optional `commit_posture` in `.work/CONVENTIONS.md`, then `adaptive`.

## Postures

- `adaptive` — infer sensible boundaries from repository practice, branch ownership, change size, review needs, and concurrent agents.
- `feature` — prefer one coherent final commit per feature when consolidation is simple and safe.
- `checkpoint` — retain finer commits at meaningful, independently verified implementation checkpoints.
- `batch` — group several closely related features or fixes at an integration boundary owned by `work`.
- `preserve` — retain natural commit history without squashing or reorganizing it.

Missing configuration means `adaptive`. A posture describes desired semantic granularity, not a required number of commits.

## Universal floor

Under every posture:

- Commit at coherent, recoverable boundaries.
- Routine item transitions do not need separate commits. Preserve never-committed
  items before completion or trimming as required below.
- Keep unrelated changes separate when practical.
- Do not rewrite shared, published, or concurrently owned history merely to achieve an ideal shape.
- Never force-push or perform an elaborate rebase without repository authority and clearly owned history.
- When clean separation is impractical, preserve safe history and explain the result.

Respect stronger Git rules in repository instructions and established contribution policy. Workbench's posture does not grant permission to commit, rewrite, push, or publish where the repository or user withholds it.

## Preserve items before trimming

Before moving an item to completed, replacing it with a summary, deleting it,
or trimming away substantive context, inspect Git history for that item (including
prior paths after moves). An untracked file, staging, or an add-and-delete inside
one uncommitted change does not preserve history.

If the item has never been committed, make an atomic commit containing its full
pre-trim record and useful owned attachments before changing or removing them.
Prefer including that snapshot in a coherent implementation commit; when no such
boundary is available, a small ledger-only preservation commit is required.
Include the outcome or cleanup disposition and useful evidence, not just an empty
placeholder. For an already-committed item, reuse existing history; preserve any
substantial uncommitted decisions or evidence that would otherwise be lost, without
requiring a new snapshot for every status edit.

Then apply retention and cleanup in a later change. Confirm the snapshot is
recoverable in retained history; do not squash an item's creation and deletion
into a result where the item never existed. This preservation floor takes
precedence over preferred feature or batch commit counts. It requires no new
receipt file, archive directory, or schema field.

Stage only owned changes and inspect the staged diff; do not absorb another
actor's work to obtain a checkpoint. If an explicit no-commit instruction, missing
Git repository, or commit failure prevents preservation, retain the affected
record, state the exact limitation and next action, and continue independent work.
Do not silently delete it or claim cleanup is complete. Never initialize Git,
rewrite shared history, or push merely to satisfy this rule.

## Stable review targets

Before a distinct review pass, identify a stable target:

- normally a coherent commit or commit range;
- a clearly bounded working-tree diff when committing would interfere with concurrent work or contradict the effective posture.

Review-fix commits may remain separate while review is active because their delta is useful evidence. They are not mandatory when another representation is clearer or safer.

After review:

- `feature` may consolidate implementation, corrections, and closure into one feature commit when the branch is exclusively owned and doing so is simple and safe;
- `checkpoint` retains meaningful checkpoint and correction commits;
- `batch` leaves consolidation to the integration owner at the agreed wider boundary; in direct `deliver` mode, keep the item's own coherent history because no wider integration owner exists;
- `preserve` leaves history alone;
- `adaptive` follows repository evidence and current ownership, preferring feature granularity for a safely owned coherent feature and preservation when history is shared or already meaningful.

Squashing is a preference, never an acceptance criterion. Final verification and Workbench closure do not depend on achieving the preferred history shape.

Treat history as exclusively owned only when it is local and unshared, or when explicit coordination confirms that no other actor, branch, or open review depends on its exact commits. Never infer exclusive ownership merely because a pushed branch appears personal.

## Orchestration

`work` supplies the effective posture to deliverers. Deliverers own only their assigned write surfaces and report the commits or diff that represent their work. Under `batch`, they must not independently reshape the wider history; the integration owner decides the final boundary. With multiple agents on one branch, default away from history rewriting unless coordination and exclusive ownership make it plainly safe.
