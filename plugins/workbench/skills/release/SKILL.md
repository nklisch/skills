---
name: release
description: >
  Prepare or reconcile a versioned Workbench release summary and clean completed outcome files. Use
  only when .work/CONVENTIONS.md declares owner: workbench and the user asks to bind completed
  outcomes to a version; ignore this skill for uninitialized repositories or ordinary release-note
  requests. Use completion stubs or Git history, remove every completed outcome file after success,
  preserve canonical directories, and never tag, publish, or deploy.
---

# Release Workbench Outcomes

Confirm that an upward-found `.work/CONVENTIONS.md` declares `owner: workbench`.
If it does not, ignore this skill and handle the request without Workbench; do
not offer setup. Apply
[setup's version check](../setup/references/version-compatibility.md) and stop on
mismatch.

Release works with either `completed_items` posture. Read conventions, completed
stubs when present, ordinary Git history, existing Workbench release summaries,
and project delivery rules. If the user did not name a version, ask for it.

## Resolve completed outcomes

Use verified `.work/completed/*.md` stubs as the primary outcome input when they
exist. When completed items were discarded or stubs are incomplete, use ordinary
Git history to draft the delivered outcomes. Ask the user only when the outcomes
that belong in this release are materially unclear.

Do not include active, blocked, unverified, or unrelated work. Before the release
can succeed, every completed outcome file must contribute to the summary or
already be represented there. An ambiguous file stops the release rather than
being silently omitted or deleted.

If `.work/releases/<version>.md` already exists, treat an equivalent summary
with no remaining completed files as already complete. If equivalent files
remain and are represented, validate and clean them without rewriting the
summary. Stop rather than overwrite conflicting content.

## Write and clean

Write `.work/releases/<version>.md` with the version, date, concise delivered
outcomes, item ids when recoverable, meaningful compatibility or operational
notes, and repository-defined verification. Prefer user-visible behavior over
commit chronology. Use the plain technical style from
[../work/references/writing-style.md](../work/references/writing-style.md).

Run repository-defined release checks and validate the summary. After they pass,
remove every `.work/completed/*.md` outcome file. Preserve
`.work/completed/.gitkeep` and `.work/releases/.gitkeep`, then run the Workbench
validator again. A successful release leaves no completed outcome file behind.
Git retains detailed history; the release summary retains the concise
version-bound record.

Reply in the current conversation with the release path, included outcomes,
verification, and cleanup result. This reply is not another repository artifact.
Do not create a Git tag, publish an artifact, bump a project version, or deploy
unless the user separately requests that action.
