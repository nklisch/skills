---
id: story-work-view-scope-docs
kind: story
tags: [tooling, docs]
stage: drafting
parent: feature-work-view-scope
depends_on: [story-work-view-scope-cli]
release_binding: null
gate_origin: null
created: 2026-06-03
updated: 2026-06-03
---

# Docs: convert AGENTS query-patterns note + refresh repo substrate copy

## Scope

Document the new default + `--scope` flag descriptively (not as config). The
binary stays the single source of truth for the default.

## Changes

- `plugins/agile-workflow/skills/convert/SKILL.md` (AGENTS substrate
  query-patterns block, ~lines 471-476): add a line noting work-view shows
  active+backlog by default and that `--scope all` (or `--scope archive` /
  `--scope releases`) reveals shipped/abandoned history. This is the template
  convert writes into project AGENTS files.
- This repo's own substrate orientation copy (the `## Agile-Workflow Substrate`
  block in the canonical agent instruction file / `.claude/CLAUDE.md`): mirror
  the same one-liner so the repo dogfoods the new wording.
- If a user-facing guide lists work-view flags
  (`plugins/agile-workflow/docs/*guide*`), add the `--scope` row there too.

## Acceptance criteria

- convert template documents the default + `--scope` opt-in in the
  query-patterns list.
- Repo substrate orientation block mentions `--scope`.
- No config key added to CONVENTIONS.md (descriptive only).
- Wording matches the `--help` text intent (active+backlog default; opt-in for
  history).
