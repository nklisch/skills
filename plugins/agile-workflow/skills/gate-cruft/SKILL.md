---
name: gate-cruft
description: >
  Cruft gate that scans the items bound to a release for AI-accumulated debris (dead code, stale
  comments, compatibility shims, defensive bloat, over-abstraction) introduced or revealed by the
  bundle. Delegates the full scan to a deep cleanup scanner agent which runs language-aware
  detection plus heuristic pattern-matching, then returns findings. The orchestrator converts findings
  into items in .work/active/ with gate_origin:cruft and tags:[cleanup]. Auto-triggers during
  /agile-workflow:release-deploy.
---

# Gate-Cruft

You orchestrate a cruft gate over the items bound to a release. The actual
scan runs inside a **deep cleanup scanner agent** (a generic sub-agent prompted with the scanner posture from `../principles/references/subagents.md`); your role is to prepare the bundle context,
dispatch the scanner, and convert the findings it returns into items in the
substrate. Findings get `gate_origin: cruft`,
`tags: [cleanup]`, with severity tier shaping the stage.

Scanner strength is explicit: spawn exactly one source-read-only deep cleanup
scanner with the strongest inspection/reviewer setting the host exposes. Use a generic sub-agent prompted with the scanner posture from `../principles/references/subagents.md`. Use extra-high reasoning
for large or polyglot release bundles. If the host has no scanner path,
run the audit inline and record the reduced isolation in the release body.

## Trigger

- `/agile-workflow:release-deploy` invokes during `quality-gate` stage
- User can invoke manually: `/agile-workflow:gate-cruft <release-version>`

## Workflow

### Phase 1: Identify bundle changes

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

### Phase 2: Read existing gate items (idempotency prep)

```bash
.work/bin/work-view --release <version> --gate cruft --paths
```

Capture the set of `(file:line, category)` already-tracked findings to feed
into the scanner brief.

### Phase 3: Dispatch the cruft scanner

Spawn ONE source-read-only deep scanner agent with the full scan brief. Use a generic sub-agent prompted with the scanner posture from `../principles/references/subagents.md` and the strongest
inspection/reviewer setting the host exposes, escalating for large or polyglot
bundles. If scanner agents are unavailable, run the audit inline and record
the reduced isolation in the release body. The scanner does ecosystem detection,
runs language-aware tools, applies heuristic pattern-matching, triages
confidence, and returns structured findings.

**Brief template**:

> You are conducting a cruft scan for release `<version>` as an agile-workflow
> scanner. Use read/search/shell tools as needed. Audit ONLY the bundle's
> changed files — not the whole repo. Do not spawn nested sub-agents or implement
> fixes.
>
> **Bundle scope**:
> ```
> <bundle-files>
> ```
>
> **Already-tracked findings to skip**:
> ```
> <already-tracked file:line / category pairs>
> ```
>
> **Methodology**:
>
> 1. **Ecosystem discovery** — examine `package.json`, `tsconfig.json`,
>    `Cargo.toml`, `go.mod`, `pyproject.toml`, `Makefile`. This determines
>    which language-aware detection tools are available.
>
> 2. **Language-aware detection (high confidence)** — run against the
>    bundle's changed files only:
>    - **TypeScript/JavaScript** — `tsc --noUnusedLocals --noUnusedParameters
>      --noEmit`, eslint unused rules
>    - **Python** — `ruff check --select F811,F841,F401`, `vulture`
>    - **Go** — `go vet`, `deadcode`
>    - **Rust** — compiler warnings for `#[warn(dead_code)]`
>    Capture output and parse into findings.
>
> 3. **Heuristic pattern-matching** via Grep on bundle files:
>
>    **Medium confidence:**
>    - Comments containing "removed", "backwards compat", "for backwards
>      compatibility", "deprecated", "TODO" where the work is clearly done,
>      "FIXME" for fixed code
>    - Re-exports that nothing imports (cross-check with Grep)
>    - Variables prefixed with `_` that were renamed to suppress warnings
>    - Empty catch/except blocks with "// ignore" style comments
>    - Wrapper functions that just call through to one other function with no
>      added logic
>
>    **Low confidence:**
>    - Try/catch around code that cannot throw
>    - Validation of internal-only inputs at non-boundary functions
>    - Single-use helper functions that could be inlined
>    - Config/options parameters that only ever receive one value
>    - Abstractions with a single implementation
>
> 4. **Cross-check existing patterns** — read `.agents/skills/patterns/` and
>    legacy `.claude/skills/patterns/` if
>    present. Intentional repetition documented as a pattern is NOT cruft.
>
> 5. **Triage by confidence**:
>    | Confidence | Stage of produced item |
>    |---|---|
>    | High (tool-detected) | `stage: implementing` |
>    | Medium (pattern-matched) | `stage: drafting` |
>    | Low (judgment calls) | backlog file |
>
> **Output format** — return a single markdown document with:
>
> ```
> ## Findings
>
> ### Finding 1
> - **Title**: <one-line description>
> - **Confidence**: High | Medium | Low
> - **Category**: unused import | dead function | stale comment |
>   compatibility shim | passthrough wrapper | defensive try/catch |
>   single-use helper | over-abstraction
> - **Location**: `<file>:<line>`
> - **Evidence**:
>   ```<lang>
>   <the offending code, 1-10 lines>
>   ```
> - **Removal**: <what to remove and what to fix in surroundings>
>
> ### Finding 2
> ...
> ```
>
> Followed by:
>
> ```
> ## Scan summary
> - Ecosystem: <one-line>
> - Tools run: <list>
> - Files scanned: <count>
> - Findings by confidence: High=<n>, Medium=<n>, Low=<n>
> ```
>
> **Rules**:
> - Scan only Bundle scope. Don't expand.
> - Cite file:line for every finding.
> - Don't fabricate. If a tool produces no output, don't invent findings.
> - Skip already-tracked. Patterns documented in
>   `.agents/skills/patterns/` or legacy `.claude/skills/patterns/` are
>   intentional, not cruft.
> - Don't propose findings you can't verify (e.g. "is this exported function
>   used externally?" — if you can't confirm zero callers, downgrade to
>   medium confidence rather than high).

