---
id: story-work-view-scope-docs
kind: story
tags: [tooling, docs]
stage: done
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

## Implementation notes (done — at review)

- `convert/SKILL.md` query-patterns template gained a `--scope all` bullet
  (the block convert writes into project AGENTS files).
- This repo's `AGENTS.md` substrate block mirrored the same bullet;
  `.claude/CLAUDE.md` is a symlink to `AGENTS.md`, so it inherits automatically.
- `docs/agile-workflow-guide.md` work-view flag listing gained a `--scope all`
  row noting the active+backlog default.
- Descriptive only — no CONVENTIONS.md config key; binary stays the single
  source of truth for the default.
