---
id: story-pi-sandbox-vendor-and-repoint
kind: story
stage: implementing
tags: [security, sandbox, plugin]
parent: feature-sandbox-first-party-bwrap
depends_on: [story-pi-sandbox-enabled-gap-fix, story-pi-sandbox-buildbwrapargs, story-pi-sandbox-drop-asrt-dep]
release_binding: null
gate_origin: null
created: 2026-07-01
---

# Vendor into `plugins/pi-sandbox/` + README + repoint settings

## Scope

Capstone packaging + migration. Create `plugins/pi-sandbox/{extensions/sandbox.ts, package.json, README.md}` (Pi-only — no `.claude-plugin/`/`.codex-plugin/`, mirrors `background-tasks`). README carries hardened-config guide, the three network modes, provenance (derives from pi's MIT `examples/extensions/sandbox/`; ASRT removed → first-party bwrap layer is original code under repo MIT), and honest residual gaps. Then repoint `~/.pi/agent/settings.json`: add the vendored path to the `nklisch/skills` git-source `extensions` array; remove the local `~/.pi/agent/extensions/sandbox` path; drop the ASRT dep from the local install. Depends on stories 1, 2, 3 (the code must be re-arched before packaging).

## Unit

**Files**: `plugins/pi-sandbox/{extensions/sandbox.ts, package.json, README.md}`; `~/.pi/agent/settings.json`.

`package.json` (Pi-only):

```json
{
  "name": "@nklisch/pi-sandbox",
  "version": "0.1.0",
  "description": "First-party bubblewrap sandbox for pi — OS-level filesystem deny + network modes for bash, with in-process file-tool and tool-egress hardening.",
  "author": { "name": "nklisch" },
  "repository": { "type": "git", "url": "git+https://github.com/nklisch/skills.git", "directory": "plugins/pi-sandbox" },
  "license": "MIT",
  "keywords": ["pi-package", "agent-skills", "sandbox"],
  "pi": { "extensions": ["./extensions"] }
}
```

## Acceptance Criteria

- [ ] `plugins/pi-sandbox/` exists with `extensions/sandbox.ts`, `package.json`, `README.md`.
- [ ] No `.claude-plugin/` or `.codex-plugin/` (Pi-only).
- [ ] `~/.pi/agent/settings.json` references vendored path; local `extensions/sandbox` path removed.
- [ ] Fresh pi launch loads vendored extension (status line `🔒 Sandbox: ...`).
- [ ] All 5 capability tests (T1–T5) pass against the vendored build.
- [ ] `--no-sandbox` dropped from downstream launch docs.
