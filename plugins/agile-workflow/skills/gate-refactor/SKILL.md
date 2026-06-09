---
name: gate-refactor
description: >
  Refactor gate that discovers scan-rule libraries declared in the host project
  ({project}/.agents/skills/scan-*/SKILL.md and {project}/.claude/skills/scan-*/SKILL.md),
  loads every discovered library, checks the release bundle's changed files against all loaded
  rules, and produces findings as items with gate_origin:refactor and tags:[refactor].
  Rule libraries are deployment-local — the gate ships the mechanism; adopters supply the rules.
  Auto-triggers during /agile-workflow:release-deploy when the host project opts in via
  CONVENTIONS.md: gates_for_release: [..., refactor, ...].
  No-libraries behavior: graceful skip (logs "no scan-* libraries discovered" and continues).
  Item-producer, NOT a pass/fail report.
allowed-tools: Read, Glob, Grep, Bash, Agent, Edit
---

# Gate-Refactor

You orchestrate a refactor gate over the items bound to a release. You discover scan-rule
libraries the host project has installed, load them, and dispatch a **deep refactor sub-agent** to
check the release bundle's changed files against every loaded rule. Your role is library discovery,
bundle preparation, sub-agent dispatch, and converting findings into substrate items.

This gate ships **the mechanism, not the rules**. The scan rule libraries that supply the actual
rules live in the host project (`{project}/.agents/skills/scan-*/SKILL.md` and
`{project}/.claude/skills/scan-*/SKILL.md`). The gate requires no built-in rule knowledge — it
adapts to whatever libraries the deploying project provides. This is why the gate is opt-in (not
in the default `gates_for_release` list): an install with no rule libraries has nothing to check,
and that is by design, not an error.

Sub-agent strength is explicit:
- **Claude Code / Anthropic:** spawn one Agent with `model: "opus"` and
  `subagent_type: "general-purpose"`.
- **Codex / OpenAI:** spawn one analysis sub-agent with `reasoning_effort: high`; use `xhigh`
  for large or polyglot release bundles, or when multiple libraries each carry dense rule sets.
- **Pi path:** use a native Pi `reviewer` or `oracle` subagent for the deep refactor audit when
  hosted in Pi and available; otherwise use the same-host read-only analysis fallback.

## Trigger

- `/agile-workflow:release-deploy` invokes during `quality-gate` stage when `gates_for_release`
  in `.work/CONVENTIONS.md` includes `refactor`.
- User can invoke manually: `/agile-workflow:gate-refactor <release-version>`

**Opt-in gate.** The default `gates_for_release` list does not include `refactor`. Add it
explicitly when your project has scan-rule libraries to enforce:

```
gates_for_release: [security, tests, cruft, docs, patterns, refactor]
```

## Workflow

### Phase 1: Identify bundle changes

```bash
# Bound items. `--release` auto-widens to ALL tiers (active + archive + releases).
# Drop any returned path under `.work/archive/`: those are already-done, body-pruned
# stubs that were gated when active and MUST NOT be re-gated (no-re-gate rule).
.work/bin/work-view --release <version> --paths | grep -v '\.work/archive/'

# Files changed by the bundle (archived stubs already excluded)
for item in $(.work/bin/work-view --release <version> --paths | grep -v '\.work/archive/'); do
  id=$(grep -m1 '^id:' "$item" | awk '{print $2}')
  git log --grep "$id" --format='%H' | xargs -I{} git diff-tree --no-commit-id --name-only -r {}
done | sort -u > /tmp/bundle-files-<version>.txt
```

### Phase 2: Discover scan-rule libraries (idempotency prep)

Glob the host project for rule libraries at both plugin-canonical and Claude-compat roots:

```bash
# Plugin-canonical root (.agents/skills/)
glob_agents: {project}/.agents/skills/scan-*/SKILL.md

# Claude-compat root (.claude/skills/)
glob_claude: {project}/.claude/skills/scan-*/SKILL.md
```

For each discovered `SKILL.md`:
1. Read the `SKILL.md` fully — its frontmatter `description` and body carry the rules the gate
   must enforce.
