# Research: Codex Plugin Format and Standards

Date: 2026-05-12
Researcher: agile-workflow:research skill
Codex CLI version surveyed: developers.openai.com/codex docs as of May 2026
Agent Skills spec version surveyed: agentskills.io as of May 2026

## Context

This repo (`nklisch/skills`) distributes agent skills and plugins for Claude Code via the Claude
Code plugin marketplace (`.claude-plugin/marketplace.json`). OpenAI Codex CLI has its own
first-party plugin and skill format, and the open **Agent Skills** standard (originated by
Anthropic, hosted at agentskills.io) is now adopted by both vendors plus 30+ other agent products.

The question is: what does Codex's plugin/skill format look like, what is shared vs. divergent
from Claude Code's, and how should this repo adapt to be installable in Codex with minimum
duplication?

## Questions

1. What is the SKILL.md frontmatter shape Codex expects? Does it match the Claude Code shape?
2. What does a Codex plugin manifest look like? Where does it live?
3. How does a Codex user discover and install a plugin — is there a marketplace format?
4. What is AGENTS.md and how does it relate to plugins/skills?
5. Can this repo be dual-published with minimal duplication?

## The three layers

Codex composes three distinct things — easy to confuse if not separated.

| Layer            | Purpose                                            | File / location                                   | Standard body                       |
| ---------------- | -------------------------------------------------- | ------------------------------------------------- | ----------------------------------- |
| **AGENTS.md**    | Per-repo agent instructions (≈ CLAUDE.md)          | Repo root + nested; hierarchical merge            | Linux Foundation / Agentic AI Fdn   |
| **Agent Skills** | Unit of capability — instructions + scripts/refs   | `SKILL.md` inside a skill directory               | agentskills.io (open standard)      |
| **Codex Plugin** | Bundle of skills + MCP servers + apps + hooks      | `.codex-plugin/plugin.json` + manifest pointers   | OpenAI Codex CLI                    |

AGENTS.md is **not** packaged inside plugins — it lives at the repo level. Skills and plugins are
packaging concerns. The Agent Skills spec governs the unit; the Codex plugin format governs the
bundle.

## Options Evaluated

For dual-distribution of this repo's plugins, three options:

### Option A — Codex-only fork

Maintain a second repo with `.codex-plugin/plugin.json` manifests and Codex-flavored SKILL.md
files.

- **Pros**: Clean separation; per-vendor optimization possible
- **Cons**: 2× maintenance; drift inevitable; single source of truth is lost

### Option B — Dual manifests, shared skills

Keep one repo. Each plugin gets sibling manifests: `.claude-plugin/plugin.json` and
`.codex-plugin/plugin.json`. SKILL.md files stay in their existing locations and are referenced
by both manifests. The root `.claude-plugin/marketplace.json` is read by Codex too (Codex
documents this as an "alternative Claude format" — see references).

- **Pros**: Single SKILL.md set; both ecosystems install from the same git tree; no fork
- **Cons**: Two manifests per plugin; per-skill `agents/openai.yaml` needed if you want
  Codex-specific marketplace polish

### Option C — No native plugin support

Skip the Codex plugin manifest entirely. Rely on Codex's ability to install skills directly via
its skill installer from a GitHub directory URL.

- **Pros**: Zero new files in this repo
- **Cons**: No native Codex `/plugins` discovery; users must know URLs; loses the marketplace
  shop-window

## Recommendation

**Option B — dual manifests, shared skills.**

It's the only option that keeps a single source of truth, gives native install UX in both
ecosystems, and matches what Codex already documents (it explicitly reads
`.claude-plugin/marketplace.json` as an alternative location). Existing skills require zero
content changes — only the optional `agents/openai.yaml` files would be additive per skill where
you want Codex-specific marketplace polish.

The cost is one extra JSON file per plugin (`plugins/<name>/.codex-plugin/plugin.json`). The
schema is small and largely a relabeling of the Claude manifest.

## How Codex parses each layer

### SKILL.md (Agent Skills open standard)

The standard is at **agentskills.io/specification**. Stewardship and contributions happen at
github.com/agentskills/agentskills. The format was originally developed by Anthropic and is
adopted by Codex, Claude Code, Cursor, Gemini CLI, OpenCode, Goose, Roo Code, Junie, Amp,
GitHub Copilot, and ~30 other agent products.

Required frontmatter:

```yaml
---
name: skill-name           # 1-64 chars, [a-z0-9-], no leading/trailing/consecutive hyphens
description: ...           # 1-1024 chars
---
```

The `name` must match the parent directory name. The `description` drives implicit invocation —
Codex matches it against user prompts, so it should include trigger keywords.

