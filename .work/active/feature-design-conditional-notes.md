---
id: feature-design-conditional-notes
kind: feature
status: active
created: 2026-09-29
updated: 2026-09-29
tags: [skill, plugin]
---
# Add conditional design notes for surface, refusals, and assumptions

Workbench designs pin down boundaries, stateful components, and recovery, but
not exactly what the implementer adds and removes, how a refusal is justified,
or which unconfirmed facts would sink the design. Implementers then leave old
paths beside new ones, add dependencies or leave runtime leftovers unasked,
write guards that review later removes, and paper over broken premises with
silent fallbacks.

## Outcome

- A design reference, `design/references/design-notes.md`, holds conditional
  notes, each with a trigger, recorded in the item only when it applies:
  - **Approach** (moved from the design skill unchanged in substance);
  - **Adds and retires:** new lasting surface (public names, formats,
    dependencies, runtime resources with their cleanup owner, new terms) and what
    the change deletes; an old path survives only for a named consumer; hard-to-reverse
    additions are raised as consequential choices;
  - **Refusals and hard stops:** the threat, what legitimate users lose, and the
    degraded path, override, or reason none is safe;
  - **Load-bearing assumptions:** how to check each first and what happens when
    it is false; no unplanned fallback, stub, or mock.
- The design skill keeps a short pointer listing the notes and triggers.
- The new-work lens, design review priorities, and delivery guidance (check
  assumptions first; compare the diff with the adds-and-retires list) reflect
  the notes. README, SPEC, and the root Workbench guide describe them.

## Exclusions

- No required sections, frontmatter, validator rules, or new lens.
- Worked examples stay limited to design attachments.

## Acceptance evidence

- Skills keep portable frontmatter; `design/SKILL.md` shrinks; the reference
  stays under 200 lines with a table of contents; no stale anchors remain.
- Workbench tests, `quick_validate.py`, the knowledge index check, and a clean
  worktree `validate-workbench.py` pass.
- Walkthrough: a routine internal change records no notes; a new CLI flag plus a
  replaced config file records adds and retires; a new startup capability check
  records a refusal note; a design relying on an unverified API batch endpoint
  records a load-bearing assumption and delivery returns rather than stubbing.
- Workbench ships as a patch release.

## Delivered

`design/references/design-notes.md` (128 lines, with contents) holds the four
notes; the design skill's approach subsection became a short pointer (design
skill now 256 lines, down from 272). The new-work lens, design review
priorities (omissions), delivery (check assumptions first; diff against the
adds-and-retires list), README, SPEC, and the root Workbench guide reflect it.

Verification: Workbench script tests pass; `quick_validate.py` passes for design
and deliver; knowledge index check passes; every relative link and anchor in
the touched files resolves, and no link to the removed approach anchor remains.
Instruction walkthrough (not an observed run): a private helper rename records
no notes; a new command flag replacing a config format lists both, raises the
format as a consequential choice, and keeps the old reader only for existing
user configs with a removal condition; a startup filesystem-type check records
its threat, user loss, and degraded path; a design relying on an unconfirmed
batch endpoint marks it load-bearing and delivery returns rather than stubbing.
Review was inline, not independent.
