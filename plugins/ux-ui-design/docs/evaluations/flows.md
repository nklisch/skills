# Skill Evaluation: flows

**Type:** workflow (multi-step with interactive checkpoints)
**Evaluated:** 2026-05-15
**Files:**
- `SKILL.md` — 348 lines

## Structural Scores

| Dimension | Score | Notes |
|-----------|-------|-------|
| Token Efficiency | 2 | 348 lines, well over the workflow-typical 260 ceiling. Two large inline HTML templates (~140 lines combined) account for most of the bloat. |
| Activation Reliability | 5 | `user-invocable: true`, trigger phrases distinct from `screens` (verbs like "walk through", "journey"), agent-driven triggers explicit. |
| Structural Quality | 5 | 8 numbered phases, frontmatter complete, anti-patterns, distinction-from-screens section up front (great for disambiguation). |
| Content Quality | 5 | Concrete step examples (signup flow with 5 steps), prev/next chrome pattern, branch handling explicit, cross-reference handling with `screens` documented. |
| Progressive Disclosure | 3 | No references at all; the page template (~40 lines) and the index template (~80 lines) belong in a shared reference rather than inline. |
| Phase Structure | 5 | Phases 1–8 with explicit entry conditions and a clean iterate-or-finalize branch in phase 7. |
| Validation & Error Handling | 4 | Step-count guard (3 ≤ N ≤ 7) is enforceable. "Three rounds without convergence → flag" is a real stop condition. Less clear what to do when a step's prev/next renumber breaks during restructure. |
| Freedom Calibration | 5 | Page template exact (for cross-step consistency, which is the whole point). Step content advice is open. Tone/density question gives just enough constraint. |
| Output Specification | 5 | Zero-padded numbering convention, prev/next link rules (first → index, last → index), per-step file path explicit, index navigator with iframe previews documented. |
| **Structural Avg** | **4.3** | |

## Emotional Tone Scores

**Task-type profile:** creative/multi-step (one design across a sequence of screens, with cross-step consistency as a craft demand)

| Dimension | Score | Notes |
|-----------|-------|-------|
| ET-1: Valence Alignment | 4 | Step-by-step decomposition is calming. "Sabotages journey-level review" in anti-patterns is one of the few sharp phrasings. |
| ET-2: Anti-Desperation Design | 5 | Step-count guard explicitly says "if it's 1-2 screens, use `screens`" — gives a safe exit. 3-round soft cap on iteration. Branches deferred to separate flows = decomposition by default. |
| ET-3: Collaboration vs Command | 4 | Most rules have rationale. "Don't break visual consistency" anti-pattern reads as command-with-threat. |
| ET-4: Arousal Calibration | 4 | Calm, methodical — appropriate for multi-step careful work. Could be slightly bolder in phase 4 around design-tone commitment. |
| **Emotional Tone Avg** | **4.3** | |

| **Overall** | **4.3** | |

## Strengths

- **Distinction-from-screens section** (lines 45–53) is exemplary. The split — N alternatives for ONE screen vs ONE design across N screens — is the kind of thing agents otherwise blur, and the worked phrasing examples ("Give me 4 options for the signup form" → screens; "Walk me through the signup flow" → flows) eliminate that ambiguity in one paragraph.
- **The wireframe-vs-polished decision at phase 3** with a default rule keyed on whether `tokens.css` exists is a beautifully calibrated piece of automation. It collapses what would otherwise be a free-form question into a defensible default with an override.
- **Step-count guard (3 ≤ N ≤ 7)** with explicit redirect (fewer → screens, more → split) prevents the most common bad-shape failure mode for flow mocks.
- **Cross-reference handling with `screens`** in phase 8 — re-mock in the flow's tone but include a provenance comment — is the right answer to a question agents would otherwise fumble.
- **Happy path by default, branches as separate flows** is an opinionated decomposition rule that protects against scope creep.

## Structural Findings

