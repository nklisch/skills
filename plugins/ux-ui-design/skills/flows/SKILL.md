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
account recovery, multi-step wizards, anything that spans more than one
screen.

Flows are stories. A signup flow isn't a sequence of forms — it's the moment
a stranger decides whether to trust this product. Mock it like that matters,
because it does.

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
| `flows <free-form description>` | Distill a kebab-case flow name (2-3 words like `signup`, `checkout-recovery`), confirm, then generate. |
| `flows <flow-name> --steps 5` | Hint at step count up-front; the discovery phase may still adjust. |
| `flows <flow-name> --refine` | Iteration mode: reload existing flow, propose edits step-by-step. |

## Distinction from `screens`

`screens` produces N **alternative** designs for ONE screen — user picks one.

`flows` produces ONE design across **multiple sequential** screens — user
walks through it.

If the user is unclear which they want, ask. Common confusion: "mock the
signup" could mean either. "Give me 4 options for the signup form" →
`screens`. "Walk me through the signup flow" → `flows`.

If the user asks for a flow with only 1-2 steps, redirect to `screens`
instead — a flow needs sequence to mean anything.

## Workflow

### Phase 1: Ground and confirm scope

Confirm `ux-ui-principles` is loaded; if `CLAUDE.md` lacks the marker,
delegate to `ux-ui-principles` for the install first.

Read context lightly:
- The substrate item (epic or feature) if applicable
- Existing mocks under `.mockups/screens/` that this flow might touch
- `.mockups/design-system/tokens.css` if present
- `CLAUDE.md`

### Phase 2: Walk the path out loud

A flow is the user's path. Before any HTML, ask the user to walk the path
out loud. What's their headspace at the start — curious, skeptical, rushed,
in pain? What's the moment of commitment? What's the resolution that lets
them exhale?

Translate that into a step sequence and confirm via `AskUserQuestion`:

```
Proposed flow: <flow-name>
- 01-landing: arrival page / entry trigger
- 02-form-basics: collect email + password
- 03-verify: email verification gate
- 04-profile: profile setup
- 05-success: welcome / first-action

Does this match? Edit / add / remove / reorder steps as needed.
```

Aim for **3-7 steps**. Fewer than 3 and `screens` is the right skill. More
than 7 and the flow needs to split into composing flows.

For each step, capture:
- The slug (kebab-case, used in the filename)
- The user's goal on that step
- The primary action that advances them
- Any branch points (success / failure / "back" / "skip")

If branches exist, note them in the step description but render the
**happy path only** by default. Branches get their own dedicated flows
(e.g. `signup-recovery`) unless the user explicitly asks for branched mocks.

### Phase 3: Set the flow's voice

Wireframe vs polished isn't just a fidelity choice — it shapes what
reviewers focus on. Ask up-front (1-2 questions max):

```
Q: How should this flow look?
- Wireframe (gray boxes + labels, focus on structure and copy)
- Polished (close to final visual, focus on aesthetic feel)

Q: Which viewport leads?
- Mobile-first
- Desktop-first
- Both equally
```

**Defaults with conviction:**
- Default to wireframe when `tokens.css` doesn't exist yet — gray boxes
  force the conversation toward flow structure, which is what's at stake
  before a design system lands.
- Default to polished when `tokens.css` is present — the visual tone is
  already decided, so showing it in context earns faster sign-off.

State the default in the question and let the user override if they have a
specific reason.

### Phase 4: Generate each step page

For each step, write a standalone HTML file at
`.mockups/flows/<flow-name>/NN-<slug>.html` (zero-padded to 2 digits).

Use the file scaffold and the `.flow-meta` sticky header pattern from
`ux-ui-principles/references/shared-chrome-css.md`. Each page carries the
sticky chrome (prev link / step indicator / next link) plus a `<main>`
with the step's content.

```html
<header class="flow-meta">
  <a href="NN-prev-slug.html">← prev</a>
  <span class="center">{flow-name} · step N/M · {slug}</span>
  <a href="NN-next-slug.html">next →</a>
</header>
<main>
  <!-- step content -->
</main>
```

First step: prev link points to `index.html` ("← overview").
Last step: next link points to `index.html` ("done ↗").

**Cross-step consistency** is the craft demand of this skill:
- Same color tokens, same fonts, same component shapes across all pages
- Reusable form fields look the same on every step that has them
- Buttons, links, and headers stay visually anchored
- The flow-meta chrome (header, progress indicator, step counter) is
  identical from page 1 to page N

Consider including a thin progress indicator in the flow-meta — a step
counter or a visual progress bar showing position. Helps reviewers feel
the journey.

