---
id: feature-skilltap-removal-plugin-docs
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
- [x] `rg -i 'skilltap|tap\.json'` over the files above (excluding CHANGELOGs)
      → no matches.
- [x] ROADMAP goals still read coherently with marketplace as the channel.

## Implementation notes
- `agile-workflow/docs/VISION.md`: "distribute the same way (skilltap)" → "(the
  Claude Code and OpenAI Codex marketplaces)". Left the "stay supported" wording
  on `workflow` untouched — that's a separate deprecation drift, out of scope
  for this story (gate-docs territory).
- `agile-workflow/docs/SPEC.md`: rewrote the whole `## Distribution` section
  from per-skill `tap.json` registration to marketplace.json + dual manifests.
- `agile-workflow/docs/ROADMAP.md`: "installs via skilltap" → "via the
  marketplace"; three "`tap.json` entries for N skills" → "Plugin manifests
  covering N skills"; "publish via skilltap" → "via the marketplace"; the Phase 4
  checkpoint `skilltap install` → `/plugin install agile-workflow@nklisch-skills`.
- `agile-workflow/README.md` + `ux-ui-design/README.md`: quick-start install
  blocks switched from `skilltap install` to the marketplace commands.
- **History left intact:** `plugins/agile-workflow/CHANGELOG.md` (1) and
  `plugins/workflow/CHANGELOG.md` (3) still mention skilltap — they record past
  reality and are excluded per the design.
- Doc-only edits; agile-workflow + ux-ui-design may take patch bumps at release.

## Notes
Editing these plugin docs may warrant patch version bumps for agile-workflow and
ux-ui-design — done via `scripts/bump-version.sh` at release, not in this story.
