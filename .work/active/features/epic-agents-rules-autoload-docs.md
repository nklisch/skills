---
id: epic-agents-rules-autoload-docs
kind: feature
stage: drafting
tags: [docs]
parent: epic-agents-rules-autoload
depends_on: [epic-agents-rules-autoload-hook, epic-agents-rules-autoload-patterns-digest, epic-agents-rules-autoload-convert-extract, epic-agents-rules-autoload-convert-safety, epic-agents-rules-autoload-skill-grounding]
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Foundation-doc + guide sync for `.agents/rules/`

## Brief

Roll the foundation docs and guides forward to describe the new present: the
generic `.agents/rules/` directory, the hook's rules-injection contract, the slim
AGENTS.md layout, the gate-patterns digest, and convert's content-integrity
guarantee. Per rolling-foundation, these describe what now exists — they land after
the implementing features, not before.

Files (from the epic's doc-ripple map): `plugins/agile-workflow/docs/SPEC.md`
(rules migration 147-169; hook contracts 383-482), `ARCHITECTURE.md` (AGENTS
section 157-170; hook scripts 408-462; patterns location 529-531),
`MIGRATION.md` (legacy rules migration 331-360), `README.md` (layout 200-216),
`docs/agile-workflow-guide.md` (layout + hook behavior), and convert's
`references/legacy-overlap-migration.md` (mapping 40-54; patterns.md split note).

Does NOT cover: behavior changes (owned by the other features); this is
documentation only.

## Epic context
- Parent epic: `epic-agents-rules-autoload`
- Position in epic: terminal — depends on all five implementing features so the
  docs describe the realized behavior.

## Foundation references
- Parent epic body — full doc-ripple map with line numbers
