---
description: Render .work/ as a classic kanban board in the browser
argument-hint: [--print | --serve [port] | --out <path>]
allowed-tools: Bash(bash:*)
---

Run the work-board renderer to produce an HTML kanban view of the project's
`.work/` substrate, then open it in the user's default browser.

```bash
!bash "${CLAUDE_PLUGIN_ROOT}/scripts/work-board.sh" $ARGUMENTS
```

After it runs, briefly tell the user:
- whether the board opened automatically (it does on Linux/macOS/WSL when
  `xdg-open` / `open` / `wslview` is available)
- the path to the generated HTML so they can re-open it without re-rendering
- that re-running `/agile-workflow:board` regenerates from the current
  `.work/` state

If the script exits with code 2 ("no substrate found"), the project has not
yet been bootstrapped — point the user at `/agile-workflow:convert`.

Useful flags the user may pass:

- `--print` — write the file but skip auto-opening; print the path only.
- `--serve [port]` — serve the rendered HTML over a tiny local HTTP
  server (requires `python3`). Defaults to port 8181.
- `--out <path>` — write to a specific path instead of a temp file.
