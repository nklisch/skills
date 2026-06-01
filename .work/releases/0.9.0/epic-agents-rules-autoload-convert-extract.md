---
id: epic-agents-rules-autoload-convert-extract
kind: feature
stage: done
tags: [skill]
parent: epic-agents-rules-autoload
depends_on: [epic-agents-rules-autoload-hook]
release_binding: 0.9.0
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

## Architectural choice

Two managed artifacts instead of one, each marker-wrapped so sync can refresh in
place without clobbering user content:
- **AGENTS.md `<!-- agile-workflow:start/end -->`** — slimmed to *dense pointers*:
  substrate overview, `work-view` query patterns, the foundation/item-as-state
  rule, the patterns/refactor pointers, and a **mandatory read-directive** for
  `.agents/rules/*.md`. Always loaded by the harness, so the directive guarantees
  graceful degradation.
- **`.agents/rules/agile-workflow.md` `<!-- agile-workflow:rules:start/end -->`** —
  the dense behavioral rule prose (tag semantics, test integrity, cross-model
  advisory review, broad entry points). Hook-injected; marker-wrapped so
  `convert --update` refreshes the plugin block while leaving any user-authored
  `.agents/rules/*.md` (and content outside the markers) untouched.

Boundary: plugin rule prose → `.agents/rules/agile-workflow.md` (markered);
user/project rule prose (incl. legacy `.claude/rules/*` non-pattern content) →
a user-owned `.agents/rules/project.md` or kept in AGENTS — NEVER inside the
plugin markers. The refactor-style-conventions arrangement is unchanged
(`refactor-conventions-creator` still owns AGENTS `## Refactor Style Conventions`);
only its one-line pointer is referenced from the slim section.

## Implementation Units

Single SKILL.md edit (`plugins/agile-workflow/skills/convert/SKILL.md`); no child
stories. The new `.agents/rules/agile-workflow.md` canonical content lives as a
template *inside* the SKILL.md (like the Phase 6 AGENTS template).

### Unit 1: Define the `.agents/rules/agile-workflow.md` template
Add a Phase-6 sub-template containing, between
`<!-- agile-workflow:rules:start -->` / `<!-- agile-workflow:rules:end -->`, the
prose currently in the AGENTS Phase 6 template at ~366-418: **Tag semantics**,
**Test integrity**, the **Cross-model advisory review** paragraph, and **Broad
entry points**. Verbatim move — no rewording, so nothing is lost.

