---
name: board
description: >
  Launch the agile-workflow interactive substrate board for a project. Use when
  the user asks to open, view, serve, inspect, or launch the .work board,
  substrate board, kanban board, dependency board, or `work-view board`.
  Requires an existing agile-workflow `.work/` substrate and a compiled
  board-capable `.work/bin/work-view` binary.
user-invocable: true
allowed-tools: Bash
---

# Board

Launch the live local board for the current project's `.work/` substrate.
The board is served by the compiled `work-view` binary and reads the substrate
directly; it does not generate a static HTML file.

## Workflow

1. From the project root or a descendant directory, run:

   ```bash
   .work/bin/work-view board
   ```

2. Pass user-supplied arguments through to `work-view board` when present:

   ```bash
   .work/bin/work-view board --port 8181 --no-open
   ```

3. Report the printed localhost URL to the user. The command binds to
   `127.0.0.1`, scans upward when the requested port is busy, then opens a
   browser when a desktop session is available. In headless sessions it prints
   the URL and keeps serving.

## Failure Handling

- If no `.work/CONVENTIONS.md` exists in the current directory or an ancestor,
  stop and tell the user to run `$agile-workflow:convert` first.
- If `.work/bin/work-view` is missing or does not support `board`, tell the
  user that the interactive board requires a compiled board-capable `work-view`
  binary for this project.
- For compatibility with older invocations, `plugins/agile-workflow/scripts/work-board.sh`
  is only a shim. Prefer `.work/bin/work-view board` for all new usage.
