# Writing Effective Skill Descriptions

The description is the most important field — it determines whether agents activate the skill.
It's injected into the system prompt at startup (~100 tokens) and must help agents decide
"is this skill relevant to my current task?"

## Rules

- **Third person always.** "Extracts PDF text" not "I can extract PDF text" or "Use this to extract"
- **Max 1024 characters.** Aim for 150-300 chars for tool skills
- **What it does + when to use it.** Both are required
- **Include specific keywords** that match how agents encounter the tool:
  - Tool name, command names, MCP tool prefixes
  - File types, protocols, error types it handles
  - Framework/language names if scoped

## Pattern

```
{What it does — 1-2 sentences with action verbs and specific tool names}.
Use when {trigger conditions — specific situations where an agent should reach for this}.
```

## Good examples

```yaml
# CLI tool
description: >
  Krometrail runtime debugging reference. Covers breakpoints, stepping, variable
  inspection, and watch expressions via debug_* MCP tools or krometrail CLI commands.
  Use when a test fails and reading the code isn't enough to find why, when you need
  to inspect runtime values, or when tracing logic through closures, async, or pipelines.

# Library
description: >
  Zod v4 validation library reference. Covers z.object, z.string, safeParse, transforms,
  discriminated unions, and error formatting. Auto-loads for schema definitions, input
  validation, and Zod-related type errors.

# MCP server
description: >
  GitHub MCP server tool reference. Covers create_issue, search_repos, get_file_contents,
  and pull request tools. Use when interacting with GitHub repositories, issues, or PRs
  through MCP tools prefixed with github_*.
```

## Bad examples

```yaml
# Too vague — no keywords, no trigger
description: Helps with debugging.

# First person
description: I help you debug code using breakpoints.

# No trigger condition
description: Runtime debugging across 10 languages with breakpoints and stepping.

# Marketing copy instead of agent instructions
description: >
  The most powerful debugging tool for AI agents, with industry-leading
  viewport compression and unmatched language support.
```

## Keywords to include

For **CLI tools**: command names, flag patterns, subcommand groups
For **MCP servers**: tool name prefixes (debug_*, chrome_*, session_*)
For **Libraries**: import paths, key function/class names, common error types
For **All**: the tool's proper name, the problem domain, file types handled
