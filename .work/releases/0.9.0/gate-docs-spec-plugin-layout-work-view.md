---
id: gate-docs-spec-plugin-layout-work-view
kind: story
stage: done
tags: [documentation]
parent: null
depends_on: []
release_binding: 0.9.0
gate_origin: docs
created: 2026-05-31
updated: 2026-05-31
---

# SPEC.md "Plugin source layout" tree omits the work-view/ Rust crate tree

## Drift category
foundation-doc-assertion

## Location
- Doc: `plugins/agile-workflow/docs/SPEC.md:196-222`
- Code: `plugins/agile-workflow/work-view/crates/cli/src/board/`,
  `work-view/crates/{cli,core}/`, `work-view/dist/`

## Current doc text
The `### Plugin source layout` tree shows `skills/<skill-name>/`, `hooks/`,
`scripts/{install-work-view.sh,work-view.sh,work-board.sh}`, `CHANGELOG.md`,
`README.md` — and no `work-view/` directory.

## Reality
The plugin ships a substantial `work-view/` Cargo workspace (`crates/core`,
`crates/cli` with the `board/` module + embedded `assets/`, and
`dist/<triple>/work-view` prebuilts). The SPEC's "work-view binary" and "Version
strategy" sections already reference `work-view/crates/cli/.work-view-version`
and `work-view/dist/`, but the authoritative "Plugin source layout" tree does
not show the crate tree, so a reader treating that tree as complete would miss
where the compiled board/CLI source lives.

## Required edit
Add the `work-view/` workspace to the plugin source layout tree: a `work-view/`
node with `crates/core/`, `crates/cli/` (noting `src/board/` + embedded
`assets/` for the board host and the `.work-view-version` stamp), and
`dist/<target-triple>/work-view` prebuilts. Replace in place; no version-tagged
prose.

## Implementation notes (2026-05-31)
- Added the `work-view/` Cargo workspace to the SPEC Plugin source layout tree: `crates/core/`, `crates/cli/` (noting `src/board/` + embedded `assets/` and the `.work-view-version` stamp), and `dist/<target-triple>/work-view` prebuilts.
