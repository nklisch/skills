# Skill Evaluation: ux-ui-principles

**Type:** principle (with reference characteristics)
**Evaluated:** 2026-05-15
**Files:**
- `SKILL.md` — 255 lines
- `references/open-cross-platform.md` — 63 lines

## Structural Scores

| Dimension | Score | Notes |
|-----------|-------|-------|
| Token Efficiency | 3 | 255 lines — over the 200-line target for principle skills. ~80 lines of installer block + CLAUDE.md content sit inline; some could move to a reference. |
| Activation Reliability | 5 | Description is third-person, lists explicit auto-load triggers, names the three companion skills, declares scope. Strong keywords. |
| Structural Quality | 5 | Complete frontmatter, logical flow (rule → storage → tech → matrix → linking → installer → opening → inheritance → anti-patterns), explicit anti-patterns section. |
| Content Quality | 5 | Concrete paths, frontmatter samples, exact installer block. Terminology is consistent throughout (mockups, substrate item, feature-id). |
| Progressive Disclosure | 4 | One reference (`open-cross-platform.md`) properly cited and used by sibling skills. The verbatim installer block is fine inline. |
| Rule Clarity | 5 | REQUIRED/OPTIONAL/SKIP decision matrix is testable; tech rule is enforceable; path convention is verifiable. |
| Example Quality | 5 | Every rule has a concrete example: storage tree, frontmatter snippet, mockup body section, installer block, open commands. |
| Auto-Load Reliability | 5 | Trigger keywords are specific and distinguish from generic "UI" or "design" loads — it ties to mockup-first conventions. |
| Composability | 5 | Explicitly documents loose coupling with agile-workflow, names which sibling skills inherit conventions, defines deferral protocol. |
| **Structural Avg** | **4.7** | |

## Emotional Tone Scores

**Task-type profile:** meticulous/quality work (principle skill encoding craft conventions for a design discipline)

| Dimension | Score | Notes |
|-----------|-------|-------|
| ET-1: Valence Alignment | 4 | Frames mockups as durable craft artifacts ("the design artifact future implementers reference"). One or two anti-pattern items lean toward pure prohibition. |
| ET-2: Anti-Desperation Design | 5 | "When unsure, default to mocking the higher-value variant: a 10-minute screen mock is cheap insurance" — explicit permission to make the safe choice. |
| ET-3: Collaboration vs Command | 4 | Most rules carry rationale ("because"). Anti-patterns are framed as commands but with explanations. A couple could shift from "don't" to "do". |
| ET-4: Arousal Calibration | 5 | Calm, steady, convention-encoding tone. Right intensity for a principle skill — neither hyped nor flat. |
| **Emotional Tone Avg** | **4.5** | |

| **Overall** | **4.6** | |

## Strengths

- The decision matrix (REQUIRED / OPTIONAL / SKIP) with named examples per bucket is exemplary — an agent can apply it without re-interpretation.
- Explicit "what the generator skills inherit" section makes the deferral model legible; sibling skills don't have to re-state conventions.
- The `<!-- ux-ui-design:installed -->` marker as the single source of truth is a clean idempotency pattern, and the skill says exactly what to do when the marker is missing vs present.
- "When NOT running in a substrate context, just write the mocks and tell the user the path" — gracefully handles the standalone case in one sentence.
- Reference file `open-cross-platform.md` is appropriately sized (63 lines), focused on one topic, with a portable bash function and per-platform notes.

## Structural Findings

### 1. Installer block adds ~80 inline lines that could move to a reference (Score: 3 / Token Efficiency)
**Issue:** Lines 121–188 carry the CLAUDE.md installer flow and the verbatim block to append. The block must be byte-stable, but it doesn't have to live in SKILL.md — a reference like `references/claude-md-installer.md` keeps SKILL.md leaner and preserves verbatim copy semantics.
**Rubric:** Token Efficiency — "Reference files under 200 lines each" and "Content needed for 20% of tasks is in references." The installer fires once per project; the rule body is consulted every time the skill loads.
**Recommendation:** Move the installer block + idempotency notes to `references/claude-md-installer.md`. Keep a one-paragraph summary plus "see `references/claude-md-installer.md` for the exact block" in SKILL.md.

### 2. Progressive disclosure could externalize the `<style>` patterns each generator inherits (Score: 4)
**Issue:** "What the generator skills inherit" (lines 207–219) is short and works, but the three sibling SKILL.md files each re-implement very similar `<header class="flow-meta">` / index-grid markup. A `references/shared-css.md` here would let `screens`/`flows`/`palette` cite a single source.
**Rubric:** Progressive Disclosure — "References linking to other references" is fine when the alternative is duplication across sibling skills.
**Recommendation:** Introduce `references/shared-chrome-css.md` with the meta-header and index-grid styles, then have `screens` / `flows` / `palette` reference it. Reduces palette.md and flows.md significantly (see those evaluations).