### Phase 4: Convert findings to items

For each finding the scanner returned:

Read `gate_finding_routing` from `.work/CONVENTIONS.md` before writing items.
If absent, use the default routing below. Normalize cruft confidence to routing
keys as: `High -> high`, `Medium -> medium`, and `Low -> low`. If a normalized
key maps to `skip`, do not emit an item for that finding; include the skipped
count in the gate output. If it maps to `backlog`, write a `.work/backlog/`
item instead of an active story.

```yaml
---
id: gate-cruft-<short-slug>
kind: story
stage: implementing | drafting    # by confidence
tags: [cleanup]
parent: null
depends_on: []
release_binding: <version>
gate_origin: cruft
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# <one-line description>

## Confidence
High | Medium | Low

## Category
<category>

## Location
`<file>:<line>`

## Evidence
\`\`\`<lang>
<the offending code, 1-10 lines>
\`\`\`

## Removal
<what to remove and what to fix in the surroundings — imports, whitespace, etc.>
```

Default confidence -> placement mapping:
- **High** → `stage: implementing` in `.work/active/stories/`
- **Medium** → `stage: drafting` in `.work/active/stories/`
- **Low** → backlog file in `.work/backlog/`

### Phase 5: Commit

```bash
git add .work/active/stories/ .work/backlog/
git commit -m "gate-cruft: <N> findings for <version>"
```

## Output

In conversation:
- **Bundle**: `<version>` — `<N>` items audited, `<M>` files changed
- **Findings**: count by confidence (High / Medium / Low)
- **Items created**: count, with new ids
- **Already-tracked**: count skipped

If the count of cleanup items is large (> 20), suggest the user implement them
in a single orchestrated pass: "These items can be drained efficiently via
`/agile-workflow:implement-orchestrator` against a parent feature, OR by
starting an autopilot goal scoped to gate-cruft items. Cleanup is mechanical
and parallelizes well."

## Guardrails

- **The scan happens in the scanner agent, not here.** Your job is bundle
  prep, dispatch, and item-writing. Don't replicate the scanner's analysis.
- Audit only the bundle's changed files, not the whole repo.
- Never remove code in this skill — produce items only.
- Cleanup items must be surgical when implemented. They remove cruft and fix
  the immediate surroundings only. They do NOT improve, refactor, or enhance.
- Patterns documented in `.agents/skills/patterns/` or legacy
  `.claude/skills/patterns/` are intentional, not
  cruft. The scanner cross-checks; don't override.
- Pass already-tracked findings into the scanner brief so it skips
  duplicates.
