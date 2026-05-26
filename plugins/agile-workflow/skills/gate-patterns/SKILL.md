---
name: gate-patterns
description: >
  Patterns gate that scans the bundle's changes for reusable code structures.
  Delegates the full discovery to a deep pattern-discovery sub-agent which identifies recurring
  shapes (3+ occurrences) introduced or revealed by the bundle, names them,
  documents them with concrete file:line examples, and returns pattern drafts.
  The orchestrator writes pattern skills to .agents/skills/patterns/ with optional Claude mirrors, updates
  the index, and produces a tracking item with gate_origin:patterns.
  Auto-triggers during /agile-workflow:release-deploy as the final gate.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent
---

# Gate-Patterns

You orchestrate a patterns gate over the bundle's code changes. The actual
pattern discovery runs inside a **deep pattern-discovery sub-agent**; your role
is to prepare the bundle context, dispatch the sub-agent, and write the pattern
files + index it returns.

Sub-agent strength is explicit:
- **Claude Code / Anthropic:** spawn one Agent with `model: "opus"` and
  `subagent_type: "general-purpose"`.
- **Codex / OpenAI:** spawn one analysis sub-agent with `reasoning_effort:
  high`; use `xhigh` only for large/polyglot bundles, architecture-wide pattern
  extraction, or conflicting pattern catalogs.

This is NOT about coding style or naming conventions (that's `AGENTS.md` /
`CLAUDE.md`'s job). This is about identifying structural patterns for
consistency and reuse.

## Trigger

- `/agile-workflow:release-deploy` invokes during `quality-gate` stage
  (typically last in the gate sequence)
- User can invoke manually: `/agile-workflow:gate-patterns <release-version>`

## Workflow

### Phase 1: Read existing patterns

```bash
ls .agents/skills/patterns/ 2>/dev/null
cat .agents/skills/patterns/SKILL.md 2>/dev/null
ls .claude/skills/patterns/ 2>/dev/null
cat .claude/rules/patterns.md 2>/dev/null
```

Capture the existing pattern catalog so the sub-agent doesn't redocument
existing patterns. Prefer `.agents/skills/patterns/` as the source of truth;
read `.claude/skills/patterns/` and `.claude/rules/patterns.md` as legacy
mirrors.

### Phase 2: Identify bundle scope

```bash
.work/bin/work-view --release <version> --paths

for item in $(.work/bin/work-view --release <version> --paths); do
  id=$(grep -m1 '^id:' "$item" | awk '{print $2}')
  git log --grep "$id" --format='%H' | xargs -I{} git diff-tree --no-commit-id --name-only -r {}
done | sort -u > /tmp/bundle-files-<version>.txt
```

### Phase 3: Dispatch the discovery sub-agent

Spawn ONE deep pattern-discovery sub-agent with the full discovery brief. For
Claude Code, this is `Agent(subagent_type=general-purpose, model=opus)`. For
Codex, use `reasoning_effort: high`, escalating to `xhigh` for large/polyglot
bundles, architecture-wide pattern extraction, or conflicting catalogs. The sub-agent runs parallel pattern searches, filters to
genuine 3+ occurrences, drafts pattern documentation, and returns
structured output.

**Brief template**:

> You are conducting pattern discovery for release `<version>`. Identify
> reusable code structures the bundle introduces or reveals — recurring
> shapes that appear 3+ times. NOT coding style or naming conventions
> (that's AGENTS.md / CLAUDE.md's job); structural patterns for consistency and reuse.
>
> You have access to Read, Glob, Grep, Bash, Task. You may spawn parallel
> sub-tasks for the different discovery axes.
>
> **Bundle scope**:
> ```
> <bundle-files>
> ```
>
> **Existing pattern catalog** (do NOT redocument these; flag inconsistencies
> against them):
> ```
> <existing-patterns-listing>
> ```
>
> **Methodology**:
>
> 1. **Parallel pattern discovery** — spawn sub-tasks on the bundle's
>    changed files plus their immediate consumers (since reuse implies
>    multiple call sites):
>    - **Shared abstractions & utilities** — find new shared/reusable code
>      introduced in the bundle: utility functions, base classes, common
>      helpers, types used across multiple modules. List each with
>      file:line and which modules use it.
>    - **Architectural patterns** — identify recurring structural
>      approaches: how modules are organized, how services are composed,
>      how data flows between layers, how config and async/error
>      propagation are handled. Concrete file:line examples.
>    - **Testing infrastructure** — find new reusable test patterns:
>      shared fixtures, test utilities, common setup/teardown, mocking
>      approaches, assertion helpers.
>
>    After sub-task results, **read 3-4 key files yourself** to verify.
>
> 2. **Filter to genuine patterns.** A finding is a genuine pattern only if
>    it has **3+ occurrences** in the codebase (not just in the bundle —
>    count across the whole repo). Single-use shapes are not patterns.
>    Two-use shapes are coincidence. Three+ is a pattern.
>
>    For each candidate, also check: does this contradict an existing
>    documented pattern? If so, it's a divergence to flag (not a new
>    pattern to document).
>
> 3. **Draft pattern files** for each genuine new pattern.
>
> **Output format** — return a single markdown document with:
>
> ```
> ## New patterns
>
> ### Pattern: <Pattern Name> (slug: <slug>)
>
> <one-line description>
>
> #### Rationale
> <why this pattern exists in this project>
>
> #### Examples
>
> ##### Example 1: <description>
> **File**: `src/path/file.ext:42`
> ```<lang>
> <concrete code example>
> ```
>
> ##### Example 2: <description>
> **File**: `src/path/other.ext:18`
> ```<lang>
> <concrete code example>
> ```
>
> ##### Example 3: <description>
> **File**: `src/path/third.ext:55`
> ```<lang>
> <concrete code example>
> ```
>
> #### When to Use
> - <circumstance>
>
> #### When NOT to Use
> - <circumstance>
>
> #### Common Violations
> - <violation and why it's wrong>
>
> #### Index entry
> - **<name>**: <terse rule, one line, suitable for the patterns index>
>
> ### Pattern: <next pattern>
> ...
> ```
>
> Followed by:
>
> ```
> ## Inconsistencies
>
> ### Inconsistency 1
> - **Existing pattern**: <slug or name>
> - **Bundle code that violates it**: `<file>:<line>`
> - **Nature of divergence**: <one-line>
>
> ### Inconsistency 2
> ...
>
> ## Discovery summary
> - Files scanned: <count>
> - Pattern candidates evaluated: <count>
> - Genuine patterns (3+ occurrences): <count>
> - Inconsistencies with existing patterns: <count>
> ```
>
> **Rules**:
> - 3+ occurrences required. Single-use is not a pattern. Two-use is
>   coincidence.
> - Don't document style conventions — that's AGENTS.md / CLAUDE.md's job.
> - Every pattern needs concrete file:line examples — abstract descriptions
>   don't serve agents.
> - Don't propose patterns that contradict existing documented ones; flag
>   the divergence instead.
> - Don't fabricate patterns. If discovery yields nothing, return an empty
>   "New patterns" section.

