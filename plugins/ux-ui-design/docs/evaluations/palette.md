# Skill Evaluation: palette

**Type:** workflow (multi-step with interactive checkpoints and a refinement-mode branch)
**Evaluated:** 2026-05-15
**Files:**
- `SKILL.md` — 427 lines

## Structural Scores

| Dimension | Score | Notes |
|-----------|-------|-------|
| Token Efficiency | 2 | 427 lines, far over the workflow ceiling. The full token list (~25 lines × 2 = ~50 lines) and the palette.html template (~90 lines) are the heaviest contributors. |
| Activation Reliability | 5 | `user-invocable: true`, distinctive trigger phrases ("design a palette", "pick brand colors", "design tokens"), agent-driven trigger named (e.g. `screens` runs before `tokens.css` exists → palette first). |
| Structural Quality | 5 | 10 numbered phases plus a refinement-mode section, complete frontmatter, anti-patterns, what-it-produces preview up front. |
| Content Quality | 5 | Concrete token list with semantic naming, contrast-check requirement explicit, both light + dark modes from day one, spacing scale defaults provided. |
| Progressive Disclosure | 3 | No references for the skill; both the token list and the preview-page template should be externalized. The 8pt spacing scale ("4/8/12/16/24/32/48/64") would belong in a shared reference too. |
| Phase Structure | 5 | Phases 1–10 cleanly ordered; refinement mode is a clean side branch with explicit guard ("don't blow away tokens.css without confirmation"). |
| Validation & Error Handling | 4 | Contrast-check requirement is real. Refinement-mode protection of existing `tokens.css` is good. Less clear what to do when light-mode passes WCAG AA but dark-mode fails. |
| Freedom Calibration | 5 | Token list prescribed (right — downstream contract); option-character axes flexible (right — creative). Spacing/radius defaults reasonable. |
| Output Specification | 5 | `tokens.css` header-comment format documented, file paths explicit, both `palette.html` and `typography.html` structures specified. |
| **Structural Avg** | **4.3** | |

## Emotional Tone Scores

**Task-type profile:** creative/exploratory + meticulous craft (designing the visual identity that every downstream mock inherits — bold range in option-picking, careful precision in token definition)

| Dimension | Score | Notes |
|-----------|-------|-------|
| ET-1: Valence Alignment | 4 | "Real variety only" is bold and right. "Mocks set expectations" connects contrast checks to purpose. A couple of anti-patterns slip into prohibition framing. |
| ET-2: Anti-Desperation Design | 4 | Refinement mode protects against destructive re-runs. Phase 9's "trim to chosen" with a stated default reduces decision load. Less explicit failure-permission than `screens` or `flows`. |
| ET-3: Collaboration vs Command | 4 | Most rules carry rationale. Several "Don't..." anti-patterns and one or two "must" phrasings sit in commanding voice. |
| ET-4: Arousal Calibration | 4 | Generally calibrated — bold in option-picking phases, careful in lock-in phases. Phase 9 trim-vs-keep question could be slightly bolder about defaulting to trim. |
| **Emotional Tone Avg** | **4.0** | |

| **Overall** | **4.1** | |

## Strengths

- **Both modes from day one** — "Define both modes from day one; retrofitting dark mode after light is established is much harder than doing it together" — is the highest-leverage opinionated rule in the skill. Most palette efforts inherit this exact pain point.
- **The semantic token vocabulary** (`--color-bg-primary` / `-secondary` / `-tertiary` / `-inverse`; `--color-text-*`; `--color-accent` / `-hover` / `-muted`; status colors) is well-scoped — small enough to use, expressive enough to compose. Better than the typical "primary-50 through primary-900" Tailwind-inherited shape.
- **Refinement mode** is the right answer for a token file that downstream mocks depend on. The explicit "Don't blow away `tokens.css` in refinement mode without explicit user confirmation" rule prevents the most expensive failure.
- **Contrast-check requirement** in `palette.html` reflects discipline most plugins skip — WCAG AA pairings shown for the primary text-on-background combinations.
- **System-stack preference for fonts** with the "self-contained, opens offline forever" rationale ties back to the plugin's core tech rule cleanly. The escape hatch ("document a hosted font in the option but use the closest system fallback in `tokens.css`") is realistic.
- **8pt baseline spacing scale** (4/8/12/16/24/32/48/64) as an opinionated default cuts a meandering decision.

