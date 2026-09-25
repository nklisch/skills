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
  the index starts empty and grows only from evidence-backed catalog passes.
---

# Project Patterns

No project patterns have been recorded yet. Add focused references only when a
catalog pass at a large review boundary confirms recurrence, concrete consumers,
and material maintenance value.
```

Focused Markdown references own confirmed pattern details. The index names and
links them without duplicating their rule bodies. Each reference records the
recurring problem, preferred implementation shape, why it helps in this
repository, real consumers or examples, and exceptions. Promotion follows the
criteria in [maintenance.md](../../work/references/maintenance.md). The
repository's pathology examples live in `references/pathologies.md`, in the
shape that [code craft](../../code-craft/SKILL.md#the-repository-catalog)
defines, and the index links it once it exists.

Keep authority separate:

- formatter and linter configuration owns mechanical rules;
- `AGENTS.md` owns concise agent operating rules;
- foundations own architecture and principles;
- the pattern catalog owns detailed recurring implementation shapes.

Setup structurally and semantically reconciles an existing catalog but does not
audit every pattern against code. Concrete delivery repairs stale existing
patterns. New entries enter through the catalog pass at a large review
boundary or an explicit extraction request, not ordinary delivery.

## Claude skill discovery

Maintain `.claude/skills` as one relative directory symlink to `../.agents/skills`.
The canonical `.agents/skills/` tree holds all project skills; the projection
exposes patterns, scan lenses, and other project skills together. This does not
depend on a root `CLAUDE.md`. A correct directory link is a no-op.

Inspect both skill trees before replacement, not just `patterns`. Move unique
Claude-only skills into `.agents/skills/` and reconcile same-name differences
there without silently choosing a winner. Treat existing per-skill links into
`.agents` as views of that content, not files to copy back onto their own targets.
Ensure the canonical tree does not itself point back through the projection.

Classify conflicting files, directories, broken or wrong-target links, and
mirrors under [migration rules](migration-rules.md#cleanup-safety). Only replace
the old `.claude/skills` container after retained contents and references are
verified, applying the normal Git/recovery and exact-confirmation rules. Inspect
and remove links themselves, never their targets. Do not retain parallel skill
copies or rebuild per-skill links after the directory projection is established.
