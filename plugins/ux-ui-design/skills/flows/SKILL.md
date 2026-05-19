---
name: flows
description: >
  ALWAYS invoke this skill when the user asks to mock, design, wireframe, or explore
  a multi-screen journey — signup, checkout, onboarding, recovery, multi-step forms,
  wizards, settings, dashboards, account areas — do not start writing production
  flow code inline. Generates a multi-page user-flow mockup as a set of single-file
  HTML pages in .mockups/flows/<flow-name>/ with chrome matched to the flow's
  topology: sequential (prev/next), hub-and-spoke (persistent nav between peer
  pages), or hybrid (sequence + cross-jumps). Renders BOTH navigation patterns
  when both fit; renders the one that fits when only one does. Always includes
  an index.html navigator that visualizes the topology. Triggers on "mock the
  signup flow", "design the checkout journey", "flow mockup for onboarding",
  "multi-page wireframe for X", "design the settings area", "navigate between
  these pages", "design the dashboard pages". Defers to ux-ui-principles for
  storage, tech, and linking conventions.
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

`flows` produces ONE design across **multiple** screens — user walks
through them. The screens may be sequential (a wizard), peers (a settings
area), or a sequence with cross-jumps (a checkout). Phase 2.5 picks the
topology.

If the user is unclear which they want, ask. Common confusion: "mock the
signup" could mean either. "Give me 4 options for the signup form" →
`screens`. "Walk me through the signup flow" → `flows`.

If the user asks for a flow with only 1-2 pages, redirect to `screens`
instead — a flow needs multiple connected pages to mean anything.

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
them exhale? Or, for hub-and-spoke flows: what brings them into this area,
which page is the natural entry, where do they go from there?

Translate that into a page list (for hub-and-spoke) or step sequence (for
sequential / hybrid) and confirm via `AskUserQuestion`:

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

### Phase 2.5: Determine the flow's topology

The chrome on each page should match how users actually move through the
flow. Five topologies, five chromes:

