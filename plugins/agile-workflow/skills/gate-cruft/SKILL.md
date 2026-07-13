---
name: gate-cruft
description: >
  Cruft gate focused on release-bound items that may follow relevant evidence into adjacent or
  system-wide code. Finds dead code, stale comments, low-value tests and checks, compatibility
  shims, defensive bloat, and over-abstraction, including whole systems that may no longer earn
  their cost. Delegates the scan to a deep cleanup scanner agent which runs language-aware
  detection plus heuristic pattern-matching, then returns findings. The orchestrator converts findings
  into items in .work/active/ with gate_origin:cruft and tags:[cleanup]. Auto-triggers during
  /agile-workflow:release-deploy.
---

# Gate-Cruft

You orchestrate a cruft gate focused on the items bound to a release. Bound
items establish the center of gravity, not a hard file boundary: the scanner may
follow relevant call paths, dependencies, shared infrastructure, tests, or
system-wide mechanisms needed to understand whether complexity still earns its
cost. The actual scan runs inside a **deep cleanup scanner agent** (a generic sub-agent prompted with the scanner posture from `../principles/references/subagents.md`); your role is to prepare the bundle context,
dispatch the scanner, and convert the findings it returns into items in the
substrate. Findings get `gate_origin: cruft`,
`tags: [cleanup]`, with confidence shaping placement and stage.

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
> scanner. Use read/search/shell tools as needed. Start with the bundle's
> changed files, then follow relevant evidence into adjacent dependencies,
> shared infrastructure, tests, or system-wide mechanisms. Do not perform an
> aimless whole-repo sweep, spawn nested sub-agents, or implement fixes.
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
> 2. **Language-aware detection (high confidence)** — run against the bundle
>    files first; expand a tool's scope only when needed to establish callers,
>    duplication, reachability, ownership, or system-level cost:
>    - **TypeScript/JavaScript** — `tsc --noUnusedLocals --noUnusedParameters
>      --noEmit`, eslint unused rules
>    - **Python** — `ruff check --select F811,F841,F401`, `vulture`
>    - **Go** — `go vet`, `deadcode`
>    - **Rust** — compiler warnings for `#[warn(dead_code)]`
>    Capture output and parse into findings.
>
> 3. **Heuristic pattern-matching** via Grep, beginning with bundle files and
>    following concrete references where the evidence leads:
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
>    - Duplicate, tautological, obsolete, or implementation-bound tests
>    - Validation/check layers whose guarantees exceed the project's actual scope
>
> 4. **System-level challenge** — inspect whether an entire validation layer,
>    invariant/check system, test suite, compatibility mechanism, defensive
>    subsystem, or abstraction family exposed by the bundle still justifies its
>    maintenance cost. State its current purpose, evidence of cost, what removal
>    would simplify, and which behavior or guarantee would be lost. Classify
>    these as `Decision required`; never assume the guarantee should disappear.
>
> 5. **Cross-check existing patterns** — read `.agents/skills/patterns/` and
>    legacy `.claude/skills/patterns/` if
>    present. Intentional repetition documented as a pattern is NOT cruft.
>
> 6. **Triage by confidence, release relevance, and decision need**:
>    - `Release-relevant`: caused by, exposed by, or materially affects the bundle.
>    - `Ambient`: useful discovery outside release scope; propose as unbound backlog.
>    - `Decision required: yes`: any whole-system removal candidate, especially
>      one that changes behavior or guarantees; ask before creating removal work.
>
>    Then triage confidence:
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
>   single-use helper | over-abstraction | low-value test | redundant checks |
>   system-level simplification
> - **Relevance**: Release-relevant | Ambient
> - **Decision required**: yes | no
> - **Guarantee affected**: none | <behavior/validation/determinism/compatibility/safety>
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
> - Bundle scope is the focus, not a hard boundary. Expand only by following
>   concrete evidence; record why each out-of-bundle file or system was inspected.
> - Cite file:line for every finding.
> - Don't fabricate. If a tool produces no output, don't invent findings.
> - Skip already-tracked. Patterns documented in
>   `.agents/skills/patterns/` or legacy `.claude/skills/patterns/` are
>   intentional, not cruft.
> - Don't propose findings you can't verify (e.g. "is this exported function
>   used externally?" — if you can't confirm zero callers, downgrade to
>   medium confidence rather than high).

### Phase 4: Resolve system-level removal decisions

For each `Decision required` candidate, present the system's purpose, current
cost, proposed simplification, and guarantees or behavior removal would weaken.
Ask the user whether to remove, reduce, retain, or park it. Group related
candidates and use the structured question tool in batches when available.
Never turn a guarantee-reducing proposal into active work without confirmation.
In a non-interactive gate path, write an unbound backlog decision proposal and
continue; do not assume consent or block unrelated release work.

### Phase 5: Convert findings to items

For each confirmed or ordinary finding the scanner returned:

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
release_binding: <version> | null  # null for ambient or unconfirmed decision proposals
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

Release-relevant findings use the normal confidence mapping and bind to the
release. Ambient findings and unconfirmed decision proposals always go to the
unbound backlog regardless of confidence. A confirmed system removal may bind
only when the user explicitly includes it in the current release.

Default confidence -> placement mapping:
- **High** → `stage: implementing` in `.work/active/stories/`
- **Medium** → `stage: drafting` in `.work/active/stories/`
- **Low** → backlog file in `.work/backlog/`

### Phase 6: Commit

```bash
git add .work/active/stories/ .work/backlog/
git commit -m "gate-cruft: <N> findings for <version>"
```

## Output

In conversation:
- **Bundle**: `<version>` — `<N>` items audited, `<M>` files changed
- **Findings**: count by confidence and relevance (release / ambient / decision)
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
- Release-bound items define focus, not a hard boundary. Follow concrete
  evidence into adjacent or system-wide code, but do not turn the gate into an
  unfocused whole-repo audit.
- Never remove code in this skill — produce items only.
- Local cleanup items should stay surgical. Whole-system simplification is
  allowed as a proposal, but any reduction in behavior or guarantees requires
  explicit user confirmation and appropriately scoped design work.
- Patterns documented in `.agents/skills/patterns/` or legacy
  `.claude/skills/patterns/` are intentional, not
  cruft. The scanner cross-checks; don't override.
- Pass already-tracked findings into the scanner brief so it skips
  duplicates.
