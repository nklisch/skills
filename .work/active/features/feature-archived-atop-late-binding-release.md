---
id: feature-archived-atop-late-binding-release
kind: feature
stage: done
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

1. **Gather**: query all unbound `.work/archive/` stubs (`release_binding: null`) — these are the
   archived items this version claims; each stub's `archived_atop` is recorded as provenance, not used
   as the gather filter. Plus any active done items with `release_binding` set, as today. Confirm the
   set with the user.
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

## Implementation (2026-06-05)

Extended `skills/release-deploy/SKILL.md` (v0.11 delete-refs flow preserved; archived_atop added):

- **Phase 3 (bind)** — split into active-done candidates (unchanged) and a new archived-stub
  late-binding step: gather all unbound `.work/archive/**/*.md` stubs (`release_binding: null`),
  confirm the combined set with the user, then set `release_binding: <version>` on each. Stub
  `archived_atop`/`git_ref` left immutable. (See Review fixes below: the gather originally filtered by
  `archived_atop == prior tag`; that stranded stubs across skipped releases, so it now claims all
  unbound stubs and records `archived_atop` as provenance only.)
- **Phase 4 (gate)** — leading rule: gates run over active bound items only; archived stubs are
  never re-gated and a pruned/missing body must never block a release.
- **Phase 5 (readiness)** — clarified archived stubs are `done` by construction; readiness checks
  `stage`, never body presence.
- **Phase 7 (collapse)** — summary table gains an `archived_atop` column (id, title, kind,
  archived_atop, git ref); active items show `—`, late-bound stubs show their baseline. git_ref and
  archived_atop resolved from stub frontmatter; active items resolve git_ref at HEAD.
- Intro "three movements" + Guardrails updated for late-binding and no-re-gate.

Judgment calls:
- `archived_atop` column value for **active done items** is `—` (they were bound directly and were
  never archived atop a prior tag). The column is the trace of which bound items arrived via the
  late-binding query.
- "Prior shipped tag" is computed the same way as F1's `archived_atop` so a stub archived atop
  release N is gathered by release N+1 (both read the same newest-tag/summary). No-re-gate is scoped
  to *archived* stubs specifically: active done items bound directly are still part of the gate
  bundle's change set.

## Review fixes (2026-06-05)

Fresh-context review found two accepted findings on this feature's surface; both fixed (item stays
`stage: done`).

- **B1 (blocker) — no-re-gate rule was inert.** release-deploy documented "gates run over active
  bound items only," but each gate self-queried `work-view --release <version> --paths` (which
  auto-widens to ALL tiers, including `.work/archive/`) and derived its change set via
  `git log --grep "$id"`, so late-bound archived stubs DID get their historical commits re-scanned.
  Fix: every gate that builds its bundle from `--release ... --paths` now pipes through
  `grep -v '\.work/archive/'`, robustly dropping archived-stub paths across both the Rust binary and
  the bash fallback (path filter, not `--scope active`, since the bash fallback ignores `--scope`).
  Wired into `gate-security`, `gate-tests`, `gate-cruft`, `gate-docs`, `gate-patterns`, and
  `bug-scan` (gate mode). release-deploy Phase 4 reconciled: gates self-filter; release-deploy
  documents that they do.
- **I2 (important) — stranded-stub leak across a skipped release.** Phase 3 gathered stubs by strict
  `archived_atop == prior shipped tag`. A stub atop N not bound at N+1 would, at N+2 (prior advanced),
  never be gathered again — permanently stranded. Fix: Phase 3 now gathers **all unbound archived
  stubs** (`release_binding: null`); `archived_atop` is recorded provenance (the summary column), not
  the gather filter. User confirmation/deselection preserved. Reconciled in release-deploy intro +
  Phase 3, SPEC.md terminal-retention + `archived_atop` computation, and convert Phase 3 item 6.
- **N3 (nit)** — gather glob made recursive: `.work/archive/*.md` → `find .work/archive -name '*.md'`
  so ROADMAP-phase epics archived to `.work/archive/epics/` are not missed.
