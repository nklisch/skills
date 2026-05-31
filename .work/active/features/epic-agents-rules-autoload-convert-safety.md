---
id: epic-agents-rules-autoload-convert-safety
kind: feature
stage: drafting
tags: [skill]
parent: epic-agents-rules-autoload
depends_on: [epic-agents-rules-autoload-convert-extract]
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# convert legacy-cleanup data-safety (content-integrity gate)

## Brief

Harden `convert` so legacy cleanup can NEVER lose data. Add a **content-integrity
gate** distinct from the existing reference-integrity (pointer-rewrite) rule: for
every legacy artifact, before any destructive step (`git rm` / shim /
symlink-replace), verify the content is present at its canonical replacement. For
split-destination files (notably `.claude/rules/patterns.md` → structural patterns
to `.agents/skills/patterns/`, prose to `.agents/rules/agile-workflow.md`),
implement a **block-level preservation manifest** (Codex finding 6): classify each
source block, route + hash-verify it to its destination OR preserve it in place as
ambiguous, before anything is shimmed/removed.

Addresses the 6 audit findings recorded in the epic body. Also adds a `patterns.md`
carve-out from `generated-only` cleanup (finding 5) and verifies bespoke-skill
convergence imports actually succeeded before removing the source (finding 6).
Backward-compat: full-AGENTS.md projects on `--update` migrate without loss.

Does NOT cover: the AGENTS.md slim itself (that's `convert-extract`); this feature
generalizes the content-integrity guarantee to all legacy artifacts.

## Epic context
- Parent epic: `epic-agents-rules-autoload`
- Position in epic: builds on `convert-extract`; same file (`convert/SKILL.md`),
  serialized via depends_on to avoid contention.

## Foundation references
- `plugins/agile-workflow/skills/convert/SKILL.md` — Phase 1.8 (215-222), Phase
  2.5 (272-291), Phase 7 (473-501), Phase 8.6 (612-638), Sync S1/S3 (686-763,
  834-844)
- `plugins/agile-workflow/skills/convert/references/legacy-overlap-migration.md`
  — DIY→canonical mapping (40-54), patterns.md split note (49-54)
- Parent epic body — the 6 data-safety findings + Codex block-level manifest
