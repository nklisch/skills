# Agent Orchestration

How to scale cruft cleanup across agents and worktrees.

## Decision Matrix

| Findings | Files | Strategy | Worktrees |
|----------|-------|----------|-----------|
| < 10 | < 5 | Edit inline, no agents | No |
| 10-30 | 5-15 | 1-2 agents | No |
| 30-80 | 15-40 | 2-4 agents | Yes |
| 80+ | 40+ | 4-6 agents, max | Yes |

Never exceed 6 agents. More agents = more merge complexity with diminishing returns.

## Partitioning Strategy

Partition by **directory ownership**, not by cruft category. This minimizes merge conflicts
because each agent edits a disjoint set of files.

### Algorithm

1. Group all approved findings by their top-level directory (e.g., `src/api/`, `src/models/`)
2. Sort groups by finding count, descending
3. Assign groups to N agents using greedy bin-packing (largest group first)
4. If a single directory has more findings than avg, split it into subdirectories

### Example

```
Findings: 45 across src/api/ (18), src/models/ (12), src/utils/ (8), src/ui/ (7)
Agents: 3

Agent 1: src/api/     (18 findings)
Agent 2: src/models/  (12 findings)
Agent 3: src/utils/ + src/ui/ (15 findings)
```

## Worktree Lifecycle

When using worktrees for isolation:

### Setup
```
Agent(
  description: "Clean cruft in {partition}",
  prompt: "{cleanup instructions with findings list}",
  isolation: "worktree"
)
```

The Agent tool handles worktree creation and cleanup automatically:
- Creates a temporary git worktree branch
- Agent works in the isolated copy
- If the agent makes changes, the worktree path and branch are returned
- If no changes, worktree is auto-cleaned

### Merging Worktree Results

After all agents complete:
1. Collect branches from agents that made changes
2. Merge each branch into the current branch sequentially
3. If merge conflicts occur, present them to the user — do NOT auto-resolve
4. Run the full test suite after all merges

### When NOT to Use Worktrees

- Small scope (< 30 findings) — overhead isn't worth it
- Changes are limited to deletions only (low conflict risk)
- Single-file findings that don't interact with each other

## Agent Prompt Template

Each cleanup agent should receive:

```
You are cleaning AI-accumulated cruft from a codebase partition.

## Your findings to address

{list of findings with file path, line number, category, confidence, description}

## Rules

1. Remove each finding surgically — delete the cruft, fix surrounding code
2. After removing an import, check if other imports on the same line are affected
3. After removing a function, check if anything else in the file referenced it
4. Fix whitespace/formatting disrupted by removals
5. Do NOT add new code, refactor, improve, or "enhance" anything
6. Do NOT modify files not in your findings list
7. Skip a finding if you determine it's actually used — note why in your output

## When done

Report: files changed, findings addressed, findings skipped (with reasons)
```

## Error Handling

| Scenario | Action |
|----------|--------|
| Agent fails/crashes | Report failure, remaining findings are unaddressed |
| Agent skips a finding | Include reason in final report, user decides |
| Merge conflict | Stop merging, show conflict to user |
| Tests fail after merge | Identify which agent's changes likely caused it, offer selective revert |
| Agent modifies wrong files | Revert that agent's worktree branch entirely |

## Progress Tracking

Use TaskCreate for each agent with a descriptive name:
```
TaskCreate("Cruft cleanup: src/api/ (18 findings)")
```

Update status as agents complete:
```
TaskUpdate(id, status: "completed", result: "16/18 addressed, 2 skipped")
```
