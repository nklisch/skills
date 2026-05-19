# UX laws — the formal-theory layer

The non-optional subset of UX research findings the design pipeline should respect.
Each entry: what it says (tightly), where it comes from, what a mockup should *do*
with it, which skill it most affects. Pop-UX inaccuracies (most notoriously Miller's
Law) get corrected inline — the goal is to inoculate the agent against propagated
misreadings, not to spread them.

This file auto-loads with `ux-ui-principles`, so every design pass has access.

---

## The 12 non-optional laws

### Hick's Law

**What it says:** Decision time grows logarithmically with the number of equally
probable choices: `RT = a + b * log2(n + 1)`. The cost is in the *choice*, not the
count alone — grouped, chunked, pre-attentively filterable options collapse the
effective `n`.

**Source:** Hick (1952), "On the rate of gain of information"; Hyman (1953) replication.

**Pop-UX correction:** Hick does NOT mean "fewer items always faster." A flat 12-item
list often beats a nested 3-deep tree because the user scans once vs. drills down
three times.

**Mockup-time check:** For menus / toolbars / settings with >7 leaf options, group
into 2-4 visible categories or use progressive disclosure (overflow menu, command
palette). For primary actions: expose 1 default + 1-2 alternates; bury the rest.

**Affects:** screens (menus, toolbars), components (settings UIs), flows (multi-choice
gates).

---

### Fitts's Law

**What it says:** Time to acquire a target = `a + b * log2(D/W + 1)`, where D is
distance to target and W is target width along the motion axis. Screen edges and
corners are infinitely tall/wide ("Fitts's infinite edge") because the mouse can't
overshoot them — which is why macOS menu bars sit at y=0.

**Source:** Fitts (1954), "The information capacity of the human motor system."

**Mockup-time check:** Primary actions need ≥44×44 CSS px (iOS HIG) or ≥48dp
(Material). Cluster related controls. Place destructive actions far from defaults.
Dock frequent actions to a screen edge. Hit areas can exceed visible bounds (a 24px
icon button should have ~44px tappable area — see "Bubble cursors" below).

**Affects:** components (button sizing, toolbars), screens (mobile touch targets),
motion (Doherty coupling on activation feedback).

---

### Miller's Law (corrected to Cowan)

**What it says:** Miller (1956) observed that absolute-judgment tasks and immediate
memory span clustered around 7±2 "chunks." He explicitly framed "7" as a rhetorical
coincidence, NOT a working-memory capacity claim. Modern work (Cowan, 2001) puts
true working-memory capacity at ~4±1 chunks.

**Source:** Miller (1956), "The Magical Number Seven." Correction: Cowan (2001),
"The magical number 4 in short-term memory."

**Pop-UX correction (loud):** The rule "menus should have 7±2 items" misattributes
the finding entirely. Miller never said that. Design to **chunking**, not to a magic
number. Group related items; give each chunk a clear label; keep simultaneously-
visible-and-meaningful groupings to ~4.

**Mockup-time check:** Comparison tables: ≤4 columns side-by-side beats 7. Form
sections: 3-5 fields per logical group, not 8. Decision splash with options: 3-4
beats 7. The Iyengar jam study below sharpens this for purchase / decision contexts.

**Affects:** screens (forms, nav, tables, dashboards), flows (multi-step wizards).

---

### Jakob's Law

**What it says:** Users spend most of their time on *other* sites, so they expect
yours to work like the ones they already know. Deviating from convention without
payoff costs more learning than the novelty earns.

**Source:** Jakob Nielsen, Nielsen Norman Group (codified in 2000s NN/g writing).

