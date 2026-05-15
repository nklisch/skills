# Skill Evaluation: screens

**Type:** workflow (with interactive checkpoints)
**Evaluated:** 2026-05-15
**Files:**
- `SKILL.md` — 305 lines

## Structural Scores

| Dimension | Score | Notes |
|-----------|-------|-------|
| Token Efficiency | 3 | 305 lines, over the workflow-typical 260 ceiling. ~90 lines are inline HTML templates that could move to a reference shared with sibling skills. |
| Activation Reliability | 5 | `user-invocable: true`, trigger phrases listed explicitly, agent-driven triggers documented, description has 4+ specific phrasings. |
| Structural Quality | 5 | 8 numbered phases, complete frontmatter, anti-patterns section, examples-of-naming section, invocation-modes table. |
| Content Quality | 5 | Three example sets (login / empty state / settings) show distinct-option naming concretely. Tables for invocation modes. Realistic placeholders enforced. |
| Progressive Disclosure | 3 | No references for this skill; the index `<style>` block alone is ~50 lines and is functionally duplicated in `flows`. Begs for `references/shared-chrome-css.md` in the parent skill. |
| Phase Structure | 5 | Phases 1–8 are sequential with explicit entry conditions; phase 7's iteration loop branches cleanly. |
| Validation & Error Handling | 4 | "If two options look 80% the same, the variety test has failed — regenerate" is a real check. The 3-round stop condition prevents loops. Could be tighter on what to do if `tokens.css` exists but is malformed. |
| Freedom Calibration | 5 | HTML scaffold is exact (right — output is fragile); option-axis selection is flexible (right — creative). |
| Output Specification | 5 | Paths explicit, file naming exact (`option-N.html`), index grid scales documented (2 → 2x1, 3 → 3x1, 4 → 2x2, 5–6 → 3x2, 7–8 → 4x2). |
| **Structural Avg** | **4.4** | |

## Emotional Tone Scores

**Task-type profile:** creative/exploratory (generating N genuinely distinct design directions)

| Dimension | Score | Notes |
|-----------|-------|-------|
| ET-1: Valence Alignment | 4 | "The mock is a conversation, not a deliverable" — sets the right creative-permission tone. A couple of anti-patterns ("variety test has failed") edge toward threat. |
| ET-2: Anti-Desperation Design | 5 | "If after 3 rounds nothing converges, surface that and ask whether scope is actually clear" — explicit graceful exit when stuck. |
| ET-3: Collaboration vs Command | 4 | Most instructions explain why; anti-patterns lean commanding ("Don't generate...", "Don't open...") with rationale appended. |
| ET-4: Arousal Calibration | 4 | Generally steady. Could be a touch bolder in phase 3 — "sketch mentally" reads as restrained for an inherently expansive creative step. |
| **Emotional Tone Avg** | **4.3** | |

| **Overall** | **4.3** | |

## Strengths

- **The "useful axes to vary" list** (density / layout primitive / hierarchy / tone / progressive disclosure / action surfacing) is one of the best parts of this skill — it gives the agent a concrete vocabulary for genuine distinctness instead of trusting it to pick "different enough" options on vibes.
- **Worked option-naming examples** for login, empty state, and settings page are gold. They show the right level of abstraction (a phrase, not a paragraph) and demonstrate variety across the listed axes.
- **The hybrid escape in phase 6's question** — "Mix elements (specify what to combine)" — is the right interaction design. Users almost always want to combine.
- **Index-first opening** (open the 2x2 grid, not the four tabs) is correctly emphasized in both the workflow and the anti-patterns.
- **"The mock is a conversation, not a deliverable"** in the last anti-pattern is a perfect tone-setter for the whole skill.

## Structural Findings

### 1. Inline HTML templates duplicate across siblings (Score: 3 / Progressive Disclosure)
**Issue:** Lines 99–125 (option-N template) and lines 145–195 (index template) total ~80 lines of HTML/CSS. The same dark-themed index chrome appears in `flows/SKILL.md` and `palette/SKILL.md` with minor variants. Each skill carries its own copy.
**Rubric:** Progressive Disclosure — "Reference files: one per topic, under 200 lines, no nested chains."
**Recommendation:** Extract a `plugins/ux-ui-design/skills/ux-ui-principles/references/shared-chrome-css.md` carrying the dark index grid, the `.mock-meta` header pattern, and the `.flow-meta` pattern. Have `screens`/`flows`/`palette` cite "see `ux-ui-principles/references/shared-chrome-css.md`" with a minimal inline diff. Cuts ~50 lines from each sibling.

### 2. Phase 1's preflight is verbose for an inherited convention (Score: 4 / Token Efficiency)
**Issue:** Phase 1 (lines 44–55) lists six reads — `ux-ui-principles`, `tokens.css`, the substrate item, the parent epic, `CLAUDE.md`, design notes. The first two are auto-inherited; the others belong to a smaller phase.
**Rubric:** Token Efficiency — "Content needed for 20% of tasks is in references."
**Recommendation:** Compress Phase 1 to "Confirm `ux-ui-principles` is loaded. Read the substrate item if applicable, the parent epic, and any nearby design notes; link to `tokens.css` if it exists." Three lines instead of twelve.

