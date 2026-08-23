---
id: feature-workbench-release-gates
kind: feature
status: blocked
tags: [plugin, release-gates]
parent: epic-workbench-scanning-and-release-gates
blocked_by: [feature-workbench-scan]
related_to: []
research_refs: []
mock_refs: []
created: 2026-08-22
updated: 2026-08-23
---

# Optional project-defined release gates

Let a project select scan lenses to apply at the Workbench release boundary without adopting a fixed release process. Gates are absent by default, their expectations belong to the project, and setup recommends them only from evidence or explicit user interest.

## Scope

- A simple `release_gates` list in `.work/CONVENTIONS.md`; absent or empty means disabled.
- Bundled, project-defined, and one-off lens definitions resolved through the shared `scan` capability.
- Release-bounded scanning, verification, and user disposition before summary cleanup.
- Only unresolved findings that materially violate a configured release expectation block completion.
- Adjacent opportunities may be offered for parking but do not silently enter release scope.
- Unavailable preferred tools degrade to another credible inspection path or an explicit evidence limitation; tool absence alone is not a blocker.

## Non-goals

No scanner registry, custom YAML grammar, mandatory packet taxonomy, historical checkpoint replay, fixed reviewer count, universal lens set, release stage machine, publishing, tagging, or deployment.

## Acceptance

- Existing release behavior remains unchanged when `release_gates` is absent or empty.
- Setup suggests a project-shaped set only when evidence warrants the conversation and records only confirmed choices.
- Custom gate meaning can live under `## Release gates` in `CONVENTIONS.md` or in reusable project `scan-*` skills.
- Release summaries briefly record which configured gates ran and the disposition of material findings without becoming audit ledgers.
