---
id: feature-delete-after-release-archive-stub
kind: feature
stage: review
tags: [skill, tooling, docs]
parent: epic-delete-after-release
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-05
updated: 2026-06-05
---

# Archive a done item as a bodyless ref stub

## Problem

The `review` skill archives a done item by `git mv`-ing its full body to `.work/archive/<id>.md`
(`review/references/substrate-side-effects.md:32,79`). The body — including rationale and "Design
decisions" — stays on disk with zero design authority but full readability.

## Target

Archiving strips the body and keeps a bodyless stub at `.work/archive/<id>.md`: frontmatter +
the `# Title` line only, with a new `git_ref:` pointing at the commit where the full body lives.
The stub stays a first-class, work-view-queryable item.

### Stub contract

- Keep all structural frontmatter: `id, kind, stage (done), tags, parent, depends_on,
  release_binding, created, updated`.
- Add `git_ref: <sha>` = `git rev-parse HEAD` captured BEFORE the prune commit (so the full body is
  present at that ref). Document this semantics in SPEC.
- Keep exactly the first `# <Title>` line; drop everything after it.
- `release_binding` stays whatever it was (normally `null`; late-binding sets it later).

## Implementation notes

- Edit `review/references/substrate-side-effects.md` (and any review SKILL.md archive step): replace
  `git mv ... .work/archive/` with: capture `git_ref`, rewrite the file in place to the stub shape,
  `git add`. The file path may stay in active or move to `.work/archive/<id>.md` — move it (archive
  tier is the location signal work-view uses), but as a stub, not a full body.
- Deterministic: no reordering; preserve frontmatter field order.

## Acceptance criteria

- Reviewing a non-release-bound item to done leaves a bodyless stub in `.work/archive/` (frontmatter
  + title only), and the full body is recoverable from `git show <git_ref>`.
- `work-view --scope archive` still lists the stub with correct id/kind/tags/title.
- `review` docs describe the stub archive step with no stale full-body `git mv` claim.

## Implementation (2026-06-05)

`review/references/substrate-side-effects.md`: rewrote the archive flow.
- "Decide And Advance" step 3 now archives as a bodyless stub (no `git mv` of the body).
- Added an "Archive as a bodyless stub" section: capture `git_ref` before the commit, write
  `.work/archive/<id>.md` as frontmatter (+ `git_ref:`) + `# Title` only, recover via
  `git show <git_ref>:.work/active/<kind>s/<id>.md`.
- Commit section reworded ("archived as a bodyless stub").

Prose-driven (matches plugin style); no shipped body-stripping script — the lesson from the
mutation-audit awk was to avoid fragile generated parsers. Stub shape is the contract release-prune
and convert-sync consume.
