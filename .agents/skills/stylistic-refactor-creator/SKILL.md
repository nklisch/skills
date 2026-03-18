---
name: stylistic-refactor-creator
description: >
  Create or update a project-specific stylistic-refactor skill. Explores the repo, researches
  stack-specific best practices, interviews the user about their stylistic preferences, then
  generates a stylistic-refactor skill with per-style reference files. The generated skill
  proactively scans for refactoring opportunities and produces a prioritized backlog.
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, WebSearch, WebFetch, AskUserQuestion
---

# Stylistic Refactor Creator

You create (or update) a project-specific **stylistic-refactor** skill that teaches agents to
recognize and apply the team's preferred coding style when refactoring.

This is NOT about formatting (that's linters) or structural patterns (that's extract-patterns).
This is about **opinionated stylistic choices**: functional over class-based, early returns over
nested conditionals, composition over inheritance, declarative over imperative, etc.

The goal is a **unified feel and design** to the codebase — not refactoring for refactoring's sake.

## Phase 1: Check for Existing Skill

Check if a stylistic-refactor skill already exists:

```
Glob: .claude/skills/stylistic-refactor/SKILL.md
Glob: .agents/skills/stylistic-refactor/SKILL.md
```

**If found**: Read the existing SKILL.md and all its reference files. Present the current styles
to the user and ask (via AskUserQuestion):
- "You already have a stylistic-refactor skill with these styles: [list]. Would you like to add
  new styles, update existing ones, or start fresh?"

Proceed accordingly — add to existing references or regenerate.

**If not found**: Continue to Phase 2.

## Phase 2: Explore the Codebase

Scan the repo to understand its current coding style. Use the Explore agent for thorough analysis.
Look for:

1. **Paradigm signals** — Classes? Functional components? Both? Mixed?
2. **Control flow style** — Early returns vs deep nesting? Guard clauses? Ternaries?
3. **Composition patterns** — Inheritance chains? HOCs? Hooks? Pipes? Middleware?
4. **Error handling** — Try/catch? Result types? Error callbacks? Thrown exceptions?
5. **State management** — Mutable state? Immutable patterns? Reactive streams?
6. **Naming conventions** — Verbose vs terse? Boolean prefixes? Consistent terminology?
7. **Function size** — Long procedural functions? Small composable units?
8. **Abstraction level** — Heavy abstraction? Pragmatic duplication? Thin wrappers?

Note BOTH consistencies and inconsistencies — the user wants to confirm even consistent patterns.

Summarize findings in 5-10 bullet points.

## Phase 3: Research Stack-Specific Best Practices

Based on what you found in Phase 2, research best practices specific to the project's stack:

1. **Identify the stack**: language(s), frameworks, domain (API, frontend, CLI, game engine, ML, etc.)
2. **Web search** for authoritative style guides and best practices:
   - Official language style guides (e.g., "Rust API guidelines", "Go effective go")
   - Framework-specific conventions (e.g., "Godot GDScript style", "React hooks best practices")
   - Domain-specific patterns (e.g., "game architecture patterns", "API design principles")
3. **Read in-repo docs**: Check for CONTRIBUTING.md, style guides, linter configs (.eslintrc,
   rustfmt.toml, .editorconfig), design docs, or ADRs that express style opinions

Collect relevant recommendations to weave into the interview.

## Phase 4: Interview the User

Conduct a natural conversation using AskUserQuestion. Weave together three sources:

1. **Repo findings** from Phase 2 (what the code actually does)
2. **Research results** from Phase 3 (what experts recommend for this stack)
3. **Generic preferences** from `references/common-styles.md` (common stylistic choices)

Do NOT present these as separate lists. Integrate them naturally:
- "I found your codebase mixes early returns and nested conditionals. The [language] style guide
  recommends early returns. Do you want to codify that?"
- "Your error handling is consistent with Result types — want to lock that in as a rule?"
- "A common practice in [framework] projects is X — any interest?"

For each preference the user expresses, collect:
- **The rule** (one sentence)
- **Why** (motivation — readability? testability? consistency? unified feel?)
- **Exceptions** (when the rule should NOT apply)