### 1. Two large inline HTML templates duplicate sibling content (Score: 2 / Token Efficiency)
**Issue:** The per-step page template (lines 126–164) and the index navigator template (lines 184–261) together account for ~140 lines. Roughly half of that styling (the dark `.flow-meta` chrome and the light index-card grid) is functionally identical to patterns in `screens` and `palette`.
**Rubric:** Token Efficiency — "Over 500 lines or significant redundancy; bloated sections." (Not at 500, but the redundancy is real across the plugin.)
**Recommendation:** Create `plugins/ux-ui-design/skills/ux-ui-principles/references/shared-chrome-css.md` with the `.flow-meta` and `.steps` index patterns. Replace inline templates with: "Use the `.flow-meta` sticky header from `ux-ui-principles/references/shared-chrome-css.md`. Step pages also need `<main>` content per the step's purpose." Trim ~80–100 lines.

### 2. Phase 4 cross-step consistency check is asserted but not validated (Score: 4 / Validation & Error Handling)
**Issue:** Phase 4 lists cross-step consistency rules (same color tokens, same fonts, same component shapes) but there's no verification step before phase 5. If the agent drifts on step 03's button radius, the inconsistency only surfaces during user review.
**Rubric:** Validation & Error Handling — "Does each phase validate its own output before proceeding?"
**Recommendation:** Add to end of phase 4: "Before moving to phase 5, scan the generated step files for token usage. Every `--color-*`, `--font-*`, `--space-*` reference should appear in `tokens.css`. Buttons and form fields should use the same class names across steps. If a step drifted, regenerate before writing the index."

### 3. Restructure path in phase 7 doesn't specify renumber mechanics (Score: 4 / Output Specification)
**Issue:** "Run Phase 2 again with the new outline. Renumber files. Update prev/next links. Regenerate the index." is the entire restructure instruction. If steps were 01–05 and the user adds a step between 02 and 03, the agent has to know whether to renumber 03→04→05→06 (cascade) or stitch in 02a.
**Rubric:** Output Specification — "Output format defined; location specified; template or example provided."
**Recommendation:** Specify the cascade rule explicitly: "When inserting a step, renumber all subsequent files (no alpha-suffix steps). Delete the old-numbered files after writing the new ones in a single batch, then update every page's prev/next links." Add an example.

### 4. Anti-pattern "more than 7 steps" lacks a worked split example (Score: 4 / Example Quality)
**Issue:** "Don't generate more than 7 steps in one flow. Split into composing flows or split by branch point." is good guidance but abstract. What does a 9-step signup look like once split? Two composing flows? A trunk + a side flow?
**Recommendation:** Add to the examples region: "Example: a 9-step signup → split into `signup-basics` (5 steps) + `signup-onboarding` (4 steps), linked by step 05 → step 01 of the second flow. The `## Mockups` section in the substrate item lists both flows."

## Emotional Tone Findings & Rewrites

### ET-1. "Sabotages" is the only sharp word in the file (Score: 4 / Valence Alignment)
**Original:** "Don't break visual consistency across steps. A flow that looks like 5 different designers worked on it sabotages journey-level review."
**Vector activated:** failure-anxiety ("sabotages")
**Target vector:** craft-pride about consistency
**Rewrite:** "Keep visual consistency across all steps — same color tokens, same button shapes, same field styles. Journey-level review works because reviewers can focus on the flow's structure instead of decoding visual variation between pages. A consistent flow makes the journey legible at a glance."
**Shift:** threat → purpose. Same content; the agent now optimizes for legibility rather than against sabotage.

### ET-3. Phase 7 "redesign" instruction is bare command (Score: 4 / Collaboration vs Command)
**Original:** "Redesign: Wireframe ↔ polished is a fundamental shift. Regenerate all steps with the new treatment. Keep the same flow structure."
**Vector activated:** compliance with the regen demand
**Target vector:** partnership + clarity about the design choice
**Rewrite:** "Redesign — wireframe ↔ polished — is a fundamental visual shift, not a tweak. Regenerate all steps with the new treatment and keep the flow structure intact. The structural decisions from phase 2 still hold; only the visual tone is changing, so the second pass should be fast."
**Shift:** order → partnership + reassurance. The added "should be fast" line signals that this is a known, bounded path, not an open-ended redo.

