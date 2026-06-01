---
id: epic-three-channel-distribution-docs-install-plugin-readmes
kind: story
stage: implementing
tags: [docs, plugin]
parent: epic-three-channel-distribution-docs-install
depends_on: [epic-three-channel-distribution-docs-install-root-guides]
release_binding: null
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

- [ ] `plugins/agile-workflow/README.md` lists Claude Code, Codex, and Pi install
  paths and mentions Pi `/aw`.
- [ ] `plugins/ux-ui-design/README.md` adds Pi install guidance and notes Pi
  consumes the same mockup skills.
- [ ] `plugins/nates-toolkit/README.md` exists with Claude Code, Codex, and Pi
  install paths.
- [ ] `plugins/agile-workflow/docs/VISION.md` describes `workflow` only as a
  deprecated migration source, not as a supported choice for new work.

## Notes

- Keep plugin README changes concise; detailed usage belongs in the public
  guides.
