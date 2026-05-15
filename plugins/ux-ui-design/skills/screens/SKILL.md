---
name: screens
description: >
  Generate N distinct single-screen HTML mockup options (default 4) for one UI
  surface, write them to .mockups/screens/<feature-id>/, open them in the user's
  browser, and ask the user to pick or describe a hybrid. Iterates with feedback
  until the user signs off. Triggers on "mock the X screen", "give me 4 options
  for Y", "screen mockups for Z", "let's design the login page". Defers to
  ux-ui-principles for storage, tech, and linking conventions.
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion
---

# Screens

Generate multiple distinct single-screen HTML mockups for one UI surface so the
user can compare and pick a direction before any production code is written.

## When to invoke

User triggers:
- "mock the X screen"
- "give me 4 options for the dashboard"
- "let's design the login page"
- "screen mockups for the settings view"

Agent-driven triggers (from agile-workflow design family or workflow design):
- A `feature-design` / `epic-design` pass identifies a UI surface and the
  `ux-ui-principles` decision matrix says REQUIRED or OPTIONAL-yes.
- The user, during scope or ideate, lands on a UI feature and the conversation
  has established that the surface needs alignment before code.

## Invocation modes

| Invocation | Behavior |
|---|---|
| `screens <feature-id>` | Generate options for the named feature. Use the id verbatim as the folder name. |
| `screens <free-form description>` | Distill a short id from the description (kebab-case, 2-4 words), confirm it with the user, then generate. |
| `screens <feature-id> --count 6` | Override default option count (default 4). Min 2, max 8. |
| `screens <feature-id> --refine option-2` | Iteration mode: start from a previously chosen option and generate refinements of it (not fresh distinct options). |

## Workflow

### Phase 1: Ground in the convention

Confirm `ux-ui-principles` is loaded. If the project's `CLAUDE.md` lacks the
`<!-- ux-ui-design:installed -->` marker, mention that the principles skill
will offer to install it — let it do so and continue.

Read:
- `ux-ui-principles` (already auto-loaded if available)
- `.mockups/design-system/tokens.css` if it exists — link to it from each option
- The relevant substrate item if applicable (`.work/active/**/<feature-id>.md`)
- The parent epic body if one exists
- `CLAUDE.md` and any nearby design notes

### Phase 2: Understand the screen

Before generating, confirm the following:

1. **What the screen IS.** A page? A modal? A panel? A multi-step wizard step?
2. **The primary action.** What does the user come here to do?
3. **The content.** What data, fields, controls, lists are on it?
4. **The constraints.** Existing brand colors? Required logo placement?
   Accessibility floor? Mobile-first or desktop-first?
5. **The audience.** Power user / casual user / first-timer?

If any of these are unclear from the item body, foundation docs, or codebase,
ask the user via `AskUserQuestion`. Keep the question set tight (2-4 questions
max). Skip what's already pinned.

### Phase 3: Plan distinct directions

Sketch mentally (NOT on disk) what makes each of the N options **genuinely
different**. The 4 options should not be cosmetic variants of one direction —
they should represent **different design takes** on the same problem.

Useful axes to vary across options:
- **Density.** Sparse and roomy vs information-dense.
- **Layout primitive.** Single column / split / sidebar+main / grid / tabs / wizard.
- **Hierarchy.** What's hero, what's secondary, what's chromed away.
- **Tone.** Minimal-utilitarian vs branded-expressive vs editorial.
- **Progressive disclosure.** Everything-visible vs expand-on-demand.
- **Action surfacing.** CTA-forward vs content-forward.

For 4 options, aim for 4 distinct combinations across these axes. Name each:
- option-1: "Sparse / single-column / CTA-forward"
- option-2: "Dense / split / content-forward"
- option-3: "Branded / sidebar / progressive-disclosure"
- option-4: "Editorial / wizard / minimal"

### Phase 4: Generate each option

For each option, write a standalone HTML file at
`.mockups/screens/<feature-id>/option-N.html`.

**File structure** (vanilla, no CDN, see ux-ui-principles tech rule):

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{feature-id} — Option N: {short-label}</title>
  <!-- Reuse design-system tokens if they exist -->
  <link rel="stylesheet" href="../../design-system/tokens.css">
  <style>
    /* All option-specific CSS here. */
  </style>
</head>
<body>
  <header class="mock-meta">
    <strong>Option N — {short-label}</strong>
    <span>{one-sentence rationale}</span>
  </header>
  <main>
    <!-- The actual mocked screen content. -->
  </main>
  <script>
    /* Optional vanilla JS for interactive bits (tabs, accordions). */
  </script>