## Structural Findings

### 1. Inline templates and token list together are >150 lines (Score: 2 / Token Efficiency)
**Issue:** The token list (lines 99–123, light/dark implied as duplicate) plus `palette.html` template (lines 141–235) plus `tokens.css` lock template (lines 311–356) total roughly 180 lines of mostly-static scaffolding. SKILL.md only needs to describe what to produce; the templates can live in references.
**Rubric:** Token Efficiency — "Bloated sections" / "Reference files under 200 lines each."
**Recommendation:** Create three references:
- `references/token-vocabulary.md` — the full semantic token list with comments.
- `references/preview-pages.md` — `palette.html` and `typography.html` templates.
- `references/tokens-css-template.md` — the locked `tokens.css` format with header-comment contract.
SKILL.md keeps short descriptions and cites them. Should pull SKILL.md from ~427 lines to ~250.

### 2. Dark-mode WCAG validation isn't explicit (Score: 4 / Validation & Error Handling)
**Issue:** Phase 4 specifies a contrast check, and the template shows pass/fail markers — but doesn't say what to do when light passes and dark fails (the common case for accent-on-background pairs). The skill could either reject the option or note the gap.
**Rubric:** Validation & Error Handling — "Are there explicit 'if X fails, do Y' instructions?"
**Recommendation:** Add to phase 4: "Compute contrast ratios for both light and dark mode for these pairings: text-on-bg-primary, text-secondary-on-bg-primary, accent-on-bg-primary, text-inverse-on-accent. If any pairing fails AA in either mode, mark the option with a `<span class='fail'>` AND show the failing pair below the swatches. If all three options have failing pairs, surface that the color space is over-constrained and ask the user whether to relax a constraint."

### 3. Phase 9 trim default is right but the question phrasing pulls toward "keep" (Score: 4 / Output Specification)
**Issue:** The question "Keep all options in the preview pages (history), or trim to the chosen one?" lists keep first. Default is stated as trim, but the option order primes the user toward keep.
**Recommendation:** Reorder the options in the AskUserQuestion to "Trim to chosen (Recommended) / Keep all (for history reference)" so the recommended default appears first.

### 4. Refinement-mode happy-path is documented; failure path is implicit (Score: 4 / Validation & Error Handling)
**Issue:** Refinement mode says "Generate a focused preview HTML at `palette.html` showing before vs after for the proposed change." If the proposed change breaks contrast on a downstream-used token, the agent should flag it before writing tokens.css. Currently the validation is implicit.
**Recommendation:** Add: "Before applying refinement edits to `tokens.css`, run the same contrast check as phase 4 on the proposed values. If any pairing degrades below AA, surface it to the user with the specific pairing and ratio, and require confirmation before locking."

## Emotional Tone Findings & Rewrites

### ET-1. "Don't ship 3 nearly-identical palette options" reads as judgment (Score: 4 / Valence Alignment)
**Original:** "Don't ship 3 nearly-identical palette options. If two options share the same hue family at similar saturation, regenerate. Real variety only."
**Vector activated:** failure-policing
**Target vector:** craft-aspiration + curiosity about the hue space
**Rewrite:** "Aim for real range across the three options — different hue families, different saturation profiles, different personality. If two options share a hue family at similar saturation, the design space hasn't been explored yet; try a third axis (warm/cool contrast, muted/punchy contrast, or corporate/expressive contrast)."
**Shift:** prohibition → exploration. "Real variety only" goes from rule to invitation; the agent gets concrete other-axes to reach for.

### ET-3. Phase 8 lock-in instruction is command-shaped (Score: 4 / Collaboration vs Command)
**Original:** "Important: Include both light and dark mode values. Add a `@media (prefers-color-scheme: dark)` block, OR document a `[data-theme='dark']` selector if the project needs explicit toggling. Include the spacing and radius scales even though those weren't pitched as options — pick reasonable defaults (8pt baseline, 4/8/12/16/24/32/48/64). Keep the header comment intact; future runs of palette read it to know what's already locked."
**Vector activated:** compliance checklist
**Target vector:** partnership + purpose
**Rewrite:** "Lock-in writes the contract that every screen and flow mock will inherit, so a few things matter here. Define both light and dark mode values together — retrofitting dark later is painful. Pick the dark-mode mechanism that fits the project: `@media (prefers-color-scheme: dark)` for system-following, `[data-theme='dark']` if explicit toggling is needed. Include the spacing scale (8pt baseline: 4/8/12/16/24/32/48/64) and radius scale even though they weren't pitched as options — downstream mocks will need them, and reasonable defaults beat ad-hoc choices later. Keep the header comment intact; future palette runs read it to know what's already locked."
**Shift:** instruction list → reasoned partnership. The agent understands why each item matters, which carries forward to refinement-mode decisions.