### 3. Tokens.css contract is implicit (Score: 4 / Validation & Error Handling)
**Issue:** The template assumes `tokens.css` provides every variable used. If a mock references a token that doesn't exist (e.g., `--color-bg-tertiary` when palette never defined it), the mock silently renders with the unset-variable fallback.
**Rubric:** Validation & Error Handling — "For tool-heavy workflows: are tool failures handled?"
**Recommendation:** Add to Phase 4: "Before referencing a token, verify it exists in `.mockups/design-system/tokens.css`. If a needed token is missing, either inline the literal value with a comment (`/* TODO: not in tokens.css yet */`) or defer to `palette` to add it."

## Emotional Tone Findings & Rewrites

### ET-1. "Variety test has failed" tilts creative work toward judgment (Score: 4 / Valence Alignment)
**Original:** "Visual differentiation: options must visibly differ on first glance. If two options look 80% the same, the variety test has failed — regenerate."
**Vector activated:** evaluation/judgment ("test has failed")
**Target vector:** craft-aspiration + curiosity about the design space
**Rewrite:** "Visual differentiation matters: each option should be recognizably its own direction at a glance. When two options trend toward the same layout-and-tone combination, push back into the axes list — there's another genuinely different take waiting."
**Shift:** failure-framing → opportunity-framing. Activates curiosity about unexplored axes instead of self-judgment about variety output.

### ET-3. "Don't agonize" is the right idea but phrased as prohibition (Score: 4 / Collaboration vs Command)
**Original:** "Don't write production-quality CSS. Keep mocks visually clear but don't agonize over BEM, sass variables, or design-system purity. The mock is a conversation, not a deliverable."
**Vector activated:** mild restraint command
**Target vector:** permission + craft pride at the right scope
**Rewrite:** "Mocks earn their value from speed and clarity — not from production-grade CSS hygiene. Skip BEM, skip sass variables, skip design-system purity here. The mock is a conversation, not a deliverable; treat the time you save as time invested in better options."
**Shift:** prohibition → permission with purpose. Same content, but the agent now feels licensed to move fast rather than instructed to suppress an instinct.

### ET-4. Phase 3 could open with more boldness (Score: 4 / Arousal Calibration)
**Original:** "Sketch mentally (NOT on disk) what makes each of the N options genuinely different."
**Vector activated:** constrained planning
**Target vector:** confident creative range
**Rewrite:** "Plan out the N directions before opening any file. The goal isn't four variants of one idea — it's four genuinely different design takes on the same problem. Use the axes list below to map out the space, then pick the most interesting combinations."
**Shift:** restraint ("NOT on disk") → invitation (the agent still knows not to write yet, but the framing centers creative range over file discipline).

## Test Scenarios

### Scenario 1: Default 4-option run on a named feature
**What to test:** Happy path, variety enforcement, index generation.
**Prompt:** "Mock the dashboard-empty-state screen for a developer-tools SaaS — give me four options."
**Expected behavior:** Skill writes `option-1.html` through `option-4.html` with visibly different layouts/density/tone, writes `index.html` with a 2x2 grid, opens the index, asks via AskUserQuestion which to pick (with a hybrid escape).
**Failure signal:** Options look 80% similar; index missing; opens 4 separate tabs; question asked without the hybrid escape.

### Scenario 2: Free-form description with no feature-id
**What to test:** Id distillation and confirmation.
**Prompt:** "Can you mock something for me — the place where users see all their teammates' avatars and recent commits, that sidebar thing on the main page."
**Expected behavior:** Skill proposes a kebab-case id (e.g. `team-activity-sidebar`), confirms with the user before writing, then proceeds.
**Failure signal:** Skill picks an id silently, or asks 4+ questions about the screen instead of distilling one id.

### Scenario 3: Override count to 6
**What to test:** Invocation-mode parsing and grid adaptation.
**Prompt:** "/ux-ui-design:screens billing-history --count 6"
**Expected behavior:** Six option files; index uses a 3x2 grid per the documented scaling.
**Failure signal:** Generates 4; or generates 6 but the index grid is still 2x2.

### Scenario 4: Refine mode after a pick
**What to test:** Iteration mode preserves the chosen direction.
**Prompt:** "/ux-ui-design:screens billing-history --refine option-2" (after option-2 was picked in a prior round)
**Expected behavior:** Skill loads `option-2.html`, generates refinements OF that direction (not fresh distinct takes), regenerates the index with the refinements.
**Failure signal:** Skill produces four entirely new distinct directions instead of variations on option-2.

### Scenario 5: Three rounds without convergence
**What to test:** Stop-condition surfacing.
**Prompt:** (After three successive "redo" rounds without picking) "Try again."
**Expected behavior:** Skill surfaces that three rounds is the soft cap, asks whether scope is actually clear, optionally suggests dropping back to scope or ideate.
**Failure signal:** Skill silently generates a 4th round of options.

## Summary

This is a well-shaped creative-workflow skill — the axes-of-variation framework, the worked option-naming examples, and the 3-round stop condition all reflect real practitioner thinking. The single highest-priority improvement is **extracting the inline HTML templates** (option scaffold + index grid) **into a shared reference in `ux-ui-principles/references/shared-chrome-css.md`**, which would pull SKILL.md under 260 lines and let `flows` and `palette` cite the same source instead of carrying their own near-identical copies.