**Token usage check.** Before referencing a `var(--token)`, verify it
exists in `.mockups/design-system/tokens.css`. If a needed token is
missing, inline the literal with a comment or defer to `palette` (see
`ux-ui-principles/references/shared-chrome-css.md`).

**Consistency validation before Phase 5.** After generating all step
files, scan them: every `--color-*`, `--font-*`, `--space-*` reference
should resolve to `tokens.css`. Buttons and form fields should use the
same class names across steps. If a step drifted (different button
radius, mismatched form field, off-token color), regenerate that step
before writing the index.

### Phase 5: Generate the index navigator

Write `.mockups/flows/<flow-name>/index.html` using the light overview
pattern in `ux-ui-principles/references/shared-chrome-css.md`. Step cards
with iframe previews; a "start the flow" ribbon at the top; clear visual
hierarchy showing the journey shape.

The index is the actual review artifact. Reviewers scan the overview to
see the journey shape, then click into step 1 and walk through.

### Phase 6: Open and walk through

Open the index:

```bash
xdg-open .mockups/flows/<flow-name>/index.html 2>/dev/null & \
  || open .mockups/flows/<flow-name>/index.html 2>/dev/null \
  || start "" .mockups/flows/<flow-name>/index.html 2>/dev/null \
  || echo "file://$(pwd)/.mockups/flows/<flow-name>/index.html"
```

Ask the user to walk through and give feedback via `AskUserQuestion`:

```
Q: How does the journey feel?
- Ship it — sign off on this flow
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
- `git add .mockups/flows/<flow-name>/`.
- Tell the user the flow is locked in.

**Tweak steps:**
- Ask which steps. Regenerate just those files. Run the consistency
  check from Phase 4 again. Re-open.

**Restructure:**
- Run Phase 2 again with the new outline.
- **Renumber by cascade, not by alpha-suffix.** When inserting a step
  between 02 and 03, the new step becomes 03, the old 03 becomes 04,
  and so on. Never write `02a-...html`. Delete the old-numbered files
  after writing the new ones in a single batch, then update every
  page's prev/next links so the chain is whole.
- Regenerate the index.

**Redesign:**
- Wireframe ↔ polished is a fundamental visual shift, not a tweak.
  Regenerate all steps with the new treatment and keep the flow
  structure intact. The structural decisions from Phase 2 still hold;
  only the visual tone is changing, so the second pass should be fast.

**Stop condition:** "ship it" or equivalent. Three rounds without
convergence → flag that scope or flow structure may be unclear.

### Phase 8: Cross-reference with screens (optional)

If individual steps in this flow already have chosen designs in
`screens/` (e.g. `.mockups/screens/login/option-2.html` was the picked
login design), the flow step re-renders that direction in the flow's
visual tone (wireframe or polished) AND includes a provenance comment:

```html
<!--
  This step is the chosen direction from .mockups/screens/login/option-2.html
  (signed off 2026-05-10). Re-rendered here in the flow's wireframe tone for
  journey-level review.
-->
```

Don't iframe-embed the screen mock directly — that breaks visual
consistency across the flow. Re-render in the flow's tone with the
provenance comment.

## Splitting flows longer than 7 steps

When the natural step count exceeds 7, split into composing flows linked
at a handoff step. Example: a 9-step signup splits into:

- `signup-basics` (5 steps: landing → email → password → verify → success-1)
- `signup-onboarding` (4 steps: welcome → profile → preferences → first-action)

Step 05 of `signup-basics` links to step 01 of `signup-onboarding`. The
substrate item's `## Mockups` section lists both flow paths and the
handoff between them.

## Anti-patterns

- **Happy path first.** Branches as separate flows or as explicitly
  requested additional pages — don't mock every error case by default.
- **Cross-step visual consistency is the craft demand.** Keep color
  tokens, button shapes, and field styles identical across steps.
  Journey-level review works because reviewers can focus on the flow's
  structure instead of decoding visual variation between pages. A
  consistent flow makes the journey legible at a glance.
- **Always write the prev/next chrome.** Reviewers step through quickly;
  navigation is non-negotiable. The chrome is what makes the flow feel
  like a flow.
- **Fewer than 3 steps → use `screens`.** A "flow" with one screen is
  just a screen. Redirect.
- **More than 7 steps → split.** Composing flows linked at a handoff
  step are easier to review than one giant flow.
- **Vanilla CSS only — no CSS framework CDNs and no JS frameworks.**
  `ux-ui-principles` tech rule applies. Hosted fonts via CDN are fine.
- **Three rounds is the soft cap on iteration.** Looping a fourth time
  rarely lands the design.
