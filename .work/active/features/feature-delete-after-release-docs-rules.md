---
id: feature-delete-after-release-docs-rules
kind: feature
stage: done
tags: [docs, skill, tooling]
parent: epic-delete-after-release
depends_on: [feature-delete-after-release-archive-stub, feature-delete-after-release-release-prune, feature-delete-after-release-convert-sync]
release_binding: null
gate_origin: null
created: 2026-06-05
updated: 2026-06-05
---

# Docs, rules, work-view scope semantics + migrate this repo

## Problem

Several docs/rules describe terminal tiers as retained on-disk bodies, and this repo's own
`.work/releases/0.9.5/` + ~10 archived bodies are still in the old shape. Stale once the paradigm
lands.

## Target

1. **Canonical AGENTS section + `.agents/rules`** (substrate-navigation tier descriptions): archive =
   bodyless stubs; releases = one summary doc; bodies live in git. The "zero design authority"
   guidance shrinks to "terminal items are bodyless refs — read git for history."
2. **work-view scope semantics**: document that `--scope archive` lists stubs (titles only) and
   `--scope releases` lists summary docs; full bodies are git-only. No binary change.
3. **docs/SPEC.md** tier model: reflect the stub + one-summary model (coordinate with convert-sync
   which owns the CONVENTIONS-format portion).
4. **Migrate this repo**: run the convert-sync prune on `.work/releases/0.9.5/` (→ one
   `release-0.9.5.md` summary) and the ~10 archived bodies (→ stubs). Dogfood the paradigm.

## Implementation notes

- Touch: the substrate-navigation rule text convert seeds, the canonical AGENTS section, work-view
  README/`--help` prose if it describes terminal scopes, `docs/SPEC.md`.
- Migration is the last step (after F1-F3 land) so the tools doing it already behave correctly.
- Verify `work-view --scope all/archive/releases` still runs cleanly post-migration (it will — stubs
  and summaries are valid items).

## Acceptance criteria

- No doc/rule asserts terminal tiers retain full bodies.
- This repo's `releases/0.9.5/` is one summary doc; archived items are bodyless stubs.
- `work-view` runs cleanly across all scopes post-migration; gates (docs/cruft) pass.

## Implementation (2026-06-05)

- Docs: updated the `--scope all` bullet in the canonical AGENTS section (`convert` Phase 6) and this
  repo's `AGENTS.md` mirror — terminal tiers now described as `releases/` (one summary) + `archive/`
  (bodyless stubs), full bodies in git. work-view `dist/README.md` had no scope prose to change.
- Self-migration (`/tmp/migrate_terminal.py`, one-time): 10 `.work/archive/` bodies → bodyless stubs
  (+ per-file `git_ref` = last-touching commit, squash-safe); `releases/0.9.5/` 52 item bodies →
  collapsed into `release-0.9.5.md` Shipped-items table, then `git rm`. `releases/0.9.5/` now holds
  only the summary. `work-view --scope all/archive` parse cleanly (103 / 10).
