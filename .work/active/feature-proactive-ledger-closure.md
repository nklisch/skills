---
id: feature-proactive-ledger-closure
kind: feature
status: active
created: 2026-09-19
updated: 2026-09-19
---
# Proactively maintain and close Workbench items

Make .work an agent-maintained tracking space: reconcile stale state, close verified
finished work promptly, and trim duplicates or superseded records without requiring
routine user approval. Preserve unmet requirements and concurrent ownership; age
alone does not establish completion or abandonment.

Before completion or removal, a never-committed item and its useful attachments
must have an atomic Git snapshot. Preserve this history through consolidation.
Honor explicit no-commit instructions by retaining the record and reporting the
specific limitation rather than silently deleting it.

Update shared lifecycle, delivery, grooming, Git guidance, managed instructions,
session reminder, and affected documentation. No schema, new cleanup service,
or repository-wide remediation campaign. Use inline implementation and one focused
implementation review; no separate design review for this instruction correction.

Acceptance: walkthroughs cover fresh uncommitted completion, already-committed
stale work, duplicates with unique requirements, unfinished and concurrently owned
items, and no-commit constraints. Shared reminder and managed block agree;
Workbench validation and existing hook/plugin tests pass. Commit this item before
trimming it. Open a PR for user review; do not bump versions, merge, or publish
until the user approves.

## Delivery evidence

Implemented shared lifecycle/Git/grooming authority, checkpoint closure and delivery
breadcrumbs, remaining-ledger prose/link cleanup, managed AGENTS instructions and
session reminder, plus aligned guide/spec/vision/README assertions. No schema or
new automation; version remains 0.24.1 pending user PR review.

Verification: all 77 Workbench script tests pass; session-hook smoke checks pass
for adopted and unadopted temporary repositories; managed instruction block matches
AGENTS.md; hook compilation, research lint, index freshness, and diff whitespace
checks pass. Direct ledger validation fails only on the pre-existing untracked
.work/bin directory. Validation of an isolated copy excluding only that directory
passes with zero warnings; original directory untouched.

Focused inline implementation review checked authority, completion acceptance,
Git preservation versus commit granularity, shared reminder parity, and recovery
from interrupted parallel delivery. Instruction walkthroughs (not live delivery
trials): fresh items require commit-before-trim; committed stale items reuse
history after checking acceptance; duplicates retain unique requirements; unmet
scope/live ownership is not discarded; no-commit requests retain the record;
parallel deliveries record results and pending acceptance and owners close at
integration checkpoints; closure searches backlog prose as well as relationships.
No additional machinery or scope changes were needed.

Remaining handoff: open the review PR, then trim this verified implementation item
in a separate commit retaining this snapshot. Do not squash away the work record.
Publishing/version bump requires subsequent user approval.
