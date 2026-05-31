---
id: feature-skilltap-removal-plugin-docs
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

# Scrub skilltap from plugin foundation docs + READMEs

## Scope
Rewrite skilltap channel references in the plugins' own foundation docs and
READMEs to the marketplace equivalent. Preserve intent (esp. ROADMAP goals).

## Files
- `plugins/agile-workflow/docs/VISION.md` (1), `SPEC.md` (3), `ROADMAP.md` (6) —
  rewrite install/publish references to marketplace; ROADMAP's "installs via
  skilltap" / "tap.json entries" / "publish via skilltap" goals become
  marketplace-install/publish goals.
- `plugins/agile-workflow/README.md` (2) — marketplace install.
- `plugins/ux-ui-design/README.md` (2) — marketplace install.

## Excluded (history — do NOT touch)
- `plugins/agile-workflow/CHANGELOG.md`, `plugins/workflow/CHANGELOG.md` —
  historical records; leave intact.

## Acceptance
- [ ] `rg -i 'skilltap|tap\.json'` over the files above (excluding CHANGELOGs)
      → no matches.
- [ ] ROADMAP goals still read coherently with marketplace as the channel.

## Notes
Editing these plugin docs may warrant patch version bumps for agile-workflow and
ux-ui-design — done via `scripts/bump-version.sh` at release, not in this story.