Optional frontmatter:

- `license` — license name or path to bundled license file
- `compatibility` — max 500 chars; environment requirements (e.g. "Requires git, jq")
- `metadata` — arbitrary key-value map; vendors may use it for non-standard fields
- `allowed-tools` — experimental; space-separated tool patterns (e.g. `Bash(git:*) Read`)

Directory layout (all optional except `SKILL.md`):

```
my-skill/
├── SKILL.md
├── scripts/          # executable code
├── references/       # long-form docs loaded on demand
├── assets/           # templates, images, schemas
└── agents/
    └── openai.yaml   # Codex-specific overrides (optional)
```

Progressive disclosure expectations: name+description (~100 tokens) at startup; full SKILL.md
body (< 5000 tokens recommended, keep under 500 lines) on activation; referenced files only when
needed.

### Codex-specific extension: `agents/openai.yaml`

This file is **optional**. It adds Codex-only marketplace metadata and policy controls without
polluting the cross-vendor frontmatter.

```yaml
interface:
  display_name: "User-facing name"
  short_description: "Shown in the picker"
  icon_small: "./assets/small-logo.svg"
  icon_large: "./assets/large-logo.png"
  brand_color: "#3B82F6"
  default_prompt: "Optional surrounding prompt suggestion"

policy:
  allow_implicit_invocation: false   # default true; set false to require $skill or /skills

dependencies:
  tools:
    - type: mcp
      value: toolName
```

`policy.allow_implicit_invocation: false` is the Codex equivalent of Claude Code's
`user-invocable: true` (when combined with no auto-trigger keywords) — it forces the user to
mention the skill explicitly.

### Codex plugin manifest: `.codex-plugin/plugin.json`

Lives at `plugin-root/.codex-plugin/plugin.json`. Everything else (skills/, .mcp.json, .app.json,
hooks/) stays at the plugin root.

Complete shape:

```json
{
  "name": "my-plugin",
  "version": "0.1.0",
  "description": "Bundle reusable skills and app integrations.",
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
    "shortDescription": "Reusable skills and apps",
    "longDescription": "Distribute skills and app integrations together.",
    "developerName": "Your team",
    "category": "Productivity",
    "capabilities": ["Read", "Write"],
    "websiteURL": "https://example.com",
    "privacyPolicyURL": "https://example.com/privacy",
    "termsOfServiceURL": "https://example.com/terms",
    "defaultPrompt": [
      "Use My Plugin to summarize CRM notes.",
      "Use My Plugin to triage customer follow-ups."
    ],
    "brandColor": "#10A37F",
    "composerIcon": "./assets/icon.png",
    "logo": "./assets/logo.png",
    "screenshots": ["./assets/screenshot-1.png"]
  }
}
```

Field categories:

- **Package metadata**: `name`, `version`, `description`, `author`, `homepage`, `repository`,
  `license`, `keywords`
- **Component pointers**: `skills`, `mcpServers`, `apps`, `hooks` — relative paths to where each
  component lives
- **Interface**: marketplace presentation (`displayName`, icons, screenshots, default prompts)

### Codex plugin hooks

Codex loads plugin lifecycle hooks from the manifest's `hooks` pointer, whose default target is
`hooks/hooks.json`. Installing or enabling a plugin does **not** automatically trust those hooks:
Codex skips plugin-bundled hooks until the user reviews and trusts the current hook definition.
Hook paths follow the same relative, inside-plugin-root path rules as other manifest pointers.

Codex hook commands receive `PLUGIN_ROOT` and `PLUGIN_DATA`; for compatibility with Claude plugin
hooks, Codex also exports `CLAUDE_PLUGIN_ROOT` and `CLAUDE_PLUGIN_DATA`. Plugin hooks use the same
event schema as regular Codex hooks. See
<https://developers.openai.com/codex/plugins/build> and the Codex hooks reference.

Claude Code hooks use the same command-hook structure this repo targets, including matchers,
`UserPromptSubmit`, `PostToolUse`, `SessionStart`, `PostCompact`, and
`hookSpecificOutput.additionalContext`; see <https://code.claude.com/docs/en/hooks>.

Comparison to `.claude-plugin/plugin.json` from this repo:

