# Research: Claude Code Marketplace / Plugin Structure and Distribution

## Context

This research maps the Claude Code plugin and marketplace ecosystem as of March 2026 — covering
the three layers of the stack (SKILL.md open standard, plugin packaging format, marketplace
distribution format), third-party distribution tools, and guidance for tool authors and plugin
maintainers who need to interoperate with or distribute through this ecosystem.

## Questions

1. What is the current Claude Code skill/plugin format (SKILL.md, plugin.json, directory structure)?
2. Does Anthropic provide or plan an official marketplace? What is the marketplace format?
3. How do skills get distributed in the wild (git repos, npm packages, third-party marketplaces)?
4. What are the trade-offs between SKILL.md-only distribution and full plugin packaging?
5. What should custom skill installers or cross-agent tools know about this ecosystem?

## Current Claude Code Ecosystem (March 2026)

### Layer 1: SKILL.md — the open standard

Skills use a `SKILL.md` file with YAML frontmatter + markdown content, defined at [agentskills.io](https://agentskills.io)
as an open standard adopted by Claude Code, OpenAI Codex CLI, Cursor, and others.

**Frontmatter fields (Claude Code extensions beyond the base standard):**

| Field | Required | Description |
|---|---|---|
| `name` | No (defaults to dir name) | Lowercase letters, numbers, hyphens (max 64 chars) |
| `description` | Recommended | Drives auto-invocation — Claude reads this to decide when to load the skill |
| `disable-model-invocation` | No | `true` = user-only, hidden from Claude's context |
| `user-invocable` | No | `false` = Claude-only, hidden from `/` menu |
| `allowed-tools` | No | Tools Claude may use without per-use approval when skill is active |
| `model` | No | Override model for this skill |
| `effort` | No | `low`/`medium`/`high`/`max` effort level |
| `context` | No | `fork` = run in isolated subagent |
| `agent` | No | Which subagent type to use when `context: fork` |
| `argument-hint` | No | Shown in autocomplete for user guidance |
| `hooks` | No | Lifecycle hooks scoped to this skill |

**String substitutions in skill content:** `$ARGUMENTS`, `$ARGUMENTS[N]`, `$N`, `${CLAUDE_SESSION_ID}`, `${CLAUDE_SKILL_DIR}`

**Supporting files:** A skill is a directory with `SKILL.md` as the entrypoint plus optional templates, examples, scripts, and reference docs.

### Layer 2: Plugin — the packaging format

A **plugin** is a directory that bundles one or more skills with other extensions:

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json        # Manifest (name, description, version, author, ...)
├── skills/                # Agent Skills directories
│   └── my-skill/
│       └── SKILL.md
├── commands/              # Simpler .md command files (legacy)
├── agents/                # Custom subagent definitions
├── hooks/
│   └── hooks.json
├── .mcp.json              # MCP server configs
├── .lsp.json              # LSP server configs
└── settings.json          # Default settings when plugin is enabled
```

**plugin.json manifest fields:**

```json
{
  "name": "plugin-name",       // kebab-case, becomes skill namespace prefix
  "description": "...",
  "version": "1.0.0",          // semver
  "author": { "name": "..." },
  "homepage": "...",
  "repository": "...",
  "license": "MIT"
}
```

Plugin skills are namespaced: `/plugin-name:skill-name`. This prevents conflicts between plugins.

**Important:** The plugin format is Claude Code-specific. Other agents (Cursor, Gemini CLI) do not use it.

### Layer 3: Marketplace — the distribution format

A **marketplace** is a git repository with a `.claude-plugin/marketplace.json` catalog that lists plugins
and their sources.

**marketplace.json structure:**

```json
{
  "name": "my-marketplace",          // kebab-case, public-facing
  "owner": { "name": "Your Name" },
  "metadata": {
    "description": "...",
    "pluginRoot": "./plugins"         // optional: base path prefix for relative sources
  },
  "plugins": [
    {
      "name": "plugin-name",
      "source": "./plugins/my-plugin",                         // relative path
      "source": { "source": "github", "repo": "owner/repo" }, // GitHub
      "source": { "source": "url", "url": "https://..." },    // any git URL
      "source": { "source": "git-subdir", "url": "...", "path": "tools/plugin" }, // monorepo subdir
      "source": { "source": "npm", "package": "@org/plugin", "version": "^2.0" }, // npm
      "description": "...",
      "version": "...",
      "category": "productivity",
      "tags": ["...", "..."],
      "strict": true     // whether plugin.json is the authority (default: true)
    }
  ]
}
```

**User workflow:**
```bash
/plugin marketplace add owner/repo       # add marketplace from GitHub
/plugin marketplace add https://...      # from any git URL
/plugin install my-plugin@marketplace    # install specific plugin
/plugin marketplace update               # pull latest marketplace catalog
```

**Plugin caching:** Installed plugins are copied to `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`.
This means plugins cannot reference files outside their directory using `..` paths.

**Reserved marketplace names:** `claude-code-marketplace`, `claude-code-plugins`, `claude-plugins-official`,
`anthropic-marketplace`, `anthropic-plugins`, `agent-skills`, `knowledge-work-plugins`, `life-sciences`.

**Official Anthropic marketplace:** Submit via [claude.ai/settings/plugins/submit](https://claude.ai/settings/plugins/submit).

### The anthropics/skills repository

The canonical official skills repository lives at `anthropics/skills` (99k GitHub stars as of March 2026).
It demonstrates the open standard and hosts Anthropic's own skills (document creation, etc.). Skills are
installed via the plugin marketplace (`/plugin marketplace add anthropics/skills`).

### Third-party distribution landscape

| Tool | Approach | Notes |
|---|---|---|
| [SkillsMP](https://skillsmp.com) | Web marketplace | 500k+ skills, search/filtering by category |
| [SkillHub](https://skillhub.club) | Web marketplace | 7k+ AI-evaluated skills for Claude, Codex, Gemini |
| [antfu/skills-npm](https://github.com/antfu/skills-npm) | npm bundling | Skills inside npm packages, symlinked at install time |
| [vercel-labs/skills](https://github.com/vercel-labs/skills) | `npx skills` CLI | `npx skills i vercel-labs/agent-skills` |
| [numman-ali/openskills](https://github.com/numman-ali/openskills) | `npx openskills` CLI | Universal loader from GitHub/local/private repos |
| Claude Code native | `/plugin install` | First-class marketplace support built into Claude Code |

## Distribution Trade-offs

### SKILL.md-only vs full plugin packaging

| Approach | Install path | Cross-agent | MCP/hooks | Namespace |
|---|---|---|---|---|
| Bare SKILL.md (git dir) | `.agents/skills/<name>/` | Yes (Claude Code, Cursor, Codex, Gemini CLI) | No | `/skill-name` |
| Full Claude Code plugin | `~/.claude/plugins/cache/` | Claude Code only | Yes | `/plugin-name:skill-name` |
| npm-published plugin | (via marketplace `npm` source) | Claude Code only | Yes | `/plugin-name:skill-name` |

**Choose bare SKILL.md** when portability across agents matters or when no Claude Code-specific
extensions (MCP servers, hooks, LSP) are needed.

**Choose the full plugin format** when you need to bundle MCP servers, hook event handlers, LSP
configs, or custom agents alongside skills, and Claude Code is the primary target.

### npm as a distribution layer

Claude Code's native marketplace supports `{ "source": "npm", "package": "@org/plugin", "version": "..." }`.
This means npm-published plugins install via the native `/plugin install` command.

**Pros:** universal registry with versioning, search, and provenance; familiar to most developers.

**Cons:** Claude Code-specific; not usable from Cursor/Gemini natively; adds npm complexity for
simple SKILL.md packages.

**Maturity:** Nascent community adoption (antfu/skills-npm proposal).

### Building a cross-agent skill installer

Custom skill installers that want to read Claude Code marketplaces should:

1. Check for `.claude-plugin/marketplace.json` when resolving a repo as a skill source.
2. Install only the SKILL.md content from each listed plugin; skip `mcpServers` / `.mcp.json`,
   `lspServers` / `.lsp.json`, `hooks/hooks.json`, `agents/`, and `settings.json` — those require
   Claude Code's native plugin system.
3. Warn users when a plugin includes MCP servers or hooks that were not installed.
4. Resolve plugin namespacing: skills installed outside the native system install as `/skill-name`
   (no namespace), not `/plugin-name:skill-name`.

## Implementation Notes

### Skill namespace consideration

Claude Code plugins install skills under a namespace (`/plugin-name:skill-name`). Bare SKILL.md
installs use `/skill-name` (no namespace). Both forms work in Claude Code and they do not
conflict — a skill installed both ways is accessible under both paths.

### What marketplace.json fields to skip in a custom installer

- `mcpServers` / `.mcp.json` — requires Claude Code's plugin system
- `lspServers` / `.lsp.json` — Claude Code-specific
- `hooks/hooks.json` — Claude Code event system
- `agents/` directory — Claude Code subagent definitions
- `settings.json` — Claude Code settings

Warn the user: "This plugin includes MCP servers and hooks that require Claude Code's native
`/plugin install`. Only the SKILL.md content has been installed."

## Common Pitfalls

- **Namespace confusion:** A bare-SKILL.md install uses `/skill-name`; the same skill installed
  natively as a plugin uses `/plugin-name:skill-name`. Both work but they don't conflict.
- **Plugin caching paths:** Claude Code copies plugins to `~/.claude/plugins/cache/`. `${CLAUDE_PLUGIN_ROOT}`
  in hook scripts references the cached path — only meaningful for natively installed plugins.
- **Reserved marketplace names:** Don't create a marketplace called `agent-skills` or any other reserved name.
- **`strict: false` mode:** marketplace.json plugins with `strict: false` have no `plugin.json`; the
  marketplace entry IS the definition. Handle this gracefully (don't expect `plugin.json` to exist).

## References

- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills)
- [Claude Code Plugins Documentation](https://code.claude.com/docs/en/plugins)
- [Claude Code Plugin Marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)
- [anthropics/skills repository](https://github.com/anthropics/skills)
- [agentskills.io open standard](https://agentskills.io)
- [antfu/skills-npm proposal](https://github.com/antfu/skills-npm)
- [vercel-labs/skills CLI](https://github.com/vercel-labs/skills)