**Mockup-time check:** Logo top-left links home. Cart top-right. Search has a
magnifying-glass affordance. Hamburger means mobile nav. Underlined text is a link.
**Innovate on substance** (the offering, the data, the model); **conform on chrome**
(where things live, how they're labeled). When inventing a novel control, give it a
familiar fallback path.

**Affects:** screens (layout, naming, iconography), flows (path conventions).

---

### Tesler's Law (Conservation of Complexity)

**What it says:** Every application has irreducible inherent complexity. Complexity
can be relocated between system and user, but not eliminated. Hide it in the system
and the system gets harder to build; expose it and the user pays. Larry Tesler
formulated this c. 1984 at Xerox PARC / Apple.

**Source:** Tesler, ~1984; sometimes called "Waterbed Theory" — push it down here,
it pops up there.

**Mockup-time check:** For each "simple" surface, name where the complexity went.
Sane defaults + an "Advanced" affordance is a budget allocation, not a simplification.
When the mockup feels suspiciously clean, find the hidden hard problem (units, time
zones, currencies, error states, permissions) and decide explicitly who solves it.

**Affects:** screens (forms, settings, configuration), flows (defaults, advanced
modes).

---

### Doherty Threshold

**What it says:** When system response is under ~400ms, productivity rises sharply
and user engagement compounds. Above ~2s, users disengage. Doherty & Thadani (IBM
Systems Journal, November 1982) found 25-30% more transactions per hour at sub-400ms
vs the then-conventional 2-second response. Returns diminish below ~100ms.

**Source:** Doherty & Thadani, "The Economic Value of Rapid Response Time," IBM
Systems Journal, Nov 1982.

**Mockup-time check:** Every interaction needs a feedback budget.
- ≤100ms: feels instantaneous; use direct state change.
- ≤400ms: feels responsive; use subtle motion (the `motion` skill's
  `--dur-quick` token sits here).
- 400ms-1s: needs explicit feedback (spinner, skeleton).
- &gt;1s: needs progress + cancel.

Mock the loading/skeleton state alongside the loaded state — never just the happy
resting view. The `motion` skill's Doherty-coupled duration scale enforces this: any
animation that gates input must fit in `--dur-quick` (≤300ms).

**Affects:** motion (the primary discipline), components (loading states),
screens (skeleton screens, optimistic UI), flows (transitions).

---

### Peak-End Rule

**What it says:** People judge an experience largely by how they felt at its
emotional peak and at its end, not by the average over its duration. Kahneman's 1993
colonoscopy study: patients rated a longer procedure with a less-painful tail as
better than a shorter, uniformly painful one.

**Source:** Kahneman, Fredrickson, Schreiber, Redelmeier (1993), "When more pain is
preferred to less."

**Mockup-time check:** Invest pixels in the **memorable peak** (the receipt page,
the first save, the "you did it" moment) and the **closing moment** (thank-you
screen, post-purchase email). Don't waste pixels making the middle of a wizard
pretty; spend them on the confirmation. Conversely: the worst friction in a flow
disproportionately defines the memory — fix the peak *pain*, not the average pain.

**Affects:** flows (onboarding, checkout, error recovery), screens (confirmation,
success, empty states).

---

### Zeigarnik Effect

**What it says:** Unfinished or interrupted tasks are remembered better than
completed ones. Bluma Zeigarnik (1927) found waiters remembered open orders, forgot
closed ones.

**Source:** Zeigarnik (1927).

**Mockup-time check:** Show open loops — "Resume where you left off," "3 of 5
sections complete," draft auto-save indicators. Reward closing the loop with clear
"done" states. But: **don't manufacture phantom incomplete tasks** ("complete your
profile!") that aren't real — that's a dark pattern, and Tristan Harris / CHT counter-
designs explicitly call it out.

**Affects:** flows (resumption, drafts, multi-session work), screens (dashboards,
todo states).

---

### Aesthetic-Usability Effect + Lindgaard's 50ms judgment

**What it says:** Users perceive aesthetically pleasing designs as more usable, and
forgive minor usability problems in beautiful UIs. Lindgaard et al. (2006): participants
formed stable aesthetic judgments of web pages from **50ms exposures**, correlating
tightly with 500ms judgments.

**Source:** Tractinsky, Katz, Ikar (2000); Lindgaard et al. (2006), "Attention web
designers: You have 50 milliseconds to make a good first impression!" *Behaviour &
Information Technology* 25:2, 115-126.

**Pop-UX correction:** The effect grants forgiveness for *minor* friction, not for
broken flows. Beautiful broken is still broken.

**Mockup-time check:** First-render visual quality is high-leverage. Type,
whitespace, and color get judged before the user reads a word. Spend on the
above-the-fold hero / first-render experience. The `palette` skill's typographic-color
check and contrast-check phases protect this.

**Affects:** palette (first-impression quality), screens (above-the-fold composition).

---

### Norman's Gulfs (Execution + Evaluation)

**What it says:** Two gaps the user must cross.
- **Gulf of execution** — distance between what the user wants and what the system
  permits. Closed by clear signifiers, mappings, constraints.
- **Gulf of evaluation** — distance between what the system is doing and what the
  user can perceive/interpret. Closed by feedback, visibility, a clear conceptual
  model.

**Source:** Norman, *The Design of Everyday Things* (1988, revised 2013).

**Mockup-time check:** For each action in the mockup, ask:
1. Can the user see what's possible? (close execution gulf)
2. Can the user see what just happened? (close evaluation gulf)

Each interactive element needs an **affordance** (it looks actionable) and a
**result** (it gave feedback). Mock the "after" state, not just the "before."

**Affects:** components (interactive states + signifiers), flows (feedback loops,
action results).

---

### Affordances vs Signifiers (Gibson + Norman)

**What it says:** Gibson (1977) coined "affordance" as the inherent action
possibilities of an object in an environment, relative to the perceiver. Norman
distinguished *real* affordances (a button can be pressed) from *perceived*
affordances and later renamed the latter **signifiers** — the visual cues that
communicate the affordance (shadow under a button, underline under a link). The
signifier is what the design *controls*.

**Source:** Gibson (1977, 1979); Norman (1988, 2008 clarification).

**Pop-UX correction:** Flat design's biggest sin is signifier-stripping. A button
that looks identical to text is a bug. If using a flat aesthetic, lean harder on
color, weight, and motion to signal interactivity.

**Mockup-time check:** Every interactive element needs a signifier — shadow,
underline, hover state, cursor change. Audit each interactive element in the
mockup: would a first-time user know it's clickable?

**Affects:** components (interactive affordances), palette (interactive color
contrast), motion (hover/press state changes are signifiers too).

---

### Calm Technology — 8 principles (Weiser + Case)

**What it says:** Mark Weiser & John Seely Brown's 1995 paper "Designing Calm
Technology" (Xerox PARC) proposed an alternative to attention-demanding software.
Amber Case (2015) formalized 8 principles:

1. Technology should require the smallest possible amount of attention.
2. Technology should inform and create calm.
3. Technology should make use of the periphery.
4. Technology should amplify the best of technology and the best of humanity.
5. Technology can communicate, but doesn't need to speak.
6. Technology should work even when it fails.
7. The right amount of technology is the minimum needed to solve the problem.
8. Technology should respect social norms.

**Source:** Weiser & Brown (1995); Amber Case, *Calm Technology* (O'Reilly, 2015).

**Mockup-time check:** Notifications: peripheral by default; central only when
actionable. Ambient state (subtle color, a corner glyph) beats modal popups. Sound:
rarely. Default failure state: useful (cached, offline, degraded), not blank. Audit
every notification / modal / badge / toast — is it informing or interrupting?

**Affects:** screens (notifications, ambient state), components (badges, toasts),
flows (failure paths), motion (`--dur-ambient` for peripheral motion).

---

## The Gestalt set (8 principles)

Perceptual grouping laws from early-20th-century Berlin/Frankfurt psychology
(Wertheimer, Köhler, Koffka). The full set:

- **Proximity** — things close together are seen as grouped.
- **Similarity** — things that look alike are grouped.
- **Continuity** — the eye follows the smoothest path.
- **Closure** — the mind completes incomplete shapes.
- **Figure / Ground** — foreground vs background separation.
- **Common Fate** — things moving together are grouped.
- **Prägnanz (good form)** — the simplest interpretation wins.
- **Focal Point** — a distinct element pulls attention (this is where the
  Von Restorff / isolation effect lives — a single different element is the one
  remembered).

**Source:** Wertheimer (1923), Köhler, Koffka — Gestalt school.

**Mockup-time check (squint test):** Squint at the mockup. What groups visually?
That should match what groups semantically. Spacing is the cheapest grouping tool —
use proximity before borders/cards. Use similarity (same color/size/shape) to imply
"same kind of thing." Use figure/ground in modal overlays (dim the rest). Common
fate: items that animate together feel related (the `motion` skill's named curves
give you a tool for this).

**Affects:** screens, components, palette (spacing system, color groupings, motion
choreography).

---

## Sub-laws worth knowing

These ride along with the 12 + Gestalt; not formally non-optional but useful when the
right situation comes up.

### Goal-Gradient Effect

Motivation to complete a goal increases as one nears the goal. Kivetz et al. (2006):
the "10 stamps to free coffee" card with 2 pre-stamped grace stamps drove faster
completion than a clean 8-stamp card. **Mockup-time check:** show progress as
*proportion done*, not steps-remaining. For onboarding wizards: start the progress
bar at ~15-20%, not 0%.

### Von Restorff / Isolation Effect

When multiple similar items are present, the one that differs is the one remembered.
Hedwig von Restorff (1933). **Mockup-time check:** make the primary action visually
different from secondary actions — different color, different weight, not just
different label. One screen, one hero. If everything is highlighted, nothing is.

### Serial Position Effect (Primacy + Recency)

In a sequence, items at the beginning and end are recalled better than the middle.
Murdock (1962). **Mockup-time check:** in nav, put highest-priority items first
(Home, Products) and last (Account, Cart). For pricing tables, position the
recommended tier first or last, not middle.

### Picture Superiority Effect

Concepts learned with images are remembered far better than concepts learned with
words alone. Standing (1973): people can recognize >10,000 images with high accuracy
after a single viewing. **Mockup-time check:** pair every category/feature/setting
with an icon when space allows. For empty states, illustrate. For error pages, show
the visual. **But:** icons without labels are recall-only — pair icons with text
unless the icon is universal (search, cart, hamburger).

### Choice Overload (Iyengar jam study)

Too many choices can reduce decision-making and satisfaction. Iyengar & Lepper
(2000): jam-tasting booths with 24 jars attracted 60% of passersby but only 3%
purchased; 6-jar booth attracted 40% and 30% purchased — roughly 10× conversion.

**Pop-UX correction:** Scheibehenne et al. (2010) meta-analysis finds the effect is
*moderated*, not universal — it depends on preference clarity and decision difficulty.

**Mockup-time check:** default to a curated handful (3-7) of choices with an "show
all" escape. Recommend a default. For pricing tiers: 3 with a "recommended" marker.

### Postel's Law (Robustness Principle)

"Be conservative in what you do, be liberal in what you accept." Originally TCP
design (RFC 761, 1980). **Pop-UX correction:** Sassaman et al. argue
over-permissive *parsers* cause security issues — the rule is sharper for UI surface
than for protocol. **Mockup-time check:** phone/date/email inputs accept multiple
formats; canonical output is one format. Validate strictly at trust boundaries.

### Three levels of design (Norman)

**Visceral** (looks/feels gut-level) — **Behavioral** (in-use experience) —
**Reflective** (post-hoc story). All three matter, but they pull in different
directions. **Mockup-time check:** mock all three layers. Visceral: first-impression
palette and type. Behavioral: actually-usable flows. Reflective: what the user says
about the product at a dinner party. A product beautiful but tedious loses; usable
but soulless loses on the reflective level.

### 10 Aesthetics of Joy (Ingrid Fetell Lee)

Energy, Abundance, Freedom, Harmony, Play, Surprise, Transcendence, Magic,
Celebration, Renewal. Picked deliberately at palette time as the emotional thesis;
shapes motion and form choices downstream.

**Source:** Fetell Lee, *Joyful* (Little, Brown Spark, 2018).

---

## Sources (verification trail)

- Doherty & Thadani, *IBM Systems Journal*, Nov 1982
- Miller (1956); Cowan (2001) correction
- Lindgaard et al. (2006), *Behaviour & Information Technology* 25:2
- Iyengar & Lepper (2000), *JPSP*
- Norman, *The Design of Everyday Things* (1988, 2013)
- Norman, *Emotional Design* (2004)
- Weiser & Brown (1995); Case (2015), *Calm Technology*
- Tesler (~1984) — see nomodes.com/larry-tesler-consulting/complexity-law
- Fitts (1954); Hick (1952); Hyman (1953)
- Wertheimer (1923) — Gestalt school
- Fetell Lee, *Joyful* (2018)
- Kahneman, Fredrickson, Schreiber, Redelmeier (1993)
- Kivetz, Urminsky, Zheng (2006), *Journal of Marketing Research*
- Scheibehenne, Greifeneder, Todd (2010) — choice-overload meta-analysis

---

## What this file is NOT

- Not a comprehensive UX-research review. The 12 + sub-laws + Gestalt are operative;
  hundreds of other heuristics exist and are not listed.
- Not a checklist to mechanically apply. Each entry is a lens; applying all twelve
  to every mockup produces noise. Reach for the lens that fits the design question.
- Not unchanging. Refinements (especially pop-UX inoculations as they evolve) should
  be folded into this file as the field updates.
