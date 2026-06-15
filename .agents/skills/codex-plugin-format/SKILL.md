---
name: codex-plugin-format
description: >
  OpenAI Codex CLI plugin, skill, and AGENTS.md format reference. Auto-loads when working with Codex
  plugins, `.codex-plugin/plugin.json`, Codex marketplaces, AGENTS.md, AGENTS.override.md,
  `~/.codex/config.toml`, project_doc_fallback_filenames, `agents/openai.yaml`, the agentskills.io
  open standard, $plugin-creator, $skill-installer, `codex plugin marketplace` CLI, or designing dual
  Claude/Codex plugin distribution.
---

# Codex Plugin / Skill / AGENTS.md Reference

Full research and rationale lives in
[docs/research/codex-plugin-format.md](../../../docs/research/codex-plugin-format.md). Use this
skill as the quick-load companion when editing manifests or skills that target Codex.

## Three layers — keep them straight

| Layer            | What it is                                            | File                                              |
| ---------------- | ----------------------------------------------------- | ------------------------------------------------- |
| AGENTS.md        | Per-repo agent instructions (≈ CLAUDE.md)             | Repo root + nested; hierarchical merge            |
| Agent Skill      | One capability — instructions + scripts/refs/assets   | `SKILL.md` inside a skill directory               |
| Codex Plugin     | Bundle of skills + MCP + apps + hooks                 | `.codex-plugin/plugin.json`                       |

AGENTS.md is a per-project file; plugins do not contain it. Skills live inside plugins (or
standalone under `.agents/skills/`). Plugins bundle skills.

## SKILL.md (open standard at agentskills.io)

```yaml
---
name: skill-name           # required; 1-64 chars; [a-z0-9-]; no leading/trailing/double hyphens; must equal dir name
description: ...           # required; 1-1024 chars; include trigger keywords
license: MIT               # optional
compatibility: ...         # optional; ≤ 500 chars; env requirements
metadata:                  # optional; arbitrary key-value map
  author: nklisch
  version: "1.0"
allowed-tools: Read Write  # optional; experimental; space-separated tool patterns
---
```

Rules:
- `name` must match the parent directory name.
- `description` drives implicit invocation in Codex. Front-load trigger keywords. Codex caps the
  combined name+description list at ~2% of context window or 8 KB.
- Keep body under 500 lines / 5000 tokens. Move long material to `references/` files.
- This frontmatter is what Claude Code's `user-invocable: true|false` lives on; the standard
  does not define `user-invocable` — it's a Claude extension. Codex ignores it.

Standard skill directory:
```
skill-name/
├── SKILL.md            # required
├── scripts/            # optional executables
├── references/         # optional long-form docs loaded on demand
├── assets/             # optional templates / images
└── agents/
    └── openai.yaml     # optional Codex-specific extension
```

Validate with `skills-ref validate ./my-skill` (from github.com/agentskills/agentskills).

## Codex skill scopes (precedence order)

| Scope  | Path                          |
| ------ | ----------------------------- |
| REPO   | `$CWD/.agents/skills`         |
| REPO   | `$REPO_ROOT/.agents/skills`   |
| USER   | `$HOME/.agents/skills`        |
| ADMIN  | `/etc/codex/skills`           |
| SYSTEM | built-in (ships with Codex)   |

This repo uses `$REPO_ROOT/.agents/skills` for reference skills — Codex picks them up natively.

## `agents/openai.yaml` — Codex-only skill extension

Optional. Adds Codex-specific marketplace polish and policy without polluting the cross-vendor
frontmatter.

```yaml
interface:
  display_name: "User-facing name"
  short_description: "Shown in picker"
  icon_small: "./assets/small-logo.svg"
  icon_large: "./assets/large-logo.png"
  brand_color: "#3B82F6"
  default_prompt: "Optional surrounding prompt"

policy:
  allow_implicit_invocation: false   # default true; false = require $skill or /skills

dependencies:
  tools:
    - type: mcp
      value: toolName
```

`policy.allow_implicit_invocation: false` is the Codex equivalent of `user-invocable: true` (no
auto-trigger). Use it on skills that should only run when the user explicitly invokes them.

## Codex plugin manifest: `.codex-plugin/plugin.json`

