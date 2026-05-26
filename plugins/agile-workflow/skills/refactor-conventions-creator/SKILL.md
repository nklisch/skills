---
name: refactor-conventions-creator
description: >
  Create or update a project-specific refactor-conventions skill. Explores the repo,
  researches stack-specific best practices, interviews the user about both stylistic
  preferences (early returns, error handling, paradigm, composition patterns) and
  structural preferences (file size, folder layout, module boundaries, co-location),
  then generates a combined skill with per-rule reference files. The generated skill
  proactively scans for opportunities and produces a prioritized refactoring plan.
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, WebSearch, WebFetch, AskUserQuestion
---

# Refactor Conventions Creator

You create (or update) a project-specific **refactor-conventions** skill that teaches agents
to recognize and apply the team's preferred coding style and project organization when refactoring.

This covers two axes:
- **Stylistic** — opinionated code choices: functional vs class-based, early returns, composition over inheritance, error handling style, etc. NOT about formatting (that's linters).
- **Structural** — organizational choices: where files live, how big they get, what gets grouped together, how modules draw boundaries. NOT about code style or architectural theory.

The goal is a **unified, navigable codebase** — not refactoring for its own sake.

## Phase 1: Check for Existing Skill

Check if a refactor-conventions skill already exists:

```
Glob: .claude/skills/refactor-conventions/SKILL.md
Glob: .agents/skills/refactor-conventions/SKILL.md
```

**If found**: Read the existing SKILL.md and all its reference files. Present the current rules
to the user and ask (via AskUserQuestion):
- "You already have a refactor-conventions skill with these rules: [list]. Would you like to add
  new rules, update existing ones, or start fresh?"

Proceed accordingly — add to existing references or regenerate.

**If not found**: Continue to Phase 2.

## Phase 2: Explore the Codebase

Scan the repo to understand its current coding style and organizational structure. Use the
Explore sub-agent for thorough analysis:
- **Claude Code / Anthropic:** Sonnet minimum, Opus for large or complex codebases.
- **Codex / OpenAI:** `reasoning_effort: medium`; use `high` for large or
  complex codebases.

Look for both dimensions:

**Stylistic signals:**
1. **Paradigm** — Classes? Functional components? Both? Mixed?
2. **Control flow style** — Early returns vs deep nesting? Guard clauses? Ternaries?
3. **Composition patterns** — Inheritance chains? HOCs? Hooks? Pipes? Middleware?
4. **Error handling** — Try/catch? Result types? Error callbacks? Thrown exceptions?
5. **Function size** — Long procedural functions? Small composable units?
6. **Abstraction level** — Heavy abstraction? Pragmatic duplication? Thin wrappers?

**Structural signals:**
7. **File size distribution** — Find the largest files. Note files over 300 lines.
8. **Folder layout pattern** — Feature-based? Layer-based? Hybrid? Flat?
9. **Module boundary signals** — What's grouped in the same folder? Are related files scattered?
10. **Co-location patterns** — Tests next to source? Types co-located or centralized?
11. **Import direction** — Do files import upward? Cross-feature? Circular dependencies?
12. **Documentation layout** — Where do docs live? Consistent structure?

Note BOTH consistencies and inconsistencies — the user wants to confirm even consistent patterns.

Summarize findings in 10-15 bullet points covering both axes.

## Phase 3: Research Stack-Specific Conventions

Based on what you found in Phase 2, research conventions specific to the stack:

1. **Identify the stack**: language(s), frameworks, build tools, domain
2. **Web search** for authoritative guides covering both style and structure:
   - Official language style guides (e.g., "Rust API guidelines", "Go effective go")
   - Framework conventions (e.g., "Next.js project structure", "React hooks best practices")
   - Domain-specific patterns (e.g., "monorepo organization", "API design principles")
3. **Read in-repo docs**: Check for CONTRIBUTING.md, style guides, linter configs, architecture docs, ADRs

Collect relevant recommendations to weave into the interview.

## Phase 4: Interview the User

Conduct a natural conversation using AskUserQuestion. Weave together three sources:
1. **Repo findings** from Phase 2 (what the code and structure actually look like)
2. **Research results** from Phase 3 (what experts recommend for this stack)
3. **Generic preferences** from `references/common-styles.md` and `references/common-structures.md`

Do NOT present these as separate lists. Integrate them naturally:
- "I found your codebase mixes early returns and nested conditionals — do you want to codify early returns as the rule?"
- "Your largest files are auth.ts (800 lines) and api-client.ts (600 lines). Want to set a file size limit?"
- "Your project uses a layer-based layout (controllers/, services/) but some features span 5+ folders. Would you prefer feature-based grouping?"

For each preference the user expresses, collect:
- **The rule** (one sentence)
- **Axis**: stylistic or structural
- **Why** (motivation — readability? navigability? consistency? maintainability?)
- **Exceptions** (when the rule should NOT apply)

Aim for **3-8 stylistic rules** and **4-10 structural rules**. Too many becomes noise.

## Phase 5: Generate the Skill

### Determine output location

Look for the project's skill directory:
- `.agents/skills/` (preferred)
- `.claude/skills/`

If neither exists, ask the user. Create: `{skill-dir}/refactor-conventions/`

After creating the skill, symlink it into `.claude/skills/` so Claude can discover it:
```bash
mkdir -p .claude/skills
ln -sf ../../.agents/skills/refactor-conventions .claude/skills/refactor-conventions
```

### Generate SKILL.md

The generated SKILL.md must be SHORT — under 80 lines. It serves as an index pointing to reference files.

```markdown
---
name: refactor-conventions
description: >
  Project refactoring conventions for [language/stack]. Proactively scans for
  style and structural opportunities, produces a prioritized refactoring plan.
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Agent, Write
---

# Refactor Conventions

Scan the codebase for opportunities to apply these conventions.
Each rule has a reference file with rationale, examples, and exceptions.

## Style Rules

| Rule | Summary (one line) | Reference |
|------|-------------------|-----------|
| {name} | {one-sentence rule} | [details](references/style/{slug}.md) |

## Structure Rules

| Rule | Summary (one line) | Reference |
|------|-------------------|-----------|
| {name} | {one-sentence rule} | [details](references/structure/{slug}.md) |

## Output

Write the refactoring plan to a `.md` file following the project's conventions.

The plan has separate sections for Style Refactors and Structure Refactors, each with:

### High Value
{Implement-ready entries with current/target state and acceptance criteria}

### Worth Considering
{Valid refactors with file paths and rationale — not implement-ready detail}

### Not Worth It
{Code that technically violates a rule but should NOT be refactored — with WHY}
```

### Generate Reference Files

For each stylistic rule, create `references/style/{rule-slug}.md`.
For each structural rule, create `references/structure/{rule-slug}.md`.

Both follow the same template:

```markdown
# {Style|Structure} Rule: {Name}

> {One-sentence rule}

## Motivation

{Why this matters — 2-3 sentences, stack-specific}

## Before / After

### From this codebase: {scenario}

**Before:** (actual code or directory tree from the repo)
```
{real example showing the current pattern}
```

**After:**
```
{preferred version}
```

### Synthetic example: {scenario}

**Before:**
```
{synthetic anti-pattern}
```

**After:**
```
{synthetic preferred pattern}
```

## Exceptions

- {When this rule should NOT apply — be specific}

## Scope

- Applies to: {areas, layers, or file types}
- Does NOT apply to: {exclusions}
```

Use BOTH real codebase examples and synthetic examples for each rule.

## Phase 6: Present and Confirm

Show the user:
1. The list of style rules and structure rules with their one-line summaries
2. The generated SKILL.md (abbreviated)
3. The file tree created

Ask if they want to adjust anything before finalizing.

## Anti-Patterns

- NEVER include formatting rules (indentation, semicolons, quotes) — that's linter territory
- NEVER include architectural theory (ports & adapters, dependency inversion) — that's the principles skill's territory
- NEVER generate more than 10 style rules or 12 structure rules — curate ruthlessly
- NEVER write reference files longer than 150 lines — keep them scannable
- NEVER assume a preference — always confirm with the user via AskUserQuestion
- NEVER suggest refactoring that causes massive import churn for marginal benefit
- NEVER suggest refactoring that adds complexity just to fit code into a stylistic box

## Quality Checklist

Before finishing:
- [ ] SKILL.md is under 80 lines
- [ ] Each rule has a reference file with before/after examples (both real and synthetic)
- [ ] Each reference file is under 150 lines
- [ ] Exceptions are documented for every rule
- [ ] Style and structural rules are in separate subdirectories
- [ ] Generated skill produces a plan with implement-ready High Value entries and a "not worth it" section
