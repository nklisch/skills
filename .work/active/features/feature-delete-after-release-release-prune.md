---
id: feature-delete-after-release-release-prune
kind: feature
stage: review
tags: [skill, tooling, docs]
parent: epic-delete-after-release
depends_on: [feature-delete-after-release-archive-stub]
release_binding: null
gate_origin: null
created: 2026-06-05
updated: 2026-06-05
---

# release-deploy: sweep bound items into one summary, prune bodies

## Problem

`release-deploy` Phase 7-9 `git mv`s each bound item body into `.work/releases/<version>/` and moves
the release file there too — retaining every shipped body on disk.

## Target

Phase 7-9 becomes: collect every item with `release_binding: <version>` (active done items AND
archived stubs — uniform), write **one** summary doc, `git rm` the swept files. The release folder
holds exactly `release-<version>.md`.

### release-<version>.md summary

```markdown
---
id: release-0.9.6
kind: release
stage: released
release_binding: 0.9.6
created: ...
updated: ...
---

# Release 0.9.6

Shipped <date>. Mapping: none. Gates: tests/cruft/docs/patterns — <finding totals>.
Bodies live in git history (see git ref per item).

| id | title | kind | git ref |
|----|-------|------|---------|
| feature-foo | Foo thing | feature | a1b2c3d |
| story-bar | Bar fix | story | e4f5g6h |
```

- For active done items: capture `git_ref` (HEAD before prune) at sweep time.
- For archived stubs: reuse their existing `git_ref`.

## Implementation notes

- Rewrite release-deploy SKILL.md Phase 7 (archive) → sweep+summary+`git rm`; fold the Phase 8 summary
  content into the generated `release-<version>.md`; keep Phase 9 commit.
- Update the readiness condition (currently "done OR already in releases/<version>/") to "every item
  with `release_binding: <version>` is `stage: done`" — there is no per-item move anymore.
- Update the skill description/output lines that say items end "in `.work/releases/<version>/` as the
  historical record" → "represented in the one release summary; bodies in git."

## Acceptance criteria

- A release with N bound items (mix of active done + archived stubs) yields exactly one
  `release-<version>.md` with N rows; the N item files are gone from the working tree (in git).
- `git show <git_ref>` recovers each shipped body.
- release-deploy docs/output describe the single-summary outcome with no stale per-item-move claims.

## Implementation (2026-06-05)

`release-deploy/SKILL.md`: reworked the ship/archive tail and the references to it.
- Phase 7 rewritten: collect `release_binding: <version>` across both tiers (`work-view --release`),
  resolve each git ref (stub reuses `git_ref`; active uses `rev-parse HEAD`), move the release file to
  `releases/<version>/` as the single summary with a Shipped-items table, `git rm` each bound body.
- Phase 8 references the table; Phase 9 commit notes the `git rm`s are pre-staged and adds CHANGELOG.
- Description, Phase 1 (none-flow), Phase 5 readiness (dropped the "in releases/ already" clause;
  spans both tiers), Output, and the guardrail all updated — no stale per-item-`git mv` claims.
