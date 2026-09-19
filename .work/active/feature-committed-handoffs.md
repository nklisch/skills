---
id: feature-committed-handoffs
kind: feature
status: active
created: 2026-09-19
updated: 2026-09-19
---
# Make committed handoffs the minimum agent Git posture

The default final repository action of a writing agent is committing its owned
changes before handoff, a planned pause, or the final report. This applies generally
to repository writes, including loose edits, design, research, setup and ledger
cleanup; it does not force otherwise unrelated work into the Workbench ledger.
Reviews target identified commits/ranges, not working-tree diffs or a moving branch.
Commit before dispatching review and commit accepted corrections and final cleanup
before handing back. Read-only reviews do not manufacture empty commits.

Commit posture remains a history-shaping preference: adaptive, feature, checkpoint,
batch or preserve may suggest safe grouping/squashing, but cannot postpone the
handoff commit or erase a work item's only snapshot. No new field, hook, receipt,
or Git automation. Respect explicit no-commit instructions, absent Git, commit
failures and overlapping ownership; disclose those exceptions rather than silently
using dirty review targets, absorbing others' changes or claiming acceptance.
Partial checkpoints preserve progress without claiming work is complete or checks
passed. No push/publication follows from the commit floor.

Update the shared Git authority and compact managed instruction, reconcile all
working-tree review exceptions, and cover isolated instruction-proposal branches
without activating proposals. Verify wording through interrupted delivery,
read-only review, shared checkout, pre-review commits, post-review correction and
closure, explicit no-commit and commit-failure cases. Follow the new floor here:
commit the verified draft before one external review of that commit; adjudicate,
verify and commit final corrections/closure before reporting. Update PR #64 only;
no version bump, merge or publishing.

## Candidate evidence

Implemented the shared Git floor, managed instruction, committed-target requirements
for design/delivery/review and handoffs, final cleanup commits, and isolated proposal
branch commits. Conventions shape history above the floor rather than postponing it.
No schema, hook, or new runtime script was added.

Before the review checkpoint: all 82 script tests pass; 201 changed-document links
and anchors, portable skill/style limits, managed-block synchronization, research
lint, knowledge-index freshness, and whitespace checks pass. Ledger validation passes
in an isolated copy excluding only the pre-existing untracked .work/bin; it remains
untouched in the working checkout. Scenario walkthroughs cover partial checkpoints,
read-only reviews, shared ownership, explicit no-commit instructions, commit failure,
post-review corrections/cleanup, batch consolidation and isolated proposals.

Next: commit this candidate and ask the existing reviewer to inspect that exact
commit range. The item remains active until findings are resolved and verified.