Aim for 3-8 styles. More than 10 becomes noisy; fewer than 3 is too thin.

## Phase 5: Generate the Skill

### Determine output location

Look for the project's skill directory:
- `.agents/skills/` (preferred)
- `.claude/skills/`

If neither exists, ask the user. Create: `{skill-dir}/stylistic-refactor/`

After creating the skill, symlink it into `.claude/skills/` so Claude can discover it:
```bash
mkdir -p .claude/skills
ln -sf ../../.agents/skills/stylistic-refactor .claude/skills/stylistic-refactor
```

### Generate SKILL.md

The generated SKILL.md must be SHORT — under 60 lines. It serves as an index pointing to
reference files. Use this structure:

```markdown
---
name: stylistic-refactor
description: >
  Project stylistic refactoring rules for [language/stack]. Proactively scans for refactoring
  opportunities and produces a prioritized backlog. Defines the team's preferred coding style.
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Agent, Write
---

# Stylistic Refactor

Scan the codebase for opportunities to apply these stylistic preferences.
Each style has a reference file with rationale, examples, and exceptions.

## Styles

| Style | Rule (one line) | Reference |
|-------|-----------------|-----------|
| {name} | {one-sentence rule} | [details]({ref-path}) |

## Output

Write the refactoring backlog to a `.md` file in a logical project location. Name and place it
based on the project's conventions — e.g., `docs/stylistic-refactor-backlog.md`, `REFACTORING.md`,
or `{docs-dir}/refactoring-backlog.md`. If the project has a `docs/` directory, prefer it.
If no obvious location exists, place it at the repo root as `stylistic-refactor-backlog.md`.

The document should be a **prioritized refactoring backlog** with three tiers:

### High Value
Refactors that significantly improve readability, consistency, or maintainability
with low risk. Each entry: file path, current code snippet, proposed change, rationale.

### Worth Considering
Valid refactors with moderate impact or moderate effort. Include rationale.

### Not Worth It
Code that technically violates a style but should NOT be refactored. Include WHY:
too destructive, too complex for marginal gain, would obscure domain logic, breaks
API contracts, or forces unnatural patterns. We want a unified feel, not refactoring
for refactoring's sake.

Focus on code that benefits from the change — skip trivial or cosmetic-only improvements.
```

### Generate Reference Files

For each style, create `references/{style-slug}.md`:

```markdown
# Style: {Name}

> {One-sentence rule}

## Motivation

{Why this style matters — 2-3 sentences, language/stack-specific}

## Before / After

### From this codebase: {scenario}

**Before:** (actual code from the repo)
```{lang}
{real code showing the current pattern}
```

**After:**
```{lang}
{refactored version}
```

### Synthetic example: {scenario}

**Before:**
```{lang}
{synthetic anti-pattern}
```

**After:**
```{lang}
{synthetic preferred style}
```

## Exceptions

- {When this rule should NOT apply — be specific}

## Scope

- Applies to: {file types, layers, or areas}
- Does NOT apply to: {exclusions}
```

Use BOTH real codebase examples and synthetic examples for each style.

## Phase 6: Present and Confirm

Show the user:
1. The list of styles with their one-line rules
2. The generated SKILL.md (abbreviated)
3. The file tree that was created

Ask if they want to adjust anything before finalizing.

## Anti-Patterns

- NEVER include formatting rules (indentation, semicolons, quotes) — that's linter territory
- NEVER include structural patterns (module organization, dependency direction) — that's design-principles territory
- NEVER generate more than 10 styles — curate ruthlessly
- NEVER write reference files longer than 150 lines — keep them scannable
- NEVER assume a style preference — always confirm with the user via AskUserQuestion
- NEVER suggest refactoring that adds complexity just to fit code into a stylistic box

## Quality Checklist

Before finishing:
- [ ] SKILL.md is under 60 lines
- [ ] Each style has a reference file with before/after examples (both real and synthetic)
- [ ] Each reference file is under 150 lines
- [ ] Exceptions are documented for every style
- [ ] Examples use the project's actual language and conventions
- [ ] No overlap with linter rules or structural patterns
- [ ] Generated skill outputs a prioritized backlog with a "not worth it" section
