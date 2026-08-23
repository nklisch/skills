---
name: release
description: >
  Prepare or reconcile a versioned Workbench release summary, optionally apply project-defined
  release gates through scan, and clean completed outcome files. Use only when
  .work/CONVENTIONS.md declares owner: workbench and the user asks to bind completed outcomes to a
  version; ignore this skill for uninitialized repositories or ordinary release-note requests. Use
  completion stubs or Git history, preserve canonical directories, and never tag, publish, or
  deploy.
---

# Release Workbench Outcomes

Confirm that an upward-found `.work/CONVENTIONS.md` declares `owner: workbench`.
If it does not, ignore this skill and handle the request without Workbench; do
not offer setup. Apply
[setup's advisory version guidance](../setup/references/version-compatibility.md);
mention a useful upgrade/setup recommendation on mismatch, then continue. Read
conventions, completed stubs when present, ordinary Git history, existing
Workbench release summaries, and project delivery rules. If the user did not
name a version, ask for it.

## Resolve completed outcomes

Use verified `.work/completed/*.md` stubs as the primary outcome input when they
exist. When completed items were discarded or stubs are incomplete, use ordinary
Git history to draft the delivered outcomes. Ask only when the outcomes that
belong in this release are materially unclear.

Do not include active, blocked, unverified, or unrelated work. Before release can
succeed, every completed outcome file must contribute to the summary or already
be represented there. An ambiguous file stops cleanup rather than being silently
omitted or deleted.

If `.work/releases/<version>.md` already exists, treat an equivalent summary
with no remaining completed files as complete. If equivalent files remain and
are represented, validate and clean them without rewriting the summary. Stop
rather than overwrite conflicting release truth.

## Apply optional release gates

Read `release_gates` from conventions. Absent or empty means Workbench adds no
gates; continue with repository-defined checks and ordinary release judgment.
A non-empty list selects scan lenses, not a prescribed release process.

For each configured gate, invoke `scan` in release-bounded mode using
[its release-gate contract](../scan/references/release-gates.md): establish the
release boundary, resolve the lens from `CONVENTIONS.md`, project `scan-*`
skills, bundled references, or user clarification, verify material findings,
and present them for disposition. The scanner technique, tools, context
isolation, historical range, and severity vocabulary adapt to the concern and
project.

Only unresolved findings that materially violate the configured gate's
project-defined release expectation block summary and cleanup. Findings outside
that bar are opportunities: offer to discard, investigate, or park them without
silently expanding release scope. If a preferred scanner or tool is unavailable,
use a credible fallback and state evidence limits. Tool absence alone is not a
blocker; stop only when missing evidence prevents a responsible judgment about a
material configured expectation.

## Write and clean

Write `.work/releases/<version>.md` with the version, date, concise delivered
outcomes, item ids when recoverable, meaningful compatibility or operational
notes, and repository-defined verification. When release gates ran, name them
and briefly summarize material findings and dispositions. Do not preserve raw
scanner output, packet identities, repeated checkpoints, or a transaction audit
unless the project's own conventions explicitly require that evidence.

Prefer user-visible behavior over commit chronology. Use the plain technical
style from [../work/references/writing-style.md](../work/references/writing-style.md).
Validate the summary. After project checks and configured gates are satisfied,
remove every `.work/completed/*.md` outcome file. Preserve
`.work/completed/.gitkeep` and `.work/releases/.gitkeep`, then run the Workbench
validator again. A successful release leaves no completed outcome file behind.
Git retains detailed history; the release summary retains concise version-bound
truth.

Reply with the release path, included outcomes, configured gates and material
dispositions when applicable, verification, and cleanup result. This reply is
not another repository artifact. Do not create a Git tag, publish an artifact,
bump a project version, or deploy unless the user separately requests that
action.
