# Skills Repo

This repo contains agent skills distributed via skilltap, the Claude Code plugin marketplace, and the OpenAI Codex plugin marketplace. Skills are defined as tap entries in `tap.json` and stored in plugin skill directories or `.agents/skills/<skill-name>/`.

## Important

- Workflow plugin skills live in `plugins/workflow/skills/<skill-name>/`.
- Skill authoring plugin skills live in `plugins/skill-authoring/skills/<skill-name>/`.
- Reference and principle skills live in `.agents/skills/<skill-name>/`.
- Skilltap resolves from `plugins/*/skills/`, `.agents/skills/`, and `skills/`.

## Dual marketplace support (Claude Code + Codex)

Each plugin ships **two parallel manifests**, kept in lockstep:

- `plugins/<name>/.claude-plugin/plugin.json` — for Claude Code (`/plugin install`).
- `plugins/<name>/.codex-plugin/plugin.json` — for OpenAI Codex CLI (`codex plugin marketplace add`).

The root `.claude-plugin/marketplace.json` uses the explicit-source-object shape (`source: { source: "local", path: "..." }`) plus `policy` + `category`. Codex officially reads this file as an alternative marketplace location, so both ecosystems install from the same git tree.

**Cross-vendor surface (works in both):** SKILL.md files (open Agent Skills standard at agentskills.io), `skills/` directory, marketplace.json entries.

**Claude-only surface (intentionally not exposed in Codex):**
- `commands/<name>.md` — Codex plugin manifest has no `commands` field.
- `hooks/hooks.json` referencing `${CLAUDE_PLUGIN_ROOT}` — variable is Claude-specific. Hooks could be added to the Codex manifest once a portable plugin-root variable is verified.
- `agents/<name>.md` (subagent definitions) — Codex plugin manifest has no `agents` field.

These work as before in Claude Code. Codex users get the skills only — that's the bulk of each plugin's value.

For full background on the Codex format, see `docs/research/codex-plugin-format.md` and the auto-loading `.agents/skills/codex-plugin-format/` reference skill.

## Versioning

Each plugin has matching `version` fields in both `plugin.json` manifests. `bump-version.sh` bumps both at once and refuses to run if they're out of sync.

**Commit your feature changes BEFORE bumping.** `bump-version.sh` auto-commits and pushes the version bump on its own — if you run it with pending changes in the plugin dir, the published bump commit won't contain them. The script refuses to run if `plugins/<plugin>/` has uncommitted changes.

Bump versions with `./scripts/bump-version.sh <plugin> <major|minor|patch>`:
- **patch** — new skill, bug fix, or minor update to an existing skill
- **minor** — significant new capability or breaking change to a skill's workflow
- **major** — plugin restructure or backwards-incompatible changes

When adding or modifying a skill, bump the version of the plugin it belongs to.

## Adding a skill

1. Create the skill directory under the appropriate plugin: `plugins/<plugin>/skills/<skill-name>/`
2. Write `SKILL.md` with frontmatter and workflow. Frontmatter follows the open Agent Skills standard (`name`, `description` required; `allowed-tools` optional). `user-invocable: true|false` is a Claude extension — Codex ignores it harmlessly.
3. Add reference files in `references/` if needed (one per topic, under 200 lines each)
4. (Optional, Codex-only) Add `agents/openai.yaml` to set Codex marketplace polish (display_name, icons) or `policy.allow_implicit_invocation: false` for explicit-only invocation.
5. Add a tap entry in `tap.json`
6. Commit your changes (the bump script refuses to run with a dirty plugin dir)
7. Bump the plugin version: `./scripts/bump-version.sh <plugin> patch`

## Adding a plugin

When creating a new plugin (a new directory under `plugins/`), register it in **all** places — missing any one breaks distribution:

1. **`plugins/<name>/.claude-plugin/plugin.json`** — Claude Code plugin manifest.
2. **`plugins/<name>/.codex-plugin/plugin.json`** — Codex plugin manifest. Same `version` as the Claude manifest. Must declare `"skills": "./skills/"` explicitly (Codex does not auto-discover) and an `interface` block for marketplace presentation.
3. **`tap.json`** — so skilltap users can discover and install its skills.
4. **`.claude-plugin/marketplace.json`** — so Claude Code and Codex marketplace users can install the plugin. Add an entry with `name`, `source: { source: "local", path: "./plugins/<name>" }`, `description`, `category`, and `policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" }`.

Verify all four files reference the new plugin before considering the plugin shippable.
