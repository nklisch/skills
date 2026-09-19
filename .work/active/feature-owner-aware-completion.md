---
id: feature-owner-aware-completion
kind: feature
status: active
created: 2026-09-19
updated: 2026-09-19
---
# Preserve ownership and acceptance during proactive cleanup

Apply the PR #64 feedback as agreed with the user: honor project-defined ownership
and required acceptance before closing or trimming another owner's work. Keep
ownership representation in project conventions, not a new core field or registry.
Merged implementation alone does not satisfy pending human acceptance or review.

Clarify partial completion without automatic split-and-close. Splitting tracking
does not reduce the accepted commitment. Required remainder stays under an open
outcome; independently complete children may close. Only an explicitly agreed
scope change permits closing a smaller delivered outcome with the remainder
tracked separately. Record that decision and preserve the remainder's disposition.
Inactivity does not authorize deferral or silently make unmet requirements optional.
Do not close parents with unfinished children or contradict current hierarchy.

Keep lifecycle.md authoritative and reconcile affected foundation/guide assertions.
Verify instruction walkthroughs for another owner's merged-but-unaccepted work,
a three-of-four result with required remainder, and an explicitly agreed rescope.
Review the committed changes together with the Claude discovery update, then
correct and verify without another review pass. Preserve and close both work
records before final handoff; update PR #64 only, without merging or publishing.

Feedback: https://github.com/nklisch/skills/pull/64#discussion_r4053695769 and
https://github.com/nklisch/skills/pull/64#discussion_r4053695775.

## Candidate evidence

Lifecycle.md now owns the convention-ownership hook, pending-acceptance distinction,
and partial-delivery/rescope rule; SPEC and the guide agree. No core ownership field,
new status, validator policy or automatic backlog deferral was added.

Instruction walkthroughs (not observed agent runs): another owner's merged item with
pending human acceptance stays open and is reported; three-of-four with a required
fourth keeps its owner open while eligible completed children may close; an explicitly
agreed rescope records the decision and independently tracks the remainder before
closing the smaller accepted boundary. The unfinished-parent prohibition still holds.
The integrated candidate passes the shared 83-test, link/style and isolated-ledger
checks recorded in the Claude discovery item. One shared committed review is pending.
