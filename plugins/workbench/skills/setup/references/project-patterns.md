# Project Pattern Catalog

Setup always creates `.agents/skills/patterns/SKILL.md` as the canonical portable
project-pattern index. An empty stub gives future agents one stable destination
without claiming that the repository already has reusable patterns.

Use this initial file:

```markdown
---
name: patterns
description: >
  Project-specific recurring implementation patterns. Use when implementing,
  designing, reviewing, refactoring, or extracting patterns in this repository;
  the index starts empty and grows only from evidence-backed maintenance work.
---

# Project Patterns

No project patterns have been recorded yet. Add focused references only after a
pattern-extraction maintenance outcome confirms recurrence, concrete consumers,
and material maintenance value.
```

Focused Markdown references own confirmed pattern details. The index names and
links them without duplicating their rule bodies. Each reference records the
recurring problem, preferred implementation shape, why it helps in this
repository, real consumers or examples, and exceptions. Promotion follows the
criteria in [maintenance.md](../../work/references/maintenance.md).

Keep authority separate:

- formatter and linter configuration owns mechanical rules;
- `AGENTS.md` owns concise agent operating rules;
- foundations own architecture and principles;
- the pattern catalog owns detailed recurring implementation shapes.

Setup structurally and semantically reconciles an existing catalog but does not
audit every pattern against code. Concrete delivery repairs stale existing
patterns. New pattern references enter through an explicit pattern-extraction
maintenance feature, not ordinary delivery.

## Claude compatibility projection

When root `CLAUDE.md` exists after setup reconciliation, maintain
`.claude/skills/patterns` as a relative symlink with target
`../../.agents/skills/patterns`. The `.agents` catalog remains authoritative. A
correct symlink is a no-op.

Inspect a conflicting path without following the symlink for destructive
operations. Classify a regular file or directory, broken symlink, wrong-target
symlink, and divergent mirror before replacement. Consolidate useful
user-authored content into the canonical catalog and apply setup's normal Git,
recovery, and exact-confirmation rules before removing an unrecoverable path.
