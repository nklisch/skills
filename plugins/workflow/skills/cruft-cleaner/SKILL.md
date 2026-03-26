---
name: cruft-cleaner
description: >
  Sweep a codebase for AI-accumulated cruft (dead code, stale comments, compatibility shims,
  defensive bloat, over-abstraction), triage findings by confidence tier, then orchestrate
  parallel cleanup agents with worktree isolation. Use when user says "clean cruft", "dead code",
  "unused code", "stale comments", or "AI leftovers".
user-invocable: true
allowed-tools: Agent, Bash, Glob, Grep, Read, Edit, AskUserQuestion, TaskCreate, TaskUpdate
model: opus
---

# Cruft Cleaner

You systematically find and remove AI-accumulated cruft from codebases. AI agents leave a
distinct debris trail: unused compatibility shims, comments describing deleted code, defensive
error handling for impossible cases, single-use abstractions nobody asked for. You find it all,
confirm with the user, then orchestrate cleanup at scale.

## Arguments

- No arguments: sweep the entire repository
- Path argument (e.g. `src/api/`): scope the sweep to that directory

## Phase 1: Detect

Discover what's in this codebase, then hunt for cruft across five categories.

### 1.1 Discover the ecosystem

Identify the project's language(s), framework, build tools, and test runner by examining:
- `package.json`, `tsconfig.json`, `Cargo.toml`, `go.mod`, `pyproject.toml`, `Makefile`, etc.
- Entry points and directory structure

This determines which language-aware tools are available. Store findings for Phase 3.

### 1.2 Run language-aware detection

Load [references/detection-patterns.md](references/detection-patterns.md) and run every
applicable tool for the detected ecosystem. These produce **high-confidence** findings:

- TypeScript/JavaScript: `tsc --noUnusedLocals --noUnusedParameters --noEmit`, eslint unused rules
- Python: `ruff check --select F811,F841,F401`, `vulture`
- Go: `go vet`, `deadcode`
- Rust: compiler warnings for dead code (`#[warn(dead_code)]`)

Capture output, parse into a structured findings list.

### 1.3 Run heuristic detection

Use Grep and Read to find pattern-based cruft. Load
[references/cruft-taxonomy.md](references/cruft-taxonomy.md) for concrete examples of what
to look for. These produce **medium** and **low-confidence** findings:

**Medium confidence:**
- Comments containing "removed", "backwards compat", "for backwards compatibility", "deprecated",
  "TODO" where the work is clearly done, "FIXME" for fixed code
- Re-exports that nothing imports (check with Grep)
- Variables prefixed with `_` that were clearly renamed to suppress warnings
- Empty catch/except blocks with "// ignore" style comments
- Wrapper functions that just call through to one other function with no added logic

**Low confidence:**
- Try/catch around code that cannot throw (requires judgment)
- Validation of internal-only inputs at non-boundary functions
- Single-use helper functions that could be inlined
- Config/options parameters that only ever receive one value
- Abstractions with a single implementation

### 1.4 Classify and deduplicate

Assign each finding a confidence tier:
- **High** — tool-detected dead code (unused imports, unreachable code, unused exports)
- **Medium** — pattern-matched likely cruft (stale comments, shims, passthrough wrappers)
- **Low** — judgment calls (defensive bloat, over-abstraction)

Deduplicate findings that appear in multiple detection passes.

## Phase 2: Triage

Present findings to the user grouped by tier with counts per category.

**AskUserQuestion checkpoint:**

Show a summary like:
```
High confidence (auto-approved): 23 findings
  - 12 unused imports
  - 6 unused functions
  - 5 unused exports

Medium confidence (review recommended): 15 findings
  - 8 stale comments
  - 4 compatibility shims
  - 3 passthrough wrappers

Low confidence (opt-in): 7 findings
  - 3 defensive try/catch
  - 2 single-use helpers
  - 2 unnecessary validation
```

Ask which tiers to include:
- All tiers
- High + Medium only (Recommended)
- High only
- Let me pick individually

If the user picks "individually", present each medium/low finding for yes/no.

## Phase 3: Plan

Based on approved findings count and distribution, decide the execution strategy.
Load [references/agent-orchestration.md](references/agent-orchestration.md).

### Decision matrix

| Approved findings | Files affected | Strategy |
|---|---|---|
| < 10 | < 5 | Single inline pass (no agents, just edit directly) |
| 10-30 | 5-15 | 1-2 agents, no worktrees |
| 30-80 | 15-40 | 2-4 agents, worktrees recommended |
| 80+ | 40+ | 4-6 agents, worktrees required |

### Partitioning

When using multiple agents, partition by **directory** (not by cruft category), so each agent
owns a clean set of files with minimal merge conflicts. Each agent gets:
- Its file partition
- The subset of approved findings in those files
- The cruft-taxonomy reference for context
- Instructions to run the test suite for its partition if possible

**AskUserQuestion checkpoint:**

Present the execution plan:
- Number of agents
- Whether worktrees will be used
- How files are partitioned
- Estimated scope (files and findings per agent)

Options: Execute / Adjust / Cancel

## Phase 4: Execute

### Small scope (inline)

If the plan calls for inline editing, just do it directly:
1. Work through findings one file at a time
2. Remove cruft, fix surrounding code (imports, whitespace, etc.)
3. Track progress with TaskCreate/TaskUpdate

### Agent scope

Spawn cleanup agents using the Agent tool:

```
For each partition:
  Agent(
    description: "Clean cruft in {partition_name}",
    prompt: <partition findings + cleanup instructions>,
    isolation: "worktree"  // if plan calls for worktrees
  )
```

Each agent's prompt includes:
1. The specific findings to address (file path, line, category, description)
2. Instructions: remove the cruft, fix surrounding code, do NOT add new code or refactor
3. Run tests if a test command was detected
4. Report what was changed

Launch agents in parallel where possible. Track each with TaskCreate/TaskUpdate.

### What agents must NOT do

- Add new code, abstractions, or helpers
- Refactor beyond the immediate cruft removal
- Modify code unrelated to the findings
- Skip findings without explanation

## Phase 5: Verify

After all agents complete (or inline editing is done):

1. **Run the test suite** — detect the test command from package.json scripts, Makefile targets,
   or common conventions (`npm test`, `pytest`, `go test ./...`, `cargo test`)
2. **Run the type checker** if applicable (`tsc --noEmit`, `mypy`, `pyright`)
3. **Summarize results:**
   - Files changed: N
   - Lines removed: N
   - Findings addressed by category
   - Tests: pass/fail
   - Type check: pass/fail

**AskUserQuestion checkpoint:**

If tests pass: "Cleanup complete. N files changed, M lines removed. Keep all changes?"
- Keep all
- Review the diff first
- Revert all

If tests fail: "Tests failed after cleanup. What do you want to do?"
- Show test failures (then investigate)
- Revert all changes
- Revert only the partition that likely caused failures

## Important Rules

- **Never remove code you can't verify is unused.** If a function is exported and you can't
  confirm zero external consumers, leave it. When in doubt, flag it as medium-confidence
  rather than removing it.
- **Always preserve the user's ability to veto.** Every phase has a checkpoint. Never skip them.
- **Cleanup agents must be surgical.** They remove cruft and fix the immediate surroundings.
  They do not improve, refactor, or enhance anything.
- **Test failures are blockers.** If the test suite fails after cleanup, the changes are suspect
  until proven otherwise.
