---
name: update-roadmap
description: >
  Revisit and update the roadmap after building phases. Assesses what was learned during
  implementation, identifies phases that need rescoping, splitting, merging, or reordering,
  and updates roadmap.md to reflect current reality. Use after completing a batch of phases,
  when scope has shifted, when new blockers were discovered, or when the roadmap no longer
  matches the project's trajectory.
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Agent, AskUserQuestion
model: opus
---

# Update Roadmap

You revisit the project's roadmap after implementation has taught you things the original
plan couldn't anticipate. Building reveals scope changes, new blockers, phases that were
too big or too small, dependencies that shifted, and decisions that need recording. This
skill captures those learnings and produces an updated roadmap that reflects reality.

**You follow the build process at `/dev/skills-v2/plugins/research-pipeline/docs/build-process.md`.** Read it before starting.

## Model Assignment

Per [model-selection-pattern.md](../docs/model-selection-pattern.md):

- **Roadmap reviewer (this skill's main loop)** — Orchestration. Opus high effort. Runs in parent context.

Rescoping decisions affect every subsequent phase — the orchestrator warrants Opus. This skill does not spawn sub-agents.

## When to Use

- **After completing 2-4 phases** — check if remaining phases still make sense
- **When scope shifted during implementation** — a phase produced different output than expected
- **When new blockers were discovered** — a future phase now needs a brief that wasn't originally listed
- **When a phase turned out to be too big** — split it
- **When phases turned out to be trivial** — merge them
- **When dependencies changed** — reorder based on what was learned
- **After `/expand`** — scope expansion means the roadmap needs new phases

## Phase 0: Load Context

1. **Check the knowledge index** — read `docs/knowledge-index.yaml`. Load the architecture doc,
   north star, and any briefs relevant to the areas that changed.
2. **Read the current roadmap** — `docs/architecture/epicize.md` (or wherever the project stores it).
   Note: which phases are DONE, which is NEXT, which are future.
3. **Read recent git history** — `git log --oneline -20` to see what was actually built recently.
   This grounds the update in reality, not just plans.

## Phase 1: Assess What Changed

For each completed phase since the last roadmap update, check:

1. **Did the output match the spec?** Read the phase's "Done when" criteria. Were they all met?
   Were additional things built that weren't planned? Were planned items deferred?
2. **Did assumptions hold?** The phase may have assumed an API works a certain way, a library
   handles a case, or a dependency exists. Were any assumptions wrong?
3. **Were new blockers discovered?** A future phase may now need research or a brief that wasn't
   listed as blocking.
4. **Did the work surface architectural changes?** New modules, changed interfaces, shifted
   dependencies — things the remaining phases may depend on.

**Present findings to the user:**
"Reviewed phases N-M. Key changes: {list}. This affects phases {list}."

**AskUserQuestion:** "Anything else that shifted that I should factor in?"

## Phase 2: Evaluate Remaining Phases

For each future phase (NEXT and beyond):

1. **Still correctly scoped?** Too big (should split), too small (should merge), or just right?
2. **Dependencies still correct?** Does it depend on phases that changed? Do its blocking briefs
   still exist and are they still relevant?
3. **Blocking briefs still needed?** Any new ones required? Any listed ones now unnecessary
   (the brief was implicitly covered by work already done)?
4. **Acceptance criteria still accurate?** Do the "Done when" checks reflect the current
   architecture, not the old one?
5. **"Read before building" docs still exist?** File paths may have changed.

Flag issues by severity:
- **Must fix** — phase is blocked, scoped wrong, or depends on something that changed
- **Should fix** — acceptance criteria stale, minor rescoping needed
- **Optional** — phase could benefit from splitting or reordering but isn't broken

## Phase 3: Propose Changes

Present a concrete change plan:

```
## Proposed Roadmap Changes

### Phases to rescope
- Phase X: {what changed, new scope description}

### Phases to split
- Phase Y → Y + Ya: {why, what each sub-phase covers}

### Phases to merge
- Phases A + B → A: {why they're now one unit of work}

### New phases to add
- Phase Z: {what, why, where in the sequence}

### New blocking briefs
- Phase X now needs: {brief topic} — {why}

### Dependency changes
- Phase Y no longer depends on Phase X because {reason}
- Phase Z now depends on Phase W because {reason}

### Status updates
- Phase X: mark DONE (was NEXT)
- Phase Y: mark NEXT
```

**AskUserQuestion:** "Does this restructuring make sense? Any changes you'd make?"

Iterate until approved.

## Phase 4: Update the Roadmap

Apply the approved changes to `roadmap.md`:

- Update phase statuses (DONE/NEXT/blank)
- Rescope phase descriptions, blocking briefs, "Read before building" sections, and acceptance criteria
- Split/merge phases as approved
- Add new phases with full structure (all required sections per the build-process format)
- Update the dependency graph diagram
- Update the track summary
- Update the roadmap's frontmatter `description` and `updated` date

**Rules:**
- Preserve the roadmap format exactly (per build-process: blocking briefs, read before building, build, done when)
- Don't drop history — phases marked DONE keep their content (it's the record of what was built)
- New phases get the same level of detail as existing ones (not stubs)
- If the dependency graph changed, redraw it

## Phase 5: Regenerate the Knowledge Index

Run `/knowledge-index` to regenerate the index from the (now-modified) roadmap frontmatter.
Do NOT hand-edit `docs/knowledge-index.yaml`. Update the roadmap's `description`,
`summary`, `decisions`, and `updated` fields in its frontmatter — the regenerator picks
those up.

If new blocking briefs were identified, those will be written via `/brief` before the phase
starts; their entries appear in the index automatically once written.

## Phase 6: Summary

Present:
- Number of phases changed (rescoped, split, merged, added)
- New NEXT phase
- Any new blocking briefs that need to be written before building resumes
- Whether the overall timeline/scope grew, shrank, or stayed the same

---

## Anti-Patterns

- **Don't rewrite the whole roadmap from scratch.** This is an update, not a redo. Preserve completed phases and their content.
- **Don't add speculative phases.** Only add phases for work that's clearly needed based on what was learned, not "it might be nice to..."
- **Don't skip the git log.** Plans say one thing; the code says what actually happened.
- **Don't forget to update the dependency graph.** It's easy to update phase text and forget the diagram.
- **Don't split phases just because they're big.** Split only when a phase has genuinely independent units that should be separately testable and mergeable.
- **Don't update without user approval.** Present changes, get buy-in, then write. The user may have context you don't.
