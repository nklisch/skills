# background-tasks

Pi-native tools for running long commands without blocking the session, polling
commands until a condition holds, and inspecting or cancelling background jobs.

## Install

```bash
pi install npm:@nklisch/pi-background-tasks

# Local checkout/development install
pi install -l ./plugins/background-tasks
```

This is a Pi-only package. It provides the runtime extension and the portable
`background-tasks` skill; it has no Claude Code or Codex plugin surface.

## License

MIT
