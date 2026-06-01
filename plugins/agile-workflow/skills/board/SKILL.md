---
name: board
description: >
  Launch and open the agile-workflow interactive substrate board for a project.
  Use when the user asks to open, view, serve, inspect, or launch the .work
  board, substrate board, kanban board, dependency board, or `work-view board`.
  Requires an existing agile-workflow `.work/` substrate, a compiled
  board-capable `.work/bin/work-view` binary, and a full terminal session that
  can keep the long-running local server alive.
user-invocable: true
allowed-tools: Bash
---

# Board

Launch and open the live local board for the current project's `.work/`
substrate. The board is served by the compiled `work-view` binary and reads the
substrate directly; it does not generate a static HTML file.

This skill is for **opening the UI for the user**, not merely printing a command.
Run it in a full terminal / PTY session that stays attached while the local
server runs. Do not launch it from a short-lived noninteractive shell that exits
after the first line of output, because that kills the board server.

## Workflow

1. From the project root or a descendant directory, start the board in a full
   terminal session:

   ```bash
   .work/bin/work-view board
   ```

   Leave that terminal session running. By default, `work-view board` opens the
   browser after it binds. Do not add `--no-open` or `--print` unless the user
   asks for URL-only/headless behavior or the environment has no desktop browser.

2. Pass user-supplied arguments through to `work-view board` when present. If
   the user asks for a specific port but still wants the UI opened, keep browser
   opening enabled:

   ```bash
   .work/bin/work-view board --port 8181
   ```

   Use `--no-open` / `--print` only for explicit URL-only runs:

   ```bash
   .work/bin/work-view board --port 8181 --no-open
   ```

3. Report the printed localhost URL to the user after the server starts. The
   command binds to `127.0.0.1`, scans upward when the requested port is busy,
   then opens a browser when a desktop session is available. In headless
   sessions it prints the URL and keeps serving.

## Failure Handling

- If no `.work/CONVENTIONS.md` exists in the current directory or an ancestor,
  stop and tell the user to run `$agile-workflow:convert` first.
- If `.work/bin/work-view` is missing or does not support `board`, tell the
  user that the interactive board requires a compiled board-capable `work-view`
  binary for this project.
- For compatibility with older invocations, `plugins/agile-workflow/scripts/work-board.sh`
  is only a shim. Prefer `.work/bin/work-view board` for all new usage.
