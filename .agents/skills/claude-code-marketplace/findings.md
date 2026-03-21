# Research: Claude Code Marketplace / Plugin Structure and Distribution

## Context

skilltap installs SKILL.md-format agent skills from git repositories. As the Claude Code ecosystem matures,
Anthropic has built out a full plugin/marketplace system that overlaps with skilltap's domain. This research
maps the current state of that ecosystem (as of March 2026) and evaluates its implications for skilltap's
design.

## Questions

1. What is the current Claude Code skill/plugin format (SKILL.md, plugin.json, directory structure)?
2. Does Anthropic provide or plan an official marketplace? What is the tap/marketplace format?
3. How do skills get distributed in the wild (git repos, npm packages, third-party marketplaces)?
4. How does skilltap's current design (SKILL.md + tap.json) relate to Claude Code's native formats?
5. What opportunities exist for skilltap to integrate with or complement the native ecosystem?

## Current Claude Code Ecosystem (March 2026)

### Layer 1: SKILL.md — the open standard

Skills use a `SKILL.md` file with YAML frontmatter + markdown content, defined at [agentskills.io](https://agentskills.io)
as an open standard adopted by Claude Code, OpenAI Codex CLI, Cursor, and others. This is exactly what
skilltap installs.

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

## Options Evaluated

### Option A: Align skilltap with Claude Code's marketplace.json format

Adopt `marketplace.json` as the tap format and the plugin directory structure as the skill package format.
Make skilltap an alternative installer for native Claude Code plugins.

**Pros:**
- Full interoperability: skills installed by skilltap work identically to natively installed plugins
- No conversion step required
- Users can switch between `skilltap install` and `/plugin install` seamlessly

**Cons:**
- Plugin format is Claude Code-specific — loses agent-agnostic portability (Cursor, Gemini CLI, etc.)
- Plugin namespacing (`/plugin-name:skill-name`) is intrusive; standalone SKILL.md installs as `/skill-name`
- Claude Code's native installer is already excellent; duplicate effort
- marketplace.json is more complex than skilltap's tap.json needs to be
- Prevents skilltap from being a lightweight alternative

**Maturity:** Active and production-quality (Anthropic-maintained)

### Option B: Keep skilltap's SKILL.md + tap.json format, add bridges to native ecosystem

Keep the current approach (SKILL.md files, tap.json index) but add:
- Ability to install from Claude Code marketplaces (parse marketplace.json)
- npm source support (already partially implemented)
- Documentation on how skilltap-installed skills compare to natively-installed plugins

**Pros:**
- Stays agent-agnostic — skills install to `.agents/skills/` and symlink to all configured agents
- tap.json is simpler than marketplace.json for the common case
- skilltap provides value that native `/plugin install` doesn't: cross-agent portability
- Can read marketplace.json as a source format without adopting the full plugin structure

**Cons:**
- Users who want MCP servers, LSP servers, or hooks must use native plugin install anyway
- Maintaining a parallel format creates divergence risk over time

**Maturity:** Active (this project)

### Option C: Focus on npm as the universal distribution layer

Shift skilltap's primary distribution model to npm packages: publish skills as npm packages, use npm as the
registry. Benefits from Claude Code's first-class `{ "source": "npm" }` support.

**Pros:**
- npm is a universal, mature registry with versioning, search, and provenance
- Claude Code natively supports npm plugin sources — no conversion needed
- Familiar workflow for most developers

**Cons:**
- npm packages are not agent-agnostic (they work with Claude Code's marketplace, not Cursor/Gemini natively)
- Adds npm as a hard dependency for skill authors
- Overkill for simple SKILL.md files — npm packages bring package.json, node_modules complexity

**Maturity:** Nascent community adoption (antfu/skills-npm proposal)

### Option D: skilltap as a thin adapter that reads both tap.json and marketplace.json

Allow `skilltap tap add` to work with both tap.json-indexed taps AND Claude Code marketplace repos.
When a repo has `.claude-plugin/marketplace.json`, parse it as a tap. When a repo has a SKILL.md, install
it as-is. Be a universal skill installer regardless of which format the source uses.

**Pros:**
- Users can point skilltap at any skill source — native marketplace, tap, or bare SKILL.md repo
- Extends tap discovery to the entire Claude Code marketplace ecosystem
- Minimal new complexity; mostly additive parsing logic

**Cons:**
- marketplace.json plugins (with MCP servers, hooks, LSP) can't be fully installed by skilltap
- Must clearly communicate what skilltap installs (SKILL.md content only) vs what native install does
- Potential confusion when marketplace plugin features don't work after skilltap install

**Maturity:** Conceptual — would need implementation

## Recommendation

**Option D (multi-format tap reader) with elements of Option B (bridges), skipping Option A (full alignment).**

### Rationale

The core insight is that **SKILL.md is the open standard; plugins are Claude Code-specific packaging.**
skilltap's value proposition — agent-agnostic, git-based, security-scanned skill installation — remains
distinct and complementary to the native plugin system.

However, skilltap should not be isolated from the growing Claude Code ecosystem. The pragmatic move is:

1. **Keep tap.json as the primary tap format.** It is simpler and more portable than marketplace.json.
   There is no reason to force skill authors to adopt the heavier plugin/marketplace format just to be
   discoverable via skilltap.

2. **Add marketplace.json as a recognized tap format.** When `skilltap tap add owner/repo` encounters
   a repo with `.claude-plugin/marketplace.json`, parse it and surface the skills listed there.
   Install only the SKILL.md content (skip MCP/LSP/hooks — those require native plugin install).
   This lets users discover and install skills from any Claude Code marketplace through skilltap.

3. **Add npm source support** (already partially in scope per SPEC.md). Claude Code's native marketplace
   uses npm sources; skilltap should match this capability so npm-published skills are installable.

4. **Document the division of responsibility clearly:**
   - skilltap installs SKILL.md content across all agents (Claude Code, Cursor, Gemini CLI, etc.)
   - Native `/plugin install` installs full Claude Code plugins (MCP, LSP, hooks, namespaced skills)
   - They are complementary, not competing

### What NOT to do

- Do not adopt the `plugin.json` + plugin directory structure as a new package format
- Do not add MCP/LSP/hooks installation to skilltap — that belongs in the native installer
- Do not try to publish to the official Anthropic marketplace (reserved names, review process, Claude-specific)

## Implementation Notes

### Reading marketplace.json in tap resolution

When `skilltap tap add <repo>` or tap search runs, check for `.claude-plugin/marketplace.json`:

```typescript
// In taps.ts — tap resolution order
async function resolveTap(repoPath: string): Promise<TapIndex> {
  // 1. Try tap.json (canonical format)
  const tapJson = await tryParseTapJson(repoPath);
  if (tapJson) return tapJson;

  // 2. Try .claude-plugin/marketplace.json (Claude Code format)
  const marketplace = await tryParseMarketplaceJson(repoPath);
  if (marketplace) return adaptMarketplaceToTap(marketplace);

  // 3. Treat repo itself as a single-skill source
  return inferTapFromRepo(repoPath);
}
```

When adapting marketplace.json:
- Map `plugins[].name` → skill name
- Map `plugins[].description` → skill description
- Map `plugins[].source` → repo/path for installation
- Warn if source is `npm` type (not yet supported) or contains MCP/LSP components

### npm source type

Claude Code marketplace uses `{ "source": "npm", "package": "@org/plugin", "version": "..." }`. The npm
adapter in skilltap should resolve this to the package's `skills/` directory after `npm install`. Reference
`DESIGN-NPM-ADAPTER.md` for the current design.

### Skill namespace consideration

Claude Code plugins install skills under a namespace (`/plugin-name:skill-name`). When skilltap installs
from a plugin source, skills install as `/skill-name` (no namespace). This is a feature — it makes skills
usable from other agents that don't understand namespacing. Document this trade-off explicitly.

### What marketplace.json fields to skip

Skip during skilltap install:
- `mcpServers` / `.mcp.json` — requires Claude Code's plugin system
- `lspServers` / `.lsp.json` — Claude Code-specific
- `hooks/hooks.json` — Claude Code event system
- `agents/` directory — Claude Code subagent definitions
- `settings.json` — Claude Code settings

Warn the user: "This plugin includes MCP servers and hooks that require Claude Code's native `/plugin install`.
Only the SKILL.md content has been installed."

## Common Pitfalls

- **Namespace confusion:** Skills installed via skilltap use `/skill-name`; the same skill installed
  natively as a plugin uses `/plugin-name:skill-name`. Both work but they don't conflict.
- **Plugin caching paths:** Claude Code copies plugins to `~/.claude/plugins/cache/`. `${CLAUDE_PLUGIN_ROOT}`
  in hook scripts references the cached path — irrelevant for skilltap installs.
- **Reserved marketplace names:** Don't create a tap called `agent-skills` or any other reserved name.
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
