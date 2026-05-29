---
description: Friction observations from the ds-engine pilot of the redesigned /knowledge-index schema. 10 docs across all 3 kinds; captured during edit-time.
type: design
updated: 2026-05-03
status: pilot complete; sketch revisions proposed
---

# Pilot friction log — knowledge-index redesign

> Captured 2026-05-03 during the ds-engine 10-doc pilot of the schema in `REDESIGN-SKETCH.md`.

## Pilot scope

10 representative ds-engine docs across all 3 kinds:
- **Planning (4):** `north-star-ds-engine.md`, `architecture.md`, `two-phase-tool-design.md`, `deferred.md`
- **Research (4):** `program.md`, `super-parent.md`, `program-report.md`, `campaigns/03-supervised-learning-tier-mapping.md`
- **Historical (2):** `techniques/eda/inventory-legacy.md`, `techniques/causal/inventory-legacy.md`

## Lint results

All 10 docs passed every lint check. No errors, no warnings.
- Required fields per kind: 100% compliant
- `kind:` field present: 100%
- `superseded_by:` chain integrity: only TBD-placeholders (intentional, Phase 7)

## Frictions captured

### F1 — Supersession context doesn't fit `summary:` (HIGH — schema gap)

**Observation:** Three of the four research docs (`super-parent.md`, `program.md`, `program-report.md`) carry pre-migration framing that needs an explicit "this part is superseded" note. The previous practice was bloating the `description:` field with supersession text:

> "...The 'Hand-off to grimoire's research backlog' section and several Coverage Assessment claims describe the pre-migration architecture; superseded 2026-05-03..."

The new `consumer_hint` should be terse ("when do I read this?"). The new `summary:` should be about *what's in* the doc. Neither is the right home for "by the way, parts of this are stale."

**Workaround applied:** I introduced a new `supersession_note:` field in three docs. Worked cleanly. Reads naturally next to `summary:` / `decisions:`.

**Sketch revision proposed:** Add `supersession_note:` as a first-class optional field in the schema. Triggered when a doc is partially-superseded (has updates that invalidate parts but not the whole). Distinct from `superseded_by:` (which marks full supersession). The lint pass should require `supersession_note:` whenever `status: superseded` AND `superseded_by:` is missing.

---

### F2 — `decisions:` cap unspecified, scale-mixing easy (MEDIUM — schema clarification)

**Observation:** `north-star-ds-engine.md` produced 9 decisions; `architecture.md` produced 8. Some are top-level commitments ("Three-rung tier model"); others are sub-system specs ("Tiered hybrid Vega-Lite authoring: Pattern C + Pattern A fallback + Pattern B narrow"). The schema doesn't help authors distinguish.

**Risk:** Authors will either (a) flatten everything to top-level — losing nuance, or (b) enumerate exhaustively — defeating the purpose of an at-a-glance index.

**Sketch revision proposed:** Add to the schema doc:

> `decisions:` should list **5–9 highest-leverage commitments** at index-readable depth. If a sub-system has its own architecture doc, its detailed decisions live in that doc's `decisions:`, not propagated upward. North-star decisions are *categorical* ("we use Cloud Run"); architecture decisions are *sub-system* ("PII scrubbing has 4 stages, in this order").

This is a stylistic guideline, not a hard cap; lint warns at >12 decisions but doesn't block.

---

### F3 — Existing `description:` field doesn't repurpose cleanly to `consumer_hint` (LOW — migration friction, not schema)

**Observation:** Most existing `description:` values were content-listings ("Module map, data flow, conventions, dependencies") rather than question-framings ("Read when implementing or modifying any module"). The repurposing-in-place strategy ("the same field is now a consumer_hint") works mechanically but every doc needed its description rewritten.

**Implication:** The migration story can't be "leave description alone, just add new fields." Authors do need to re-author descriptions. ~3 minutes per doc to rewrite.

**Sketch revision proposed:** Migration phase 2 should explicitly include "rewrite description as consumer_hint (question framing, not content listing)". Could be LLM-drafted from `summary:` for review — `summary` answers "what's in it?" and the LLM can flip that to "when would I want to know what's in it?".

