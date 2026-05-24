# Skills Repo

This repo contains agent skills distributed via skilltap, the Claude Code plugin marketplace, and the OpenAI Codex plugin marketplace. Skills are defined as tap entries in `tap.json` and stored in plugin skill directories or `.agents/skills/<skill-name>/`.

## Orient first — `ls plugins/` before assuming

**There are FOUR distinct plugins under `plugins/`, not one.** Before designing on top of any plugin, run `ls plugins/` and read the target plugin's `plugin.json` + `docs/` (if it has them). Skill names overlap between plugins by design; the plugin a skill lives in determines its semantics.

### Plugin map

| Directory | Published name | Status | Purpose |
|---|---|---|---|
| `plugins/agile-workflow/` | `agile-workflow` | supported | **Substrate-driven** work tracking. Items as files in `.work/` with YAML frontmatter, late-binding releases, gates that produce items, autopilot queue runner. See `plugins/agile-workflow/docs/VISION.md`. |
| `plugins/ux-ui-design/` | `ux-ui-design` | supported | HTML/CSS/JS mockup-first UI/UX design. Throwaway single-file mockups in `.mockups/`. Loose integration with agile-workflow. |
| `plugins/skill-authoring/` | `skill-authoring` | supported | Create, evaluate, and refine agent skills. |
| `plugins/workflow/` | `workflow` | **DEPRECATED — no longer supported** | Doc-driven software workflow with design docs as artifacts in `docs/designs/`. Kept in tree so existing installs don't break. No new features or fixes will land. New projects should use `agile-workflow`; existing `workflow` projects migrate via `/agile-workflow:convert`. |

### workflow is deprecated

The `workflow` plugin is **deprecated and no longer supported.** It still ships in this repo so existing installations keep working, but no new features or fixes will land. Do not extend it. Do not reference it as a sibling in new docs.

If a user asks for the workflow plugin or wants to migrate, point them at:
- `/agile-workflow:convert` — detects the legacy `docs/designs/` + `docs/ROADMAP.md` + `docs/PROGRESS.md` layout and migrates phases→epics, designs→features, completed designs→retro-release.
- `docs/agile-workflow-guide.md` and `docs/ux-ui-design-guide.md` — the supported guides.
- `plugins/agile-workflow/docs/MIGRATION.md` — full migration matrix.

**Skill names that overlap** between `workflow` (deprecated) and the supported plugins — `perf-design`, `refactor-design`, `implement`, `autopilot`, `principles`, `review`, `fix`, `ideate`, `repo-eval`, `research`, `bold-refactor`, `tool-evaluator`, `refactor-conventions-creator`, `implement-orchestrator` — have intentionally different implementations. When touching a skill, confirm which plugin you're in. New work goes into `agile-workflow`.

**Surface-area differences (for reference):**
- `workflow` has: `design`, `roadmap`, `extend`, `e2e-test-design`, `test-quality`, `update-documentation`, `security-review`, `release`, `cruft-cleaner`, `extract-patterns`
- `agile-workflow` has: `scope`, `convert`, `epicize`, `epic-design`, `feature-design`, `park`, `gate-{security,tests,cruft,docs,patterns}`, `release-deploy`

### Other locations

- Reference and principle skills (not part of a plugin) live in `.agents/skills/<skill-name>/`.
- Skilltap resolves from `plugins/*/skills/`, `.agents/skills/`, and `skills/`.

## Dual marketplace support (Claude Code + Codex)

Each plugin ships **two parallel manifests**, kept in lockstep:

- `plugins/<name>/.claude-plugin/plugin.json` — for Claude Code (`/plugin install`).
- `plugins/<name>/.codex-plugin/plugin.json` — for OpenAI Codex CLI (`codex plugin marketplace add`).

The root `.claude-plugin/marketplace.json` uses the legacy string-path shape for local plugins (`"source": "./plugins/<name>"`) plus `policy` + `category`. Claude Code does NOT support the object shape `{ "source": "local", "path": "..." }` — only `github`, `url`, `git-subdir`, and `npm` are valid object-form source types. Codex reads this file as an alternative marketplace location, so both ecosystems install from the same git tree.

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
4. **`.claude-plugin/marketplace.json`** — so Claude Code and Codex marketplace users can install the plugin. Add an entry with `name`, `"source": "./plugins/<name>"` (string form — the object form `{ source: "local", ... }` is NOT supported by Claude Code), `description`, `category`, and `policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" }`.

Verify all four files reference the new plugin before considering the plugin shippable.