### Phase 4: Write pattern files

For each new pattern the sub-agent returned, write
`.agents/skills/patterns/<slug>.md` with the pattern content (everything
under the `### Pattern:` heading except the `Index entry` block).

### Phase 5: Update the index

Regenerate `.agents/skills/patterns/SKILL.md`:

```markdown
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

Combine existing entries with the new ones from the sub-agent's output. Keep
the available-patterns list concise. Order by relevance (most commonly
applicable first).

### Phase 6: Maintain Claude mirror

If `.claude/skills/` exists, keep Claude compatibility by symlinking the
canonical skill:

```bash
mkdir -p .claude/skills
ln -sfn ../../.agents/skills/patterns .claude/skills/patterns
```

If symlinks are unavailable, copy `.agents/skills/patterns/` into
`.claude/skills/patterns/` as a mirror and note that `.agents/skills/patterns/`
is canonical.

### Phase 7: Produce tracking item

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
- `.agents/skills/patterns/<slug>.md`
- `.agents/skills/patterns/SKILL.md` (updated index)
```

This item is at `stage: done` because the gate's work IS the writing of the
pattern files. No further implementation needed.

For each inconsistency the sub-agent flagged, ALSO produce a `[refactor]`
story (`stage: drafting`) so the divergence gets reconciled in a subsequent
release.

### Phase 8: Commit

```bash
git add .agents/skills/patterns/ .claude/skills/patterns .work/active/stories/gate-patterns-<version>.md .work/active/stories/gate-patterns-inconsistency-*.md
git commit -m "gate-patterns: <N> patterns extracted for <version>"
```

## Output

In conversation:
- **Bundle**: `<version>`
- **New patterns extracted**: list with slugs
- **Inconsistencies flagged**: count, with new story ids
- **Index updated**: `.agents/skills/patterns/SKILL.md`
- **Tracking item**: `gate-patterns-<version>` at `stage: done`

## Guardrails

- **The discovery happens in the sub-agent, not here.** Your job is bundle
  prep, dispatch, and writing the pattern files + index + tracking item.
  Don't replicate the sub-agent's analysis.
- A pattern requires 3+ occurrences. The sub-agent enforces this; trust it.
- Don't document style conventions — that's AGENTS.md / CLAUDE.md's job.
- Every pattern needs concrete file:line examples — the sub-agent provides
  them; don't write a pattern file without them.
- Inconsistencies with existing patterns become `[refactor]` stories, not
  new pattern files.
- The tracking item is `stage: done` because the gate's deliverable is the
  pattern files themselves, not deferred work.