### ET-4. Phase 3 default-rule could lead with more conviction (Score: 4 / Arousal Calibration)
**Original:** "Wireframe is faster and forces focus on flow structure. Polished is better for stakeholder sign-off. Default to wireframe if no design system exists yet, and polished if `.mockups/design-system/tokens.css` is present."
**Vector activated:** balanced consideration
**Target vector:** confident default with named reasoning
**Rewrite:** "Default to wireframe when `tokens.css` doesn't exist yet — gray boxes force the conversation toward flow structure, which is what's at stake before a design system lands. Default to polished when `tokens.css` is present — the visual tone is already decided, so showing it in context earns faster sign-off. Override either if the user has a reason."
**Shift:** options-listing → confident defaults with explicit override permission. Steadier intensity for multi-step careful work.

## Test Scenarios

### Scenario 1: Default flow generation with step confirmation
**What to test:** Phase 2 outline confirmation, prev/next chrome, index navigator.
**Prompt:** "Mock the signup flow — email collection, email verification, profile setup, success."
**Expected behavior:** Skill confirms the 4-step outline via AskUserQuestion (or proposes a 5-step refinement), writes `01-...` through `04-...` with consistent chrome and proper prev/next, writes the index with iframe previews, opens the index.
**Failure signal:** Skill writes pages without confirming the outline; prev/next links wrong on first/last; no index.

### Scenario 2: Wireframe vs polished default rule
**What to test:** Phase 3 default-rule honoring.
**Prompt 2a:** (with `.mockups/design-system/tokens.css` present) "Mock the checkout flow, 4 steps."
**Expected behavior 2a:** Defaults to polished, mentions the default, asks for override only if ambiguous.
**Prompt 2b:** (with no `tokens.css`) "Mock the checkout flow, 4 steps."
**Expected behavior 2b:** Defaults to wireframe, mentions the default.
**Failure signal:** Defaults flipped, or skill asks the tone question with no default suggestion.

### Scenario 3: Step-count guard
**What to test:** Redirect to `screens` when count is too low.
**Prompt:** "Mock the password-reset flow — just one screen where they enter their email."
**Expected behavior:** Skill detects N=1, redirects to `/ux-ui-design:screens password-reset`, doesn't generate a flow.
**Failure signal:** Skill generates a one-step flow with a degenerate index.

### Scenario 4: Restructure during iteration
**What to test:** Phase 7 restructure path and renumber discipline.
**Prompt:** (After a 5-step signup flow is generated) "Insert a 'choose plan' step between profile setup and success."
**Expected behavior:** Skill renumbers cleanly (no 04a files), updates all prev/next links, regenerates the index, deletes the stale files.
**Failure signal:** Skill writes `04a-choose-plan.html` instead of cascading; or leaves stale numbered files in place; or only updates the new file's prev/next.

### Scenario 5: Cross-reference with a previously chosen screen
**What to test:** Phase 8 cross-reference handling.
**Prompt:** "Mock the onboarding flow — the login step should match the option-2 login we already picked at `.mockups/screens/login/option-2.html`."
**Expected behavior:** Skill re-renders the login step in the flow's tone (wireframe or polished) AND adds the provenance comment naming `option-2.html`. Does NOT iframe-embed the screen mock by default.
**Failure signal:** Skill iframe-embeds and breaks visual consistency, or omits the provenance comment.

## Summary

This is the strongest of the three workflow skills in conceptual design — the distinction from `screens`, the wireframe/polished default rule, and the step-count guard reflect real practitioner discipline. The single highest-priority improvement is **trimming the two inline HTML templates** by moving the shared chrome CSS into `ux-ui-principles/references/shared-chrome-css.md`, which would pull SKILL.md from 348 lines toward the 260-line workflow ceiling and remove ~90 lines of cross-skill duplication.