## Emotional Tone Findings & Rewrites

### ET-1. Anti-pattern framing tilts to prohibition (Score: 4 / Valence Alignment)
**Original:** "Don't generate production code from this plugin. Mockups are not React components, not Svelte components, not anything that imports from the host application. They are throwaway HTML — the implementer translates them into the real stack later."
**Vector activated:** mild restriction / boundary policing
**Target vector:** craft-pride + clear purpose
**Rewrite:** "Mockups stay as throwaway HTML — that's their power. They're the alignment artifact, opened in any browser years from now, untouched by the host stack. The implementer translates the chosen mock into your real components later."
**Shift:** prohibition → purpose. The new phrasing activates pride in the artifact's longevity rather than fear of crossing a line.

### ET-3. "Don't skip the index.html" reads as a command without the why (Score: 4 / Collaboration vs Command)
**Original:** "Don't skip the index.html. For screens and flows, an `index.html` that shows all options/steps side-by-side or as a navigator is what makes review fast. Without it the user has to open four tabs and remember which is which."
**Vector activated:** compliance
**Target vector:** partnership + concrete purpose
**Rewrite:** "Always write the index.html — it's the actual review artifact. The four option files are inputs; the index is what the user opens. Without it review fragments across four tabs and tab-amnesia eats the comparison."
**Shift:** "don't skip" → "always write" (positive framing) + reinforces the reasoning so the agent treats the index as the deliverable, not as a side artifact.

## Test Scenarios

### Scenario 1: First-invocation install on a project with no CLAUDE.md
**What to test:** Idempotency and graceful project bootstrap.
**Prompt:** "I'm starting a new project at `/tmp/test-skill-eval`. There's no `CLAUDE.md`. We're going to need to design a few screens — can you set up the UI/UX design convention for this project?"
**Expected behavior:** The skill detects the missing `CLAUDE.md`, asks via AskUserQuestion whether to create+install the block, and writes the file with `<!-- ux-ui-design:installed -->`.
**Failure signal:** Skill installs silently without asking, OR writes the block without the marker, OR fails because `CLAUDE.md` doesn't exist.

### Scenario 2: Second invocation should not re-prompt
**What to test:** Marker-based idempotency.
**Prompt:** (After Scenario 1 completes.) "Now mock the login screen."
**Expected behavior:** Skill detects the marker, does NOT re-prompt the install question, proceeds to delegate to `screens`.
**Failure signal:** Skill re-asks the install question even though the marker is present.

### Scenario 3: User pastes the block but strips the marker
**What to test:** Documented behavior for the manual-paste edge case.
**Prompt:** "I copied your UI convention block into CLAUDE.md but stripped the marker comment. Run the mockup skill now."
**Expected behavior:** Skill re-prompts (since the marker is the source of truth) AND tells the user to restore the marker if they don't want the prompt.
**Failure signal:** Skill is silently confused, or installs a duplicate block, or fails to mention how to suppress future prompts.

### Scenario 4: Decision-matrix call from an external workflow
**What to test:** Composability and deferral behavior.
**Prompt:** "I'm in agile-workflow:feature-design for a feature called `dashboard-empty-state`. The feature involves a single new screen. Should I mock it, and how?"
**Expected behavior:** Skill applies the matrix → REQUIRED (net-new UI surface), recommends invoking `/ux-ui-design:screens dashboard-empty-state`, and explains the link convention back to the substrate item.
**Failure signal:** Skill applies the matrix incorrectly (e.g., says SKIP), or invokes screens itself instead of deferring, or doesn't mention the substrate item body section.

### Scenario 5: Cross-platform open recipe
**What to test:** Reference findability.
**Prompt:** "Mock the settings page. After generating, make sure to open it for me — I'm on Linux."
**Expected behavior:** Skill (or its delegate) uses the `references/open-cross-platform.md` recipe, runs `xdg-open` with stderr suppressed and backgrounded, falls back to `file://` if it fails.
**Failure signal:** Skill blocks on the open command, or uses a hardcoded macOS `open`, or invents a recipe instead of citing the reference.

## Summary

This is a strong principle/reference skill — the decision matrix and storage convention are unambiguous, the installer protocol is well-designed, and the deferral pattern with the three generators is documented in both directions. The single highest-priority improvement is **moving the 80-line CLAUDE.md installer block into `references/claude-md-installer.md`** to pull SKILL.md under the 200-line target and reduce auto-load token cost without losing any verbatim semantics.
