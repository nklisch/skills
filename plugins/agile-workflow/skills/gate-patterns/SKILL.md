---
name: gate-patterns
description: >
  Patterns gate that scans the bundle's changes for reusable code structures. Delegates the full
  discovery to a deep pattern scanner agent which identifies recurring shapes (3+ occurrences)
  introduced or revealed by the bundle, names them, documents them with concrete file:line examples,
  and returns pattern drafts. The orchestrator writes detailed pattern skills to
  .agents/skills/patterns/ (the single source of truth) with optional Claude mirrors, updates the
  index, also generates the hook-loaded .agents/rules/patterns.md digest (a do-not-hand-edit
  slug+one-liner index that points back at the patterns skill for detail), and produces a tracking
  item with gate_origin:patterns. Auto-triggers during /agile-workflow:release-deploy as the final
  gate.
---

# Gate-Patterns

You orchestrate a patterns gate over the bundle's code changes. The actual
pattern discovery runs inside a **deep pattern scanner agent** (the shipped
agile-workflow `scanner` role when available); your role is to prepare the
bundle context, dispatch the scanner, and write the pattern files + index it
returns.

Scanner strength is explicit: spawn exactly one source-read-only deep pattern
scanner with the strongest inspection/reviewer setting the host exposes. Use the
shipped agile-workflow `scanner` role when available. Use extra-high reasoning
only for large/polyglot bundles, architecture-wide pattern extraction, or
conflicting pattern catalogs. If the host has no scanner path, run
discovery inline and record the reduced isolation in the release body.

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
cat AGENTS.md 2>/dev/null
cat .agents/AGENTS.md 2>/dev/null
cat .claude/AGENTS.md 2>/dev/null
```

Capture the existing pattern catalog and project rules context so the scanner
doesn't redocument existing patterns or mistake project conventions for
structural patterns. Prefer `.agents/skills/patterns/` as the source of truth;
read `.claude/skills/patterns/` only as a legacy mirror. Project-level rules
belong in the selected `AGENTS.md` target. If an older repo still has
`.claude/rules/patterns.md`, that content should be migrated by
`/agile-workflow:convert --update`; do not treat it as a gate input or source
of truth.

**Rules folder directive.** The detailed pattern bodies in
`.agents/skills/patterns/` are the single, hand-maintained source of truth. The
hook-loaded rules digest lives at `.agents/rules/patterns.md` — a **generated**
slug+one-liner index that this gate writes in Phase 5 alongside the skill index,
pointing back at the patterns skill for full detail. `.agents/rules/patterns.md`
is **not hand-editable**: any change made there is overwritten on the next gate
run. Edit patterns by editing `.agents/skills/patterns/<slug>.md` and re-running
the gate; never edit the digest directly.

### Phase 2: Identify bundle scope

```bash
# Bound non-release items. `--release` auto-widens to ALL tiers (active + archive + releases).
# Include late-bound archived stubs; their bodies may be pruned, but their item id is still
# present and can recover the bundle commits/files. Ignore only the release orchestration item.
.work/bin/work-view --release <version> --paths | while IFS= read -r item; do
  kind=$(grep -m1 '^kind:' "$item" | awk '{print $2}')
  [ "$kind" = "release" ] && continue
  echo "$item"
done > /tmp/bundle-items-<version>.txt

# Files changed by the bundle. For archived stubs, the body is pruned on disk by design; use the
# item id to find implementation commits instead of treating the missing body as a skip reason.
while IFS= read -r item; do
  id=$(grep -m1 '^id:' "$item" | awk '{print $2}')
  git log --grep "$id" --format='%H' | xargs -I{} git diff-tree --no-commit-id --name-only -r {}
done < /tmp/bundle-items-<version>.txt | sort -u > /tmp/bundle-files-<version>.txt
```

### Phase 3: Dispatch the pattern scanner

Spawn ONE source-read-only deep scanner agent with the full discovery brief. Use
the shipped agile-workflow `scanner` role when available and the strongest
inspection/reviewer setting the host exposes, escalating for large/polyglot
bundles, architecture-wide pattern extraction, or conflicting catalogs. If
scanner agents are unavailable, run discovery inline and record the reduced
isolation in the release body. The scanner runs pattern-search passes, filters
to genuine 3+ occurrences, drafts pattern documentation, and returns structured
output.

**Brief template**:

> You are conducting pattern discovery for release `<version>`. Identify
> reusable code structures the bundle introduces or reveals — recurring
> shapes that appear 3+ times. NOT coding style or naming conventions
> (that's AGENTS.md / CLAUDE.md's job); structural patterns for consistency and reuse.
>
> Use read/search/shell tools as needed. Do not spawn nested sub-agents or modify
> source files.
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
> 1. **Pattern discovery passes** — inspect the bundle's changed files plus
>    their immediate consumers (since reuse implies multiple call sites):
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
>    Read 3-4 key files yourself to verify the candidate patterns.
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

For each new pattern the scanner returned, write
`.agents/skills/patterns/<slug>.md` with the pattern content (everything
under the `### Pattern:` heading except the `Index entry` block).

