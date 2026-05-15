---
name: flows
description: >
  Generate a multi-page user-flow mockup as a sequence of numbered single-file HTML
  pages in .mockups/flows/<flow-name>/, with an index.html navigator that lets
  reviewers step through the flow as a real user would. Captures cross-screen
  journeys for sign-off — signup, checkout, onboarding, recovery flows, multi-step
  forms, wizards. Triggers on "mock the signup flow", "design the checkout journey",
  "flow mockup for onboarding", "multi-page wireframe for X". Defers to
  ux-ui-principles for storage, tech, and linking conventions.
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion
---

# Flows

Generate a multi-page user-flow mockup — a numbered sequence of HTML pages
that, viewed in order, represent the user's path through a journey. Used to
align on multi-screen UX before implementation: signup, checkout, onboarding,
account recovery, multi-step wizards, anything that spans more than one screen.

## When to invoke

User triggers:
- "mock the signup flow"
- "design the checkout journey"
- "flow mockup for onboarding"
- "multi-page wireframe for password reset"
- "walk me through what the upgrade flow looks like"

Agent-driven triggers:
- An epic-design pass identifies a multi-screen journey under the epic's scope.
- A feature-design pass crosses screen boundaries (more than one route).

## Invocation modes

| Invocation | Behavior |
|---|---|
| `flows <flow-name>` | Generate a flow under `.mockups/flows/<flow-name>/`. Confirm the step list with the user first. |
| `flows <free-form description>` | Distill a kebab-case flow name from the description (2-3 words like `signup`, `checkout-recovery`), confirm, then generate. |
| `flows <flow-name> --steps 5` | Hint at step count up-front; the discovery phase may still adjust. |
| `flows <flow-name> --refine` | Iteration mode: reload existing flow, propose edits step-by-step. |

## Distinction from `screens`

`screens` produces N **alternative** designs for ONE screen — user picks one.

`flows` produces ONE design across **multiple sequential** screens — user
walks through it.

If the user is unclear which they want, ask. Common confusion: "mock the
signup" could mean either. "Give me 4 options for the signup form" → screens.
"Walk me through the signup flow" → flows.

## Workflow

### Phase 1: Ground and confirm scope

Confirm `ux-ui-principles` is loaded; if `CLAUDE.md` lacks the marker, let
principles install it first.

Read context:
- The substrate item (epic or feature) if applicable
- Existing mocks under `.mockups/screens/` that this flow might touch
- `.mockups/design-system/tokens.css` if present
- `CLAUDE.md`

### Phase 2: Outline the steps with the user

Before writing any HTML, propose the step sequence. Use `AskUserQuestion` to
confirm:

```
Proposed flow: <flow-name>
- 01-landing: arrival page / entry trigger
- 02-form-basics: collect email + password
- 03-verify: email verification gate
- 04-profile: profile setup
- 05-success: welcome / first-action

Does this match? Edit / add / remove steps as needed.
```

Aim for **3-7 steps**. Fewer than 3 and `screens` is probably the right skill.
More than 7 and the flow needs to be split (collect smaller flows that
compose).

For each step, capture:
- The slug (kebab-case, used in the filename)
- The user's goal on that step
- The primary action that advances them
- Any branch points (success / failure / "back" / "skip")

If branches exist, note them in the step description but render the **happy
path only** by default. Branches get their own dedicated flows (e.g.
`signup-recovery`) unless the user explicitly asks for branched mocks.

### Phase 3: Determine tone and density

Unlike `screens`, `flows` doesn't generate alternatives — there's one
direction. So ask up-front (1-2 questions max):

- Is this a polished mock (close to final visual) or a wireframe
  (gray boxes + labels)?
- Mobile-first, desktop-first, or both?

Wireframe is faster and forces focus on flow structure. Polished is better for
stakeholder sign-off. Default to wireframe if no design system exists yet, and
polished if `.mockups/design-system/tokens.css` is present.

### Phase 4: Generate each step page

For each step, write a standalone HTML file at
`.mockups/flows/<flow-name>/NN-<slug>.html` (zero-padded to 2 digits).

Each page must have:

- A `<header class="flow-meta">` showing flow name, step number/total,
  and prev/next links for navigation
- A `<main>` with the actual mocked content
- The same visual treatment across all pages (consistency matters MORE than
  in `screens`)

