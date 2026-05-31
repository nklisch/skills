---
id: feature-skilltap-removal-repo
kind: story
stage: review
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
- [x] `tap.json` no longer exists.
- [x] `rg -i 'skilltap|tap\.json' AGENTS.md README.md docs/ARCHITECTURE.md docs/agile-workflow-guide.md` → no matches.
- [x] README still has a valid install section; AGENTS "Adding a skill/plugin"
      steps are renumbered and coherent.

## Implementation notes
- Deleted `tap.json` via `git rm` (history preserved in git).
- `AGENTS.md`: intro now lists two channels; removed the "Skilltap resolves
  from…" bullet; "Adding a skill" dropped the tap-entry step (7→6 steps);
  "Adding a plugin" dropped the tap.json item (4→3 places, "Verify all three
  files").
- `README.md`: removed the intro skilltap link, the "### Via Skilltap" section
  (the marketplace install block at the top already covers install), the
  "individually via skilltap" note, and the `(skilltap)` / `tap.json` lines in
  the repo-structure tree.
- `docs/ARCHITECTURE.md`: removed the `tap.json` line from the repo-layout tree
  (README is now the last entry).
- `docs/agile-workflow-guide.md`: the restart-after-install note now points at
  `/plugin install agile-workflow@nklisch-skills` instead of `skilltap install`.
- Verified: `rg -i 'skilltap|tap\.json'` over all four files returns nothing.
