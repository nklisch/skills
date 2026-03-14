---
name: update-documentation
description: >
  Align all documentation to code after a change. Use after implementing a feature, adding a
  config key, new CLI command, new flag, or any non-trivial code change. Invoke proactively
  when finishing implementation — not only when the user asks. Discovers the project's doc
  structure dynamically rather than assuming fixed paths.
---

# Update Documentation

> **Run inline — do NOT spawn a subagent.** Your live context of what changed is the primary
> input. Delegating forces a lossy re-briefing and causes gaps.

## Phase 1: Discover the Doc Structure

Before updating anything, map what documentation exists in this project.

1. **Find doc roots** — look for any of: `docs/`, `doc/`, `website/`, `site/`, `pages/`,
   `README.md`, `CHANGELOG.md`, or equivalent at the project root.
2. **Find internal specs** — look for files named `SPEC.md`, `ARCH.md`, `DESIGN.md`, `UX.md`,
   `ADR/`, `decisions/`, or similar technical reference docs.
3. **Find public-facing docs** — look for guide pages, reference pages, or a static site.
4. **Find generated files** — look for any file that is auto-generated from others (check for
   comments like `# generated`, scripts that concatenate docs, or files named `llms-full.txt`,
   `api.md`, etc.). Note these — never edit them directly; regenerate them.
5. **Find memory** — look for `MEMORY.md` in `~/.claude/projects/…/memory/` or the project root.
6. **Find repo-specific skills** — look for `.agents/skills/`, `.claude/skills/`, or similar
   directories containing skills derived for this repo. These skills encode repo-specific
   workflows, conventions, or domain knowledge and must stay in sync with the codebase.

## Phase 2: Classify the Change

For the change that was just made, identify its category:

| Change type | Typical doc owners |
|---|---|
| New feature / behavior | Spec, architecture doc, relevant guide page(s) |
| New CLI command or flag | CLI reference, spec, relevant guide page |
| New config key | Config reference, spec, default config template |
| Prompt / UX flow change | UX doc, guide page with examples |
| New module or interface | Architecture doc, API reference |
| Bug fix with behavior impact | Spec (if behavior was mis-documented), changelog |
| Phase or milestone complete | Roadmap / changelog |
| New stable pattern or gotcha | Memory file |
| Changed interface, workflow, or convention | Repo-specific derived skills that reference it |

Don't limit yourself to a fixed checklist — reason from the map you built in Phase 1.

## Phase 3: Update

**Rule 1 — Grep before reading.**
Search for the changed feature's name, flag, or function across all doc roots to find stale
references and gaps. Read only the relevant section, not the whole file.

**Rule 2 — Guide pages own the narrative.**
Where guide pages exist, they are where users learn behavior — update prose, examples, and
condition lists there. Reference pages (tables, option lists) must stay accurate too.

**Rule 3 — Regenerate generated files last.**
If any source doc changed and a generated aggregate file exists (e.g., a concatenated LLM
ingestion file, an auto-built API reference), regenerate it after all source edits are done.
Find the generation script by searching for it (`gen-`, `build-docs`, `scripts/`) or checking
`package.json` / `Makefile` tasks.

**Rule 4 — Update memory for new stable patterns, gotchas, or completed phases.**
Keep memory terse (under 200 lines). Put detail in a topic file if needed.

**Rule 5 — Do not edit generated files directly.**
If you find a file that is auto-generated, never edit it — regenerate it from source.

**Rule 6 — Sync repo-specific derived skills.**
If the change alters an interface, workflow, convention, or domain concept that a repo-specific
skill references, update that skill to match. Grep skill files for the changed names, flags, or
patterns. Skills that encode stale assumptions will silently produce wrong guidance.

## Completion Criteria

- All doc files that own the changed area have been updated
- No stale references to old behavior remain (grep-verified)
- Generated files have been regenerated if source docs changed
- Memory updated if a new stable pattern or gotcha was introduced
- Repo-specific derived skills updated if the change affects anything they reference
