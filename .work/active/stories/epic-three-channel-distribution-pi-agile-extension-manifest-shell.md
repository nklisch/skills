---
id: epic-three-channel-distribution-pi-agile-extension-manifest-shell
kind: story
stage: review
tags: [plugin, tooling]
parent: epic-three-channel-distribution-pi-agile-extension
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-01
updated: 2026-06-01
---

# Add Pi Extension Manifest And Command Shell

## Scope

Wire the agile-workflow Pi package to load a native extension and create the
initial `/aw` command shell. This story establishes the small, auditable
extension file and the safe helper layer that later stories extend.

## Acceptance Criteria

- [x] `plugins/agile-workflow/package.json` declares `pi.extensions` alongside
  the existing `pi.skills`.
- [x] `plugins/agile-workflow/extensions/agile-workflow.ts` registers an `/aw`
  command with concise help output.
- [x] The extension detects the nearest `.work/CONVENTIONS.md` substrate from
  `ctx.cwd` by walking upward.
- [x] Missing substrate or missing `.work/bin/work-view` returns an actionable
  message that points to `$agile-workflow:convert`.
- [x] The helper for `work-view` execution uses `pi.exec(command, args, options)`
  with an argument array, not shell string concatenation.

## Notes

- Keep the file dependency-free unless a verified Pi API requires otherwise.
- Do not implement queue subcommands here beyond enough structure for `/aw help`.

## Implementation Notes

- Added `./extensions` to the Pi package manifest.
- Created `plugins/agile-workflow/extensions/agile-workflow.ts` with a single
  `/aw` command, substrate discovery from `ctx.cwd`, no-substrate and no-binary
  fallbacks, and a centralized `runWorkView()` helper using `pi.exec()` with an
  argument array.
- Kept the first shell dependency-free; no Pi subagent package is required.

## Verification

- `python3 -m json.tool plugins/agile-workflow/package.json`
- `rg -n "registerCommand\\(\"aw\"|pi.exec|shell|CONVENTIONS.md|work-view" plugins/agile-workflow/extensions/agile-workflow.ts plugins/agile-workflow/package.json`
- `git diff --check -- plugins/agile-workflow/package.json plugins/agile-workflow/extensions/agile-workflow.ts .work/active/stories/epic-three-channel-distribution-pi-agile-extension-manifest-shell.md`
