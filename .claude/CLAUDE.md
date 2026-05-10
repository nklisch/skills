# Skills Repo

This repo contains agent skills distributed via skilltap. Skills are defined as tap entries in `tap.json` and stored in plugin skill directories or `.agents/skills/<skill-name>/`.

## Important

- Workflow plugin skills live in `plugins/workflow/skills/<skill-name>/`.
- Skill authoring plugin skills live in `plugins/skill-authoring/skills/<skill-name>/`.
- Reference and principle skills live in `.agents/skills/<skill-name>/`.
- Skilltap resolves from `plugins/*/skills/`, `.agents/skills/`, and `skills/`.

## Versioning

Each plugin has a `plugin.json` at `plugins/<name>/.claude-plugin/plugin.json` with a semver `version` field.

Bump versions with `./scripts/bump-version.sh <plugin> <major|minor|patch>`:
- **patch** — new skill, bug fix, or minor update to an existing skill
- **minor** — significant new capability or breaking change to a skill's workflow
- **major** — plugin restructure or backwards-incompatible changes

When adding or modifying a skill, bump the version of the plugin it belongs to.

## Adding a skill

1. Create the skill directory under the appropriate plugin: `plugins/<plugin>/skills/<skill-name>/`
2. Write `SKILL.md` with frontmatter and workflow
3. Add reference files in `references/` if needed (one per topic, under 200 lines each)
4. Add a tap entry in `tap.json`
5. Bump the plugin version: `./scripts/bump-version.sh <plugin> patch`

## Adding a plugin

When creating a new plugin (a new directory under `plugins/`), register it in **both** places — missing either one breaks distribution:

1. **`tap.json`** — so skilltap users can discover and install its skills.
2. **`.claude-plugin/marketplace.json`** — so Claude Code marketplace users can install the plugin via `/plugin marketplace`. Add an entry with `name`, `source: "./plugins/<name>"`, and `description`.

Verify both files reference the new plugin before considering the plugin shippable.
