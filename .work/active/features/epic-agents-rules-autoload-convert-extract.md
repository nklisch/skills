---
id: epic-agents-rules-autoload-convert-extract
kind: feature
stage: drafting
tags: [skill]
parent: epic-agents-rules-autoload
depends_on: [epic-agents-rules-autoload-hook]
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# convert extracts dense rules into `.agents/rules/agile-workflow.md`

## Brief

Update the `convert` skill so the managed `<!-- agile-workflow:start -->` section
of AGENTS.md stays in its **dense-pointer** style but carries pointers, not the
dense rule prose: substrate orientation (what the substrate is, `work-view` query
patterns, item-is-state / rolling-foundation), grep-able pointers to the canonical
rules file `.agents/rules/agile-workflow.md` and the patterns skill, and a
MANDATORY directive "Before designing/implementing/reviewing, read
`.agents/rules/*.md`." The dense behavioral rule prose (tag semantics, test
integrity, advisory-review policy, refactor-conventions pointer) moves into a new
plugin-managed `.agents/rules/agile-workflow.md`. Update Phase 6 (the canonical template), the
Phase 2.5/7 routing, and the sync path (S1/S3) + commit file lists accordingly.

Per the Codex review, the slim is itself a data-loss vector: `convert --update`
overwrites the managed section, so convert must write AND verify
`.agents/rules/agile-workflow.md` is present and complete BEFORE removing the dense
content from the AGENTS.md section. Existing full-AGENTS.md projects migrate on
`--update` with that write-verify-before-slim guarantee.

Does NOT cover: the generalized legacy-cleanup content-integrity gate and the
block-level manifest for split files (that's `convert-safety`, which serializes
after this on the same file).

## Epic context
- Parent epic: `epic-agents-rules-autoload`
- Position in epic: producer of `.agents/rules/agile-workflow.md`; owns the slim of
  the AGENTS.md managed section. Serialized before `convert-safety` (same file).

## Foundation references
- `plugins/agile-workflow/skills/convert/SKILL.md` — Phase 6 template (329-420),
  Phase 2.5 (237-291), Phase 7 (425-500), Sync S1/S3
- `AGENTS.md` (this repo) — current managed section that gets slimmed
- Parent epic body — AGENTS.md extraction + slim-is-data-loss decisions
