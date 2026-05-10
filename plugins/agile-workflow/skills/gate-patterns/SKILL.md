---
name: gate-patterns
description: >
  Patterns gate that scans the bundle's changes for reusable code structures and
  writes pattern skills to .claude/skills/patterns/. Identifies recurring shapes
  (3+ occurrences) introduced or revealed by the bundle, names them, documents
  them with concrete file:line examples, then produces a tracking item with
  gate_origin:patterns. Auto-triggers during /agile-workflow:release-deploy as
  the final gate (after security, tests, cruft, docs).
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, Task
model: sonnet
---

# Gate-Patterns

You scan the bundle's code changes for reusable patterns — recurring shapes that
appear 3+ times — and codify them into pattern skills at
`.claude/skills/patterns/<slug>.md`. A tracking item is produced with
`gate_origin: patterns` so the user has a record in the substrate.

This is NOT about coding style or naming conventions (that's `CLAUDE.md`'s job).
This is about identifying structural patterns for consistency and reuse.

## Trigger

- `/agile-workflow:release-deploy` invokes during `quality-gate` stage (typically
  last in the gate sequence)
- User can invoke manually: `/agile-workflow:gate-patterns <release-version>`

## Workflow

### Phase 1: Read existing patterns

```bash
ls .claude/skills/patterns/ 2>/dev/null
cat .claude/rules/patterns.md 2>/dev/null
```

So you don't redocument existing patterns. Note inconsistencies between existing
patterns and the bundle's new code (those become items, not new pattern skills).

### Phase 2: Identify bundle scope

```bash
.work/bin/work-view --release <version> --paths
```

Find the union of files changed by bound items. This is the new code to scan.

### Phase 3: Parallel pattern discovery

Spawn parallel Explore sub-agents (sonnet minimum) on the bundle's changed files
plus their immediate consumers (since reuse implies multiple call sites):

1. **Shared abstractions & utilities** — "Find new shared/reusable code introduced
   in <files>: utility functions, base classes, common helpers, types used across
   multiple modules. List each with file:line and which modules use it."

2. **Architectural patterns** — "Identify recurring structural approaches in
   <files>: how modules are organized, how services are composed, how data flows
   between layers, how config and async/error propagation are handled. Report
   with concrete file:line examples."

3. **Testing infrastructure** — "Find new reusable test patterns in <files>:
   shared fixtures, test utilities, common setup/teardown, mocking approaches,
   assertion helpers."

After results, **read 3-4 key files yourself** to verify findings.

### Phase 4: Filter to genuine patterns

A finding is a genuine pattern only if it has **3+ occurrences** in the codebase
(not just in the bundle — count across the whole repo). Single-use shapes are not
patterns. Two-use shapes are coincidence. Three+ is a pattern.

For each candidate, also check: does this contradict an existing documented
pattern? If so, it's a divergence to flag (not a new pattern to document).

### Phase 5: Write pattern files

For each genuine new pattern, write
`.claude/skills/patterns/<slug>.md`:

```markdown
# Pattern: <Pattern Name>

<one-line description>

## Rationale
<why this pattern exists in this project>

## Examples

### Example 1: <description>
**File**: `src/path/file.ext:42`
\`\`\`<lang>
<concrete code example>
\`\`\`

### Example 2: <description>
**File**: `src/path/other.ext:18`
\`\`\`<lang>
<concrete code example>
\`\`\`

### Example 3: <description>
**File**: `src/path/third.ext:55`
\`\`\`<lang>
<concrete code example>
\`\`\`

## When to Use
- <circumstance>

## When NOT to Use
- <circumstance>

## Common Violations
- <violation and why it's wrong>
```

### Phase 6: Update the index

Regenerate `.claude/rules/patterns.md`:

```markdown
---
description: Project pattern index — terse pointers to detailed pattern files
paths: ['src/**', 'lib/**', 'app/**']
---

- **<name>**: <terse rule> → [<slug>.md](.claude/skills/patterns/<slug>.md)
- ...
```

Keep the index under 30 lines. Order by relevance (most commonly applicable first).

### Phase 7: Update the patterns SKILL.md

Create or update `.claude/skills/patterns/SKILL.md`:

```yaml
---
name: patterns
description: "Project code patterns and conventions. Auto-loads when implementing,
  designing, verifying, or reviewing code. Provides detailed pattern definitions
  with code examples."
user-invocable: false
allowed-tools: Read, Glob, Grep
---

# Project Patterns Reference

This skill contains detailed pattern documentation for this project.
See individual pattern files for full details with code examples.

Available patterns:
- [<slug>.md](<slug>.md) — <pattern name>
```

Keep the available patterns list current.

### Phase 8: Produce tracking item

Create one item summarizing what was extracted:

```yaml
---
id: gate-patterns-<release-version>
kind: story
stage: done                  # this gate's "work" is done when it writes the patterns
tags: [patterns]
parent: null
depends_on: []
release_binding: <version>
gate_origin: patterns
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Patterns extracted for <version>

## New patterns codified
- `<slug>` — <one-line summary>
- `<slug>` — <one-line summary>

## Inconsistencies flagged
<patterns the bundle introduces that contradict existing documented patterns>

## Pattern files written
- `.claude/skills/patterns/<slug>.md`
- `.claude/rules/patterns.md` (updated index)
```

This item is at `stage: done` because the gate's work IS the writing of the
pattern files. No further implementation needed.

### Phase 9: Commit

```bash
git add .claude/skills/patterns/ .claude/rules/patterns.md .work/active/stories/gate-patterns-<version>.md
git commit -m "gate-patterns: <N> patterns extracted for <version>"
```

## Output

In conversation:
- **Bundle**: `<version>`
- **New patterns extracted**: list with slugs
- **Inconsistencies flagged**: count
- **Index updated**: `.claude/rules/patterns.md`
- **Tracking item**: `gate-patterns-<version>` at `stage: done`

## Guardrails

- A pattern requires 3+ occurrences. Single-use is not a pattern. Two-use is
  coincidence.
- Don't document style conventions — that's CLAUDE.md's job.
- Every pattern needs concrete file:line examples — abstract descriptions don't
  serve agents.
- Don't propose patterns that contradict existing documented ones without
  flagging it explicitly.
- The tracking item is `stage: done` because the gate's deliverable is the
  pattern files themselves, not deferred work.