Lives at `plugin-root/.codex-plugin/plugin.json`. Everything else (skills/, .mcp.json, .app.json,
hooks/) stays at the plugin root.

```json
{
  "name": "my-plugin",
  "version": "0.1.0",
  "description": "Bundle reusable skills.",
  "author": { "name": "Your team", "email": "team@example.com", "url": "https://example.com" },
  "homepage": "https://example.com/plugins/my-plugin",
  "repository": "https://github.com/example/my-plugin",
  "license": "MIT",
  "keywords": ["research", "crm"],
  "skills": "./skills/",
  "mcpServers": "./.mcp.json",
  "apps": "./.app.json",
  "hooks": "./hooks/hooks.json",
  "interface": {
    "displayName": "My Plugin",
    "shortDescription": "Reusable skills",
    "longDescription": "Distribute skills and app integrations together.",
    "developerName": "Your team",
    "category": "Productivity",
    "capabilities": ["Read", "Write"],
    "defaultPrompt": ["Use My Plugin to summarize CRM notes."],
    "brandColor": "#10A37F",
    "composerIcon": "./assets/icon.png",
    "logo": "./assets/logo.png",
    "screenshots": ["./assets/screenshot-1.png"]
  }
}
```

Three field groups: package metadata, component pointers (`skills`, `mcpServers`, `apps`,
`hooks`), and `interface` (marketplace presentation).

Differences vs Claude `plugin.json`:
- `skills`, `mcpServers`, `hooks`, `apps` are **explicit pointers** in Codex; Claude
  auto-discovers from convention paths.
- `interface` is Codex-only.
- Other fields (`name`, `version`, `description`, `author`, `repository`, `license`) are
  identical shape.

### Plugin hooks

Codex loads plugin hooks from the manifest's `hooks` pointer, normally `./hooks/hooks.json`.
Installing or enabling a plugin does not automatically trust its bundled hooks; Codex skips them
until the user reviews and trusts the current hook definition.

Hook commands receive `PLUGIN_ROOT` and `PLUGIN_DATA`; Codex also exports
`CLAUDE_PLUGIN_ROOT` and `CLAUDE_PLUGIN_DATA` so existing Claude-compatible plugin hook commands
can use the portable form `${PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT}}`. Plugin hooks use the same event
schema as regular hooks. Claude Code's hook schema uses the same command-hook shape this repo
targets for `UserPromptSubmit`, `PostToolUse`, `SessionStart`, `PostCompact`, and
`hookSpecificOutput.additionalContext`.

## Codex marketplace: `marketplace.json`

Codex reads from any of:
- `$REPO_ROOT/.agents/plugins/marketplace.json`
- `~/.agents/plugins/marketplace.json`
- **`$REPO_ROOT/.claude-plugin/marketplace.json`** — Codex officially supports this as an
  "alternative Claude format" location.

Schema:

```json
{
  "name": "local-example-plugins",
  "interface": { "displayName": "Local Example Plugins" },
  "plugins": [
    {
      "name": "my-plugin",
      "source": { "source": "local", "path": "./plugins/my-plugin" },
      "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" },
      "category": "Productivity"
    },
    {
      "name": "remote-helper",
      "source": {
        "source": "git-subdir",
        "url": "https://github.com/example/codex-plugins.git",
        "path": "./plugins/remote-helper",
        "ref": "main"
      },
      "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" },
      "category": "Productivity"
    }
  ]
}
```

Documented source kinds: `local`, `git-subdir`.
Installation policies: `AVAILABLE`, `INSTALLED_BY_DEFAULT`, `NOT_AVAILABLE`.

Rules:
- Use kebab-case plugin names.
- All paths begin with `./` and are relative to the marketplace root.
- Each entry must declare `policy.installation`, `policy.authentication`, and `category`.

This repo's existing marketplace.json uses bare-string `"./plugins/<name>"` source shorthand,
which Claude accepts but Codex does not. To dual-publish, rewrite each entry with the explicit
source object shape and add `policy` + `category`. Claude tolerates the explicit shape too.

## CLI commands

```bash
codex plugin marketplace add owner/repo
codex plugin marketplace add owner/repo --ref main
codex plugin marketplace add https://github.com/example/plugins.git --sparse .agents/plugins
codex plugin marketplace upgrade
codex plugin marketplace remove marketplace-name
```

