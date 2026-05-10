---
name: gate-docs
description: >
  Documentation gate that enforces the rolling-foundation principle. Scans items
  bound to a release for foundation-doc drift (assertions in docs/ that no longer
  match implementation), changelog gaps, and skill/pattern-skill staleness. Produces
  items in .work/active/ with gate_origin:docs and tags:[documentation].
  Auto-triggers during /agile-workflow:release-deploy.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent
model: opus
---

# Gate-Docs

You enforce the **rolling-foundation principle**: foundation docs in `docs/`
describe the system as it is NOW. After implementation work, foundation-doc
assertions can drift from reality. This gate finds the drift and produces items
to roll the docs forward.

## Trigger

- `/agile-workflow:release-deploy` invokes during `quality-gate` stage
- User can invoke manually: `/agile-workflow:gate-docs <release-version>`

## Workflow

### Phase 1: Identify bundle and changed files

```bash
.work/bin/work-view --release <version> --paths
```

Build the union of files changed by the bundle (per phase 1 in `gate-cruft`).

### Phase 2: Discover the doc structure

Map the project's docs:
- Foundation docs at `docs/`: VISION.md, SPEC.md, ARCHITECTURE.md, PRINCIPLES.md,
  domain-specific (UX.md, CONTRACT.md, GAMEPLAY.md, etc.)
- README.md at repo root
- CHANGELOG.md
- Repo-specific skills at `.claude/skills/` or `.agents/skills/`
- Pattern skills at `.claude/skills/patterns/`
- Generated files (look for `# generated`, `llms-full.txt`, etc. — never edit;
  flag for regeneration)

### Phase 3: Classify the bundle's changes

For each bound item, classify its change type by reading the item body:

| Change type | Doc owners |
|---|---|
| New feature / behavior | SPEC.md, ARCHITECTURE.md, relevant guide pages |
| New CLI command or flag | CLI reference, SPEC.md, guide pages |
| New config key | Config reference, SPEC.md |
| Prompt / UX flow change | UX.md, guide pages |
| New module or interface | ARCHITECTURE.md, API reference |
| Bug fix with behavior impact | SPEC.md (if behavior was mis-documented), CHANGELOG.md |
| New stable pattern | Pattern skills under `.claude/skills/patterns/` |
| Changed interface used by repo skills | Repo-specific skills referencing it |

### Phase 4: Drift detection

Spawn parallel Explore sub-agents (sonnet minimum) to find drift:

1. **Foundation-doc drift** — "Read VISION.md, SPEC.md, ARCHITECTURE.md. For each
   assertion (interface, contract, component, behavior), grep the bundle's changed
   files. Flag any assertion where the doc says X but the code now does Y. Cite
   file:line for the doc, file:line for the code."

2. **README staleness** — "Read README.md. Verify quick-start, install steps,
   examples, command names match the codebase post-bundle. Flag any drift."

3. **CHANGELOG gap** — "Read CHANGELOG.md. For each item bound to release
   `<version>`, verify a changelog entry exists. Flag missing entries."

4. **Repo skill staleness** — "Read each `.claude/skills/<name>/SKILL.md`.
   For each, grep for terms used in the skill against the bundle's changed
   files. Flag any skill referencing terms that no longer exist or signatures
   that have changed."

5. **Pattern skill staleness** — "Read each `.claude/skills/patterns/*.md`.
   For each pattern, verify its example file:line references still resolve and
   the code still matches. Flag stale references."

6. **Doc misplacement** — "Scan `docs/` for files that are item-shaped (contain
   `## Acceptance Criteria`, `## Implementation Units`, or `feature-`/`story-`
   prefixes). These belong in `.work/` as items, not loose in `docs/` —
   foundation docs in `docs/` should describe the system as it is now, not
   carry feature briefs or design plans. Flag each with a suggestion to migrate
   into the substrate via `/agile-workflow:scope` or to delete if redundant."

### Phase 5: Convert drift to items

For each finding:

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
foundation-doc-assertion | readme-staleness | changelog-gap |
repo-skill-staleness | pattern-skill-staleness | generated-file-needs-regen

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

### Phase 6: Idempotency

Skip findings already tracked as gate-docs items for this release.

### Phase 7: Commit

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

- Foundation-doc drift is the gate's primary job. Find it and surface it.
- Required edits ENFORCE rolling-foundation: replace stale assertions in place.
  Do NOT propose adding "previously" or "in v1.x" prose. Git is the audit trail;
  the doc is the present.
- Don't fix the docs in this skill — produce items only. Implementation of the
  fixes happens via `/agile-workflow:implement` on each item.
- Audit only the bundle's changes plus the docs that own those areas. Don't audit
  every doc in the repo — that's unscoped scope creep.
- Generated files get items describing the regeneration command, not manual edits.
