---
id: epic-agents-rules-autoload-docs
kind: feature
stage: done
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

## Implementation notes (2026-05-31)

Rolled the foundation docs + guides forward to describe the present `.agents/rules/`
mechanism. Five docs changed (convert's `references/legacy-overlap-migration.md` was
left untouched per the brief — it was already updated by the convert features):

1. **`plugins/agile-workflow/docs/SPEC.md`**
   - AGENTS.md-section block now describes the **slim** managed section (orientation +
     work-view patterns + pointers + a MANDATORY read-directive) and added a new
     `### .agents/rules/ agent rules` subsection: dense rules live in
     `.agents/rules/agile-workflow.md` (`agile-workflow:rules` markers), written+verified
     before slimming; user/legacy rule prose lives in `.agents/rules/<name>.md`; legacy
     `.claude/rules/*.md` migrate via the content-integrity gate (block routing +
     verify-before-shim).
   - Hook contracts: SessionStart/PostCompact now documented as the **primary**
     unconditional `.agents/rules/` firing (after epoch reset/bump); added a full
     `### .agents/rules/ rules-injection contract` (events, content shape, per-epoch +
     content-hash dedup, substrate gate, `rules_context` flag + `rules_context_max_bytes`
     cap). UserPromptSubmit effect now lists the broad coding-prompt fallback.
   - CLAUDE.md-compatibility paragraph: `.claude/rules/*.md` migration rerouted through
     the content-integrity gate instead of "import into AGENTS".

2. **`plugins/agile-workflow/docs/ARCHITECTURE.md`**
   - AGENTS.md-substrate-section intro rewritten as slim dense-pointers + read-directive;
     dense rules noted as living in `.agents/rules/agile-workflow.md`, read-directive
     called out as the graceful-degradation guarantee. Embedded AGENTS template body +
     trailing note updated to the slim Phase-6 shape (rules pointer + read-directive).
   - `hooks/scripts/prompt-context.py` section: added a `.agents/rules/` rules-loader
     paragraph (force-load all `*.md`, content-agnostic, hybrid SessionStart/PostCompact
     primary + UserPromptSubmit coding-prompt fallback, per-epoch + content-hash dedup,
     CONVENTIONS flag + byte cap).
   - Patterns location: gate-patterns table row + skill-catalog row now mention the
     generated `.agents/rules/patterns.md` digest (banner + source hash) with
     `.agents/skills/patterns/` as the single source of truth. Legacy `.claude/rules/*.md`
     idempotency bullet rerouted through the content-integrity gate.

3. **`plugins/agile-workflow/docs/MIGRATION.md`**
   - `--update refreshes` list: AGENTS slim overwrite gated on `.agents/rules/agile-workflow.md`
     existing+verified; added `.agents/rules/agile-workflow.md` refresh bullet; legacy
     `.claude/rules/*.md` now migrate via the content-integrity gate (block routing to
     `.agents/skills/patterns/` + `.agents/rules/<name>.md`, verify-before-shim).
   - Conflict-handling paragraph rewritten around the content-integrity gate
     (Markdown-aware blocks, block-level preservation manifest, verify-before-destroy,
     ambiguous blocks preserved in place).

4. **`README.md`** (repo root): canonical-layout tree adds `.agents/rules/*.md`
   (force-loaded agent rules) and `.agents/skills/patterns/`; AGENTS.md annotated as slim.

5. **`docs/agile-workflow-guide.md`** (repo root): layout tree adds `.agents/` with
   `rules/*.md` + `skills/patterns/`; the "Actionable prompt context" hook section now
   leads with session-start `.agents/rules/` force-loading (cross-vendor replacement for
   `.claude/rules/`, dedup, `rules_context` flag + byte cap, coding-prompt fallback),
   then the queue snapshot.

**No-legacy-prose check:** `rg -n "previously|newly|in v0\.|used to"` over the five files
returns only pre-existing matches — the rolling-foundation rule text itself
(ARCHITECTURE.md:283, guide:642/767), the `workflow`-plugin deprecation note (guide:14),
and the `v0` retro-release description (MIGRATION.md:106). None are in the edited passages;
the new prose is all present-tense. Every edited doc now mentions `.agents/rules/`.
