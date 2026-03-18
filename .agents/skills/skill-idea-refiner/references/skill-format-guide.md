# Agent Skill Format Guide

Complete reference for authoring well-structured agent skills. Based on the Agent Skills open
standard (agentskills.io) and Claude Code platform conventions as of March 2026.

## Table of Contents

- [Directory Structure](#directory-structure)
- [SKILL.md Frontmatter](#skillmd-frontmatter)
- [Naming Rules](#naming-rules)
- [Writing Descriptions](#writing-descriptions)
- [Body Content Guidelines](#body-content-guidelines)
- [Reference Files](#reference-files)
- [Progressive Disclosure](#progressive-disclosure)
- [Skill Types & Patterns](#skill-types--patterns)
- [Interactive Skills](#interactive-skills)
- [tap.json Registration](#tapjson-registration)
- [Common Anti-Patterns](#common-anti-patterns)
- [Quality Checklist](#quality-checklist)

---

## Directory Structure

```
skill-name/
  SKILL.md              # Required — main instructions
  references/           # Optional — detailed docs loaded on demand
    topic-one.md
    topic-two.md
  scripts/              # Optional — executable helpers
  assets/               # Optional — templates, data files
```

Skills live in:
| Scope | Path |
|---|---|
| Project | `.claude/skills/` or `.agents/skills/` |
| User/global | `~/.claude/skills/` or `~/.agents/skills/` |

---

## SKILL.md Frontmatter

```yaml
---
name: my-skill              # Required. Must match directory name.
description: >              # Required. Max 1024 chars.
  Third-person description of what the skill does and when to use it.
user-invocable: true        # Optional. Show in /slash menu. Default: false.
disable-model-invocation: true  # Optional. Prevent auto-triggering. Default: false.
model: sonnet               # Optional. Override model (sonnet, opus).
allowed-tools: Read, Grep   # Optional. Restrict available tools.
license: MIT                # Optional. License identifier.
metadata:                   # Optional. Arbitrary key-value pairs.
  author: your-name
  version: "0.1"
---
```

| Field | Required | Notes |
|---|---|---|
| `name` | Yes | Max 64 chars. Lowercase, numbers, hyphens only. |
| `description` | Yes | Max 1024 chars. Third person. What + when. |
| `user-invocable` | No | `true` = appears in slash menu. `false` = background only. |
| `disable-model-invocation` | No | `true` = manual trigger only, never auto-invoked. |
| `model` | No | `opus` for complex orchestration, `sonnet` for standard. |
| `allowed-tools` | No | Comma-separated. Restricts which tools the skill can use. |
| `license` | No | License name or reference to bundled file. |
| `metadata` | No | Author, version, tags, etc. |

### String substitutions

Available in the SKILL.md body:
- `$ARGUMENTS` — full argument string from `/skill-name args here`
- `$ARGUMENTS[0]`, `$1`, `$2` — positional arguments
- `${CLAUDE_SESSION_ID}` — current session identifier
- `${CLAUDE_SKILL_DIR}` — absolute path to the skill's directory

### Dynamic context injection

`` !`shell command` `` — runs before skill content reaches the agent, replaced with output.

---

## Naming Rules

- Lowercase letters, numbers, hyphens only
- No leading/trailing hyphens: `my-tool` not `-my-tool-`
- No consecutive hyphens: `my-tool` not `my--tool`
- Must match parent directory name exactly
- Cannot contain "anthropic" or "claude"
- Versioned libraries include major version: `zod-v4`, `hono-v4`
- Max 64 characters

---

## Writing Descriptions

The description is the **most important field**. It's loaded into context at startup (~100 tokens)
and determines whether agents activate the skill.

### Pattern

```
{What it does — 1-2 sentences with action verbs and specific names}.
{Use when / Auto-loads when} {trigger conditions}.
```

### Rules

1. **Third person always.** "Extracts PDF text" not "I extract PDF text"
2. **Max 1024 chars.** Aim for 150-300 for most skills.
3. **What + when.** Both required. What it does AND when to use it.
4. **Specific keywords.** Include tool names, command names, file types, error types.
5. **No marketing copy.** Agents don't need to be sold on the skill.

### Good examples

```yaml
# Reference skill
description: >
  Zod v4 validation library reference. Covers z.object, z.string, safeParse, transforms,
  discriminated unions, and error formatting. Auto-loads for schema definitions, input
  validation, and Zod-related type errors.

# Workflow skill
description: >
  Design a comprehensive end-to-end test suite for a project. Explores the codebase,
  understands user-facing behavior from docs and code, then designs two test sets:
  golden-path user journey tests and adversarial/failure-mode tests. Interactive.

# Interactive skill
description: >
  Audit, validate, and interactively refine MEMORY.md. Use when memory has grown
  stale, bloated, or inconsistent.
```

### Bad examples

```yaml
description: Helps with debugging.              # Too vague, no keywords, no trigger
description: I help you debug code.             # First person
description: The best debugging skill ever.     # Marketing copy
```

---

## Body Content Guidelines

### Size targets

| Content | Target | Hard max |
|---|---|---|
| SKILL.md body | Under 300 lines | 500 lines |
| Individual reference file | Under 150 lines | 200 lines |

### Structure

1. **Lead with "when to use"** — agents need relevance before instructions
2. **Compact command/tool tables** — not verbose prose
3. **One concrete example workflow** — input, action, result
4. **Links to references** for deep details
5. **Anti-patterns section** — what NOT to do (prevents common mistakes)
6. **Quality checklist** — measurable completion criteria

### What NOT to include

- Things agents already know (what HTTP status codes mean, what a function is)
- Lengthy tool introductions or history
- Marketing language or motivation paragraphs
- Duplicate content between SKILL.md and references

---

## Reference Files

### When to use

| In SKILL.md (80% of tasks need it) | In references/ (20% of tasks need it) |
|---|---|
| When to use this tool | Full CLI command reference with all flags |
| Tool/command table (name + purpose) | Parameter schemas and detailed examples |
| One example workflow | Language-specific setup and gotchas |
| Key pitfalls | Extended workflow patterns |
| Links to references | Troubleshooting guides |

### Rules

- **One file per topic** — `references/cli.md`, not `references/everything.md`
- **Table of contents** if over 100 lines
- **One level deep** — references don't link to other references
- **Compact format** — tables and code blocks, not prose
- **Forward slashes only** in paths

---

## Progressive Disclosure

Skills load in tiers. Structure content so agents pay tokens only for what they need.

| Tier | Content | Where | Size |
|---|---|---|---|
| 1 | Name + description only | Frontmatter | ~100 tokens |
| 2 | Main instructions | SKILL.md body | <5000 tokens |
| 3 | Deep details | references/ | On demand |

Unreferenced files in Tier 3 cost nothing. Only load when SKILL.md links to them.

---

## Skill Types & Patterns

### Reference skills (library/tool/API)

- `user-invocable: false` (or omit)
- Auto-loads based on description keywords
- Compact: command tables, code examples, pitfalls
- Example: `zod-v4`, `hono-v4`, `bun`

### Workflow skills (multi-step process)

- `user-invocable: true` typically
- Phase-based with clear checkpoints
- Produces an output artifact (design doc, test plan, etc.)
- Example: `e2e-test-design`, `write-tool-skill`

### Principle skills (conventions/standards)

- `user-invocable: false`
- Auto-loads when relevant work is happening
- Short, declarative rules with examples
- Example: `design-principles`, `implementation-principles`

### Interactive skills (user interview + artifact)

- `user-invocable: true`
- Uses AskUserQuestion at decision points
- Conversational between checkpoints
- Produces a user-shaped artifact
- Example: `clean-memory`, `stylistic-refactor-creator`

---

## Interactive Skills

### When to use AskUserQuestion

- **Decisions that change direction** — scope choices, naming, structure approval
- **Information only the user has** — preferences, constraints, context
- **Confirmation gates** — before writing files or finalizing output

### When to just talk

- **Presenting findings** — research results, analysis, observations
- **Creative ideation** — suggesting options, riffing on ideas
- **Explaining tradeoffs** — pros/cons of different approaches
- **Status updates** — summarizing what was done

### Pattern

```markdown
**AskUserQuestion checkpoint:**
- Present context and options clearly
- Ask a specific question with concrete choices
- Include an "other" or open-ended escape hatch
```

---

## tap.json Registration

For skills published to a tap repository:

```json
{
  "name": "skill-name",
  "description": "Same as SKILL.md description, shortened if needed",
  "repo": "owner/repo",
  "tags": ["domain", "tool-name", "category", "key-concepts"]
}
```

Tags should include: tool/domain name, category (cli, mcp, library, workflow, interactive),
and 2-3 key concepts the skill covers.

---

## Common Anti-Patterns

| Anti-pattern | Why it's bad | Fix |
|---|---|---|
| Monolithic skill (>500 lines) | Loads too much context, slow activation | Split into focused skills |
| Vague description | Agents can't match it to tasks | Add specific keywords and triggers |
| No trigger conditions | Skill never auto-activates | Add "Use when" / "Auto-loads when" |
| Marketing copy in body | Wastes tokens on non-actionable text | Lead with instructions |
| Duplicate content across files | Wastes tokens, causes inconsistency | Single source of truth |
| Nested reference chains | Agents get lost following links | One level deep only |
| Over-broad scope | Does many things poorly | Focus on one domain |
| Missing anti-patterns section | Agents make avoidable mistakes | Document what NOT to do |
| No quality checklist | No way to verify completeness | Add measurable criteria |
| Time-sensitive content | Becomes stale quickly | Use dynamic injection or keep evergreen |

---

## Quality Checklist

Before publishing any skill, verify:

- [ ] Name matches directory, lowercase+hyphens only, max 64 chars
- [ ] Description is third person, includes keywords, says what AND when
- [ ] SKILL.md body under 500 lines (ideally under 300)
- [ ] References are one level deep (no chains)
- [ ] No time-sensitive information that will become stale
- [ ] Consistent terminology throughout
- [ ] Examples are concrete with real commands/calls, not abstract
- [ ] Only tool-specific knowledge included (skip what agents already know)
- [ ] Progressive disclosure applied (overview in SKILL.md, details in references)
- [ ] Anti-patterns section included
- [ ] If interactive: AskUserQuestion used at decision points, conversation used for exploration
- [ ] If multi-skill: each has a distinct trigger and standalone value
