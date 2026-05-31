---
id: feature-skilltap-removal-repo
kind: story
stage: implementing
tags: [plugin]
parent: feature-skilltap-removal
depends_on: []
release_binding: null
gate_origin: null
created: 2026-05-30
updated: 2026-05-30
---

# Scrub skilltap from the registry + repo instructions/docs

## Scope
Delete the skilltap registry and remove channel references from the repo's
top-level instructions and docs. Replacement install story is the marketplace
(README already carries it).

## Files
- `tap.json` — DELETE (`git rm`).
- `AGENTS.md` — intro line 3 (drop "via skilltap,"); remove the "Skilltap
  resolves from…" bullet (~line 36); "Adding a skill" step 5 (remove the
  tap.json step, renumber 5-7→); "Adding a plugin" item 3 (remove tap.json
  registration; the 4-place list becomes 3, renumber).
- `README.md` — remove "### Via Skilltap" (lines 44-53), the intro skilltap
  link (8), the "Installed individually via skilltap" note (~188), and the
  layout-tree comments mentioning skilltap/`tap.json` (253, 256). Keep the
  existing marketplace install block (10-19).
- `docs/ARCHITECTURE.md` — remove the `tap.json` entry in the repo-layout tree
  (line 24).
- `docs/agile-workflow-guide.md` — replace the `skilltap install
  nklisch/agile-workflow` example (line 770) with the marketplace install
  (`/plugin marketplace add` + `/plugin install agile-workflow@nklisch-skills`).

## Acceptance
- [ ] `tap.json` no longer exists.
- [ ] `rg -i 'skilltap|tap\.json' AGENTS.md README.md docs/ARCHITECTURE.md docs/agile-workflow-guide.md` → no matches.
- [ ] README still has a valid install section; AGENTS "Adding a skill/plugin"
      steps are renumbered and coherent.
