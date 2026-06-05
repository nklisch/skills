---
id: feature-archived-atop-late-binding-release
kind: feature
stage: drafting
tags: [skill, tooling, docs]
parent: epic-archived-atop-late-binding
depends_on: [feature-archived-atop-late-binding-stub-stamp]
release_binding: null
gate_origin: null
created: 2026-06-05
updated: 2026-06-05
---

# release-deploy: late-bind archived stubs via `archived_atop`

## Problem

v0.11 release-deploy binds only items already carrying `release_binding: <version>`. It has no step
to pull in archived stubs that were done *atop* the prior release — the consumer's late-binding
behavior. And re-running gates over already-done archived work is wrong (they passed when active).

## Target

Add an `archived_atop`-driven late-binding step to release-deploy's bind phase:

1. **Gather**: query `.work/archive/` stubs whose `archived_atop` is the prior shipped tag (or
   `pre-release` for the first release) — these are the archived items this version claims. Plus any
   active done items with `release_binding` set, as today. Confirm the set with the user.
2. **Bind**: set `release_binding: <version>` on the gathered stubs.
3. **No re-gate of done**: archived stubs are already `done` and were gated when active — the gate
   phase does NOT re-analyze their (pruned) bodies. Gates run over active bound items only. Document
   this explicitly so a missing body never blocks a release.
4. **Summary**: the one `release-<version>.md` table gains an `archived_atop` column
   (id, title, kind, archived_atop, git_ref). Stubs are `git rm`'d into the summary like other bound
   items.

## Acceptance criteria
- A release pulls in archived stubs by `archived_atop` (prior tag / `pre-release`), with user
  confirmation, and binds them.
- Gates do not fail or re-run on already-done archived stubs lacking bodies.
- The release summary records each bound item's `archived_atop` + `git_ref`; bodies recoverable from
  git.
- release-deploy docs describe the late-binding query + the no-re-gate-of-done rule.
