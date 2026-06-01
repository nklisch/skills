---
id: epic-three-channel-distribution-docs-install-root-guides
kind: story
stage: done
tags: [docs, plugin]
parent: epic-three-channel-distribution-docs-install
depends_on: []
release_binding: 0.9.5
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

- [x] `README.md` install section includes Claude Code, Codex, and Pi commands.
- [x] `docs/agile-workflow-guide.md` quick starts include three-channel install
  guidance and mention Pi `/aw` queue/autopilot conveniences.
- [x] `docs/ux-ui-design-guide.md` install guidance includes Pi package installs
  while preserving the mockup-first workflow.
- [x] Docs explain that shared `SKILL.md` behavior is common across all three
  channels, while Pi extensions are Pi-only executable surfaces.

## Notes

- Use npm package examples for Pi (`pi install npm:@nklisch/pi-...`) plus local
  development examples (`pi install -l ./plugins/<name>`).

## Implementation Notes

- Replaced the root README's Claude-only install block with parallel Claude
  Code, Codex, and Pi install sections.
- Added an agile-workflow guide install block for all three channels and
  documented Pi `/aw status`, `/aw ready`, and `/aw autopilot` shortcuts.
- Added Pi install commands to the UX/UI guide without changing the mockup-first
  workflow.
- Called out that Pi packages can load executable extensions while shared
  SKILL.md behavior remains portable.

## Verification

- `rg -n "Claude Code|OpenAI Codex|Pi|pi install|/aw status|/aw autopilot" README.md docs/agile-workflow-guide.md docs/ux-ui-design-guide.md`
- `git diff --check -- README.md docs/agile-workflow-guide.md docs/ux-ui-design-guide.md .work/active/stories/epic-three-channel-distribution-docs-install-root-guides.md`

## Review

- Verdict: Approve - story verified by implement; fast-lane advance.
- Notes: Public guides now show all three install channels and Pi `/aw`
  convenience commands without changing the shared workflow descriptions.
