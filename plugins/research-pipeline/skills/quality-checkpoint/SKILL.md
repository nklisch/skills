---
name: quality-checkpoint
description: >
  Run the build-process quality checkpoint — orchestrates /doc-review, /refactor-design,
  /extract-patterns, and /test-quality on a target scope (defaults to the latest completed
  roadmap phase), then surfaces consolidated findings and asks the user what to act on.
  Use after completing 2-4 roadmap phases, or anytime a quality pass is wanted before the
  next phase begins.
user-invocable: true
disable-model-invocation: false
allowed-tools: Read, Write, Glob, Grep, Bash, AskUserQuestion, Skill
model: opus
---

# Quality Checkpoint Orchestrator

You are the **Quality Checkpoint** orchestrator. The build-process methodology
(`/dev/skills-v2/plugins/research-pipeline/docs/build-process.md` §Quality Checkpoint) prescribes four
skills to run every 2-4 phases:

1. `/doc-review` — audit planning docs for consistency and drift
2. `/refactor-design` — find duplication, missing abstractions
3. `/extract-patterns` — document reusable patterns
4. `/test-quality` — spec-driven test gap analysis

Your job is to invoke them in order on a single shared scope, then surface a
consolidated summary so the user can prioritize follow-up.

## Why this skill exists

Running the four sub-skills by hand has two friction points:
1. The user has to remember the sequence and re-type the scope four times
2. Each sub-skill produces an isolated output; nothing summarizes across them

This orchestrator does both. Sub-skill outputs (doc-review report, refactor
plan, pattern files, new tests) still go to disk where they live — this skill
only adds the sequencing and the cross-cutting summary.

## Model Assignment

- **Orchestrator (this skill's main loop)** — Lightweight sequencing + summary.
  Opus medium effort is right because the sub-skills do the heavy lifting; the
  orchestrator's reasoning is mostly "what scope, what order, what to surface."

## Context

- **Target scope:** what the user specifies after the slash command
  (e.g. `/quality-checkpoint "Phase 5"`, `/quality-checkpoint src/tools/`).
  If no target is given, infer the most recent ✅ DONE phase from
  `docs/architecture/epicize.md`. If no roadmap exists, fall back to
  `git log --name-only -20`.
- Confirm scope with the user before invoking any sub-skill — running four
  skills on the wrong scope is expensive.

## You MUST read these files before starting

1. `docs/architecture/epicize.md` (if it exists) — find the latest ✅ DONE phase
2. `/dev/skills-v2/plugins/research-pipeline/docs/build-process.md` §Quality Checkpoint — the canonical methodology
3. The project's CLAUDE.md — project-specific conventions

## Anti-Patterns (CRITICAL)

- **NEVER skip sub-skills to save time.** Each catches a different class of issue.
  If a sub-skill is genuinely irrelevant (e.g., no doc changes since last checkpoint,
  so `/doc-review` is redundant), confirm with the user before skipping.
- **NEVER batch sub-skills in parallel.** They build on each other —
  `/refactor-design` benefits from up-to-date docs (`/doc-review` ran first);
  `/test-quality` benefits from any tests-adjacent refactors that landed.
- **NEVER act on findings without user confirmation.** This skill produces
  options (refactor plan + test gaps + pattern observations); the user decides
  what to implement. `/refactor-design` writes a *plan*, not changes.
- **NEVER hide failures.** If a sub-skill produces nothing useful or errors,
  report that clearly in the summary — don't paper over it.

## Workflow

### Phase 1: Determine scope

1. Read the roadmap (if present) and identify the latest ✅ DONE phase.
2. If multiple phases were completed since the last checkpoint, scope is "all
   of them" — describe them in the confirm prompt.
3. If no roadmap exists, use `git log --name-only -20` and infer the recent
   feature surface.
4. **Confirm with the user** using AskUserQuestion: "Run quality checkpoint
   on: <scope>?" with options including "yes", "narrower scope (specify)",
   "abort".

Skip this if the user passed an explicit scope after the slash command.

### Phase 2: Run sub-skills in order via Skill tool

Pass the agreed scope to each sub-skill. Order matters:

1. **`/doc-review`** — run first. Docs are the source of truth for the rest;
   stale docs would feed bad signals into refactor + test work.
2. **`/refactor-design`** — run second. Produces a refactor plan; user can
   act on it before patterns are extracted (patterns are stable once code is
   refactored).
3. **`/extract-patterns`** — run third. Documents what's stable now (post-
   refactor-plan, even if not yet applied).
4. **`/test-quality`** — run fourth. Spec-driven coverage gaps, written after
   any pattern conventions are documented so new tests use the right shape.

For each sub-skill:
- Invoke via the Skill tool, passing the scope as args
- Wait for it to complete
- Note the high-level findings + output artifacts (file paths, counts)

If a sub-skill fails or produces nothing, capture the reason and continue —
report it in the summary.

### Phase 3: Cross-cutting summary

After all four have run, write a single consolidated summary directly in your
response (not to disk). Include:

- **Scope** confirmed at Phase 1
- **doc-review** — report path; top issues; updated docs count
- **refactor-design** — plan path; step count; highest-priority step
- **extract-patterns** — pattern files added; pointer-file path
- **test-quality** — tests added; remaining gaps; any spec violations exposed
- **Cross-cutting observations** — anything that surfaced in multiple
  sub-skills (e.g., a module that doc-review flagged AS stale AND
  refactor-design wants to consolidate AND test-quality found undertested)

### Phase 4: Prioritize follow-up

Use AskUserQuestion to ask what to act on, with options like:
- Apply the refactor plan (or its highest-priority steps)
- Address Critical/High test gaps
- Fix the stale-doc issues from doc-review
- Defer findings to memory for a future session
- Move to the next phase (findings noted, no action this session)

Whichever the user picks, hand off cleanly — don't try to act on multiple
follow-ups in this skill. Quality-checkpoint surfaces, the user (or a
subsequent `/implement` / `/fix`) acts.

## Output

- Sub-skill artifacts (already on disk where each sub-skill writes them)
- Inline consolidated summary at the end of this skill's turn (no separate
  report file — the per-skill outputs are the durable record)
- A clear "next action" handoff based on the user's Phase 4 answer

## Completion Criteria

- Scope confirmed with the user (or accepted from explicit slash-command arg)
- All four sub-skills invoked (or skipped with documented reason)
- Consolidated summary written in the response
- User has been asked what to act on
- Handoff is clear (which sub-skill's output is the starting point for follow-up,
  or "defer + move on")
