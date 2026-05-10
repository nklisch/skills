---
name: gate-cruft
description: >
  Cruft gate that scans the items bound to a release for AI-accumulated debris
  (dead code, stale comments, compatibility shims, defensive bloat, over-abstraction)
  introduced or revealed by the bundle. Produces items in .work/active/ with
  gate_origin:cruft and tags:[cleanup]. Auto-triggers during
  /agile-workflow:release-deploy.
allowed-tools: Read, Glob, Grep, Bash, Agent, Edit
model: opus
---

# Gate-Cruft

You scan the bundle's code changes for AI-accumulated cruft and produce items
as findings. Findings get `gate_origin: cruft`, `tags: [cleanup]`, with the
appropriate severity tier shaping the stage.

## Trigger

- `/agile-workflow:release-deploy` invokes during `quality-gate` stage
- User can invoke manually: `/agile-workflow:gate-cruft <release-version>`

## Workflow

### Phase 1: Identify bundle changes

```bash
# Bound items
.work/bin/work-view --release <version> --paths

# Files changed by the bundle
for item in $(...); do
  id=$(grep -m1 '^id:' "$item" | awk '{print $2}')
  git log --grep "$id" --format='%H' | xargs -I{} git diff-tree --no-commit-id --name-only -r {}
done | sort -u
```

### Phase 2: Discover ecosystem

Examine `package.json`, `tsconfig.json`, `Cargo.toml`, `go.mod`, `pyproject.toml`,
`Makefile` for language and tooling. This determines which language-aware
detection tools are available.

### Phase 3: Run language-aware detection

These produce **high-confidence** findings:

- **TypeScript/JavaScript** — `tsc --noUnusedLocals --noUnusedParameters --noEmit`,
  eslint unused rules
- **Python** — `ruff check --select F811,F841,F401`, `vulture`
- **Go** — `go vet`, `deadcode`
- **Rust** — compiler warnings for `#[warn(dead_code)]`

Run only against the bundle's changed files (not the whole repo). Capture output;
parse into findings.

### Phase 4: Heuristic detection (medium / low confidence)

Use Grep on the bundle's changed files to find:

**Medium confidence:**
- Comments containing "removed", "backwards compat", "for backwards compatibility",
  "deprecated", "TODO" where the work is clearly done, "FIXME" for fixed code
- Re-exports that nothing imports (cross-check with Grep)
- Variables prefixed with `_` that were renamed to suppress warnings
- Empty catch/except blocks with "// ignore" style comments
- Wrapper functions that just call through to one other function with no added
  logic

**Low confidence:**
- Try/catch around code that cannot throw
- Validation of internal-only inputs at non-boundary functions
- Single-use helper functions that could be inlined
- Config/options parameters that only ever receive one value
- Abstractions with a single implementation

Use the `patterns` skill if it exists — intentional repetition documented as a
pattern is NOT cruft.

### Phase 5: Triage findings

| Confidence | Stage of produced item |
|---|---|
| High (tool-detected) | `stage: implementing` |
| Medium (pattern-matched) | `stage: drafting` |
| Low (judgment calls) | backlog file (not stage-managed) |

### Phase 6: Convert findings to items

For each finding:

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
unused import | dead function | stale comment | compatibility shim |
passthrough wrapper | defensive try/catch | single-use helper | over-abstraction

## Location
`<file>:<line>`

## Evidence
\`\`\`<lang>
<the offending code, 1-10 lines>
\`\`\`

## Removal
<what to remove and what to fix in the surroundings — imports, whitespace, etc.>
```

### Phase 7: Idempotency

Skip findings that already have gate-cruft items for this release.

### Phase 8: Commit

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
spawning a `/agile-workflow:autopilot --all` run scoped to gate-cruft items.
Cleanup is mechanical and parallelizes well."

## Guardrails

- Audit only the bundle's changed files, not the whole repo.
- Never remove code you can't verify is unused. If a function is exported and you
  can't confirm zero external consumers, flag medium-confidence rather than
  removing.
- Cleanup items must be surgical when implemented. They remove cruft and fix the
  immediate surroundings only. They do NOT improve, refactor, or enhance.
- Patterns documented in `.claude/skills/patterns/` are intentional, not cruft.
  Cross-check before flagging.
- Don't fix anything in this skill — produce items only.