| Topology | Chrome | When it fits |
|---|---|---|
| **Sequential** | prev/next strip (`.flow-meta`) | Each step is a hard gate. Users move strictly forward; back means "abandon and restart." Examples: signup wizard, password reset, multi-step form, onboarding wizard. |
| **Hub-and-spoke** | persistent nav bar (`.flow-nav`) | Pages are peers; no order. The "flow" is the set of pages that comprise an area. Examples: settings, account, dashboard tabs, admin panels. |
| **Hybrid** | sequence + cross-jump breadcrumb (`.flow-hybrid`) | Primary sequence AND legitimate cross-jumps to revisit earlier steps. Examples: checkout (cart → shipping → payment → review, with "edit cart" from later steps), multi-stage approval flows, complex onboarding with optional revisits. |
| **Map-as-canvas** | floating context strip + on-canvas popovers (`.flow-map`) | The canvas IS the application — a map, a 3D scene, a graph view. Pages are *modes* over the canvas (planning / editing / inspecting) and panels float as popovers on top. Examples: route-planning, logistics dashboards, real-estate browsing, urban planning, hiking tools, field-service apps (lineage: Death Stranding's map-as-hero). |
| **Chat-as-canvas** | persistent composer + thread scroll (`.flow-chat`) | The thread IS the application. Rich blocks — cards, forms, choice-chips — render *inside* chat bubbles; the conversation is the surface. Examples: AI assistants, support chat with rich cards, bot-driven workflows, conversational forms (lineage: Slack Block Kit / Discord / ChatGPT). |

**Decision rule.** When both sequential and cross-nav fit the journey,
render **both** via the hybrid chrome. When only one fits, render that
one. Don't shoehorn — if a settings page wouldn't naturally have a "next"
button, don't add one to satisfy a default.

**Default heuristics by flow shape:**
- Wizard-shaped names (`signup`, `onboarding`, `recovery`, `checkout-payment`)
  → propose **sequential**
- Area-shaped names (`settings`, `account`, `dashboard`, `admin`, `profile`)
  → propose **hub-and-spoke**
- Process-shaped names (`checkout`, `application`, `appointment-booking`)
  → propose **hybrid**
- Spatial / geographic names (`route-planning`, `delivery`, `field-service`,
  `map`, `terrain`, `properties`) → propose **map-as-canvas**
- Conversational / assistant names (`chat`, `assistant`, `support`, `bot`,
  `agent`, `inquiry-flow`) → propose **chat-as-canvas**

Confirm with the user via `AskUserQuestion`:

```
Q: How do users move between these pages?
- Sequential — strictly forward, each step gates the next (wizard / form)
- Hub-and-spoke — peer pages with shared nav, any order (settings / dashboard)
- Hybrid — primary sequence with cross-jumps back to earlier steps (checkout)
- Map-as-canvas — the map/canvas IS the surface; pages are modes (planning / editing / inspecting)
- Chat-as-canvas — the thread IS the surface; pages are inline blocks inside bubbles
```

Frame the default in the question text: "This looks like a wizard, so
sequential is the default — override if some steps should be revisitable."

**What to capture per topology:**

For **sequential**: page order is the chrome. Each page links prev/next
via the `.flow-meta` strip.

For **hub-and-spoke**: there's no "next page." Every page links to every
other page via the `.flow-nav` strip. Pick the **entry page** (where
users land first); the index.html "enter the area" ribbon points there.
Group pages into sub-sections only if the flow has clear clusters
(e.g., "Account settings" / "Workspace settings" / "Billing").

For **hybrid**: capture the primary sequence AND each cross-jump. A
cross-jump is a link from a later step BACK to an earlier step
(e.g., from "Payment" back to "Cart" via "edit cart"). Record per page:
which earlier pages can be jumped to from here. The `.flow-hybrid`
breadcrumb makes all steps clickable; the cross-jumps are the realistic
"edit X" links inside the page content.

For **map-as-canvas**: capture the *modes* (planning / editing /
inspecting / executing) and what each mode adds or removes from the
canvas. The "pages" are mode states — `01-overview.html`,
`02-planning.html`, `03-executing.html` — all showing the same canvas with
different popover panels, different cursors, different on-canvas controls.
Pick the **default mode** (the one users land in); the canvas chrome
shows the mode switcher prominently.

For **chat-as-canvas**: capture the *conversation arc* — the trigger
phrase or initiation, the canonical bot/user message sequence, the
inline-block types the bot uses (rich card, choice-chip rail, inline form,
streaming-token reveal), and the resolution. The "pages" are message
states — `01-greeting.html`, `02-task-clarification.html`,
`03-results-card.html`, `04-followup.html`. Each shows the full thread
ending at that message; the user reads top-down.

See `references/topology-guide.md` for the full decision tree, edge
cases, and worked examples per topology.

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

### Phase 4: Generate each page

For each page, write a standalone HTML file at
`.mockups/flows/<flow-name>/NN-<slug>.html` (zero-padded to 2 digits).
Numbering: for sequential and hybrid flows, the number reflects the
primary sequence; for hub-and-spoke, the number just keeps files sorted
in a stable order (entry page first).

If `.mockups/design-system/components.css` exists, link both stylesheets
in the `<head>` and prefer component classes (`.btn`, `.input`,
`.nav-bar`) over inline styles. Layout-only CSS still goes inline.

**Use the chrome that matches the topology** (Phase 2.5):

#### Sequential — `.flow-meta` chrome

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

#### Hub-and-spoke — `.flow-nav` chrome

```html
<header class="flow-nav">
  <span class="flow-nav__title">{flow-name}</span>
  <nav>
    <a href="01-dashboard.html" class="flow-nav__link">Dashboard</a>
    <a href="02-account.html" class="flow-nav__link flow-nav__link--active">Account</a>
    <a href="03-billing.html" class="flow-nav__link">Billing</a>
  </nav>
  <a href="index.html" class="flow-nav__overview">overview ↗</a>
</header>
<main>
  <!-- page content -->
</main>
```

The nav is **identical on every page** except for which link has
`--active`. If `components.css` defines a `.nav-bar` component, use that
instead of `.flow-nav`:

```html
<nav class="nav-bar nav-bar--top">
  <a href="#" class="nav-bar__brand">{flow-name}</a>
  <a href="01-dashboard.html" class="nav-bar__item">Dashboard</a>
  <a href="02-account.html" class="nav-bar__item nav-bar__item--active">Account</a>
  <a href="03-billing.html" class="nav-bar__item">Billing</a>
  <a href="index.html" class="nav-bar__overview">overview ↗</a>
</nav>
```

Page content should include realistic in-page links to other pages
wherever a real user would have them (e.g., a "view billing details"
link on the account page that goes to `03-billing.html`). Don't fake
isolation — peer pages cross-link freely.

#### Map-as-canvas — `.flow-map` chrome + on-canvas popovers

```html
<header class="flow-map">
  <span class="flow-map__title">{flow-name}</span>
  <nav class="flow-map__modes">
    <a href="01-overview.html" class="flow-map__mode">Overview</a>
    <a href="02-planning.html" class="flow-map__mode flow-map__mode--active">Planning</a>
    <a href="03-executing.html" class="flow-map__mode">Executing</a>
  </nav>
  <a href="index.html" class="flow-map__overview">overview ↗</a>
</header>
<main class="map-canvas">
  <!-- The map/scene/graph fills the viewport -->
  <div class="canvas-fill"><!-- placeholder map SVG / image / canvas --></div>
  <!-- Floating popover panels with the current mode's content -->
  <aside class="popover popover--top-left">{mode-specific panel}</aside>
  <aside class="popover popover--bottom-right">{tools / actions}</aside>
</main>
```

The map fills the viewport. The chrome is *minimal* (mode switcher + brand)
and the mode-specific UI floats on top as popover panels. Planning panels
sit one corner; tool palettes sit another; selection details appear as
small popovers near the selected on-canvas element.

For mocks, the canvas can be a static SVG / image placeholder; the *modes*
demonstrate by swapping the popover panel content. Lineage: Death Stranding's
map-as-hero where planning the route IS the gameplay; Google Maps' modes;
Figma's tool modes; Mapbox planning UIs.

#### Chat-as-canvas — `.flow-chat` chrome + thread

```html
<header class="flow-chat">
  <span class="flow-chat__title">{flow-name}</span>
  <a href="index.html" class="flow-chat__overview">overview ↗</a>
</header>
<main class="chat-thread">
  <!-- Each chat bubble; alternates user / bot -->
  <div class="msg msg--bot">
    <p>Hi — I can help with X. What are you trying to do today?</p>
  </div>
  <div class="msg msg--user">
    <p>I want to book a meeting with Jordan next Tuesday.</p>
  </div>
  <!-- A bot message can carry a rich block — card, choice-chips, inline form -->
  <div class="msg msg--bot">
    <p>Here are Jordan's free slots Tuesday:</p>
    <div class="rich-block choice-chips">
      <button class="choice-chip">10:00 AM</button>
      <button class="choice-chip">2:30 PM</button>
      <button class="choice-chip">4:00 PM</button>
    </div>
  </div>
</main>
<footer class="composer">
  <input type="text" class="input" placeholder="Type a message…">
  <button class="btn btn-primary">Send</button>
</footer>
```

The thread scrolls. The composer is sticky at the bottom. Rich blocks
(cards, choice-chips, inline forms, streaming-token reveals) appear *inside*
bot bubbles — composition shifts from page-as-canvas to message-as-canvas.

Each mock step shows the thread *up to that message* — reviewers scroll to
read the conversation arc top-down. The flow's index visualizes the message
sequence as a vertical timeline.

#### Hybrid — `.flow-hybrid` chrome + in-page cross-jumps

```html
<header class="flow-hybrid">
  <a href="NN-prev-slug.html" class="flow-hybrid__prev">← prev</a>
  <nav class="flow-hybrid__crumbs">
    <a href="01-cart.html">1 Cart</a>
    <a href="02-shipping.html">2 Shipping</a>
    <a href="03-payment.html" aria-current="step" class="flow-hybrid__current">3 Payment</a>
    <a href="04-review.html" class="flow-hybrid__future">4 Review</a>
  </nav>
  <a href="NN-next-slug.html" class="flow-hybrid__next">next →</a>
</header>
<main>
  <!-- page content, including realistic in-page "edit X" links
       to earlier steps (e.g., an "edit cart" link on payment) -->
</main>
```

The breadcrumb chrome handles abstract navigation. The **in-page
cross-jump links** are the realistic ones: an "edit cart" link inside
the payment summary, an "edit shipping" link in the review section.
Both must work — reviewers click through to verify the round-trip.

**Cross-page consistency** is the craft demand of this skill:
- Same color tokens, same fonts, same component shapes across all pages
- Reusable form fields look the same on every page that has them
- Buttons, links, and headers stay visually anchored
- The chrome (flow-meta / flow-nav / flow-hybrid) is identical across
  every page except for the per-page state (active nav link, current
  step, prev/next targets)

If `components.css` exists, this is mostly automatic — every page uses
the same component classes. Without it, you have to enforce consistency
by hand.

For **sequential** flows, consider including a thin progress indicator
in the flow-meta — a step counter or a visual progress bar showing
position. Helps reviewers feel the journey.

For **hub-and-spoke** flows, consistency means the nav bar is byte-for-
byte identical on every page (only the `--active` class moves). Drift
here is the #1 reason hub-and-spoke flows feel broken.

**Token usage check.** Before referencing a `var(--token)`, verify it
exists in `.mockups/design-system/tokens.css`. If a needed token is
missing, inline the literal with a comment or defer to `palette` (see
`ux-ui-principles/references/shared-chrome-css.md`).

**Consistency validation before Phase 5.** After generating all page
files, scan them: every `--color-*`, `--font-*`, `--space-*` reference
should resolve to `tokens.css`. Buttons and form fields should use the
same class names across pages. If a page drifted (different button
radius, mismatched form field, off-token color), regenerate it before
writing the index. For hub-and-spoke flows, also diff the nav-bar markup
between pages — anything but the `--active` class differing is a bug.

### Phase 5: Generate the index navigator

Write `.mockups/flows/<flow-name>/index.html` using the topology-matched
overview pattern in `ux-ui-principles/references/shared-chrome-css.md`:

- **Sequential** → linear numbered card sequence (default pattern)
- **Hub-and-spoke** → peer grid, optionally grouped into sub-sections;
  "enter the area" ribbon points at the entry page
- **Hybrid** → numbered sequence with cross-jump chips on cards that
  have non-adjacent links from elsewhere in the flow

The index is the actual review artifact. Reviewers scan the overview to
see the journey shape — and the topology should be obvious at a glance:
a numbered sequence reads as "follow these steps," a peer grid reads as
"these are the pages in this area," a sequence with cross-jump chips
reads as "primary path plus revisit options."

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
- Run Phase 2 (and 2.5 if the topology should change) again with the
  new outline.
- **Renumber by cascade, not by alpha-suffix.** When inserting a page
  between 02 and 03, the new page becomes 03, the old 03 becomes 04,
  and so on. Never write `02a-...html`. Delete the old-numbered files
  after writing the new ones in a single batch, then update every
  page's chrome (prev/next links for sequential/hybrid; nav-bar items
  for hub-and-spoke) so the chain is whole.
