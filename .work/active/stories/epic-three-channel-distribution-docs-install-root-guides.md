---
id: epic-three-channel-distribution-docs-install-root-guides
kind: story
stage: implementing
tags: [docs, plugin]
parent: epic-three-channel-distribution-docs-install
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-01
updated: 2026-06-01
---

# Update Root README And Public Guides

## Scope

Update the top-level user docs so Claude Code, OpenAI Codex, and Pi are equal
installation channels. Keep the workflow explanations shared; call out
harness-native conveniences only where they differ.

## Acceptance Criteria

- [ ] `README.md` install section includes Claude Code, Codex, and Pi commands.
- [ ] `docs/agile-workflow-guide.md` quick starts include three-channel install
  guidance and mention Pi `/aw` queue/autopilot conveniences.
- [ ] `docs/ux-ui-design-guide.md` install guidance includes Pi package installs
  while preserving the mockup-first workflow.
- [ ] Docs explain that shared `SKILL.md` behavior is common across all three
  channels, while Pi extensions are Pi-only executable surfaces.

## Notes

- Use npm package examples for Pi (`pi install npm:@nklisch/pi-...`) plus local
  development examples (`pi install -l ./plugins/<name>`).
