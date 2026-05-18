---
name: screens
description: >
  ALWAYS invoke this skill when the user asks to mock, design, wireframe, or explore
  options for a single UI screen, page, or surface — do not start writing production
  components inline. Generates N distinct single-screen HTML mockup options (default
  4) for one UI surface, writes them to .mockups/screens/<feature-id>/, opens them in
  the user's browser, and asks the user to pick or describe a hybrid. Iterates with
  feedback until the user signs off. Use whenever a new screen, page, or surface
  needs design exploration before code. Triggers on "mock the X screen", "design the
  login page", "give me 4 options for Y", "screen mockups for Z", "wireframe X",
  "let's mock up the dashboard". Defers to ux-ui-principles for storage, tech, and
  linking conventions.
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion
---

# Screens

Generate multiple distinct single-screen HTML mockups for one UI surface so
the user can compare and pick a direction before any production code is
written.

This is design exploration — the highest-leverage moment in UI work. Four
mocks side by side surface the assumptions the user didn't know they were
making. Lean into that. The mockups are throwaway; the conversation they
unlock isn't.

## When to invoke

User triggers:
- "mock the X screen"
- "give me 4 options for the dashboard"
- "let's design the login page"
- "screen mockups for the settings view"

Agent-driven triggers (from agile-workflow design family or workflow design):
- A `feature-design` / `epic-design` pass identifies a UI surface and the
  `ux-ui-principles` decision matrix says REQUIRED or OPTIONAL-yes.
- A scope or ideate run lands on a UI feature and the conversation has
  established the surface needs alignment before code.

## Invocation modes

| Invocation | Behavior |
|---|---|
| `screens <feature-id>` | Generate options for the named feature. Use the id verbatim as the folder name. |
| `screens <free-form description>` | Distill a short id (kebab-case, 2-4 words), confirm it with the user, then generate. |
| `screens <feature-id> --count 6` | Override default option count (default 4). Min 2, max 8. |
| `screens <feature-id> --refine option-2` | Iteration mode: start from a previously chosen option and generate refinements of it (not fresh distinct options). |

## Workflow

### Phase 1: Ground in the convention

Confirm `ux-ui-principles` is loaded. If the project's `CLAUDE.md` lacks the
`<!-- ux-ui-design:installed -->` marker, delegate to `ux-ui-principles` for
the install and then continue.

Read the substrate item if applicable (`.work/active/**/<feature-id>.md`),
the parent epic body if one exists, and any nearby design notes. Link to
`.mockups/design-system/tokens.css` from each generated option if the
design system has been locked.

### Phase 2: Understand the screen

Before generating, confirm the following from the item body, foundation
docs, or codebase. Ask the user via `AskUserQuestion` only for the
unanswered pieces — keep questions tight (2-4 max):

1. **What the screen IS.** A page? A modal? A panel? A wizard step?
2. **The primary action.** What does the user come here to do?
3. **The content.** What data, fields, controls, lists live on it?
4. **The constraints.** Existing brand colors? Required logo placement?
   Accessibility floor? Mobile-first or desktop-first?
5. **The audience.** Power user / casual user / first-timer?

### Phase 2.5: Stake out aesthetic territory

This is the checkpoint where four options that all look "kinda corporate
SaaS" gets prevented. The real value of this skill comes from generating
four genuinely different **aesthetic worlds** the screen could live in.

Use `AskUserQuestion` to claim the design space the options should explore.
Frame each pole as a real direction with personality, not a neutral
checkbox. Pitch 4-6 poles and let the user pick 2-4 that feel alive for
this project:

```
Q: Which aesthetic worlds should the four options explore? Pick 2-4.
- Brutally minimal — system-fonts, single accent, every pixel earns its place
- Editorial / magazine — generous type hierarchy, serifs, image-as-hero
- Retro-futuristic — chunky borders, mono accents, terminal echoes
- Organic / natural — earthy tones, soft shapes, hand-drawn touches
- Maximalist chaos — overlapping layers, expressive type, color riot
- Luxury / refined — generous whitespace, gold leaf, slow gravitas
- Playful / toy-like — rounded everything, bright primaries, springy motion
- Industrial / utilitarian — dense info, monospace numerics, no chrome
- Art-deco / geometric — symmetrical, rule-bound, ornament with intent
- Cyberpunk / neon — high-contrast dark mode, electric accents, glow
- Quiet / monastic — single weight, single color, profound restraint
```

