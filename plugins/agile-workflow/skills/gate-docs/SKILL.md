---
name: gate-docs
description: >
  Documentation gate that enforces the rolling-foundation principle. Delegates
  the full drift detection to an opus sub-agent which scans the bundle's
  changes for foundation-doc drift (assertions in docs/ that no longer match
  implementation), changelog gaps, README staleness, and skill/pattern-skill
  staleness. The orchestrator converts findings into items in .work/active/
  with gate_origin:docs and tags:[documentation]. Auto-triggers during
  /agile-workflow:release-deploy.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent
---

# Gate-Docs

You orchestrate a documentation gate that enforces the **rolling-foundation
principle**: foundation docs in `docs/` describe the system as it is NOW.
After implementation work, foundation-doc assertions can drift from reality.

The actual drift detection runs inside an **opus sub-agent**; your role is
to prepare the bundle context, dispatch the sub-agent, and convert the
findings it returns into items that will roll the docs forward.

## Trigger

- `/agile-workflow:release-deploy` invokes during `quality-gate` stage
- User can invoke manually: `/agile-workflow:gate-docs <release-version>`

## Workflow

### Phase 1: Identify bundle and changed files

```bash
.work/bin/work-view --release <version> --paths

# Files changed by the bundle
for item in $(.work/bin/work-view --release <version> --paths); do
  id=$(grep -m1 '^id:' "$item" | awk '{print $2}')
  git log --grep "$id" --format='%H' | xargs -I{} git diff-tree --no-commit-id --name-only -r {}
done | sort -u > /tmp/bundle-files-<version>.txt
```

### Phase 2: Read existing gate items (idempotency prep)

```bash
.work/bin/work-view --release <version> --gate docs --paths
```

Capture the set of `(doc-file:line, drift-category)` already-tracked findings.

### Phase 3: Dispatch the drift-detection sub-agent

Spawn ONE Agent (subagent_type=general-purpose, model=opus) with the full
drift-detection brief. The sub-agent maps the doc structure, classifies the
bundle's changes, runs parallel drift checks, and returns structured
findings.

**Brief template**:

> You are conducting a documentation drift audit for release `<version>`.
> The principle: docs in `docs/` describe the system as it is NOW. Drift =
> doc says X, code now does Y. You have access to Read, Write, Edit, Glob,
> Grep, Bash, Task. You may spawn parallel sub-tasks for the different
> drift categories.
>
> **Bundle scope** (the changes that may have caused drift):
> ```
> <bundle-files>
> ```
>
> **Bound items** (read each item's body to classify the change type):
> `<bound-item-ids>`
>
> **Already-tracked findings to skip**:
> ```
> <already-tracked doc:line / category pairs>
> ```
>
> **Methodology**:
>
> 1. **Map the doc structure**:
>    - Foundation docs at `docs/`: VISION.md, SPEC.md, ARCHITECTURE.md,
>      PRINCIPLES.md, domain-specific (UX.md, CONTRACT.md, GAMEPLAY.md, etc.)
>    - README.md at repo root
>    - CHANGELOG.md
>    - Repo-specific skills at `.claude/skills/` or `.agents/skills/`
>    - Pattern skills at `.claude/skills/patterns/`
>    - Generated files (look for `# generated`, `llms-full.txt` — never
>      edit; flag for regeneration)
>
> 2. **Classify each bound item's change type**:
>    | Change type | Doc owners |
>    |---|---|
>    | New feature / behavior | SPEC.md, ARCHITECTURE.md, relevant guide pages |
>    | New CLI command or flag | CLI reference, SPEC.md, guide pages |
>    | New config key | Config reference, SPEC.md |
>    | Prompt / UX flow change | UX.md, guide pages |
>    | New module or interface | ARCHITECTURE.md, API reference |
>    | Bug fix with behavior impact | SPEC.md (if behavior was mis-documented), CHANGELOG.md |
>    | New stable pattern | Pattern skills under `.claude/skills/patterns/` |
>    | Changed interface used by repo skills | Repo-specific skills referencing it |
>
> 3. **Parallel drift checks** — spawn sub-tasks for each:
>    - **Foundation-doc drift** — for VISION.md, SPEC.md, ARCHITECTURE.md,
>      for each assertion (interface, contract, component, behavior), grep
>      the bundle's changed files. Flag any assertion where the doc says X
>      but the code now does Y. Cite file:line for the doc and the code.
>    - **README staleness** — verify quick-start, install steps, examples,
>      command names match the codebase post-bundle.
>    - **CHANGELOG gap** — for each item bound to release `<version>`,
>      verify a changelog entry exists.
>    - **Repo skill staleness** — for each `.claude/skills/<name>/SKILL.md`,
>      grep for terms used in the skill against the bundle's changed files.
>      Flag references to terms that no longer exist or signatures that
>      changed.
>    - **Pattern skill staleness** — for each `.claude/skills/patterns/*.md`,
>      verify example file:line references still resolve and code still
>      matches.
>    - **Doc misplacement** — scan `docs/` for files that are item-shaped
>      (contain `## Acceptance Criteria`, `## Implementation Units`, or
>      `feature-`/`story-` prefixes). These belong in `.work/`.
>
> **Output format** — return a single markdown document with:
>
> ```
> ## Findings
>
> ### Finding 1
> - **Title**: <one-line: which doc, what drift>
> - **Drift category**: foundation-doc-assertion | readme-staleness |
>   changelog-gap | repo-skill-staleness | pattern-skill-staleness |
>   generated-file-needs-regen | doc-misplacement
> - **Confidence**: High | Medium
> - **Doc location**: `<file>:<line>`
> - **Code location**: `<file>:<line>` (for assertion drift; omit for gaps)
> - **Current doc text**:
>   > <quote — what the doc currently says>
> - **Reality**: <what the code now does, post-bundle>
> - **Required edit**: <roll the doc forward to match the new present.
>   Apply rolling-foundation: no "previously" prose, no "in v1.x" notes.
>   Replace the assertion in place. For generated files, give the
>   regeneration command.>
>
> ### Finding 2
> ...
> ```
>
> Followed by:
>
> ```
> ## Audit summary
> - Doc structure: <one-line>
> - Drift checks run: <list>
> - Findings by category: <breakdown>
> ```
>
> **Rules**:
> - Scan only the bundle's changes plus the docs that own those areas.
>   Don't audit every doc in the repo.
> - Cite file:line for every finding.
> - Required edits ENFORCE rolling-foundation: replace stale assertions in
>   place. Do NOT propose adding "previously" or "in v1.x" prose. Git is the
>   audit trail; the doc is the present.
> - For generated files, the required edit is the regeneration command, not
>   a manual edit.
> - Skip already-tracked findings.
> - Don't fix the docs in the sub-agent. Findings only.

### Phase 4: Convert findings to items

For each finding the sub-agent returned:

```yaml
---
id: gate-docs-<short-slug>
kind: story
stage: implementing       # high-confidence drift
                          # OR drafting for medium
tags: [documentation]
parent: null
depends_on: []
release_binding: <version>
gate_origin: docs
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# <one-line: which doc, what drift>

## Drift category
<category>

## Location
- Doc: `<file>:<line>`
- Code: `<file>:<line>` (for assertion drift)

## Current doc text
> <quote the doc — what it currently says>

## Reality
<what the code now does, post-bundle>

## Required edit
<roll the doc forward to match the new present. Apply rolling-foundation:
no "previously" prose, no "in v1.x" notes. Replace the assertion in place.>
```

For generated files needing regeneration, the item describes the regeneration
command rather than a manual edit.

### Phase 5: Commit

```bash
git add .work/active/stories/
git commit -m "gate-docs: <N> rolling-foundation findings for <version>"
```

## Output

In conversation:
- **Bundle**: `<version>` — `<N>` items audited
- **Drift found**: count by category
- **Items created**: count, with new ids
- **Generated files needing regen**: list (if any)
- **Goal reminder**: rolling-foundation enforces docs describing NOW. Findings
  here become items the release flow drains to `done` before shipping.

## Guardrails

- **The drift detection happens in the sub-agent, not here.** Your job is
  bundle prep, dispatch, and item-writing. Don't replicate the sub-agent's
  analysis in the orchestrator's context.
- Foundation-doc drift is the gate's primary job. The sub-agent surfaces it;
  you turn it into items.
- Required edits ENFORCE rolling-foundation: replace stale assertions in
  place. Do NOT propose adding "previously" or "in v1.x" prose.
- Don't fix the docs in this skill — produce items only. Implementation of
  the fixes happens via `/agile-workflow:implement` on each item.
- Audit only the bundle's changes plus the docs that own those areas — the
  sub-agent enforces this; don't override.
- Generated files get items describing the regeneration command, not manual
  edits.