2. Read all files in the library's `references/` directory (if present) — reference files carry
   the detailed per-rule specifications.
3. Derive a **library tag** from the directory name by stripping `scan-` (e.g., `scan-wcag-aa`
   → `wcag-aa`, `scan-structural` → `structural`).

**No-libraries behavior:** if both globs return zero results, log to the release body:

```
gate-refactor (<date>) — no scan-* rule libraries discovered; gate-refactor has nothing to
check. To activate: install a scan-rule library at {project}/.agents/skills/scan-<name>/ or
{project}/.claude/skills/scan-<name>/. See gate-refactor/SKILL.md for the library contract.
```

Then continue the gate sequence. This is not an error — the gate is designed to ship
content-free when no libraries are installed.

Read existing gate items (idempotency prep):

```bash
.work/bin/work-view --release <version> --gate refactor --paths
```

Capture the set of `(file:line, rule-slug)` already-tracked findings to feed into the
sub-agent's brief so it skips duplicates.

### Phase 3: Dispatch the refactor sub-agent

If at least one library was discovered, spawn ONE deep refactor sub-agent with the full scan brief.
For Claude Code, this is `Agent(subagent_type=general-purpose, model=opus)`. For Codex, use
`reasoning_effort: high` (or `xhigh` for large/polyglot bundles or dense rule sets). For Pi,
use a native `reviewer` or `oracle` subagent when available; otherwise use the same-host
read-only analysis fallback.

The sub-agent checks all rules from all libraries in one pass per file, returning structured
findings. Dispatching one sub-agent with the full library set (rather than one per library) avoids
M-times-N redundant file reads and allows cross-library finding deduplication.

**Brief template**:

