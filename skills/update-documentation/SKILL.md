---
name: update-documentation
description: >
  Align all documentation to code after a change. Use after implementing a feature, adding a
  config key, new CLI command, new flag, or any non-trivial code change. Invoke proactively
  when finishing implementation — not only when the user asks. Discovers the project's doc
  structure dynamically rather than assuming fixed paths.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent
model: opus
---

# Update Documentation

You are an **Opus orchestrator** for documentation updates. You use your context of what
changed to identify which docs need updating, then spawn **Sonnet edit agents** with
precise instructions. You do NOT edit docs yourself — you craft targeted prompts and delegate.

If you're running in the same session that made the code changes, you already have deep
context. Use it — but still verify your assumptions in the prompts you craft.

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
6. **Find repo-specific skills** — look for `.agents/skills/`, `.claude/skills/`, `skills/`,
   or similar directories containing skills derived for this repo.

## Phase 2: Classify the Change

For the change that was just made, identify its category and which docs own it:

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
| New accepted value or alias for existing param | Tool/API reference, skills with example calls |

Don't limit yourself to a fixed checklist — reason from the map you built in Phase 1.

## Phase 3: Plan Update Tasks

For each doc that needs updating, define a task:
- Which file to update
- What section(s) to change
- What the change is (add, modify, remove)
- What grep searches the agent should run first to find stale references
- What the agent should verify before editing (validate against reality)

Group related updates into agent-sized tasks. One agent per doc area is typical —
e.g., one for spec + architecture, one for guide pages, one for skills.

## Phase 4: Spawn Edit Agents

For each task, spawn a **Sonnet agent** with a self-contained prompt including:

1. **Goal** — one sentence: what docs to update and why
2. **What changed** — describe the code change that triggered the update. Be specific:
   new function names, changed signatures, new config keys, new behavior.
3. **Files to update** — exact paths
4. **Validation step** — "Before editing, grep for [terms] across the doc roots to find
   all references. Read the relevant sections. Verify the current content matches your
   understanding — if it doesn't, adjust your edits accordingly."
5. **Update rules**:
   - Grep before reading — find stale references, don't read whole files
   - Guide pages own the narrative — update prose, examples, and condition lists
   - Reference pages must stay accurate — update tables, option lists
   - Do NOT edit generated files — note them for regeneration
   - Update memory for new stable patterns or gotchas (keep under 200 lines)
   - Sync repo-specific derived skills if the change affects anything they reference
6. **Commit instruction** — "After all edits, commit with a message describing what
   docs were updated and why. Do NOT push."

**Prompt crafting principles** (same as implement-orchestrator):
- Be concrete — exact file paths, exact terms to grep for
- Include the change context — the agent doesn't know what you know
- Flag non-obvious things — if a doc uses unusual structure, mention it
- Don't over-constrain — Sonnet can figure out how to phrase the update

## Phase 5: Review and Regenerate

After agents complete:

1. Read each agent's result summary
2. If any generated files need regeneration (agent should have noted these), run the
   generation scripts now
3. Verify no stale references remain: grep for the changed feature's name/flag/function
   across all doc roots

## Completion Criteria

- All doc files that own the changed area have been updated
- No stale references to old behavior remain (grep-verified)
- Generated files have been regenerated if source docs changed
- Memory updated if a new stable pattern or gotcha was introduced
- Repo-specific derived skills updated if the change affects anything they reference
- All changes committed
