---
name: gate-docs
description: >
  Documentation gate that enforces the rolling-foundation principle. Delegates the full drift
  detection to a deep documentation scanner agent which scans the bundle's changes for
  foundation-doc drift (assertions in docs/ that no longer match implementation), changelog gaps,
  README staleness, and skill/pattern-skill staleness. The orchestrator converts findings into items
  in .work/active/ with gate_origin:docs and tags:[documentation]. Auto-triggers during
  /agile-workflow:release-deploy.
---

# Gate-Docs

You orchestrate a documentation gate that enforces the **rolling-foundation
principle**: foundation docs in `docs/` describe current truth or intended
future state, never past state. After implementation work, foundation-doc
assertions can drift from reality or from the intended state they are meant to
describe.

The actual drift detection runs inside a **deep documentation scanner agent**
(a generic sub-agent prompted with the scanner posture from `../principles/references/subagents.md`); your role is to
prepare the bundle context, dispatch the scanner, and convert the findings it
returns into items that will roll the docs forward.

Scanner strength is explicit: spawn exactly one source-read-only deep
documentation scanner with the strongest inspection/reviewer setting the host
exposes. Use a generic sub-agent prompted with the scanner posture from `../principles/references/subagents.md`. Use
extra-high reasoning for large documentation surfaces or broad API drift. If the
host has no scanner path, run the audit inline and record the reduced
isolation in the release body.

## Trigger

- `/agile-workflow:release-deploy` invokes during `quality-gate` stage
- User can invoke manually: `/agile-workflow:gate-docs <release-version>`

## Workflow

