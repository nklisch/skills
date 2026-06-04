---
id: epic-research-work-handoff-live-fields-docs
kind: story
stage: implementing
tags: [docs]
parent: epic-research-work-handoff-live-fields
depends_on: [epic-research-work-handoff-live-fields-core, epic-research-work-handoff-live-fields-cli]
release_binding: null
gate_origin: null
research_refs: []
research_origin: null
created: 2026-06-04
updated: 2026-06-04
---

# Docs roll-forward: SPEC / CONVENTIONS / AGENTS / ARCHITECTURE

## Scope
Unit 6 of the parent feature — the presence-based foundation roll-forward the
epic deferred from scope time. The fields now exist (core + cli landed), so the
docs may describe them. Depends on `…-fields-core` + `…-fields-cli`.

## Units
- **SPEC.md** (`plugins/agile-workflow/docs/SPEC.md`): frontmatter block (~L47)
  gains `research_refs: [...]  # optional` + `research_origin: <slug>|null  #
  optional`; field-semantics table (~L64) gains both rows; flag table (~L354)
  gains `--research-origin` / `--research-refs`; TS envelope (~L444) gains
  `research_origin: string | null;` + `research_refs: string[];`.
- **AGENTS.md**: substrate field list (~L96) appends `research_refs,
  research_origin`.
- **CONVENTIONS.md** + **ARCHITECTURE.md**: note the two optional linkage fields
  (mirroring `gate_origin`), pointing at `agentic-research`'s `docs/HANDOFF.md`
  for the cross-tier contract.

## Acceptance criteria
- [ ] SPEC frontmatter block, field-semantics table, flag table, and TS envelope all list both fields as optional
- [ ] AGENTS substrate field list updated; CONVENTIONS + ARCHITECTURE reference the fields and link HANDOFF.md
- [ ] No liveness overclaim — docs describe the *fields*, not the (not-yet-live) emission gate / commissioning arrows; all cross-links resolve

## Notes
This story closes the field-additions feature. The `agile-workflow` version bump
happens after the feature's three stories land and the feature reaches review/done
(commit feature changes BEFORE `bump-version.sh`, per CLAUDE.md).