Also pin what's **locked** (existing brand colors, logo placement, audience
constraints) and what's a **stretch** ("I keep defaulting to centered
cards — push me out of that"). The locked things constrain the options;
the stretch things liberate them.

If `.mockups/design-system/tokens.css` already exists, options vary in
layout and personality — `tokens.css` constrains palette, not direction.

### Phase 3: Sketch four distinct directions

This is where the mockup-first approach earns its keep. Plan four genuinely
different design takes on the same problem — not cosmetic variants, not
"option 2 with rounded corners." Different *answers* to the screen.

Useful axes to vary across options:

- **Density.** Sparse and roomy vs information-dense.
- **Layout primitive.** Single column / split / sidebar+main / grid / tabs / wizard.
- **Hierarchy.** What's hero, what's secondary, what's chromed away.
- **Tone.** Minimal-utilitarian vs branded-expressive vs editorial.
- **Progressive disclosure.** Everything-visible vs expand-on-demand.
- **Action surfacing.** CTA-forward vs content-forward.

For 4 options, pick four combinations that span the aesthetic territory
opened up in Phase 2.5. Commit to each direction fully. A mock that's a
watered-down version of three others teaches the user nothing.

Name each combination clearly before writing any HTML:

- option-1: "Sparse / single-column / CTA-forward — quiet-monastic pole"
- option-2: "Dense / split / content-forward — industrial-utilitarian pole"
- option-3: "Branded / sidebar / progressive-disclosure — editorial pole"
- option-4: "Editorial / wizard / minimal — brutally-minimal pole"

### Phase 4: Generate each option

Write each option as a standalone HTML file at
`.mockups/screens/<feature-id>/option-N.html`.

Use the file scaffold and `.mock-meta` header pattern from
`references/shared-chrome-css.md` (in the sibling `ux-ui-principles` skill).
The skeleton:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{feature-id} — Option N: {short-label}</title>
  <link rel="stylesheet" href="../../design-system/tokens.css">
  <link rel="stylesheet" href="../../design-system/components.css">
  <style>
    /* .mock-meta from shared-chrome-css */
    /* Layout-only CSS here (grid, flex, page-specific composition). */
    /* Components style themselves via components.css — don't override. */
  </style>
</head>
<body>
  <header class="mock-meta">
    <strong>Option N — {short-label}</strong>
    <span>{one-sentence rationale}</span>
  </header>
  <main>
    <!-- The mocked screen content. Use component classes:
         <button class="btn btn-primary">, <input class="input">, etc. -->
  </main>
  <script>/* Optional vanilla JS for interactive bits. */</script>
</body>
</html>
```

**Link `components.css` only when it exists.** If
`.mockups/design-system/components.css` is missing, drop that
`<link>` line and style components inline. For projects spanning more
than a few mocks, consider delegating to `components` first to lock
the component layer before generating options.

**Use component classes in markup.** When `components.css` exists,
markup uses `.btn .btn-primary` / `.input` / `.card` etc. instead of
inline styles. The `<style>` block in each option is for **layout
only** (grid, flex, page-specific composition) — not for restyling
buttons or inputs. This is what makes four options visually compare
on their layout/density/hierarchy choices instead of comparing
"how option 3 styled buttons differently."

**Token usage check.** Before referencing a `var(--token)`, verify it exists
in `.mockups/design-system/tokens.css`. If a needed token is missing,
either inline the literal value with a comment
(`/* TODO: not in tokens.css yet */`) or defer to `palette` to add it.

**Content rules:**
- Realistic placeholder content, not "Lorem ipsum." Names like "Acme Corp,"
  prices like "$47.20," dates like "Mar 14, 2026." Domain-appropriate copy.
- Make interactive bits actually interactive (a tab that switches, an
  accordion that expands). It surfaces UX issues early. Keep JS small.
- Don't fake data fetches. Hardcode 5-8 plausible rows in any list.

**Visual differentiation matters:** each option should be recognizably its
own direction at a glance. When two options trend toward the same
layout-and-tone combination, push back into the axes list from Phase 3 —
there's another genuinely different take waiting.

### Phase 5: Generate the comparison index

Write `.mockups/screens/<feature-id>/index.html` using the dark 2x2 grid
pattern in `references/shared-chrome-css.md`. Scale the grid columns/rows to
option count: 2 → 2x1, 3 → 3x1, 4 → 2x2, 5-6 → 3x2, 7-8 → 4x2.

The index is the actual review artifact. Treat it as the deliverable; the
option files are inputs to it.

### Phase 6: Open and ask

Open the index — not the four options individually:

```bash
xdg-open .mockups/screens/<feature-id>/index.html 2>/dev/null & \
  || open .mockups/screens/<feature-id>/index.html 2>/dev/null \
  || start "" .mockups/screens/<feature-id>/index.html 2>/dev/null \
  || echo "file://$(pwd)/.mockups/screens/<feature-id>/index.html"