### Phase 1: Identify bundle and changed files

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
.work/bin/work-view --release <version> --gate docs --paths
```

Capture the set of `(doc-file:line, drift-category)` already-tracked findings.

### Phase 3: Dispatch the drift-detection scanner

Spawn ONE source-read-only deep scanner agent with the full drift-detection
brief. Use a generic sub-agent prompted with the scanner posture from `../principles/references/subagents.md` and the
strongest inspection/reviewer setting the host exposes, escalating for large
documentation surfaces. If scanner agents are unavailable, run the audit
inline and record the reduced isolation in the release body. The scanner maps
the doc structure, classifies the bundle's changes, runs drift-check passes, and
returns structured findings.

**Brief template**:

> You are conducting a documentation drift audit for release `<version>` as an
> agile-workflow scanner. The principle: docs in `docs/` describe current truth
> or intended future state, never past state. Drift = doc says X, but the
> completed bundle now does Y or the intended future state has changed to Y. Use
> read/search/shell tools as needed, but do not spawn nested sub-agents or fix docs.
>
> **Bundle scope** (the changes that may have caused drift):
> ```
> <bundle-files>
> ```
>
> **Bound items** (read each item's body to classify the change type; an
> archived stub's body is pruned on disk — hydrate it from the stub's
> `git_ref` frontmatter via `git show <git_ref>:<path>`, trying the item's
> former `.work/active/` path at that ref):
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
>    - Repo-specific skills at `.agents/skills/` or legacy `.claude/skills/`
>    - Pattern skills at `.agents/skills/patterns/` or legacy `.claude/skills/patterns/`
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
>    | New stable pattern | Pattern skills under `.agents/skills/patterns/` |
>    | Changed interface used by repo skills | Repo-specific skills referencing it |
>
> 3. **Drift-check passes** — run each relevant pass yourself:
>    - **Foundation-doc drift** — for VISION.md, SPEC.md, ARCHITECTURE.md,
>      for each assertion (interface, contract, component, behavior), grep
>      the bundle's changed files. Flag any assertion where the doc says X
>      but the code now does Y. Cite file:line for the doc and the code.
>    - **README staleness** — verify quick-start, install steps, examples,
>      command names match the codebase post-bundle.
>    - **CHANGELOG gap** — for each item bound to release `<version>`,
>      verify a changelog entry exists.
>    - **Repo skill staleness** — for each `.agents/skills/<name>/SKILL.md`
>      or legacy `.claude/skills/<name>/SKILL.md`,
>      grep for terms used in the skill against the bundle's changed files.
>      Flag references to terms that no longer exist or signatures that
>      changed.
>    - **Pattern skill staleness** — for each `.agents/skills/patterns/*.md`
>      or legacy `.claude/skills/patterns/*.md`,
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
> - **Relevance**: Release-relevant | Ambient
> - **Doc location**: `<file>:<line>`
> - **Code location**: `<file>:<line>` (for assertion drift; omit for gaps)
> - **Current doc text**:
>   > <quote — what the doc currently says>
> - **Reality**: <what the code now does, post-bundle>
> - **Required edit**: <roll the doc forward to match the new active truth.
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
> - Bundle changes and their owning docs are the focus, not a hard boundary.
>   Follow concrete references into adjacent docs, generated catalogs, or
>   system-wide documentation when needed; do not perform an aimless doc sweep.
> - Cite file:line for every finding.
> - Required edits ENFORCE rolling-foundation: replace stale assertions in
>   place. Do NOT propose adding "previously" or "in v1.x" prose. Git is the
>   audit trail; the doc carries the active truth.
> - For generated files, the required edit is the regeneration command, not
>   a manual edit.
> - Skip already-tracked findings.
> - Don't fix the docs in the scanner. Findings only.

### Phase 4: Convert findings to items

For each finding the scanner returned:

Read `gate_finding_routing` from `.work/CONVENTIONS.md` before writing items.
If absent, use the default routing below. Normalize documentation confidence to
routing keys as: `High -> high` and `Medium -> medium`. If a normalized key maps
to `skip`, do not emit an item for that finding; include the skipped count in
the gate output. If it maps to `backlog`, write a `.work/backlog/` item instead
of an active story.

```yaml
---
id: gate-docs-<short-slug>
kind: story
stage: implementing       # high-confidence drift
                          # OR drafting for medium
tags: [documentation]
parent: null
depends_on: []
release_binding: <version> | null  # null for ambient findings
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
<roll the doc forward to match the new active truth. Apply rolling-foundation:
no "previously" prose, no "in v1.x" notes. Replace the assertion in place.>
```

For generated files needing regeneration, the item describes the regeneration
command rather than a manual edit.

Release-relevant drift uses the normal confidence mapping and binds to the
release. Ambient staleness merely discovered while following references goes to
the unbound backlog.

Default confidence -> placement mapping:
- **High** → `stage: implementing` in `.work/active/stories/`
- **Medium** → `stage: drafting` in `.work/active/stories/`

### Phase 5: Commit

```bash
git add .work/active/stories/ .work/backlog/
git commit -m "gate-docs: <N> rolling-foundation findings for <version>"
```

## Output

In conversation:
- **Bundle**: `<version>` — `<N>` items audited
- **Drift found**: count by category
- **Items created**: count, with new ids
- **Generated files needing regen**: list (if any)
- **Goal reminder**: rolling-foundation enforces docs describing current truth
  or intended future state, never past state. Findings here become items the
  release flow drains to `done` before shipping.

## Guardrails

- **The drift detection happens in the scanner agent, not here.** Your job is
  bundle prep, dispatch, and item-writing. Don't replicate the scanner's
  analysis in the orchestrator's context.
- Foundation-doc drift is the gate's primary job. The scanner surfaces it;
  you turn it into items.
- Required edits ENFORCE rolling-foundation: replace stale assertions in
  place. Do NOT propose adding "previously" or "in v1.x" prose.
- Don't fix the docs in this skill — produce items only. Implementation of
  the fixes happens via `/agile-workflow:implement` on each item.
- Release-bound changes define focus, not a hard boundary. Follow concrete
  documentation ownership and reference chains; route merely ambient drift to
  the unbound backlog rather than silently expanding the release.
- Generated files get items describing the regeneration command, not manual
  edits.
