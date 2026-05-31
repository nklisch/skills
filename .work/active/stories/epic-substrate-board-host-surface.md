---
id: epic-substrate-board-host-surface
kind: story
stage: implementing
tags: [tooling]
parent: epic-substrate-board-host
depends_on: [epic-substrate-board-host-feed, epic-substrate-board-host-assets]
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Board host human surface and legacy retirement

Implements Unit 5 of `epic-substrate-board-host`.

## Scope

Make the interactive board available through a cross-vendor skill, remove the
legacy Claude slash command, and retire the static one-shot board generator.

## Work

- Create `plugins/agile-workflow/skills/board/SKILL.md` as the user-invocable
  cross-vendor surface for launching the live board.
- Delete `plugins/agile-workflow/commands/board.md`.
- Delete `plugins/agile-workflow/scripts/work-board.template.html`.
- Replace `plugins/agile-workflow/scripts/work-board.sh` with a thin
  compatibility shim for one release window. The shim should not generate static
  HTML; it should exec `.work/bin/work-view board` when a compiled board-capable
  binary is available, and otherwise print an actionable "compiled work-view
  required for the board" message.
- Implement browser-open behavior in the Rust board adapter: bind first, then
  try `xdg-open`, `open`, or `wslview`; headless mode prints the URL only.
- Roll README and foundation docs forward in place so they describe the live
  local board, not a one-shot generated page.

## Acceptance Criteria

- [ ] `plugins/agile-workflow/skills/board/SKILL.md` exists and launches the
      live board.
- [ ] `plugins/agile-workflow/commands/board.md` is removed.
- [ ] `work-board.template.html` is removed.
- [ ] `work-board.sh` no longer renders static HTML; it only shims or reports
      the compiled-board requirement.
- [ ] README and foundation docs describe the live local board, not a one-shot
      generated page.
- [ ] Headless use prints the URL; desktop use attempts browser open after the
      server binds.

