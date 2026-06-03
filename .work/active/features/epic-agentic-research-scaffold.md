---
id: epic-agentic-research-scaffold
kind: feature
stage: drafting
tags: [plugin]
parent: epic-agentic-research
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-03
updated: 2026-06-03
---

# Plugin scaffold + three-channel registration

## Brief
Stand up the `agentic-research` plugin skeleton and register it across all three
distribution channels so it installs in Claude Code, Codex, and Pi. Create
`plugins/agentic-research/` with the three channel manifests
(`.claude-plugin/plugin.json`; `.codex-plugin/plugin.json` declaring
`"skills": "./skills/"` + an `interface` block; `package.json` with
`keywords: ["pi-package"]` and a `pi` manifest pointing at `./skills/`), an empty
`skills/` directory, and a plugin README. Add the `marketplace.json` entry using
the string-path `"./plugins/agentic-research"` form, and register the plugin in
the AGENTS.md plugin map (+1 row). Start the plugin at its own semver `0.1.0`,
recording "adopts ARD v0.1" per the epic's versioning design decision.

This is the dependency root: every other feature's content lives inside this
plugin directory, so it must land first. It is kept deliberately lean — package
shell + channel registration + version baseline only — so the downstream features
unblock quickly.

Does NOT cover: the skills/agents content, the `.research/` substrate definition,
the adapted foundation docs, or the `research-view` binary.

## Epic context
- Parent epic: `epic-agentic-research`
- Position in epic: foundation feature — all other features depend on it (the
  plugin dir + manifests must exist before their content can land).

## Foundation references
- `AGENTS.md` — "Adding a plugin" checklist + "Three-channel distribution support"
- `docs/VISION.md` — channel parity + lockstep-metadata success criteria
- `plugins/nates-toolkit/` — closest standalone-plugin template (three manifests + `skills/`)
- `.claude-plugin/marketplace.json` — existing entries to mirror