```

Then use `AskUserQuestion` with options that match the generated count plus
a hybrid escape. Frame each option as a world, not a checkbox:

```
Q: Which direction feels right? Picking one works; describing a hybrid works too.
- Option 1 — {label}: {evocative one-line rationale capturing the feel}
- Option 2 — {label}: {evocative one-line rationale}
- Option 3 — {label}: {evocative one-line rationale}
- Option 4 — {label}: {evocative one-line rationale}
- Mix elements (specify what to combine from which)
- None of these click — push further into a different pole
```

### Phase 7: Iterate or finalize

**If the user picks one cleanly:**
- Note the selection in the substrate item body's `## Mockups` section:
  ```markdown
  ## Mockups
  - Screens: `.mockups/screens/<feature-id>/index.html`
  - Selected: option-2 ({label}) — {date}
  - Rationale: {user's reason if given}
  ```
- Stage the mock files: `git add .mockups/screens/<feature-id>/`.
- Tell the user the mock is ready for implementation reference.

**If the user wants a hybrid:**
- Ask which elements from which options.
- Generate one new file (`option-5.html` or `option-hybrid.html`)
  combining them.
- Re-open and re-ask.

**If the user wants refinements:**
- Re-enter Phase 3 with the user's feedback shaping the new variations.
- Either replace the existing four (overwrite option-1 through option-4)
  or add option-5..option-8 — ask which.

**Stop condition:** the user says some variation of "this is good / sign
off / implement option N." If three rounds pass without convergence,
surface that openly and ask whether scope is actually clear — sometimes
the question isn't "which mock" but "what are we even building."

### Phase 8: Record the decision

For substrate items: edit the item body's `## Mockups` section as shown.

For non-substrate work: write a short header comment at the top of the
chosen option's HTML:

```html
<!--
  Signed off as the chosen direction on 2026-05-15.
  Rationale: dense layout matches power-user audience; CTAs surfaced
  top-right per existing dashboard conventions.
-->
```

## Examples of distinct option naming

Adapt to the screen being mocked.

**Login screen:**
- option-1: "Centered card, single CTA, no brand"
- option-2: "Split — illustration left, form right, branded"
- option-3: "Full-bleed background, glass-morphism card, expressive"
- option-4: "Multi-method (SSO + email + magic-link), tabbed"

**Empty state:**
- option-1: "Centered icon + CTA + secondary link"
- option-2: "Illustrated walkthrough card with 3 steps"
- option-3: "Pre-filled example data with 'this is a demo' label"
- option-4: "Skeleton-of-real-UI with annotations"

**Settings page:**
- option-1: "Long single page, section anchors"
- option-2: "Tabbed (Account / Security / Billing / Notifications)"
- option-3: "Sidebar nav, content pane"
- option-4: "Search-first — start by querying a setting"

## Anti-patterns

- **Near-identical options waste review time.** "Slightly different colors"
  or "same layout, different button copy" doesn't earn its keep. If the
  difference can't be articulated in one sentence per option, push back
  into the axes list and regenerate.
- **Open the index, not the option files individually.** Side-by-side
  comparison is what makes a four-option review tractable; four tabs is
  what makes it forgettable.
- **Mocks earn their value from speed and clarity** — not from
  production-grade CSS hygiene. Skip BEM, skip sass variables, skip
  design-system purity. The mock is a conversation, not a deliverable;
  treat the time saved as time invested in better options.
- **Three rounds is the soft cap.** After three rounds without
  convergence, surface that scope might be unclear — looping a fourth
  time rarely lands the design and often signals upstream ambiguity.
- **Vanilla CSS only — no CSS framework CDNs.** `ux-ui-principles` carries
  the tech rule. Tailwind via CDN here drifts the mock toward "production
  code that kinda works" and breaks the throwaway property. Hosted fonts
  via CDN are fine when the palette specifies one.
