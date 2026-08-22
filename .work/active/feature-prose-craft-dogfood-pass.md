---
id: feature-prose-craft-dogfood-pass
kind: feature
status: active
tags: [prose, plugin, documentation]
parent: null
blocked_by: []
related_to: []
research_refs: []
mock_refs: []
created: 2026-08-21
updated: 2026-08-21
---
# Dogfood the prose-craft workflow on prose-craft's own docs

## Brief
Run the plugin's own discipline (interview → pinned brief + reader path →
six-lens review → fix → one refine round) on all ten prose-craft docs:
3 SKILL.md + 7 references. The README already got a brief during the parent
feature. Purposes: (a) make the plugin self-consistent, (b) validate the
workflow genuinely works — especially on agent-facing SKILL.md files whose
audience (fresh agent context, mid-task, zero session knowledge) is not in
the doc-type catalog, (c) surface and fix workflow creaks.

User decisions: all plugin docs in scope; depth = review + fix + one refine
round (2 re-writers) on the two most prose-heavy references
(structure-patterns.md, styles.md); carried intent lives in working comments
during the pass only — per prose-draft's lifecycle rule, stripped from every
published file at the end (README's permanent comment included; finding #0
of this pass).

## Acceptance criteria
- Each of the 10 docs carries a pinned brief (6 fields) + reader path during
  the pass; review judges against them.
- Cross-model reviewer (family not yet used on this plugin: gpt-5.6-sol)
  produces lens findings; material findings fixed or explicitly rejected
  with reasons.
- Refine round runs on the two chosen references with the new weave rule
  (least model-toned wins; model-voice signatures checked).
- Workflow creaks recorded; small grounded fixes applied where warranted
  (e.g. agent-instruction venue gap) — no invented scope.
- End state: NO working comments left in any published file (README
  stripped too); briefs preserved in the commit message; lifecycle rule in
  prose-draft sharpened so "strip when the engagement ends" is explicit.
- Skills validate; patch version bump (minor updates to existing skills).

## Implementation notes
Interview collapsed per the proportionality rule: one batched confirmation
(scope/depth/carry answered by user); per-doc briefs derived from settled
plugin design and pinned as comments.

Six-lens review (GPT-5.6 Sol, fresh context, thorough): 7 material, 11
polish, 4 dogfood. All material accepted: rewrite-brief confirmation
loophole; review recovering 2-of-6 brief fields; refine must-keep
repair-vs-surface contradiction (pre-existing); cross-skill paths not
resolvable (fix: relative links); styles.md seed-fact drift (13 seeds
rewritten to identical facts); capture prompts not reproducible (inlined
verbatim); convergence-note misattribution to Sol (removed — host error,
good catch). Polish accepted (P8/P9 selectively). Dogfood creaks → grounded
fixes: agent-instruction archetype added to doc-types.md; tier gloss for
context-not-viewport agent readers; audience-lens provider bullets
generalized to the define-before-use map; corpus anchor added to findings
format. Reviewer's protected qualities: non-silent alignment rules, honest
severity model, reader-path continuity, bounded loop, concrete catalogs.