| Field         | Claude         | Codex                      | Note                                |
| ------------- | -------------- | -------------------------- | ----------------------------------- |
| `name`        | ✓              | ✓                          | identical                           |
| `version`     | ✓              | ✓                          | identical                           |
| `description` | ✓              | ✓                          | identical                           |
| `author`      | ✓              | ✓                          | identical shape                     |
| `repository`  | ✓              | ✓                          | identical                           |
| `license`     | ✓              | ✓                          | identical                           |
| skills loc.   | auto-discovery | explicit `skills` pointer  | Codex requires the field            |
| MCP loc.      | `.mcp.json`    | `mcpServers` pointer       | Codex points; Claude auto-discovers |
| hooks loc.    | `hooks/`       | `hooks` pointer            | Codex points; Claude auto-discovers |
| `interface`   | not used       | marketplace presentation   | Codex-only                          |

### Codex marketplace: `marketplace.json`

Lives at one of:

- `$REPO_ROOT/.agents/plugins/marketplace.json`
- `~/.agents/plugins/marketplace.json`
- **`$REPO_ROOT/.claude-plugin/marketplace.json`** — Codex officially supports this as an
  alternative location. This is the file this repo already publishes.

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

Source kinds: `local`, `git-subdir` (others may exist; these are the documented two).

Installation policies: `AVAILABLE`, `INSTALLED_BY_DEFAULT`, `NOT_AVAILABLE`.

This repo's existing `marketplace.json` already uses `local` (as string shorthand `"./..."`)
and `git-subdir` source shapes. To be fully Codex-compatible the entries would need:

- `source.source: "local"` wrapper instead of bare-string `"./plugins/agile-workflow"`
- `policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" }` per entry
- `category` per entry

Claude Code marketplace tolerates the explicit-source-object shape too, so a single
marketplace.json can satisfy both.

### CLI commands

```bash
codex plugin marketplace add owner/repo
codex plugin marketplace add owner/repo --ref main
codex plugin marketplace add https://github.com/example/plugins.git --sparse .agents/plugins
codex plugin marketplace upgrade
codex plugin marketplace remove marketplace-name
```

Inside Codex: `/plugins` opens the picker; `$skill-name` mentions a skill in a turn;
`$plugin-creator` is the built-in skill that scaffolds new plugins.

### AGENTS.md (orthogonal to plugins)

Hierarchical instruction file, equivalent role to CLAUDE.md.

Discovery order Codex builds at session start:

1. Global: `~/.codex/AGENTS.override.md` if present, else `~/.codex/AGENTS.md`
2. Project: walk Git root → CWD, at each level check `AGENTS.override.md`, then `AGENTS.md`,
   then any fallback names from `project_doc_fallback_filenames`
3. Files concatenated root → CWD with blank-line separators; later (closer) overrides earlier

Fallback filenames are configured in `~/.codex/config.toml`:

```toml
project_doc_fallback_filenames = ["TEAM_GUIDE.md", ".agents.md"]
project_doc_max_bytes = 65536    # default 32 KiB
```

Codex skips empty files, processes at most one file per directory, stops at the size cap.

This is **not** something this repo packages — it's a per-project consumer concern. Worth
mentioning to projects adopting this repo's plugins.

## Implementation Notes for this repo

If adopting Option B:

1. **Add `.codex-plugin/plugin.json`** to each plugin sibling-of `.claude-plugin/`:
   - `plugins/workflow/.codex-plugin/plugin.json`
   - `plugins/agile-workflow/.codex-plugin/plugin.json`
   - `plugins/skill-authoring/.codex-plugin/plugin.json`

   Each is a near-clone of the Claude `plugin.json` with `skills: "./skills/"` added and an
   `interface` block for marketplace polish.

2. **Verify SKILL.md compatibility**. Existing skills use:
   - `name`, `description` ✓ standard
   - `allowed-tools` ✓ standard (experimental tag in spec)
   - `user-invocable: true|false` — Claude-specific. Codex ignores unknown frontmatter, so this
     is harmless. For Codex to honor the same intent, add `agents/openai.yaml` with
     `policy.allow_implicit_invocation: false` to the user-invocable-only skills.

3. **Update `.claude-plugin/marketplace.json`** to use the explicit `source: { source: "local",
   path: ... }` shape and add `policy` + `category` to each entry. Both ecosystems will accept
   the explicit shape.

4. **(Optional) Per-skill `agents/openai.yaml`** for marketplace-visible skills where icons,
   brand color, or default prompts add value. Most reference skills (e.g. `hono-v4`) don't need
   this — they auto-load on keyword match in both ecosystems and aren't surfaced in pickers.

5. **Update bump-version.sh** to refuse on `plugins/<name>/.codex-plugin/` dirty trees too, not
   just `.claude-plugin/`.

6. **Update CLAUDE.md** to mention the dual-manifest convention so future skill authors don't
   forget the Codex side.

## Code Examples