### ET-4. "Don't forget dark mode" is the right insight, phrased timidly (Score: 4 / Arousal Calibration)
**Original:** "Don't forget dark mode. Define both modes from day one; retrofitting dark mode after light is established is much harder than doing it together."
**Vector activated:** mild reminder-tone
**Target vector:** confident assertion of craft principle
**Rewrite:** "Design both modes together from day one. Light-first then dark-retrofit is the most expensive mistake in palette work — every contrast choice has to be re-justified against a dark canvas, and the muted/accent relationships rarely survive the translation. Build both side by side and the constraints compose."
**Shift:** reminder → conviction. The lesson is the same; the framing now activates pride in doing it right rather than fear of forgetting.

## Test Scenarios

### Scenario 1: Cold start, three palette + two typography options
**What to test:** Phase 2–7 happy path, AskUserQuestion checkpoints.
**Prompt:** "Design a palette for a developer-tools SaaS — minimal-utilitarian tone, dark-first."
**Expected behavior:** Skill asks 2–4 character questions (or skips them since some are pinned by the prompt), writes `palette.html` with 3 distinct hue families, writes `typography.html` with 2 type stacks, opens both, asks the palette and type questions separately.
**Failure signal:** Three options share a hue family; typography options share the same stack with weight differences only; questions asked in one bundled prompt without separation.

### Scenario 2: Refinement-mode protection
**What to test:** Don't-blow-away rule on existing `tokens.css`.
**Prompt:** (With a populated `.mockups/design-system/tokens.css`) "Redo the palette — I want something warmer."
**Expected behavior:** Skill detects refinement mode, asks what specifically should change, generates a before/after preview, requires explicit confirmation before overwriting `tokens.css`, preserves the header comment.
**Failure signal:** Skill overwrites `tokens.css` without confirmation, or strips the header comment, or generates three fresh options instead of editing the existing.

### Scenario 3: Hosted font requested
**What to test:** System-stack preference + escape hatch.
**Prompt:** "I want Inter as the body font — pull it from Google Fonts."
**Expected behavior:** Skill documents Inter as the brand choice in the typography option, but locks `tokens.css` with a system-stack fallback (`--font-sans: 'Inter', -apple-system, ui-sans-serif, ...`), explicitly tells the user the loader belongs in production code, not the mock.
**Failure signal:** Skill adds a `<link>` to fonts.googleapis.com in the mocks, or refuses Inter entirely.

### Scenario 4: WCAG fail on accent
**What to test:** Contrast-check enforcement in dark mode.
**Prompt:** "Option 2 looks great — the bright lime accent on the near-black background really pops. Lock it in."
**Expected behavior:** Skill verifies the accent-on-bg-primary contrast for both modes, flags the failing pairing with the exact ratio, asks whether to relax the constraint or adjust the accent before locking.
**Failure signal:** Skill locks `tokens.css` with a failing accent pair silently, or refuses to lock without offering an adjustment path.

### Scenario 5: Phase 9 trim flow
**What to test:** Default-trim recommendation.
**Prompt:** (After Phase 8 lock-in) "Done — let's wrap."
**Expected behavior:** Skill asks the trim-vs-keep question with trim listed first (Recommended), defaults to trim if the user confirms generically.
**Failure signal:** Skill keeps all three options in `palette.html` without asking, or asks the question with keep listed first.

## Summary

This is a thoughtfully designed skill — the both-modes-from-day-one rule, the semantic token vocabulary, and the refinement-mode safety reflect real palette-work discipline. The single highest-priority improvement is **externalizing the three large inline blocks** (token vocabulary, preview-page templates, locked-tokens template) **into `references/` files**, which would pull SKILL.md from 427 lines down to ~250 and let the skill carry its opinionated decisions without inflating the auto-load surface.