In-session:
- `/plugins` — open the plugin picker.
- `$skill-name` — mention a skill in a turn.
- `$plugin-creator` — built-in skill that scaffolds a new plugin.
- `$skill-installer` — built-in skill that installs from a GitHub directory URL or curated name.

## AGENTS.md (orthogonal to plugins)

Per-repo agent instruction file, equivalent to CLAUDE.md.

Codex builds the instruction chain at session start:
1. Global: `~/.codex/AGENTS.override.md` if present, else `~/.codex/AGENTS.md`.
2. Project: walk from Git root down to CWD. At each level, check `AGENTS.override.md`, then
   `AGENTS.md`, then any fallback names in `project_doc_fallback_filenames`. At most one file
   per directory.
3. Concatenate root → CWD, blank-line separated. Later (closer) overrides earlier.

Config in `~/.codex/config.toml`:

```toml
project_doc_fallback_filenames = ["TEAM_GUIDE.md", ".agents.md"]
project_doc_max_bytes = 65536          # default 32 KiB
```

Codex skips empty files and stops adding files once the combined size hits the cap.

Profile override: set `CODEX_HOME=$(pwd)/.codex` to use a different config root.

## Disabling a plugin

`~/.codex/config.toml`:

```toml
[plugins.my-plugin]
enabled = false
```

This keeps the plugin installed but inactive. To remove entirely, use the in-app uninstall or
`codex plugin marketplace remove <name>`.

## Dual-publishing this repo (Claude + Codex)

The chosen approach (see research doc for trade-offs):

1. Each plugin gets sibling manifests: `.claude-plugin/plugin.json` and
   `.codex-plugin/plugin.json`. SKILL.md files don't move.
2. Rewrite `.claude-plugin/marketplace.json` entries to use the explicit `source` object shape
   plus `policy` + `category`. Both Claude and Codex accept this shape.
3. Add `agents/openai.yaml` only to skills that benefit from Codex marketplace polish or need
   `allow_implicit_invocation: false`.
4. Skill frontmatter already complies with the open standard — `user-invocable` is a Claude
   extension that Codex ignores harmlessly.

## Open-standard governance

- **Agent Skills** — github.com/agentskills/agentskills; originally Anthropic, now adopted by
  Codex, Claude Code, Cursor, Gemini CLI, OpenCode, Goose, Roo Code, Junie, Amp, GitHub
  Copilot, and ~30 others.
- **AGENTS.md** — agents.md; stewarded by the Agentic AI Foundation under the Linux Foundation;
  60k+ open-source projects in use.

## Anti-patterns

- Don't put `AGENTS.md` inside a plugin — it's a project-level file.
- Don't rely on `user-invocable` in skills you want Codex to honor — use
  `policy.allow_implicit_invocation: false` in `agents/openai.yaml`.
- Don't omit `policy` or `category` from Codex marketplace entries — required by the loader.
- Don't trust third-party blog posts about the plugin schema; the format is < 1 year old and
  evolving. The developers.openai.com docs are authoritative.
- Don't put pointer files (`skills`, `mcpServers`, etc.) inside `.codex-plugin/` — only
  `plugin.json` goes there; the targets live at the plugin root.

## Sources

- developers.openai.com/codex/plugins — overview, install model, CLI surface.
- developers.openai.com/codex/plugins/build — full plugin.json + marketplace.json schemas.
- developers.openai.com/codex/hooks — hook events, inputs, outputs, and trust review.
- developers.openai.com/codex/skills — skill scopes, context budgets.
- developers.openai.com/codex/skills/create-skill — `agents/openai.yaml` schema.
- developers.openai.com/codex/guides/agents-md — discovery order, override files, fallback.
- developers.openai.com/codex/config-reference — `~/.codex/config.toml` schema.
- code.claude.com/docs/en/hooks — Claude Code hook events and JSON output.
- agentskills.io/specification — formal SKILL.md frontmatter spec.
- agents.md — universal instruction-file spec.
- github.com/openai/codex — codex-rs and codex-cli source.
- github.com/openai/skills — official skills catalog; .curated/gh-address-comments has a
  reference `agents/openai.yaml`.
