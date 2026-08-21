# declaudify

A Claude Code-only hook that injects a writing guide on every user turn. It
keeps responses simple and technical without making them shallow, asks the
agent to frame codebase references for the user, and treats only the visible
chat stream as shared user knowledge, without assuming the user saw private file
or tool work.

## Install

```text
/plugin marketplace add nklisch/skills
/plugin install declaudify@nklisch-skills
```

The plugin targets Claude Code's `UserPromptSubmit` hook and is not registered
in the Codex or Antigravity catalogs. Pi's bridge can discover entries from the
Claude marketplace, but Pi support is not provided or claimed for this plugin.

## Development check

```bash
python3 -m unittest discover -s plugins/declaudify/hooks/scripts -p 'test_*.py' -v
python3 -m py_compile plugins/declaudify/hooks/scripts/declaudify.py
```

## License

MIT
