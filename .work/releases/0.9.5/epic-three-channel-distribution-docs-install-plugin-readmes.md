---
id: epic-three-channel-distribution-docs-install-plugin-readmes
kind: story
stage: done
tags: [docs, plugin]
parent: epic-three-channel-distribution-docs-install
depends_on: [epic-three-channel-distribution-docs-install-root-guides]
release_binding: 0.9.5
gate_origin: null
created: 2026-06-01
updated: 2026-06-01
---

# Update Plugin READMEs For Three Channels

## Scope

Make supported plugin-local docs match the three-channel distribution model and
remove stale wording that treats the deprecated `workflow` plugin as a supported
new-work sibling.

## Acceptance Criteria

- [x] `plugins/agile-workflow/README.md` lists Claude Code, Codex, and Pi install
  paths and mentions Pi `/aw`.
- [x] `plugins/ux-ui-design/README.md` adds Pi install guidance and notes Pi
  consumes the same mockup skills.
- [x] `plugins/nates-toolkit/README.md` exists with Claude Code, Codex, and Pi
  install paths.
- [x] `plugins/agile-workflow/docs/VISION.md` describes `workflow` only as a
  deprecated migration source, not as a supported choice for new work.

## Notes

- Keep plugin README changes concise; detailed usage belongs in the public
  guides.

## Implementation Notes

- Added three-channel install sections and Pi `/aw` notes to the agile-workflow
  plugin README.
- Added Pi install guidance to the UX/UI plugin README and clarified that Pi
  consumes the same shared mockup skills.
- Added a new Nate's Toolkit README with all three install channels.
- Updated agile-workflow VISION so `workflow` is described only as deprecated
  compatibility/migration surface.

## Verification

- `rg -n "Claude Code|OpenAI Codex|Pi|pi install|/aw|deprecated|workflow" plugins/agile-workflow/README.md plugins/ux-ui-design/README.md plugins/nates-toolkit/README.md plugins/agile-workflow/docs/VISION.md`
- `git diff --check -- plugins/agile-workflow/README.md plugins/ux-ui-design/README.md plugins/nates-toolkit/README.md plugins/agile-workflow/docs/VISION.md .work/active/stories/epic-three-channel-distribution-docs-install-plugin-readmes.md`

## Review

- Verdict: Approve - story verified by implement; fast-lane advance.
- Notes: Plugin-local docs now cover Claude Code, Codex, and Pi, and
  agile-workflow no longer presents deprecated `workflow` as a new-work choice.
