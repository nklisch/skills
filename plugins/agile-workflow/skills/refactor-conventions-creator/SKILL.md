---
name: refactor-conventions-creator
description: >
  Create or update a project-specific refactor-conventions catalog for
  agile-workflow. Explores the repo, researches stack-specific best practices,
  interviews the user about stylistic preferences and structural refactor
  preferences, writes concise style rules into the canonical AGENTS.md, writes
  detailed refactor convention references under .agents/skills/refactor-conventions/,
  maintains optional Claude mirrors, and leaves refactor execution to
  /agile-workflow:refactor-design. The generated catalog extends refactor-design's
  sensible defaults; it does not replace them or create standalone plan docs.
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, WebSearch, WebFetch, AskUserQuestion
---

# Refactor Conventions Creator

You create or update a project-specific **refactor-conventions** catalog that
extends `refactor-design` with the team's preferred code style and organization
rules. The catalog is reference material. It does not replace
`refactor-design`'s built-in smell scan, and it does not write standalone
refactoring plan documents.

Keep these sources of truth separate:

- **Style conventions** — concise project rules live in the selected
  `AGENTS.md` target. Examples: early returns, error handling, preferred
  function shape, naming intent. These are not formatter/linter rules.
- **Structural/refactor conventions** — richer rule docs live in
  `.agents/skills/refactor-conventions/` with optional Claude mirror. Examples:
  module boundaries, file split triggers, co-location, import direction.
- **Reusable code patterns** — `.agents/skills/patterns/`, maintained by
  `gate-patterns`. Do not duplicate them here.
- **Architecture principles** — `principles` skill and foundation docs. Do not
  restate ports/adapters, generated contracts, or other architectural doctrine
  unless the user is choosing a project-specific refactor convention.

The goal is a unified, navigable codebase. Convention-driven refactors should
still earn their keep: less duplication, clearer boundaries, easier scanning, or
lower coordination cost.

## Phase 1: Check for Existing Artifacts

Detect all relevant artifacts before writing:

```text
Glob: .agents/skills/refactor-conventions/SKILL.md
Glob: .claude/skills/refactor-conventions/SKILL.md
Glob: AGENTS.md
Glob: .agents/AGENTS.md
Glob: .claude/AGENTS.md
Glob: CLAUDE.md
Glob: .claude/CLAUDE.md
Glob: .agents/CLAUDE.md
```

Canonical locations:

- Selected `AGENTS.md` target is the source of truth for style rules.
- `.agents/skills/refactor-conventions/` is the source of truth for detailed
  refactor convention references.
- `.claude/skills/refactor-conventions/` is only a compatibility mirror.

If only a Claude copy exists, read it and migrate it into `.agents/skills/`
instead of treating Claude as canonical. Preserve user-authored content. If both
copies exist and differ, present the differences and ask whether to merge,
prefer `.agents`, or keep both for now.

If an existing generated skill still says to write a separate `.md` refactoring
plan, treat that as an old generated template and update the workflow wrapper.
Do not discard the user's actual rule references.

## Phase 2: Explore the Codebase

Scan the repo to understand current coding style and organization. Start with
direct Read/Glob/Grep over manifests, entry points, representative source
directories, and existing tests. Use one read-only Explore sub-agent for breadth
only when the codebase is too broad to characterize from those reads:

- **Claude Code / Anthropic:** Sonnet minimum, Opus for large or complex
  codebases.
- **Codex / OpenAI:** `reasoning_effort: medium`; use `high` for large or
  complex codebases.

Look for both dimensions.

**Style signals:**
1. Paradigm — classes, functions, components, data-first modules, mixed style.
2. Control flow — early returns, nesting depth, guard clauses, switch/match use.
3. Error handling — exceptions, result types, boundary catches, fail-fast guards.
4. Composition — inheritance, hooks/composables, middleware, pipelines.
5. Function shape — long procedural blocks vs small named units.
6. Abstraction posture — pragmatic duplication, thin wrappers, heavy frameworks.

**Structural signals:**
1. File size distribution and obvious split points.
2. Folder layout — feature-based, layer-based, package-based, hybrid.
3. Module boundaries — public APIs, deep imports, cross-feature imports.
4. Co-location — tests, fixtures, types, styles, docs.
5. Import direction and cycles.
6. Documentation and generated-artifact placement.

