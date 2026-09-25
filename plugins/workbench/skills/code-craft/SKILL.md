---
name: code-craft
description: >
  Keep code readable and free of ceremony while designing, implementing, or reviewing in a
  Workbench project. Use only when .work/CONVENTIONS.md declares owner: workbench. Covers finding
  the repository's existing model before inventing one, designing an abstraction with its first
  consumer, naming readability pathologies in review instead of saying "too complex", judging
  decomposition, and keeping the repository's pathology catalog current.
---

# Code Craft

Code that agents write rarely fails through bad style in the abstract. It fails
because a real requirement is missing its abstraction, so every implementer
repeats the same ceremony inline until the algorithm disappears under it. Long
functions are not the problem; plenty of long functions read well. Ceremony that
hides the algorithm is.

Apply this skill with the project's `## Overbuilding calibration` and effective
[simplification posture](../work/references/simplification.md). It sharpens how
code is shaped and reviewed; it never adds scope, requirements, or review passes.

## Design

When a mechanism will recur across call sites (error construction, boundary
parsing, context passing, failure returns), design the abstraction with its first
consumer rather than after the third copy. The trigger is ceremony that already
exists in the repository, never speculation.

- Before inventing a local idiom, find the repository's existing model of the
  same ceremony. The good abstraction usually already exists somewhere; the
  failure is not looking for it. The repository's pathology catalog names these
  models, and its project `patterns` skill records the recurring shapes they
  follow.
- Shape public surfaces so callers cannot produce the boilerplate: constructors
  for error variants, typed boundary values, parser methods, context structs.
- Separate mechanical extraction, an implementation choice, from a new
  abstraction that owns state or touches admission, publication, or recovery.
  The second is a design decision; raise it through design's
  [forecast step](../design/SKILL.md#forecast-new-state-before-it-binds).
- When the design adds, splits, merges, or moves units, or introduces a layer,
  shape the decomposition with [structure](references/structure.md).

## Implementation

- Look for the existing helper before writing a block. If the same block appears
  twice in your own change, extract it now, not in a later cleanup.
- Keep one construct per nesting level. Depth should follow the grammar or the
  algorithm, not error plumbing.
- Do not fix ceremony by splitting alone; that produces two ceremony-laden
  functions. Extract the ceremony first, then decide whether a split still helps.
- Keep comments that carry ordering constraints, such as reserve-before-move or
  validate-before-mutate. They are load-bearing and survive extraction.
- Test at supported interfaces. Do not leave a door into a sealed system for a
  test ([test backdoors](references/pathologies.md#test-backdoors)).

## Review

Read for feel, then name the pathology from
[the catalog](references/pathologies.md) instead of saying "too long" or "too
complex". A finding is material when ceremony hides the algorithm, the same block
appears three or more times in a file or change, nesting follows plumbing rather
than logic, or a file mixes subsystems past reviewability. Ask for rework that
names the pathology and the suggested abstraction; the outcome owner adjudicates.
Non-material ceremony is a note, not a blocker.

Check the [idiom table](references/structure.md#idiom-table) before flagging.
Dispatch tables, guard-clause checklists, declarative tables, and similar shapes
look dense and are fine. At `standard` review weight and above, refactor and
decomposition work also applies the [structure lens](references/structure.md).

A repository may define further pathology names in its own instructions or
catalog. Use them the same way.

## The repository catalog

Each repository keeps its own examples in a `pathologies.md` reference inside
its `patterns` skill, beside its pattern references and linked from the index
(by default `.agents/skills/patterns/pathologies.md`). The general pathologies here are the vocabulary; the repository catalog
records where they occur in this codebase and where the good model lives. Read it
when it exists. It is written only at the review boundaries in
[maintenance](../work/references/maintenance.md#pattern-lifecycle); during
ordinary delivery, report candidates to the outcome owner instead of editing it.

Keep each entry to this shape:

```markdown
## Error ladders

- Example: `src/import.rs:120` — the same five-line error built for every field
- Model to copy: `ParseContext::fail` in `src/parse.rs`
```

- At most three current examples and one model to copy per pathology. A new
  example replaces the weakest or stalest one instead of being appended. The
  catalog shows the shape; it is not an inventory of every instance.
- One line per example: `path:line` and what it shows. No copied code.
- Delete an example once it is fixed, unless the fix becomes the model to copy.
  Git keeps the history.
- Remove a pathology from the file when no live example remains.
- A pathology found only in this repository gets a short memorable name and a
  one-paragraph definition of its symptom and fix. It needs three occurrences
  with the same underlying cause. Match findings by cause, not symptom: two
  symptoms from one missing abstraction are one pathology.
- Check the general pathologies and the repository's own definitions before
  adding a new one; most findings are a new example of an existing pathology.