---

### F4 — `decisions:` and `key_findings:` overlap is real but resolved by framing discipline (LOW — confirmed schema works)

**Observation:** `super-parent.md` had findings AND adopted them as decisions. The schema's both-fields-allowed design (resolved Q5) handled this exactly right:
- `key_findings:` "Three-rung tier model... covers the analytical surface"  ← what the research showed
- `decisions:` "Adopt three-rung tier model with 1.5 sub-tag as v1 architecture"  ← what we now commit to

Reader sees both at once; the genre signal survives.

**No revision needed.** Confirmed: Option C from the open-questions resolution is correct.

---

### F5 — `summary:` for historical docs felt redundant with description (LOW — minor)

**Observation:** For the two `inventory-legacy.md` files, the new `summary:` overlapped heavily with the body of the doc and the `description:`. The doc IS the inventory; the summary just restates that.

**Mitigation:** I framed the summary around what's covered AND what's missing (i.e., positions the legacy doc against its eventual Phase 7 successor). That added value.

**Sketch revision proposed:** For `kind: historical`, suggest summary framing of "what this captures + what's not in it + where it's superseded". One-sentence form: "Captures X (as of original authorship); not yet refreshed for Y." This makes historical summaries usefully different from their descriptions.

---

### F6 — `kind` ↔ `type` relationship is unclear (LOW — taxonomy)

**Observation:** A `type: north-star` doc is always `kind: planning`. A `type: program-parent` is always `kind: research`. Are these two fields independent or correlated?

**Apparent rule:**
- `type: north-star | architecture | roadmap | design | features | workon` → `kind: planning`
- `type: brief | program-parent | program-report` → `kind: research` (default) OR `kind: historical` (if `status: legacy`)
- `type: ideate` → `kind: planning` (it's a workshop output committing to a vision)

`kind:` is mostly derivable from `type:` + `status:`. So why have both?

**Argument for keeping both:**
- `type:` describes the *form* (what skill produced it; what slot in the pipeline)
- `kind:` describes the *epistemic shape* (what kind of content lives in it; which fields apply)
- A research-method `brief` can become `kind: historical` without changing `type:`

**Sketch revision proposed:** Clarify in the schema doc that `kind:` is derivable from `type:` + `status:` for most cases, and the regenerator can default it. Authors only set `kind:` explicitly when overriding the default. Lint validates the derivation when `kind:` is set explicitly.

---

### F7 — Hand-rolling the two-layer index by hand was tedious but illuminating (LOW — implementation note)

**Observation:** Manually constructing `knowledge-index-pilot.yaml` (terse) and `knowledge-index-pilot-detail.yaml` (detail) from frontmatter took ~15 minutes for 10 docs. Mostly mechanical: parse frontmatter, group by kind, format. A regenerator script does this in ~5 seconds.

**Confirmed:** the two-file shape is right. Terse is genuinely terse (~80 lines for 10 docs); detail is rich (~200 lines for 10 docs). Each serves a clear purpose. They don't need to be in the same file.

---

## Sketch revisions to apply

1. **Add `supersession_note:` as first-class optional field** (F1)
2. **Add author guidance: 5–9 decisions at index-readable depth** (F2)
3. **Update migration phase 2 to include description rewrite** (F3)
4. **Add framing guidance for historical-kind summaries** (F5)
5. **Clarify `kind:` derivation from `type:` + `status:`** (F6)

## What didn't show up as friction (validates the design)

- `summary` / `decisions` / `key_findings` schema felt natural across all 10 docs
- The kind taxonomy (planning / research / historical) covered every doc cleanly — no doc needed a fourth bucket
- The dual-field both-allowed pattern (super-parent.md) just worked
- `consumer_hint` rewrites were genuinely better than the old descriptions
- Two-layer output structure is sound

## Recommendation

Apply the 5 sketch revisions, then proceed to the implementation step (update `/knowledge-index` SKILL.md, sibling skills, regenerator script). The schema is ready.
