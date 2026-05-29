---
name: update-epicize
description: >
  Revisit and update epic items after building features. Reads current epic items
  in .work/active/epics/ + their child features' actual completion status; identifies
  divergence between planned vs actual (scope creep, missed dependencies, scope
  reduction); proposes epic rescoping / splits / merges / archive moves. Use after
  completing a batch of features, when scope has shifted, when new blockers were
  discovered, or when the epic graph no longer matches the project's trajectory.
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion
model: opus
---

# Update-Epicize

You revisit the project's epic graph after substantial work has landed, and update
it to reflect what was actually learned during implementation. This is the substrate
equivalent of "update the roadmap" — but instead of editing a `roadmap.md` doc, you
update individual epic items and their `depends_on` chains.

**You follow the build process at `/dev/skills-v2/plugins/research-pipeline/docs/build-process.md`.** Read it before starting.

**Read `/dev/skills-v2/plugins/research-pipeline/docs/first-principles.md` for consideration.** Apply Challenge and Synthesize — challenge the current decomposition against actual evidence; synthesize learnings into the updated graph.

## When to invoke

- After completing 2-4 features within an epic (epic-level checkpoint)
- After completing a full epic (cross-epic re-evaluation)
- When scope has shifted (e.g., a feature revealed an unanticipated capability area)
- When new blockers were discovered (a brief surfaced a research gap; an integration revealed a tighter coupling)
- When the epic graph no longer matches the project's trajectory (visible via repeated `## Blocker` items or autopilot stalls)

## Prerequisites

- `.work/CONVENTIONS.md` exists (substrate bootstrapped)
- At least one epic item exists in `.work/active/epics/` (otherwise there's nothing to update)

## Model Assignment

Per [model-selection-pattern.md](/dev/skills-v2/plugins/research-pipeline/docs/model-selection-pattern.md):

- **Updater (this skill's main loop)** — Orchestration. Opus high effort. Runs in parent context.

Cross-epic decisions affect every downstream design and implement pass — Opus warrants. This skill does not spawn sub-agents.

## Workflow

### Phase 1: Inventory current state

Read all epic items via `.work/bin/work-view --kind epic`:
- Current epics + their stages
- Each epic's `depends_on` chain
- Each epic's child features (via `--parent <epic-id>`)
- Feature completion status per epic (count at `done` vs `implementing` vs `drafting` vs blocked)
- Items in `.work/releases/*/` (already-shipped epics for reference)

### Phase 2: Read foundation docs + recent decisions

Read foundation docs per `.work/CONVENTIONS.md` `foundation_docs:` declaration. Check
for any changes since the last epicize — new sections, new capability areas, new
constraints.

Read recent `## Design decisions` and `## Blocker` entries across active epics and
features. These are the most recent signals about where the work is actually heading.

### Phase 3: Identify divergence

For each active epic, ask:

- **Scope creep**: did child features extend beyond the epic's original brief? If yes, is the brief still right, or has the epic outgrown its boundary?
- **Scope reduction**: did the epic turn out smaller than planned? Should it be collapsed into a sibling?
- **Missed dependency**: did a feature reveal a dependency on a sibling epic that wasn't declared? Should the `depends_on` chain be updated?
- **Stale dependency**: is a declared `depends_on` no longer needed (e.g., the dependency was inlined)?
- **Splitting opportunity**: did a single epic accumulate multiple capability arcs that should split?
- **Merging opportunity**: do two epics overlap enough that they should merge?
- **New epic needed**: did a feature reveal an unanticipated capability area that warrants its own epic?
- **Archive candidate**: is an epic effectively done but stale (all children at `done`, parent still at `implementing`)?

### Phase 4: Propose changes

Present proposed changes to the user via `AskUserQuestion` or conversational summary:

```
Proposed epic updates:

1. epic-auth — rescoping
   Reason: recovery flow grew beyond original brief; splitting into epic-auth-core
   and epic-auth-recovery
   Changes:
     - epic-auth: scope reduced to login + session
     - new epic-auth-recovery: depends_on [epic-auth]
     - features under epic-auth tagged for new parent assignment

2. epic-admin-dashboard — dependency added
   Reason: profile-edit feature uses User type owned by epic-user-profile
   Changes:
     - depends_on: [epic-auth] → [epic-auth, epic-user-profile]

3. epic-notifications — archive candidate
   Reason: all 4 child features done; epic still at implementing
   Changes: stage drafting/implementing → done, will archive on next release-deploy
```

Iterate with user — confirm each change before applying.

### Phase 5: Apply changes

For each confirmed change:

- **Rescope**: edit the epic body (revise `## Brief`) + frontmatter (revise `tags` if needed)
- **Split**: edit the existing epic; create the new epic file; reassign child features (edit each child's `parent` field)
- **Merge**: edit one epic to absorb the other's brief; reassign child features; archive the absorbed epic
- **Dependency change**: edit `depends_on` on the affected epic; cycle-check via `.work/bin/work-view --blocking`
- **New epic**: create the file per epicize Phase 6 schema
- **Archive**: advance stage to `done` if all children done; release-deploy will archive on next bind

### Phase 6: Cycle check

For every epic whose `depends_on` changed, run:

```bash
.work/bin/work-view --blocking <epic-id> --paths
```

If any cycle exists, surface it and ask the user to break it.

### Phase 7: Commit

```bash
git add .work/active/epics/
git commit -m "update-epicize: <N> epics updated"
```

If new epics were created OR splits happened, the commit message should note specifics:
- `update-epicize: split epic-auth into auth-core + auth-recovery`
- `update-epicize: merged epic-admin and epic-config; updated 6 children`

## Output

In conversation:

- **Changes applied**: list of (epic-id, change-type, summary) per change
- **Items affected**: count of features whose `parent` was reassigned, count of new epics created
- **Suggested next steps**:
  - For newly-created epics: invoke `/epic-design <id>` to decompose
  - For [needs-brief] tags surfaced during update: invoke `/brief <topic>`
  - For archive candidates: next `/agile-workflow:release-deploy` will move them to `.work/releases/<version>/`

## Guardrails

- Don't rewrite epic history. Past `## Design decisions` are kept — append revisions with dated annotations rather than overwriting.
- Don't archive epics that still have `implementing` or `drafting` children — those need to advance first.
- Don't break parent-child relationships silently. Every feature's `parent` must point to a real epic in `.work/active/epics/` or `.work/releases/*/`.
- Cycle prevention is mandatory.
- Don't propose changes that contradict already-bound releases (`release_binding != null`); those items are part of a shipped/in-flight version.
