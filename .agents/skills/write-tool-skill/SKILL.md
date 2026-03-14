---
name: write-tool-skill
description: >
  Write agent skills for external tools, CLIs, MCP servers, and libraries. Use when creating
  a skill that teaches agents how to use a specific tool — covers research, structure decisions,
  description writing, progressive disclosure, reference splitting, multi-skill breakouts, and
  tap.json entries. Interactive workflow with user checkpoints at each phase.
user-invocable: true
allowed-tools: Read, Write, Glob, Grep, WebSearch, WebFetch, AskUserQuestion
---

# Write Tool Skill

You help the user create agent skills for external-facing tools — CLIs, MCP servers, libraries,
or combinations. The skill you produce teaches other agents how to use the tool effectively:
when to reach for it, what commands/tools/APIs to call, common workflows, and pitfalls.

## Context

- Tool: {{tool}}
- Output location: {{output_path}}

If no output path is given, ask the user where the skill should be written.

## Workflow

Work through these phases in order. Use AskUserQuestion at each checkpoint.
Do NOT skip checkpoints — the user's input shapes the skill.

### Phase 1: Research the tool

Gather information about the tool before proposing anything. **The codebase is the source of truth** —
docs may be outdated or aspirational. Use docs to guide what to look for, then validate against code.

1. **Read the codebase first** — find the actual CLI command definitions, MCP tool registrations,
   exported API surface. Use Glob/Grep to locate:
   - CLI: command definitions, argument specs, subcommand registrations
   - MCP: tool handler registrations, Zod schemas for parameters, tool descriptions
   - Library: exported functions/classes, public API, type signatures
2. **Search the web** for the tool's documentation, README, and any existing skills — use this
   to understand intent and discover features you might miss in code
3. **Cross-reference docs against code** — if docs say a flag exists, verify it's implemented.
   If code has a feature docs don't mention, include it. Trust code over docs.
4. **Check for CLI** — run `--help` if available, read the command registration source
5. **Check for MCP tools** — read the tool handler source to get actual parameter schemas and descriptions
6. **Check for library/SDK** — read exports, public types, and usage examples in tests

Summarize what you found for the user before moving on. Flag any discrepancies between docs and code.

### Phase 2: Scope & breakout checkpoint

Present the user with a proposed scope. Ask:

1. **What interfaces does this tool expose?** (CLI, MCP, library, browser extension, etc.)
2. **Who is the audience?** (agents using MCP tools, agents using CLI via bash, developers importing a library)
3. **Should this be one skill or multiple?**

#### When to recommend splitting into multiple skills

Recommend separate skills when:
- The tool has **distinct capability domains** with different "when to use" triggers
  (e.g., a debugger vs. a browser recorder — different problems, different tools)
- An agent doing task A would **never need** the instructions for task B
  (e.g., backend debugging doesn't need browser observation docs)
- The combined SKILL.md would **exceed ~300 lines** or reference files would bloat context
- Different audiences exist — one skill for CLI users, one for MCP users is usually wrong
  (same audience, different interface), but one skill for debugging Python and another for
  observing React state is right (different problems, different triggers)

Recommend keeping as one skill when:
- The capabilities are tightly coupled and usually used together
- The total content fits comfortably under 300 lines
- Splitting would force agents to load two skills for most tasks

If recommending a split, propose the skill names, descriptions, and what goes where.
Use AskUserQuestion to confirm with the user.

### Phase 3: Structure checkpoint

For each skill being created, propose:

1. **Name** — lowercase, hyphens, max 64 chars, matches directory name
2. **Description** — third person, specific keywords, both what-it-does and when-to-use-it
   (see [references/description-guide.md](references/description-guide.md))
3. **SKILL.md outline** — section headers with 1-line summaries of content
4. **Reference files** — what goes in `references/` vs. the main SKILL.md
   (see [references/progressive-disclosure.md](references/progressive-disclosure.md))

Present this to the user via AskUserQuestion. Adjust based on feedback.

### Phase 4: Write SKILL.md

Write the main skill file following these rules:

**Frontmatter:**
```yaml
---
name: the-skill-name
description: >
  Third-person description. Specific keywords. What it does AND when to use it.
  Max 1024 chars.
license: MIT
metadata:
  author: {infer from context or ask}
  version: "0.1"
allowed-tools: Bash({tool-command}:*)
---
```

**Body principles:**
- Lead with "when to use" — agents need to know if this skill is relevant before anything else
- Show MCP tools as a table: tool name | purpose (one line each)
- Show CLI commands as compact code blocks, not verbose explanations
- Include one concrete example workflow (MCP or CLI) — input → action → result
- Link to references for deep details — don't inline everything
- Under 500 lines total, ideally under 300
- Don't explain what the tool is at length — agents don't need marketing copy
- Don't include information agents already know (what a breakpoint is, what HTTP status codes mean)

Present the draft SKILL.md to the user. Ask for feedback before writing reference files.

### Phase 5: Write reference files

For each reference file in the plan:

- Keep files focused on one topic (one language, one subcommand group, one workflow)
- Include a table of contents if over 100 lines
- Use compact command/API reference format — not prose
- Don't duplicate content between references and SKILL.md

### Phase 6: Generate tap.json entry

If the skills are going into a tap repository, generate the tap.json entry:

```json
{
  "name": "skill-name",
  "description": "Same as SKILL.md description, shortened if needed",
  "repo": "{owner}/{repo}",
  "tags": ["relevant", "tags", "for", "discovery"]
}
```

Tags should include: the tool name, its category (cli, mcp, library), key concepts it covers.

Present the entry to the user for confirmation.

### Phase 7: Final review

Ask the user to review the complete output:
- Skill directory structure
- SKILL.md content
- Reference files
- tap.json entry

## Quality checklist

Before finishing, verify:
- [ ] Description is third person, includes keywords, says what AND when
- [ ] Name matches directory name, lowercase+hyphens only
- [ ] SKILL.md body under 500 lines (ideally under 300)
- [ ] References are one level deep from SKILL.md (no nested reference chains)
- [ ] No time-sensitive information
- [ ] Consistent terminology throughout
- [ ] Examples are concrete with real commands/tool calls, not abstract
- [ ] Agent already knows general concepts — only tool-specific knowledge included
- [ ] Progressive disclosure: overview in SKILL.md, details in references
- [ ] If multiple skills: each has a distinct trigger and standalone value