### Unit 2: Slim the Phase 6 AGENTS template
Replace the dense prose (the ~366-418 block) in the AGENTS template with:
```markdown
Reusable code patterns live in `.agents/skills/patterns/` (load the `patterns`
skill for detail). Project agent rules live in `.agents/rules/*.md`
(plugin-managed rules in `.agents/rules/agile-workflow.md`); do not maintain
`.claude/rules/*.md` as a source of truth.

**Before designing, implementing, or reviewing, read `.agents/rules/*.md`** —
the project's force-loaded agent rules (tag semantics, test integrity, review
policy). The agile-workflow hook auto-loads these at session start and after
compaction; read them directly when working without the hook.
```
Keep: substrate overview, `work-view` bullets, foundation/item-as-state
paragraph, and the existing refactor-style-conventions pointer paragraph.

### Unit 3: Bootstrap writes rules-first, then slims (write-verify-before-slim)
In Phase 6 (and Phase 4 skeleton), convert writes `.agents/rules/agile-workflow.md`
from the Unit-1 template FIRST, verifies the file exists, is non-empty, and
contains the `agile-workflow:rules:end` marker, and only THEN writes the slim
AGENTS section. If the verify fails, halt without slimming (no data loss).
Add `.agents/rules/agile-workflow.md` to the Phase 10 commit `git add` list.

### Unit 4: Sync (S1/S3) detect + refresh + migrate full-AGENTS projects
- S1: classify `.agents/rules/agile-workflow.md` (missing / match / drift_plugin)
  AND detect an AGENTS managed section that still carries the OLD dense prose
  (matches a known prior template) → `drift_plugin` "needs extraction".
- S3: for "needs extraction", run the same write-verify-before-slim sequence —
  write/refresh `.agents/rules/agile-workflow.md`, verify, THEN rewrite the AGENTS
  section to the slim template. Never slim before the rules file is verified
  present. This is the full-AGENTS.md backward-compat migration on `--update`.
- Add `.agents/rules/` to the Sync (S5) commit `git add` list; list
  `.agents/rules/agile-workflow.md` in Phase S4 "refresh in place, preserve
  user content outside markers".

## Implementation Order
1. Unit 1 (template) → 2 (slim template) → 3 (bootstrap wiring) → 4 (sync wiring).

## Testing
`convert` is a skill instruction doc — no automated test harness. Verification is
a careful read-through confirming: (a) the slim AGENTS template + the
`agile-workflow.md` template together contain ALL content from the old template
(no prose dropped — the write-verify-before-slim invariant in prose form); (b)
path/marker/line references are correct and consistent; (c) the bootstrap and
sync sequences both write+verify rules before slimming. The generalized,
mechanized content-integrity guarantee is owned by `convert-safety` (depends on
this feature).

## Risks
- **Dropping prose during the move** — mitigated by the verbatim-move rule (Unit 1)
  and the read-through diff check (old template content == slim + agile-workflow.md).
- **Cross-skill coupling with `refactor-conventions-creator`** (it writes AGENTS
  `## Refactor Style Conventions`) — mitigated by leaving that section in AGENTS
  and only referencing it from the slim pointer block.
- **Advisory review**: the AGENTS-extraction architectural decision was already
  cross-model-reviewed at the epic level (Codex); per-feature Codex pass deferred
  to the autopilot final loop for economy.

## Child stories
None — single SKILL.md edit; the agile-workflow.md content ships as a template in
the SKILL.md. Single-stride.

## Implementation notes (2026-05-31)

Implemented inline in `plugins/agile-workflow/skills/convert/SKILL.md`:
- **Unit 2 (slim Phase 6 AGENTS template)**: replaced the "Project-level agent
  rules live in this file…" paragraph with the patterns/rules dense-pointer block
  + the mandatory "Before designing, implementing, or reviewing, read
  `.agents/rules/*.md`" directive; lifted the `### Tag semantics`, `### Test
  integrity`, advisory-review, and Broad-entry-points prose OUT of the template.
  Kept substrate overview, work-view bullets, foundation paragraph, and the
  refactor-style-conventions pointer.
- **Unit 1 + 3 (Phase 6.5)**: new section writes plugin-managed
  `.agents/rules/agile-workflow.md` between `<!-- agile-workflow:rules:start/end -->`
  markers containing the moved prose **verbatim** (no reword → no loss), then
  **verifies** the file exists/non-empty/has the end marker BEFORE the slim AGENTS
  section is written. Verify-fail → halt without slimming (keeps the full section).
  User/legacy rule prose → a separate user-owned `.agents/rules/<name>.md`, never
  inside the plugin markers.
- **Unit 4 (sync)**: S1 classifies `.agents/rules/agile-workflow.md`
  (missing/match/drift_plugin) AND flags an AGENTS section that still carries the
  old dense prose as `drift_plugin` "needs extraction"; S3 runs the same
  rules-first-then-slim verify for that migration (full-AGENTS.md backward-compat
  on `--update`); S4 preserves user-authored `.agents/rules/*.md` + out-of-marker
  content; S5 and Phase 10 commits add `.agents/rules/`.

Verification (skill doc — no automated test harness): structural check confirmed
the dense prose appears exactly once as prose (Phase 6.5 template; the other
"Tag semantics"/"Test integrity" hits are the S1 detection bullet naming the
headers), the read-directive is present, the AGENTS markdown fence is balanced
(`<!-- agile-workflow:end -->` then fence close), and the no-loss invariant holds
(old template content == slim section + agile-workflow.md template). The
mechanized content-integrity gate is `convert-safety` (depends on this).

## Review (2026-05-31, inline)

Doc-edit feature with a clear, self-verifiable no-loss invariant (prose moved
verbatim, write-verify-before-slim). Reviewed inline rather than via Codex — the
genuinely data-safety-critical convert work is `convert-safety` (next, depends on
this), which gets the cross-model pass along with the autopilot final loop.
Verdict: **Approve** — no blockers; structural + no-loss checks pass. Advanced
`review → done`.