- Regenerate the index.

**Re-topologize:**
- When the chosen topology turns out wrong (sequential should have been
  hybrid; hub-and-spoke should have been sequential), re-run Phase 2.5,
  regenerate every page's chrome, regenerate the index. Page bodies stay
  intact; only the chrome and the index change. This is a fast pass.

**Redesign:**
- Wireframe ↔ polished is a fundamental visual shift, not a tweak.
  Regenerate all pages with the new treatment and keep the flow
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
- **Match the chrome to the topology.** A settings area with a forced
  "next →" button feels wrong because settings aren't a sequence. A
  signup wizard with a peer nav bar feels wrong because the user
  shouldn't jump to "verify" before "email." A logistics dashboard with
  a step-by-step wizard chrome wastes the spatial intelligence that
  map-as-canvas is the answer for. A conversational assistant forced into
  hub-and-spoke loses the thread-as-application property that chat-as-canvas
  earns. Pick the topology in Phase 2.5 deliberately; the chrome falls
  out of that choice.
- **When both navigation patterns fit, render both.** Hybrid chrome
  exists exactly for this case. Sequential strip + cross-jump
  breadcrumb together is more informative than either alone for
  checkout-style flows.
- **Cross-page visual consistency is the craft demand.** Keep color
  tokens, button shapes, and field styles identical across pages. If
  `components.css` exists, lean on it — it makes consistency automatic.
  Drift between pages makes the flow read as four separate screens
  instead of one journey.
- **Hub-and-spoke chrome must be byte-identical across pages.** Only
  the `--active` class moves. Anything else differing — different link
  order, different brand text, different layout — breaks the "shared
  nav" illusion and reads as a bug.
- **Always write the chrome on every page.** Reviewers step through
  quickly; navigation is non-negotiable. The chrome (whichever variant)
  is what makes the flow feel like a flow instead of disconnected pages.
- **Fewer than 3 pages → use `screens`.** A "flow" with one screen is
  just a screen. Redirect.
- **More than 7 pages → split (sequential / hybrid) or sub-section
  (hub-and-spoke).** Composing flows linked at a handoff page are
  easier to review than one giant flow. Hub-and-spoke flows with many
  peers can use the sub-section grouping in the index instead of
  splitting.
- **Vanilla CSS only — no CSS framework CDNs and no JS frameworks.**
  `ux-ui-principles` tech rule applies. Hosted fonts via CDN are fine.
- **Three rounds is the soft cap on iteration.** Looping a fourth time
  rarely lands the design.

## Reference files

- `references/topology-guide.md` — full decision tree for picking
  sequential / hub-and-spoke / hybrid, edge cases, worked examples
  per topology
