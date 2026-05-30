# Progressive Disclosure for Tool Skills

Skills load in tiers. Structure content so agents pay tokens only for what they need.

## Tier 1: Metadata (~100 tokens, always loaded)

Just `name` and `description` from frontmatter. This is all agents see at startup.
The description must be good enough that agents know when to activate.

## Tier 2: SKILL.md body (<5000 tokens, loaded on activation)

The main instructions. For tool skills, this should contain:

1. **When to use** — bullet list of trigger conditions
2. **Tool/command table** — compact reference of available tools or commands
3. **One example workflow** — concrete, not abstract
4. **Links to references** — for details that don't belong in the overview

### What belongs in SKILL.md vs references

| In SKILL.md | In references/ |
|---|---|
| When to use this tool | Full CLI command reference with all flags |
| MCP tool table (name + purpose) | MCP tool parameter schemas and examples |
| One example workflow | Language-specific setup and gotchas |
| Key gotchas/pitfalls | Extended workflow patterns |
| Links to references | Troubleshooting guides |

### Rule of thumb

If an agent doing 80% of tasks with this tool needs the info, it goes in SKILL.md.
If only 20% of tasks need it, it goes in a reference file.

## Tier 3: Reference files (loaded on demand)

Agents read these only when SKILL.md links to them. Keep them focused:

- **One file per topic** — `references/python.md`, not `references/all-languages.md`
- **Table of contents** if over 100 lines
- **One level deep** from SKILL.md — don't have references linking to other references
- **Compact format** — command reference tables, not prose explanations

## Size guidelines

| Content | Target |
|---|---|
| SKILL.md body | Under 300 lines (hard max 500) |
| Individual reference file | Under 200 lines |
| Total skill directory | No practical limit (unreferenced files cost nothing) |

## Directory structure examples

### Simple tool (CLI only)

```
my-tool/
  SKILL.md
  references/
    cli.md          # Full command reference
```

### Tool with multiple interfaces

```
my-tool/
  SKILL.md
  references/
    cli.md          # CLI commands
    mcp-tools.md    # MCP tool schemas and examples
```

### Tool with language-specific setup

```
my-tool/
  SKILL.md
  references/
    cli.md
    python.md
    javascript.md
    go.md
```

### Multiple skills (after breakout)

```
my-tool-debug/
  SKILL.md
  references/
    cli.md
    python.md
    go.md

my-tool-browser/
  SKILL.md
  references/
    chrome.md
```