**Page template:**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{flow-name} — step N/M: {slug}</title>
  <link rel="stylesheet" href="../../design-system/tokens.css">
  <style>
    /* Shared flow chrome */
    .flow-meta {
      position: sticky; top: 0; z-index: 100;
      background: #0d1117; color: #c9d1d9;
      padding: 10px 16px;
      display: flex; justify-content: space-between; align-items: center;
      font: 13px/1.4 system-ui, sans-serif;
      border-bottom: 1px solid #30363d;
    }
    .flow-meta a {
      color: #58a6ff; text-decoration: none;
      padding: 4px 8px; border-radius: 4px;
    }
    .flow-meta a:hover { background: #161b22; }
    .flow-meta .center { font-weight: 600; }
    /* Page-specific styles below */
  </style>
</head>
<body>
  <header class="flow-meta">
    <a href="NN-prev-slug.html">← prev</a>
    <span class="center">{flow-name} · step N/M · {slug}</span>
    <a href="NN-next-slug.html">next →</a>
  </header>
  <main>
    <!-- Step content. -->
  </main>
</body>
</html>
```

For the first step, the prev link points to `index.html` ("← overview").
For the last step, the next link points to `index.html` ("done ↗").

**Cross-step consistency rules:**
- Same color tokens, same fonts, same component shapes across all pages
- Reusable form fields look the same on every step that has them
- Buttons, links, and headers stay visually anchored
- Navigation chrome (header, progress bar, "step X of Y") is identical

Consider including a **progress indicator** in the flow-meta — a step counter
or a thin progress bar showing position. Helps reviewers feel the journey.

### Phase 5: Generate the index navigator

Write `.mockups/flows/<flow-name>/index.html` — a single page that lists all
steps with thumbnails or summaries and lets the reviewer click through:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{flow-name} — flow overview</title>
  <style>
    body {
      margin: 0; font: 14px/1.5 system-ui, sans-serif;
      background: #f6f8fa; color: #24292f;
    }
    header {
      background: #0d1117; color: #fff;
      padding: 24px 32px;
    }
    header h1 { margin: 0 0 4px; font-weight: 600; font-size: 20px; }
    header p { margin: 0; color: #8b949e; }
    .steps {
      display: grid; gap: 16px;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      padding: 24px 32px;
    }
    .step {
      background: #fff; border: 1px solid #d0d7de; border-radius: 8px;
      overflow: hidden; display: flex; flex-direction: column;
    }
    .step .label {
      padding: 12px 16px;
      display: flex; justify-content: space-between; align-items: center;
      border-bottom: 1px solid #d0d7de;
    }
    .step .label .num {
      background: #0969da; color: #fff;
      width: 24px; height: 24px; border-radius: 50%;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 600;
    }
    .step .label a {
      color: #0969da; text-decoration: none; font-size: 12px;
    }
    .step iframe {
      border: 0; width: 100%; height: 220px;
      background: #fff;
    }
    .ribbon {
      display: flex; gap: 4px; padding: 16px 32px;
      background: #fff; border-bottom: 1px solid #d0d7de;
    }
    .ribbon a {
      flex: 1; padding: 8px 12px; text-align: center;
      background: #f6f8fa; border: 1px solid #d0d7de; border-radius: 6px;
      color: #24292f; text-decoration: none; font-size: 13px;
    }
    .ribbon a:hover { background: #eaeef2; }
  </style>
</head>
<body>
  <header>
    <h1>{flow-name}</h1>
    <p>{one-sentence flow purpose} — {step count} steps</p>
  </header>
  <div class="ribbon">
    <a href="01-{slug}.html">▶ start the flow</a>
    <a href="01-{slug}.html" target="_blank">▶ start in new tab</a>
  </div>
  <div class="steps">
    <!-- one .step per step -->
    <div class="step">
      <div class="label">
        <span><span class="num">1</span> &nbsp; {step title}</span>
        <a href="01-{slug}.html">open ↗</a>
      </div>
      <iframe src="01-{slug}.html"></iframe>
    </div>
    <!-- ... -->
  </div>
</body>
</html>
```

The iframes give reviewers a preview without leaving the index. Clicking
"start the flow" enters at step 1 with the prev/next chrome carrying them
through.

### Phase 6: Open and walk through

Open the index:

```bash
xdg-open .mockups/flows/<flow-name>/index.html 2>/dev/null & \
  || open .mockups/flows/<flow-name>/index.html 2>/dev/null \
  || start "" .mockups/flows/<flow-name>/index.html 2>/dev/null \
  || echo "file://$(pwd)/.mockups/flows/<flow-name>/index.html"
```

Then ask the user to walk through the flow and give feedback. Use
`AskUserQuestion`:

```
Q: How does the flow feel?
- Ship it — sign off
- Tweak specific steps (specify which)
- Restructure — add / remove / reorder steps
- Redesign — wireframe to polished, or vice versa
```

### Phase 7: Iterate or finalize

**Ship it:**
- Add the `## Mockups` section to the substrate item body:
  ```markdown
  ## Mockups
  - Flow: `.mockups/flows/<flow-name>/index.html`
  - Steps: 01-landing → 02-form → 03-verify → 04-profile → 05-success
  - Signed off: 2026-05-15
  ```
- `git add .mockups/flows/<flow-name>/`
- Tell user the flow is locked in.

**Tweak steps:**
- Ask which steps. Regenerate just those files. Re-open.

**Restructure:**
- Run Phase 2 again with the new outline. Renumber files. Update prev/next
  links. Regenerate the index.

**Redesign:**
- Wireframe ↔ polished is a fundamental shift. Regenerate all steps with the
  new treatment. Keep the same flow structure.

**Stop condition:** "ship it" or equivalent. Three rounds without convergence
→ flag that scope or flow structure may be unclear.

### Phase 8: Cross-reference with screens (optional)

If individual steps in this flow have already been explored via `screens`
(e.g. `.mockups/screens/login/option-2.html` was the chosen login design),
the flow step can either:

- Embed/iframe the screen mock if the layouts match
- Re-mock the step in the flow's visual tone with a note: "based on screen
  selection: login option-2"

Default: re-mock in the flow's tone but include a comment in the file:

```html
<!--
  This step is the chosen direction from .mockups/screens/login/option-2.html
  (signed off 2026-05-10). Re-rendered here in the flow's wireframe tone for
  journey-level review.
-->
```

## Anti-patterns

- **Don't mock branches by default.** Happy path first. Branches as separate
  flows or as explicitly requested additional pages.
- **Don't break visual consistency across steps.** A flow that looks like 5
  different designers worked on it sabotages journey-level review.
- **Don't skip the prev/next chrome.** Reviewers need to step through quickly;
  navigation is non-negotiable.
- **Don't generate fewer than 3 steps.** If it's 1-2 screens, use `screens`.
- **Don't generate more than 7 steps in one flow.** Split into composing
  flows or split by branch point.
- **Don't use a JS framework or CDN.** ux-ui-principles tech rule applies.
- **Don't iterate forever.** 3 rounds is the soft cap.