Note consistencies and inconsistencies. Summarize findings in 10-15 bullets
covering both axes.

## Phase 3: Research Stack-Specific Conventions

Based on Phase 2, research the stack:

1. Identify languages, frameworks, build tools, and domain.
2. Search authoritative guides for relevant style and structure conventions:
   official language guides, framework docs, package layout recommendations,
   testing conventions, and domain-specific organization.
3. Read in-repo docs: `AGENTS.md`, `CONTRIBUTING.md`, linter configs,
   architecture docs, ADRs, and existing `.agents/skills/patterns/`.

Use research as interview input, not as an automatic rule source. The user's
confirmed preference wins unless it conflicts with correctness or toolchain
requirements.

## Phase 4: Interview the User

Use `AskUserQuestion`. Weave together repo findings, stack research, and the
generic prompts in:

- `references/common-styles.md`
- `references/common-structures.md`

Ask about concrete tradeoffs, not abstract preferences:

- "This repo mixes guard clauses and nested conditionals in service code. Should
  we codify early returns for boundary validation?"
- "Several modules exceed 600 lines but only split cleanly around parser vs
  renderer responsibilities. Do you want a hard line limit or split-at-boundary
  rule?"
- "Some features deep-import from sibling internals. Should refactors introduce
  curated module exports, or is deep import acceptable here?"

For each confirmed preference, capture:

- **Rule** — one sentence.
- **Axis** — style or structural/refactor.
- **Why** — readability, navigability, consistency, maintenance cost, etc.
- **Exceptions** — when not to apply.
- **Scope** — packages, layers, file types, or "whole repo".

Aim for 3-8 style rules and 4-10 structural/refactor rules. Fewer good rules
are better than a catalog that turns every preference into churn.

## Phase 5: Write Canonical Artifacts

### 5a. Update AGENTS.md style section

Resolve the selected `AGENTS.md` target using the same precedence as
`convert`: root `AGENTS.md`, then `.agents/AGENTS.md`, then
`.claude/AGENTS.md`, else create root `AGENTS.md`.

Write or refresh a short section outside the agile-workflow managed markers:

```markdown
## Refactor Style Conventions

These project-specific rules extend agile-workflow refactor/design behavior.
They are not formatter settings.

- **<rule name>**: <one-sentence rule>. Exceptions: <short exception>.
```

If a matching section exists, merge without duplicating rules. If a user-edited
rule conflicts with a new answer, ask before overwriting.

### 5b. Generate `.agents/skills/refactor-conventions/SKILL.md`

The generated `SKILL.md` must stay short — under 100 lines. It is an index and
consumer guide for `refactor-design`, not a standalone workflow.

```markdown
---
name: refactor-conventions
description: >
  Project-specific refactor conventions for [language/stack]. Auto-loads when
  agile-workflow refactor-design scans or designs refactors. Extends
  refactor-design's default smell scan with team-confirmed style and structural
  preferences; does not replace the defaults and does not create standalone plan
  docs.
user-invocable: false
allowed-tools: Read, Glob, Grep
---

# Refactor Conventions

This is a reference catalog consumed by `/agile-workflow:refactor-design`.
Run refactor-design's built-in scan first, then use these conventions as an
additional lens for project-specific consistency.

## Style Rules

Source of truth: `AGENTS.md` → `## Refactor Style Conventions`.
Summaries here are an index only; if this file conflicts with AGENTS, AGENTS wins.

| Rule | Summary | Reference |
|---|---|---|
| {name} | {one-sentence rule} | [details](references/style/{slug}.md) |

## Structural Refactor Rules

| Rule | Summary | Reference |
|---|---|---|
| {name} | {one-sentence rule} | [details](references/structure/{slug}.md) |

## How To Use

- Do not emit work just because a rule is technically violated.
- High-value convention drift can become substrate items through
  `/agile-workflow:refactor-design`.
- Small/surgical fixes become stories at `stage: implementing`.
- Multi-file or policy-heavy changes become `[refactor]` features at
  `stage: drafting`.