> You are conducting a refactor gate scan for release `<version>`. You have access to
> Read, Glob, Grep, Bash. Scan ONLY the bundle's changed files — not the whole repo.
>
> **Bundle scope** (files changed by the bundle):
> ```
> <bundle-files>
> ```
>
> **Loaded rule libraries** (N libraries discovered):
>
> For each library `<tag>` (e.g. `structural`, `wcag-aa`):
>
> **Library: `<tag>`** (source: `{project}/.agents/skills/scan-<name>/` or `{project}/.claude/skills/scan-<name>/`)
> ```
> <full SKILL.md content>
> ```
> Reference files:
> ```
> <full content of each file in references/>
> ```
>
> **Already-tracked findings to skip**:
> ```
> <(file:line, rule-slug) pairs already written as items>
> ```
>
> **Instructions**:
>
> 1. Read every file in the bundle scope.
> 2. For each file, check against all rules from all loaded libraries in a single pass.
> 3. For each finding, record:
>    - **Library tag**: which library's rule was violated (e.g. `structural`).
>    - **Rule slug**: which specific rule was violated (from the library's rule inventory).
>    - **File:line**: exact location.
>    - **Issue**: one-sentence description of the violation.
>    - **Fix**: specific proposed change (or "needs analysis" for findings requiring judgment).
>    - **Confidence**: `high` / `medium` / `low` per the library's guidance for that rule.
> 4. Deduplicate against the already-tracked set.
> 5. Return findings as a structured list.
>
> **Rules**:
> - Scan only the bundle scope. Do not expand to the whole repo.
> - Cite file:line for every finding.
> - Do not fabricate findings. If a rule produces no matches, emit nothing for it.
> - Skip already-tracked findings (exact file:line + rule-slug match).
> - Confidence follows the library's own guidance for each rule. When the library
>   does not specify, default to medium.
>
> **Output format** — return a single markdown document with:
>
> ```
> ## Findings
>
> ### Finding 1
> - **Title**: <one-line description>
> - **Library**: <library-tag>
> - **Rule**: <rule-slug>
> - **Confidence**: High | Medium | Low
> - **Location**: `<file>:<line>`
> - **Issue**: <one sentence>
> - **Fix**: <specific proposed change or "needs analysis">
>
> ### Finding 2
> ...
> ```
>
> Followed by:
>
> ```
> ## Scan summary
> - Libraries loaded: <list of library tags>
> - Files scanned: <count>
> - Findings by confidence: High=<n>, Medium=<n>, Low=<n>
> ```

### Phase 4: Convert findings to items

For each finding the sub-agent returned:

```yaml
---
id: gate-refactor-<short-slug>
kind: story
stage: implementing | drafting    # by confidence — see table below
tags: [refactor]
parent: null
depends_on: []
release_binding: <version>
gate_origin: refactor
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# <one-line description>

## Library
<library-tag>

## Rule
<rule-slug>

## Confidence
High | Medium | Low

## Location
`<file>:<line>`

## Issue
<one-sentence violation description>

## Fix
<specific proposed change, or "needs analysis" for medium/low>
```

Confidence → stage mapping (mirrors gate-cruft):

| Confidence | Stage | Tier |
|---|---|---|
| High | `stage: implementing` | `.work/active/stories/` |
| Medium | `stage: drafting` | `.work/active/stories/` |
| Low | backlog file | `.work/backlog/` |

Slug: derive from library tag + rule slug + file fragment (e.g.
`gate-refactor-structural-routes-api`, `gate-refactor-wcag-aa-missing-alt`).

### Phase 5: Update the release body

Append to the release body's gate-runs section:

```markdown
- **gate-refactor** (YYYY-MM-DD) — N findings (H high, M medium, L low) from K libraries:
  <library-tag-1> (<n> findings), <library-tag-2> (<n> findings)
```

If no libraries were discovered, append the no-libraries log entry from Phase 2 instead.

### Phase 6: Commit

```bash
git add .work/active/stories/ .work/backlog/ .work/releases/<version>.md
git commit -m "gate-refactor: <N> findings for <version> (<library-tags>)"
```

If no findings and no libraries: `gate-refactor: no libraries discovered for <version> — gate skipped`.
If no findings but libraries ran: `gate-refactor: 0 findings for <version> (<library-tags> — clean)`.

## Output

In conversation:
- **Bundle**: `<version>` — `<N>` items audited, `<M>` files changed
- **Libraries**: count and tags (`structural`, `wcag-aa`, ...) or "none discovered"
- **Findings**: count by confidence (High / Medium / Low), or "no findings"
- **Items created**: count, with new ids
- **Already-tracked**: count skipped

## Guardrails

- **The scan happens in the sub-agent, not here.** Your job is library discovery, bundle prep,
  dispatch, and item-writing. Do not replicate the sub-agent's analysis.
- Scan only the bundle's changed files, not the whole repo.
- Never apply fixes in this skill — produce items only.
- **No-libraries is not an error.** Graceful skip with a log entry is the correct behavior when
  no scan-* libraries are installed.
- Pass already-tracked findings into the sub-agent's brief so it skips duplicates (idempotency).
- Archive stubs are excluded (no-re-gate rule): items under `.work/archive/` were gated when
  active and must not be re-gated. Filter them out via `grep -v '\.work/archive/'` in Phase 1.
- Do NOT add `refactor` to the default `gates_for_release` list. The gate is opt-in by design.
  Deployers with no scan-rule libraries would get a no-op gate on every release — unnecessary
  overhead. Adopters opt in by editing their `.work/CONVENTIONS.md`.

## Library contract (for adopters writing scan-rule libraries)

A scan-rule library declares itself by its directory name and the content of its SKILL.md:

- **Location**: `{project}/.agents/skills/scan-<name>/SKILL.md` OR
  `{project}/.claude/skills/scan-<name>/SKILL.md` (both roots are discovered; duplicate
  names are merged — the `.agents/` root takes precedence if both carry the same name).
- **SKILL.md content**: the `description` frontmatter field and the body carry the rules. The
  gate reads the full SKILL.md and all files in `references/` as the library declaration.
- **Rule format**: each rule should carry a slug (for deduplication), a description of what
  constitutes a violation, and confidence guidance (when does a match warrant high vs. medium vs.
  low confidence).
- **No registration required**: the gate discovers libraries by glob. No manifest entry needed.

Example library skeleton:

```
{project}/.agents/skills/scan-structural/
  SKILL.md         ← library declaration + rule inventory
  references/
    api-shape.md   ← detailed rule: API structural conventions
    error-shape.md ← detailed rule: error-handling conventions
```
