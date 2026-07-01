---
id: story-pi-sandbox-vendor-and-repoint
kind: story
stage: implementing
tags: [security, sandbox, plugin]
parent: feature-sandbox-first-party-bwrap
depends_on: [story-pi-sandbox-enabled-gap-fix, story-pi-sandbox-buildbwrapargs, story-pi-sandbox-drop-asrt-dep, story-pi-sandbox-config-boundary-contract, story-pi-sandbox-bypass-tool-policy]
release_binding: null
gate_origin: null
created: 2026-07-01
updated: 2026-07-01
---

# Vendor into `plugins/pi-sandbox/` and verify Pi package install

## Scope

Create `plugins/pi-sandbox/` as a supported Pi-only package containing the
first-party sandbox extension and README. This is a repository deliverable; any
operator-local `~/.pi/agent/settings.json` repoint is verification/migration
work, not something committed to this repo.

## Package shape

Pi-only plugin/package:

```json
{
  "name": "@nklisch/pi-sandbox",
  "version": "0.1.0",
  "description": "First-party Linux bubblewrap sandbox for pi — hardened bash/file-tool paths with open/block network modes and tool-egress policy.",
  "author": { "name": "nklisch" },
  "repository": { "type": "git", "url": "git+https://github.com/nklisch/skills.git", "directory": "plugins/pi-sandbox" },
  "license": "MIT",
  "keywords": ["pi-package", "agent-skills", "sandbox"],
  "peerDependencies": {
    "@earendil-works/pi-coding-agent": "*",
    "typebox": "*"
  },
  "pi": { "extensions": ["./extensions"] }
}
```

No `.claude-plugin/` or `.codex-plugin/` manifests: the runtime hardening surface
is Pi-only.

## README requirements

- Install/use examples for local path and git package installs.
- Linux + `bwrap` requirement.
- Network modes: `open` and `block`; `filter` deferred.
- Hardened config guide and additive-only project config behavior.
- Security boundary / non-goals.
- Known bypass mitigation for `background`/`monitor` and follow-up item link.
- Provenance: derived from pi's MIT `examples/extensions/sandbox/`; ASRT removed;
  first-party bwrap layer is original MIT code in this repo.

## Acceptance Criteria

- [ ] `plugins/pi-sandbox/` exists with `extensions/sandbox.ts`, `package.json`,
      and `README.md`.
- [ ] Package manifest uses Pi package shape and peer dependencies for Pi core
      imports / `typebox`.
- [ ] No `.claude-plugin/` or `.codex-plugin/` directories exist under
      `plugins/pi-sandbox/`.
- [ ] `pi install /home/agent/projects/skills/plugins/pi-sandbox` loads the
      extension from the package manifest alone in a clean test context.
- [ ] Fresh Pi launch can load the vendored extension and report `🔒 Sandbox:`
      status.
- [ ] Capability tests for open/block builder, file tools, env, `/proc`, and
      bypass-tool policy pass against the vendored package.
- [ ] Optional local migration docs explain how to replace any old
      `~/.pi/agent/extensions/sandbox` path or `--no-sandbox` workaround.