### Phase 5: Regenerate the index and the rules digest

First, compute the per-pattern entries **once**. For each pattern (existing
entries combined with the new ones from the scanner's output), you have a
`<slug>` and a `<one-line rule>` — for new patterns the one-liner is the terse
rule from the scanner's `#### Index entry` block. Order by relevance (most
commonly applicable first) and keep the list concise. These same entries feed
both files below, so they cannot drift.

**5a. Regenerate the skill index** `.agents/skills/patterns/SKILL.md` (the
single source of truth for the detailed pattern bodies):

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
- [<slug>.md](<slug>.md) — <one-line rule>
```

**5b. Generate the rules digest** `.agents/rules/patterns.md`. This is the
concise, hook-loaded digest — NOT a source of truth. Reuse the exact same
`<slug>` + `<one-line rule>` pairs you wrote to the skill index (do not
recompute them), so the two files cannot drift. Compute `src-sha256` as the
SHA-256 of the index entry lines (the `<slug> — <one-line rule>` block, the same
text you emit below) so a consumer can detect drift from the skill index:

```bash
mkdir -p .agents/rules
```

Write `.agents/rules/patterns.md` with this exact shape:

```markdown
<!-- generated by agile-workflow gate-patterns — do not hand-edit -->
<!-- agile-workflow:patterns-digest src-sha256=<sha256 of the slug+one-liner entry block> -->
## Project Code Patterns
- <slug> — <one-line rule>
- ...

Load the `patterns` skill (read `.agents/skills/patterns/<slug>.md`) for full
rationale, examples, and common violations.
```

The banner marks the file as generated; the `src-sha256` marker hashes the entry
block so drift from `.agents/skills/patterns/SKILL.md` is detectable; the entries
are the same slug+one-liner pairs written to the skill index; the pointer line
sends agents to the patterns skill for full detail. If discovery produced no
patterns and the catalog is empty, still write the banner + marker + pointer with
an empty entry list so the digest reflects the current (empty) state.

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

Only `.agents/skills/patterns/` is mirrored to `.claude/`. The
`.agents/rules/patterns.md` digest is **generated** (Phase 5b) and is NOT a
`.claude` mirror target — the hook loads it from `.agents/rules/` directly in
both Claude Code and Codex. Do not symlink or copy it into `.claude/`.

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
- `.agents/rules/patterns.md` (generated hook-loaded digest)
```

This item is at `stage: done` because the gate's work IS the writing of the
pattern files. No further implementation needed.

For each inconsistency the scanner flagged, ALSO produce a `[refactor]`
story (`stage: drafting`) so the divergence gets reconciled in a subsequent
release.

### Phase 8: Commit

```bash
git add .agents/skills/patterns/ .agents/rules/patterns.md .claude/skills/patterns .work/active/stories/gate-patterns-<version>.md .work/active/stories/gate-patterns-inconsistency-*.md
git commit -m "gate-patterns: <N> patterns extracted for <version>"
```

## Output

In conversation:
- **Bundle**: `<version>`
- **New patterns extracted**: list with slugs
- **Inconsistencies flagged**: count, with new story ids
- **Index updated**: `.agents/skills/patterns/SKILL.md`
- **Rules digest regenerated**: `.agents/rules/patterns.md`
- **Tracking item**: `gate-patterns-<version>` at `stage: done`

## Guardrails

- **The discovery happens in the scanner agent, not here.** Your job is bundle
  prep, dispatch, and writing the pattern files + index + tracking item.
  Don't replicate the scanner's analysis.
- A pattern requires 3+ occurrences. The scanner enforces this; trust it.
- Don't document style conventions — that's AGENTS.md / CLAUDE.md's job.
- Every pattern needs concrete file:line examples — the scanner provides
  them; don't write a pattern file without them.
- Inconsistencies with existing patterns become `[refactor]` stories, not
  new pattern files.
- The tracking item is `stage: done` because the gate's deliverable is the
  pattern files themselves, not deferred work.
- `.agents/skills/patterns/` is the single source of truth.
  `.agents/rules/patterns.md` is a generated digest — compute the slug+one-liner
  entries once in Phase 5 and write both files from them so they cannot drift;
  never hand-edit the digest.
