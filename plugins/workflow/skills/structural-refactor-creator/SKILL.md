---
name: structural-refactor-creator
description: >
  Create or update a project-specific structural-refactor skill. Explores the repo, researches
  stack-specific organizational conventions, interviews the user about their structural preferences
  (file size, folder layout, module boundaries, co-location, separation of concerns, documentation
  layout), then generates a structural-refactor skill with per-category reference files. The
  generated skill proactively scans for organizational issues and produces a prioritized plan.
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, WebSearch, WebFetch, AskUserQuestion
---

# Structural Refactor Creator

You create (or update) a project-specific **structural-refactor** skill that teaches agents to
recognize and fix organizational issues in a codebase.

This is NOT about code style (that's stylistic-refactor), deduplication (that's refactor-design),
or architectural theory (that's design-principles). This is about **concrete organizational
structure**: where files live, how big they get, what gets grouped together, and how modules
draw their boundaries.

The goal is a **well-organized, navigable codebase** — not reorganization for its own sake.

## Phase 1: Check for Existing Skill

Check if a structural-refactor skill already exists:

```
Glob: .claude/skills/structural-refactor/SKILL.md
Glob: .agents/skills/structural-refactor/SKILL.md
```

**If found**: Read the existing SKILL.md and all its reference files. Present the current rules
to the user and ask (via AskUserQuestion):
- "You already have a structural-refactor skill with these rules: [list]. Would you like to add
  new rules, update existing ones, or start fresh?"

Proceed accordingly — add to existing references or regenerate.

**If not found**: Continue to Phase 2.

## Phase 2: Explore the Codebase

Scan the repo to understand its current organizational structure. Use the Explore agent for
thorough analysis. Look for:

1. **File size distribution** — Find the largest files (by line count). Note files over 300 lines.
   Run: `find src -name '*.{ext}' | xargs wc -l | sort -rn | head -30`
2. **Folder layout pattern** — Is it feature-based (user/, billing/, auth/), layer-based
   (controllers/, services/, models/), hybrid, or flat? How deep is the nesting?
3. **Module boundary signals** — What's grouped in the same folder? Are related files scattered
   across the tree? Are there clear public APIs (index files, barrel exports)?
4. **Co-location patterns** — Tests next to source or in a separate tree? Types co-located or
   centralized? Styles beside components or in a styles/ folder?
5. **Barrel/index file usage** — Are index files used for public APIs? Are they re-exporting
   everything or curating exports? Are they missing where expected?
6. **File and folder naming** — kebab-case? PascalCase? Suffixes like .service.ts, .util.ts?
   Is naming consistent across the codebase?
7. **Import direction** — Do files import upward in the tree? Cross-feature? Are there circular
   dependencies? Is there a clear dependency direction?
8. **Documentation layout** — Where do docs live? Is there a docs/ folder? READMEs per feature?
   Are docs co-located with the code they describe? Is the structure consistent?
9. **Class/type size** — Are there god classes handling many responsibilities? Are types
   co-located with their implementations or centralized?

Note BOTH consistencies and inconsistencies — the user wants to confirm even consistent patterns.

Summarize findings in 8-12 bullet points covering each category.

## Phase 3: Research Stack-Specific Conventions

Based on what you found in Phase 2, research organizational conventions specific to the stack:

1. **Identify the stack**: language(s), frameworks, build tools, domain
2. **Web search** for authoritative project layout guides:
   - Official framework conventions (e.g., "Next.js app router project structure",
     "Go standard project layout", "Rust workspace organization")
   - Community best practices (e.g., "React feature-based folder structure",
     "Django project organization", "Godot project structure")
   - Domain-specific patterns (e.g., "monorepo organization", "microservice layout")
3. **Read in-repo docs**: Check for CONTRIBUTING.md, architecture docs, ADRs, or any files
   that express opinions about project structure

Collect relevant recommendations to weave into the interview.

## Phase 4: Interview the User

Conduct a natural conversation using AskUserQuestion. Weave together three sources:

1. **Repo findings** from Phase 2 (what the structure actually looks like)
2. **Research results** from Phase 3 (what the ecosystem recommends)
3. **Generic preferences** from `references/common-structures.md` (common structural choices)

Do NOT present these as separate lists. Integrate them naturally:
- "Your largest files are auth.ts (800 lines) and api-client.ts (600 lines). The [framework]
  community generally recommends max 300 lines per file. Want to set a file size limit?"
- "Your project uses a layer-based layout (controllers/, services/) but some features span
  5+ folders. Would you prefer feature-based grouping?"
- "Tests are in a separate __tests__/ tree, but your types are co-located. Want to standardize
  on one co-location approach?"

For each preference the user expresses, collect:
- **The rule** (one sentence)
- **Why** (motivation — navigability? discoverability? maintainability? onboarding?)
- **Exceptions** (when the rule should NOT apply)

Aim for 4-10 structural rules. More than 12 becomes noisy; fewer than 3 is too thin.

## Phase 5: Generate the Skill

### Determine output location

Look for the project's skill directory:
- `.agents/skills/` (preferred)
- `.claude/skills/`

If neither exists, ask the user. Create: `{skill-dir}/structural-refactor/`

After creating the skill, symlink it into `.claude/skills/` so Claude can discover it:
```bash
mkdir -p .claude/skills
ln -sf ../../.agents/skills/structural-refactor .claude/skills/structural-refactor
```

### Generate SKILL.md

The generated SKILL.md must be SHORT — under 60 lines. It serves as an index pointing to
reference files. Use this structure:

```markdown
---
name: structural-refactor
description: >
  Project structural organization rules for [language/stack]. Proactively scans for organizational
  issues and produces a prioritized plan. Defines the team's preferred file, folder, and module
  structure.
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Agent, Write
---

# Structural Refactor

Scan the codebase for organizational issues based on these structural rules.
Each rule has a reference file with rationale, examples, and exceptions.

## Rules

| Rule | Summary (one line) | Reference |
|------|-------------------|-----------|
| {name} | {one-sentence rule} | [details]({ref-path}) |

## Output

Write the refactoring plan to a `.md` file in a logical project location. Name and place it
based on the project's conventions — e.g., `docs/structural-refactor-plan.md`,
or `{docs-dir}/structural-refactor-plan.md`. If the project has a `docs/` directory, prefer it.
If no obvious location exists, place it at the repo root as `structural-refactor-plan.md`.

The document should be a **prioritized refactoring plan** with these sections:

### High Value

Structural changes that significantly improve navigability, maintainability, or developer
onboarding with low risk. Each entry must be **implement-ready**:

#### {N}. {Name}
**Files**: `src/path/old-location.ts` → `src/path/new-location.ts`
**Rule**: {which structural rule}

**Current**:
\`\`\`
{actual directory tree or file layout}
\`\`\`

**Target**:
\`\`\`
{reorganized structure}
\`\`\`

**Implementation Notes**:
- Import updates needed
- Files affected by the move

**Acceptance Criteria**:
- [ ] Files moved to target locations
- [ ] All imports updated
- [ ] Build passes
- [ ] Tests pass

---

### Worth Considering

Valid reorganizations with moderate impact or moderate effort. Brief entries with
file paths and rationale — not implement-ready detail.

### Not Worth It

Code that technically violates a structural rule but should NOT be reorganized. Include WHY:
too many dependents, would break imports across the codebase, churn outweighs benefit, the
current structure has historical reasons that still apply.
```

### Generate Reference Files

For each structural rule, create `references/{rule-slug}.md`:

```markdown
# Rule: {Name}

> {One-sentence rule}

## Motivation

{Why this structural choice matters — 2-3 sentences, stack-specific}

## Before / After

### From this codebase: {scenario}

**Before:** (actual structure from the repo)
```
{real directory tree or file layout showing the current pattern}
```

**After:**
```
{reorganized structure}
```

### Synthetic example: {scenario}

**Before:**
```
{synthetic anti-pattern}
```

**After:**
```
{synthetic preferred structure}
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
1. The list of structural rules with their one-line summaries
2. The generated SKILL.md (abbreviated)
3. The file tree that was created

Ask if they want to adjust anything before finalizing.

## Anti-Patterns

- NEVER include code style rules (early returns, composition) — that's stylistic-refactor territory
- NEVER include deduplication work — that's refactor-design territory
- NEVER include architectural theory (ports & adapters) — that's design-principles territory
- NEVER include formatting rules — that's linter territory
- NEVER generate more than 12 structural rules — curate ruthlessly
- NEVER write reference files longer than 150 lines — keep them scannable
- NEVER assume a structural preference — always confirm with the user via AskUserQuestion
- NEVER suggest reorganization that would cause massive import churn for marginal benefit

## Quality Checklist

Before finishing:
- [ ] SKILL.md is under 60 lines
- [ ] Each rule has a reference file with before/after examples (both real and synthetic)
- [ ] Each reference file is under 150 lines
- [ ] Exceptions are documented for every rule
- [ ] Examples use the project's actual directory structure and conventions
- [ ] No overlap with stylistic-refactor, refactor-design, or design-principles
- [ ] Generated skill outputs a prioritized plan with implement-ready High Value entries and a "not worth it" section
