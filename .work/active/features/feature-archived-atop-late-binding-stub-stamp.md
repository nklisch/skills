---
id: feature-archived-atop-late-binding-stub-stamp
kind: feature
stage: done
tags: [skill, tooling, docs]
parent: epic-archived-atop-late-binding
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-05
updated: 2026-06-05
---

# Stamp `archived_atop` + `git_ref` on the bodyless archive stub

## Problem

v0.11's archive stub (review skill) carries `git_ref` but not `archived_atop`. Without the baseline,
a release can't late-bind "everything done atop the prior shipped tag" — it only has
`release_binding`, which is null until claimed.

## Target

Extend the review archive step (`review/references/substrate-side-effects.md` + SPEC stub shape):
the bodyless stub frontmatter gains `archived_atop: <release | pre-release>`, computed at archival.

### `archived_atop` computation
- Latest released version = the newest git tag matching the project's release tag shape, OR the
  newest `.work/releases/<version>/` summary. If none exist yet → `pre-release` sentinel.
- Stamp once at archival; never rewrite it afterward (it's the immutable baseline).

### Stub shape (SPEC)
```
---
id: ...
kind: ...
stage: done
tags: [...]
release_binding: null
archived_atop: <release | pre-release>
git_ref: <sha>
created: ...
updated: ...
---

# <Title>
```

## Acceptance criteria
- Archiving a done item writes a stub carrying both `archived_atop` and `git_ref`.
- `archived_atop` resolves to the latest released tag, or `pre-release` when none exists, and is
  never rewritten on re-archival/idempotent reruns.
- SPEC documents the stub shape + the `archived_atop` computation so it's reproducible.

## Implementation (2026-06-05)

Extended the v0.11 bodyless-stub model (not a rewrite) across three surfaces:

- `skills/review/references/substrate-side-effects.md` — the "Archive as a bodyless stub" step now
  computes `archived_atop` (new step 2) and stamps it alongside `git_ref` in the stub frontmatter.
  Computation: latest release tag (`git describe --tags --abbrev=0`) → newest
  `.work/releases/<version>/` summary → `pre-release` sentinel. Documented stamp-once/immutable and
  "preserve existing `archived_atop` on idempotent re-archive."
- `docs/SPEC.md` — added an "Archive stub shape" subsection (frontmatter incl. `archived_atop` +
  `git_ref`) and an "`archived_atop` computation" subsection under Terminal-tier retention; updated
  the bootstrapped-project layout comment for the archive stub.
- `docs/ARCHITECTURE.md` — tier-transition table archive row now lists `archived_atop` as the
  immutable release baseline.

Judgment call: the computation prefers a git tag, falling back to the newest releases-summary dir,
then the `pre-release` sentinel — covering all release mappings (tag-based, release-branch, none).
The `xargs -r basename` form keeps it safe when no releases dir exists.