- Marginal churn belongs in "not worth it" notes, not in `.work/`.
```

### 5c. Generate reference files

For each style rule, create `references/style/{slug}.md`. These expand the
AGENTS summary but do not replace it.

For each structural/refactor rule, create `references/structure/{slug}.md`.

Use this template:

```markdown
# {Style|Structure} Rule: {Name}

> {One-sentence rule}

## Motivation

{Why this matters — 2-3 sentences, stack-specific}

## Signals

- {What to look for before proposing a refactor}

## Before / After

### From this codebase: {scenario}

**Before:**
\`\`\`{lang}
{real example or directory tree}
\`\`\`

**After:**
\`\`\`{lang}
{preferred version}
\`\`\`

### Synthetic example: {scenario}

**Before:**
\`\`\`{lang}
{synthetic anti-pattern}
\`\`\`

**After:**
\`\`\`{lang}
{synthetic preferred pattern}
\`\`\`

## Exceptions

- {When this rule should NOT apply}

## Scope

- Applies to: {areas, layers, file types}
- Does NOT apply to: {exclusions}
```

Use both real and synthetic examples when possible. If a real example would
expose sensitive code or force a huge excerpt, use file:line references plus a
short paraphrase.

### 5d. Maintain Claude mirror

If `.claude/skills/` exists, create or refresh a compatibility mirror:

```bash
mkdir -p .claude/skills
ln -sfn ../../.agents/skills/refactor-conventions .claude/skills/refactor-conventions
```

If symlinks are unavailable, copy the `.agents` catalog as a mirror and note in
the output that `.agents/skills/refactor-conventions/` is canonical.

## Phase 6: Convert Alignment Hook

`/agile-workflow:convert --update` owns whole-project artifact alignment. After
creating or materially updating the conventions catalog, make sure convert's
sync model can repair these artifacts in one pass:

- selected `AGENTS.md` has `## Refactor Style Conventions`;
- `.agents/skills/refactor-conventions/` exists and is canonical;
- `.claude/skills/refactor-conventions/` is absent, a symlink, or a mirror;
- old generated catalogs that write standalone `.md` plans are upgraded without
  losing user-authored rules;
- `.agents/skills/patterns/` remains separate from refactor conventions.

If the project already has a messy mix of `.agents` and `.claude` artifacts,
recommend running `/agile-workflow:convert --update` after this skill finishes.
Do not duplicate convert's full sync workflow here.

## Phase 7: Present and Confirm

Show the user:

1. The style rules written to AGENTS.
2. The structural/refactor rules written to the catalog.
3. The created or updated file tree.
4. Any migration or mirror action taken.
5. Whether `/agile-workflow:convert --update` is recommended for one-pass
   artifact alignment.

Ask if they want adjustments before the final commit.

## Phase 8: Commit

After the user confirms, commit the artifact update:

```bash
git add AGENTS.md .agents/AGENTS.md .claude/AGENTS.md
git add .agents/skills/refactor-conventions .claude/skills/refactor-conventions
git commit -m "refactor-conventions: update project catalog"
```

Adjust the `git add` paths to only include files that exist or changed. Do not
commit unrelated working-tree changes.

## Anti-Patterns

- NEVER write a standalone refactoring plan file. Refactor work belongs in
  `.work/` items through `refactor-design`.
- NEVER let the generated catalog replace `refactor-design`'s built-in scan.
  It is an extension layer.
- NEVER include formatting rules; linters and formatters own those.
- NEVER duplicate reusable code patterns from `.agents/skills/patterns/`.
- NEVER include broad architecture theory from the principles skill.
- NEVER generate more than 10 style rules or 12 structural/refactor rules.
- NEVER overwrite user-authored AGENTS or catalog content without confirmation.
- NEVER suggest refactoring that causes massive import churn for marginal value.

## Quality Checklist

Before finishing:

- [ ] Style summaries are in the selected `AGENTS.md` target.
- [ ] `.agents/skills/refactor-conventions/SKILL.md` is under 100 lines.
- [ ] `.agents/skills/refactor-conventions/` is canonical.
- [ ] Claude mirror exists only as compatibility, not as source of truth.
- [ ] Each rule has rationale, examples or file references, exceptions, and scope.
- [ ] The generated catalog tells consumers to emit substrate items, not plan docs.
- [ ] `refactor-design` can still run sensibly when the catalog is absent.
