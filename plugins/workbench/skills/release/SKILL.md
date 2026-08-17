---
name: release
description: >
  Prepare a versioned Workbench release summary from completed outcome stubs. Use only when
  .work/CONVENTIONS.md declares owner: workbench and the user asks to bind its completed outcomes to
  a version; ignore this skill for uninitialized repositories or ordinary release-note requests.
  Verify eligible outcomes, write one summary under .work/releases, remove the selected completion
  stubs, and run repository-defined checks. This skill does not tag, publish, or deploy.
---

# Release Workbench Outcomes

Confirm that an upward-found `.work/CONVENTIONS.md` declares `owner: workbench`.
If it does not, ignore this skill and handle the request without Workbench; do
not offer setup. When Workbench is active, require `completed_items: summarize`.
If it is `discard`, explain the applicable convention change and do not write a
release.
Otherwise, read the selected completion stubs in `.work/completed/`, existing
release history, and project delivery conventions.

If the user did not name a version, ask for it before writing. Resolve the
eligible outcome set. Do not include active, blocked, unverified, or unrelated
work. Verify that every selected stub reflects an actual delivered outcome.

Write `.work/releases/<version>.md` with the date, concise outcome summary,
selected item ids, meaningful compatibility or operational notes, and
repository-defined verification. Prefer user-visible behavior over commit
chronology. Write the summary in the plain technical style of
[../work/references/writing-style.md](../work/references/writing-style.md).

Remove the selected individual completion stubs after the release summary is
validated. Run the Workbench validator and project-defined release checks, then
reply in the current conversation with the release path, included outcomes,
verification, and any excluded items. This reply is separate from the durable
release summary and is not another repository artifact. Do not create a Git tag,
publish an artifact, or deploy unless the user separately requests that action.