</body>
</html>
```

**Important content rules:**
- Use realistic placeholder content, not "Lorem ipsum." Names like "Acme Corp,"
  prices like "$47.20," dates like "Mar 14, 2026." Domain-appropriate copy.
- Make interactive bits actually interactive (a tab that switches, an
  accordion that expands) — it makes the mock feel real and surfaces UX issues
  early. But keep JS small.
- Don't fake data fetches. If a list is shown, hardcode 5-8 plausible rows.
- The `.mock-meta` header at top labels the option — keep it visible so the
  user knows which option they're looking at in tabs. Skip it ONLY if the user
  explicitly asks for "clean mocks without the header strip."

**Visual differentiation:** options must visibly differ on first glance. If
two options look 80% the same, the variety test has failed — regenerate.

### Phase 5: Generate the comparison index

Write `.mockups/screens/<feature-id>/index.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{feature-id} — N options</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #111; color: #eee; }
    h1 { padding: 16px 24px; margin: 0; font-weight: 500; }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 8px;
      padding: 8px;
      height: calc(100vh - 56px);
      box-sizing: border-box;
    }
    .cell {
      background: #fff;
      border-radius: 4px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .cell h2 {
      margin: 0;
      padding: 8px 12px;
      font-size: 13px;
      font-weight: 600;
      background: #222;
      color: #eee;
      display: flex;
      justify-content: space-between;
    }
    .cell iframe { border: 0; flex: 1; width: 100%; }
    .cell a { color: #6cf; text-decoration: none; }
  </style>
</head>
<body>
  <h1>{feature-id} — pick a direction</h1>
  <div class="grid">
    <div class="cell">
      <h2>Option 1 — {label} <a href="option-1.html" target="_blank">open ↗</a></h2>
      <iframe src="option-1.html"></iframe>
    </div>
    <!-- repeat for each option -->
  </div>
</body>
</html>
```

Adapt the grid columns/rows to the option count (2 → 2x1, 3 → 3x1, 4 → 2x2,
5-6 → 3x2, 7-8 → 4x2).

### Phase 6: Open and ask

Open the index — NOT all four options individually. See the
`open-cross-platform` reference in `ux-ui-principles`:

```bash
xdg-open .mockups/screens/<feature-id>/index.html 2>/dev/null & \
  || open .mockups/screens/<feature-id>/index.html 2>/dev/null \
  || start "" .mockups/screens/<feature-id>/index.html 2>/dev/null \
  || echo "file://$(pwd)/.mockups/screens/<feature-id>/index.html"
```

Then use `AskUserQuestion` with options that match the generated count plus a
hybrid escape:

```
Q: Which direction works? Picking one is fine; describing a hybrid also works.
- Option 1 — {label}: {one-line rationale}
- Option 2 — {label}: {one-line rationale}
- Option 3 — {label}: {one-line rationale}
- Option 4 — {label}: {one-line rationale}
- Mix elements (specify what to combine)
- Refine all four (more variations)
```

### Phase 7: Iterate or finalize

**If user picks one cleanly:**
- Note the selection in the substrate item body's `## Mockups` section:
  ```markdown
  ## Mockups
  - Screens: `.mockups/screens/<feature-id>/index.html`
  - Selected: option-2 ({label}) — {date}
  - Rationale: {user's reason if given}
  ```
- Stage the mock files: `git add .mockups/screens/<feature-id>/`
- Tell the user the mock is ready for implementation reference.

**If user wants a hybrid:**
- Ask which elements from which options.
- Generate one new file `option-5.html` (or `option-hybrid.html`) combining
  them.
- Re-open and re-ask.

**If user wants refinements:**
- Re-enter Phase 3 with the user's feedback shaping the new variations.
- Either replace the existing four (overwrite option-1 through option-4) or
  add option-5..option-8 — ask which.

**Stop condition:** the user says some variation of "this is good / let's go
with this / sign off / implement option N." Don't loop forever; if after 3
rounds nothing converges, surface that and ask whether scope is actually
clear.

### Phase 8: Record the decision

For substrate items: edit the item body's `## Mockups` section as shown.

For non-substrate work: write a short header comment at the top of the chosen
option's HTML:

```html
<!--
  Signed off as the chosen direction on 2026-05-15.
  Rationale: dense layout matches power-user audience; CTAs surfaced top-right
  per existing dashboard conventions.
-->
```

## Examples of distinct option naming

These are illustrative — adapt to the screen being mocked.

**For a login screen (4 options):**
- option-1: "Centered card, single CTA, no brand"
- option-2: "Split — illustration left, form right, branded"
- option-3: "Full-bleed background, glass-morphism card, expressive"
- option-4: "Multi-method (SSO + email + magic-link), tabbed"

**For an empty state (4 options):**
- option-1: "Centered icon + CTA + secondary link"
- option-2: "Illustrated walkthrough card with 3 steps"
- option-3: "Pre-filled example data with 'this is a demo' label"
- option-4: "Skeleton-of-real-UI with annotations"

**For a settings page (4 options):**
- option-1: "Long single page, section anchors"
- option-2: "Tabbed (Account / Security / Billing / Notifications)"
- option-3: "Sidebar nav, content pane"
- option-4: "Search-first — start by querying a setting"

## Anti-patterns

- **Don't generate near-identical options.** "Slightly different colors" or
  "same layout, different button copy" wastes the user's review time. If the
  difference can't be articulated in one sentence per option, regenerate.
- **Don't open all 4 options as separate tabs.** Open the index. The user's
  review is faster when they can see options side-by-side.
- **Don't skip the index.html.** It's the actual review artifact — the four
  options are inputs to it.
- **Don't loop endlessly without convergence.** Three rounds is a reasonable
  ceiling; after that surface that scope might be unclear.
- **Don't use a CSS framework.** ux-ui-principles forbids CDN/external deps.
- **Don't write production-quality CSS.** Keep mocks visually clear but don't
  agonize over BEM, sass variables, or design-system purity. The mock is a
  conversation, not a deliverable.
