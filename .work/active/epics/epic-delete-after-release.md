---
id: epic-delete-after-release
kind: epic
stage: implementing
tags: [skill, tooling, docs]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-05
updated: 2026-06-05
---

# Delete-after-release: terminal items become bodyless refs, not retained prose

## Why

Terminal-tier item bodies (`.work/archive/`, `.work/releases/<version>/`) are retained on disk but
carry zero design authority. Agents still read them directly and absorb stale "we decided X"
rationale as if it bound the present — a real poison vector (a downstream agent cited an archived
item to reject a current design choice). Git already preserves every body. Retaining the prose on
disk buys little and costs design integrity.

## The model (locked)

1. **Done → archived (optional), as a bodyless *ref*.** The item file stays at
   `.work/archive/<id>.md` but is stripped to **frontmatter + the `# Title` line only** — body
   pruned. Frontmatter gains `git_ref:` (commit where the full body last existed). Full content is
   in git history. No rationale prose on disk = zero poison; still a first-class, queryable item.
2. **Archiving ≠ release-binding.** A fresh stub is `stage: done`, `release_binding: null`.
3. **Late-bind to a release.** Set the stub's `release_binding: <version>` — the **same** field
   active done items use. One binding mechanism for both.
4. **release-deploy** sweeps every item with `release_binding: <version>` (active done items AND
   archived stubs, uniformly) into **one** `.work/releases/<version>/release-<version>.md` summary
   (per item: id, title, git ref), `git rm`s the swept files. The release folder holds exactly that
   one doc.
5. **convert** seeds the new convention (CONVENTIONS + SPEC + rules) and, on sync, detects existing
   retained terminal bodies and **offers to prune** them to stubs/summary — syncing a repo to
   current practice.

### Stub shape

```
---
id: feature-foo
kind: feature
stage: done
tags: [skill]
parent: epic-bar
depends_on: []
release_binding: null
git_ref: a1b2c3d
created: 2026-06-01
updated: 2026-06-05
---

# Foo thing
```

Why this beats a single INDEX table: unified binding (`release_binding:` everywhere), work-view keeps
querying archived refs with no binary change, simpler uniform release sweep, fits convert's existing
`done`+archive classification, and work-view can still render an at-a-glance index from the stubs on
demand. Stubs are transient — they collapse into the release summary and are pruned at release.

## Surfaces touched

- `review` skill — archive step (`git mv` full body → strip to stub + set `git_ref`).
- `release-deploy` skill — Phase 7-9 (sweep `release_binding` → one summary, `git rm` swept files).
- `convert` skill — CONVENTIONS interview/write, detection, offer-to-prune migration.
- `docs/SPEC.md` — CONVENTIONS format, tier model, stub shape.
- `.agents/rules` tier descriptions + the canonical AGENTS section convert writes.

## Child features (riskiest first)

- **feature-delete-after-release-archive-stub** *(riskiest — design/implement first)* — defines the
  bodyless-stub contract and changes `review`'s archive step. Everything else consumes this shape.
- **feature-delete-after-release-release-prune** — release-deploy sweep (`release_binding`) → one
  summary doc + `git rm` swept files. depends_on archive-stub.
- **feature-delete-after-release-convert-sync** — SPEC/CONVENTIONS convention + convert offer-to-prune
  migration. depends_on archive-stub, release-prune.
- **feature-delete-after-release-docs-rules** — rules/AGENTS/work-view-scope docs + run the migration
  on THIS repo's own 0.9.5 + archived bodies. depends_on the other three.