### Minimal Codex-compatible skill (no change needed if frontmatter already conforms)

```markdown
---
name: research
description: Research external libraries, APIs, and SDKs. Use before designing features that depend on unfamiliar technology, when choosing between options, or when API assumptions need verification.
allowed-tools: Read, Write, Glob, Grep, WebSearch, WebFetch
---

# Research

...
```

### Codex plugin manifest mirroring this repo's `agile-workflow` plugin

```json
{
  "name": "agile-workflow",
  "version": "0.4.8",
  "description": "Markdown-based work-tracking substrate for AI-driven projects.",
  "author": { "name": "nklisch" },
  "repository": "https://github.com/nklisch/skills",
  "license": "MIT",
  "skills": "./skills/",
  "interface": {
    "displayName": "Agile Workflow",
    "shortDescription": "Substrate-driven work tracking with autopilot",
    "category": "Productivity",
    "developerName": "nklisch"
  }
}
```

### Codex-compatible marketplace entry (rewrite of an existing entry)

```json
{
  "name": "agile-workflow",
  "source": { "source": "local", "path": "./plugins/agile-workflow" },
  "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" },
  "category": "Productivity",
  "description": "Markdown-based work-tracking substrate for AI-driven projects."
}
```

### Forcing explicit-only invocation in Codex (mirrors `user-invocable: true`)

`<skill-dir>/agents/openai.yaml`:

```yaml
policy:
  allow_implicit_invocation: false
```

## Risks and Open Questions

- **Schema drift**: The Codex plugin format is < 1 year old (introduced 2026) and still
  evolving. The blog from danielvaughan.com (March 2026) suggests minor differences from current
  docs. Pin to the developers.openai.com docs version, not third-party writeups.
- **Marketplace dual-tolerance**: Verified that Codex reads `.claude-plugin/marketplace.json`,
  but not verified end-to-end that an entry with `policy` + `category` round-trips cleanly
  through Claude Code's installer. Test before bumping the marketplace shape.
- **`allowed-tools` field**: marked experimental in the spec — semantics may differ slightly
  between vendors. Use it but don't rely on identical behavior.
- **AGENTS.md vs CLAUDE.md**: this repo's CLAUDE.md is fine for Claude Code. Projects that
  install this repo's plugins into a Codex environment will want a project-level AGENTS.md;
  consider documenting this in `docs/agile-workflow-guide.md`.

## References

- [Codex Plugins overview](https://developers.openai.com/codex/plugins) — install model,
  components (skills/apps/MCP), CLI commands, `~/.codex/config.toml` `enabled` flag
- [Build Codex plugins](https://developers.openai.com/codex/plugins/build) — full plugin.json
  schema, marketplace.json shape, source kinds, CLI commands
- [Codex Agent Skills overview](https://developers.openai.com/codex/skills) — SKILL.md format,
  storage scopes (REPO/USER/ADMIN/SYSTEM), 2% / 8K-char context budget for skill metadata
- [Codex Create Skill guide](https://developers.openai.com/codex/skills/create-skill) — required
  frontmatter, `agents/openai.yaml` schema, `allow_implicit_invocation` semantics
- [Codex AGENTS.md guide](https://developers.openai.com/codex/guides/agents-md) — discovery
  order, override files, `project_doc_fallback_filenames`, `project_doc_max_bytes`
- [Codex Configuration Reference](https://developers.openai.com/codex/config-reference) — full
  config.toml schema; `tool_suggest.disabled_tools` references plugins by id
- [Agent Skills open standard](https://agentskills.io) — cross-vendor home, client showcase
- [Agent Skills specification](https://agentskills.io/specification) — formal frontmatter
  spec, name/description rules, optional fields, validation tool `skills-ref`
- [AGENTS.md specification](https://agents.md/) — universal instruction-file format, 60k+
  projects, Linux Foundation / Agentic AI Foundation governance
- [openai/codex repo](https://github.com/openai/codex) — codex-rs and codex-cli source
- [openai/codex AGENTS.md](https://github.com/openai/codex/blob/main/AGENTS.md) — reference
  example of AGENTS.md in a real Rust monorepo
- [openai/skills catalog](https://github.com/openai/skills) — official Codex skills, `.system`
  ships built-in, `.curated` and `.experimental` install via `$skill-installer`
- [openai/skills curated example](https://github.com/openai/skills/tree/main/skills/.curated/gh-address-comments)
   — real SKILL.md with `agents/openai.yaml` extension
- [Sibling research: claude-code-marketplace](../../.agents/skills/claude-code-marketplace/SKILL.md)
   — companion findings for Claude Code's parallel format
