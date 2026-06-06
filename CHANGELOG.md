# Changelog

## v0.11.1

### Merge `archived_atop` late-binding into delete-refs

- **`archived_atop` baseline** — archived bodyless stubs stamp an immutable `archived_atop` (the
  release the item was done atop) plus `git_ref`. `release-deploy` late-binds all unbound archived
  stubs into the one release summary (with an `archived_atop` column). Release gates include those
  stubs and hydrate their historical bodies from `git_ref` when needed. One merged terminal-retention convention in
  SPEC + convert (sync detects/offers it and offers the prune-to-stubs migration).

## v0.11.0

### Features
- **Delete-after-release terminal tiers.** Done items archive as bodyless ref stubs
  (frontmatter + `# Title` + `git_ref`), and `release-deploy` collapses bound items into a single
  `releases/<version>/release-<version>.md` summary and prunes their bodies — full history stays in
  git. New `terminal-tier retention: delete-refs | retain-bodies` convention (default `delete-refs`),
  seeded by `convert` so consumers pick it up. Terminal prose (zero design authority) no longer
  persists on disk to mislead future agents.

### Changed
- `review` archives a done item as a bodyless stub instead of `git mv`-ing its full body.
- `release-deploy` Phases 7-9 collapse + prune instead of per-item `git mv` into `releases/`;
  readiness spans active done items and archived stubs uniformly via `release_binding`.
- `convert` adds the terminal-retention interview question and offers to prune existing retained
  terminal bodies to stubs/summary on sync.
- Docs (SPEC, ARCHITECTURE, AGENTS) describe terminal tiers as refs; git holds the bodies.
