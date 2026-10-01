---
id: feature-approach-note-data-shape
kind: feature
status: active
created: 2026-10-01
updated: 2026-10-01
tags: [skill, plugin, perf]
---
# Ask where hot-path data comes from and how it is shaped

The design approach note asks which algorithm or data structure a hot-path unit
uses and why its cost fits, but not the questions that decide the structure.
A Voxlar packing design answered it with "hash every final corner position, on
worker threads": a valid answer under the current wording, yet the mesher
already knew each facet and its integer grid corners, the keys fit a small
dense grid an array could index directly, and moving the hashing to workers
delayed chunk readiness instead of removing the cost. Measurement and two
correction rounds recovered what three design questions would have caught.

## Outcome

- The approach note in `design/references/design-notes.md` also asks:
  - which earlier stage already knows the identities, grouping, order, or
    changes the unit needs, so the design carries them forward instead of
    rediscovering them by hashing, searching, sorting, or diffing derived values;
  - the data shape, when the unit keeps, groups, or looks up data per element:
    the keys and their range, which decides the container; where working
    memory lives and how it is reused and reset; and the walk order;
  - every budget the cost lands on, since moving work to another thread or
    deferring it shifts cost to latency or throughput.
- The design skill's one-line summary of the note, the design review priorities,
  and the scan performance lens each reflect it in a clause.

## Exclusions

- No new lens, note, required section, frontmatter, template, or validator rule;
  the approach note's trigger is unchanged, so cold paths record nothing.
- No technique catalog (generation stamps, structure-of-arrays, false sharing,
  cache sizes). Those are domain-specific and belong in a domain craft skill or
  project patterns, which the note already says to load.
- README, SPEC, and the root guide describe the note at a level that stays true.

## Acceptance evidence

- Edited skills keep portable frontmatter and line limits; `quick_validate.py`
  passes for design and scan; Workbench script tests and `validate-workbench.py .`
  pass.
- Walkthrough: the Voxlar corner-packing case leads to the mesher's facets and
  a direct-indexed grid; a routine settings form records no note; a "might be
  slow" hunch adds nothing.
- Workbench ships as a patch release.

## Delivered

The approach note gains three prompts inside its existing trigger: every budget
the cost lands on, the earlier stage that already knows what the unit needs,
and the data shape (keys and their range, working memory reuse and reset, walk
order) for per-element data. The design skill's summary line, the design review
priorities, and the scan performance lens each gained a clause. README, SPEC,
and the root guide still describe the note accurately and are unchanged.

Verification: Workbench script tests (84) pass; `quick_validate.py` passes for
design and scan; `validate-workbench.py .` passes with no warnings; knowledge
index check passes; `design-notes.md` is 141 lines with contents and the design
skill 257 lines. Instruction walkthrough (not an observed run): the Voxlar
corner-packing unit triggers the note, and its prompts lead to the mesher's
facets and grid corners (carry forward), a bounded grid of positions and a few
dozen normals (direct indexing with reused, cheaply reset scratch), and chunk
readiness as the budget worker time lands on; a routine settings form records
no note; a "might be slow" hunch with no budget or trap adds nothing. Review was
inline, not independent.
