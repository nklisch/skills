# Isolated Instruction Proposals

Read only when a verified instruction finding meets the invocation's remediation
threshold. This procedure prepares reviewable changes; it never activates them.

## Establish isolation before editing

Use only the task's explicitly established Git repository and permitted write
locations. Confirm that the affected instruction sources are repository-owned
and can be represented accurately in a separate branch and checkout/worktree.
Account for relevant uncommitted content without stashing, resetting, moving,
or changing the user's active checkout. If the current source cannot be safely
represented, skip automatic rewriting and explain what needs explicit direction.

Create a new proposal branch using the project's branch naming convention and
an isolated checkout/worktree. Record its base and location for review. Confirm
that proposed destinations resolve inside that isolated checkout and that no
symlink, hard link, generated projection, or shared backing file would write
through to active instructions. A branch in the active checkout is insufficient:
editing there would apply the unreviewed instructions to the user's working files.

If Git, branch creation, a permitted isolated checkout, or accurate source
isolation is unavailable for any reason, do not rewrite instructions automatically.
Report the finding, the limitation, and that an explicit user request is needed
to pursue a different approach. Do not substitute in-place edits, a detached
checkout without a proposal branch, or changes to global instruction files.

## Prepare the proposal

Keep the original governing instructions in force. Read proposed replacements
as text to review, never as instructions controlling their own preparation.
Do not start a new agent/session rooted in the rewritten instructions before
user review; that could activate the proposal indirectly.

Limit edits to the supported finding: consolidate duplication, clarify conflicts
whose intended resolution is already established, or move conditional detail to
linked references. Preserve user intent, permissions, and necessary constraints.
If a conflict requires a user decision, explain it rather than silently choosing.
Use the repository's instruction-authoring and channel-parity conventions.

Leave the proposal as a local diff in the isolated checkout, associated with the
proposal branch; commit only if the user has already authorized local commits.
Do not automatically push, open an external review, merge, cherry-pick, install,
copy back, or otherwise apply it. A severity rating never supplies review approval.

## Return for review

Give the user the proposal branch, base, checkout location, affected files, and
a readable diff or link to it. Briefly explain the intended reduction and any
decision still needed. Identify whether the edits are committed or remain in
that checkout so the user can find the actual proposal. Keep it available for
review; do not remove an uncommitted proposal's worktree as routine cleanup.

Application is a separate, explicitly requested action after review. Until then,
the active checkout and effective instructions remain unchanged.
