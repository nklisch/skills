# UX / Information-Design / Typography Foundations for the UI/UX Design Skill Plugin

This document inventories formal theory the palette / components / screens / flows skills can lean on. Each entry gives a tight claim, an anchor, a concrete mockup-time check, and which skill it hooks into. Where pop-UX writing distorts a finding (Miller most notoriously), the entry corrects it.

---

## Territory 1 — UX Laws and Cognitive Principles

### Hick's Law
**What it says:** Decision time grows logarithmically with the number of equally probable choices: `RT = a + b * log2(n + 1)`. The cost is in the *choice*, not the count alone — grouped, pre-attentively filterable options collapse the effective `n`. Pop-UX often miscites Hick to mean "fewer items are always faster," ignoring that hierarchy and chunking change the function.
**Source / anchor work:** Hick (1952) "On the rate of gain of information"; Hyman (1953) replication.
**UI implication — what a mockup should DO with this:** For any menu/toolbar with >7 leaf options, group into 2-4 visible categories or use progressive disclosure (overflow menu, command palette). For primary actions, expose 1 default + 1-2 alternates; bury the rest. Don't equate "minimal" with "good" — a flat 12-item list often beats a nested 3-deep tree.
**Hooks into our skills:** screens, flows, components (menus, toolbars, settings)

### Fitts's Law
**What it says:** Time to acquire a target = `a + b * log2(D/W + 1)`, where D is distance and W is width along the motion axis. Bigger and closer = faster. The screen edges and corners are infinitely tall/wide ("Fitts's infinite edge"), which is why macOS menu bars sit at y=0.
**Source / anchor work:** Fitts (1954) "The information capacity of the human motor system…"
**UI implication — what a mockup should DO with this:** Primary actions: ≥44×44 CSS px (iOS HIG) or ≥48dp (Material). Cluster related controls. Place destructive actions far from defaults. For frequent actions: dock to a screen edge. Don't put critical buttons in the dead center of a 4K display next to small ones — distance and width both matter.
**Hooks into our skills:** components, screens (button sizing, toolbars, nav placement)

### Miller's Law (with correction)
**What it says:** Miller (1956) observed that absolute-judgment tasks and immediate memory span both clustered around 7±2 "chunks." He explicitly framed "7" as a rhetorical coincidence, not a working-memory capacity claim. Modern work (Cowan, 2001) puts true working-memory capacity at ~4±1 chunks. **The pop-UX rule "menus should have 7±2 items" misattributes the finding entirely** — Miller never said that, and the underlying number is closer to 4.
**Source / anchor work:** Miller (1956) "The Magical Number Seven, Plus or Minus Two." Correction: Cowan (2001) "The magical number 4 in short-term memory."
**UI implication — what a mockup should DO with this:** Don't design to "7±2." Design to chunking. Group related items, give each chunk a clear label, keep simultaneously-visible-and-meaningful groupings to ~4. For comparison tables: ≤4 columns side-by-side is far more usable than 7.
**Hooks into our skills:** screens, flows, components (forms, nav, tables, dashboards)

### Jakob's Law
**What it says:** Users spend most of their time on *other* sites, so they expect yours to work like the ones they already know. Deviating from convention without payoff costs more learning than the novelty earns.
**Source / anchor work:** Jakob Nielsen, Nielsen Norman Group (coined formally in 2000s NN/g writing).
**UI implication — what a mockup should DO with this:** Logo top-left links home. Cart top-right. Search has a magnifying-glass affordance. Hamburger means mobile nav. Underlined text is a link. Innovate on substance (the offering, the data, the model), conform on chrome (where things live, how they're labeled). When inventing a novel control, give it a familiar fallback path.
**Hooks into our skills:** screens, flows (layout, naming, iconography)

### Tesler's Law (Conservation of Complexity)
**What it says:** Every application has irreducible inherent complexity. It can be relocated between system and user, but not eliminated. Larry Tesler formulated this around 1984 at Xerox PARC / Apple. Hide complexity in the system and the system gets harder to build; expose it and the user pays.
**Source / anchor work:** Tesler, ~1984; published treatments through 1990s-2000s; sometimes called "Waterbed Theory."
**UI implication — what a mockup should DO with this:** For each "simple" surface, name where the complexity went. Sane defaults + an "Advanced" affordance is a budget allocation, not a simplification. When the mockup feels suspiciously clean, find the hidden hard problem (units, time zones, currencies, error states, permissions) and decide explicitly who solves it.
**Hooks into our skills:** screens, flows (forms, settings, configuration wizards)

### Postel's Law (Robustness Principle)
**What it says:** "Be conservative in what you do, be liberal in what you accept from others." Originally TCP design (RFC 761, 1980), it transfers to UI: accept many input shapes, emit one canonical output. Modern critique (Sassaman et al.) argues over-permissive *parsers* cause security issues — the rule is sharper for UI surface than for protocol.
**Source / anchor work:** Jon Postel, RFC 761 (1980), RFC 793 (1981).
**UI implication — what a mockup should DO with this:** Phone inputs accept `(555) 123-4567`, `555.123.4567`, `+15551234567`; the rendered/stored value is one format. Dates accept multiple forms with confirmation. Search tolerates typos and partial matches. But: validate strictly at trust boundaries (payments, auth).
**Hooks into our skills:** components (inputs), flows (forms, onboarding)

### Doherty Threshold
**What it says:** When system response is under ~400ms, productivity rises sharply and user engagement compounds. Above ~2s, users disengage. Doherty & Thadani (IBM Systems Journal, November 1982, "The Economic Value of Rapid Response Time") found 25-30% more transactions per hour at sub-400ms vs the then-conventional 2-second response. Returns diminish below ~100ms.
**Source / anchor work:** Doherty & Thadani, IBM Systems Journal, Nov 1982.
**UI implication — what a mockup should DO with this:** Every interaction needs a feedback budget. ≤100ms: feels instantaneous (use direct state change). ≤400ms: feels responsive (use subtle motion). 400ms-1s: needs explicit feedback (spinner, skeleton). >1s: needs progress + cancel. Mock the loading/skeleton state alongside the loaded state — never just the happy resting view.
**Hooks into our skills:** components (button/loading states), screens (skeleton screens, optimistic UI)

### Goal-Gradient Effect
**What it says:** Motivation to complete a goal increases as one nears the goal. Originally Hull (1932) in rats; Kivetz et al. (2006) replicated for humans (coffee-card study: the "10 stamps to free coffee" card with 2 pre-stamped grace stamps drove faster completion than a clean 8-stamp card).
**Source / anchor work:** Hull (1932); Kivetz, Urminsky, Zheng (2006), Journal of Marketing Research.
**UI implication — what a mockup should DO with this:** Show progress as proportion-done, not steps-remaining. For onboarding wizards: start the progress bar at ~15-20%, not 0%. For checkouts: show the steps and where the user is. For profile completion: show 60% complete, not "4 things missing."
**Hooks into our skills:** flows (onboarding, checkout, multi-step forms), components (progress bars)

### Peak-End Rule
**What it says:** People judge an experience largely by how they felt at its emotional peak and at its end, not by the average over its duration. Kahneman's colonoscopy study (1993): patients rated a longer procedure with a less-painful tail as better than a shorter, uniformly painful one.
**Source / anchor work:** Kahneman, Fredrickson, Schreiber, Redelmeier (1993) "When more pain is preferred to less."
**UI implication — what a mockup should DO with this:** Invest in one memorable peak (the receipt page, the first save, the "you did it" moment) and the closing moment (thank-you screen, post-purchase email). Don't waste pixels making the middle of a wizard pretty; spend them on the confirmation. Conversely: the worst friction in a flow disproportionately defines the memory — fix the peak pain, not the average pain.
**Hooks into our skills:** flows (onboarding, checkout, error recovery), screens (confirmation, success, empty states)

### Zeigarnik Effect
**What it says:** Unfinished or interrupted tasks are remembered better than completed ones. Bluma Zeigarnik (1927) found waiters remembered open orders, forgot closed ones.
**Source / anchor work:** Zeigarnik (1927), Studies in the Psychology of Action.
**UI implication — what a mockup should DO with this:** Show open loops: "Resume where you left off," "3 of 5 sections complete," draft auto-save indicators. Reward closing the loop: clear "done" states. But ethically — don't manufacture phantom incomplete tasks ("complete your profile!") that aren't real.
**Hooks into our skills:** flows (resumption, drafts, multi-session work), screens (dashboards, todo states)

### Von Restorff / Isolation Effect
**What it says:** When multiple similar items are present, the one that differs is the one remembered. Hedwig von Restorff (1933).
**Source / anchor work:** von Restorff (1933).
**UI implication — what a mockup should DO with this:** Make the primary action visually different from secondary actions — different color, different weight, not just different label. Avoid a row of equally-weighted buttons. One screen, one hero. If everything is highlighted, nothing is.
**Hooks into our skills:** components (button hierarchy), screens (visual hierarchy), palette (action color)

### Serial Position Effect (Primacy + Recency)
**What it says:** In a sequence, items at the beginning (primacy) and end (recency) are recalled better than the middle. Murdock (1962) U-shaped recall curve.
**Source / anchor work:** Ebbinghaus (1885), Murdock (1962).
**UI implication — what a mockup should DO with this:** In nav: put highest-priority items first (Home, Products) and last (Account, Cart). Bury secondary items in the middle. In lists where order is choosable: order matters for recall. For pricing tables: position the recommended tier at the end (recency) or first (primacy), not in the middle.
**Hooks into our skills:** screens (nav order, pricing tables), components (menu lists)

### Picture Superiority Effect
**What it says:** Concepts learned with images are remembered far better than concepts learned with words alone. Standing (1973): people can recognize >10,000 images with high accuracy after a single viewing.
**Source / anchor work:** Standing (1973); Paivio's dual-coding theory.
**UI implication — what a mockup should DO with this:** Pair every category/feature/setting with an icon when space allows. For empty states, illustrate. For error pages, show the empty-mailbox / broken-link visual. But: icons without labels are recall-only, not recognition — pair icons with text unless the icon is universal (search, cart, hamburger).
**Hooks into our skills:** components (icons, empty states), screens, palette (illustration system)

### Aesthetic-Usability Effect (and Lindgaard's 50ms judgment)
**What it says:** Users perceive aesthetically pleasing designs as more usable, and forgive minor usability problems in beautiful UIs. Lindgaard et al. (2006) "Attention web designers: You have 50 milliseconds to make a good first impression!" (Behaviour & Information Technology, 25:2, 115-126) — participants formed stable aesthetic judgments of web pages from 50ms exposures, correlating tightly with 500ms judgments.
**Source / anchor work:** Tractinsky, Katz, Ikar (2000); Lindgaard et al. (2006).
**UI implication — what a mockup should DO with this:** First-render visual quality is high-leverage. Type, whitespace, and color get judged before the user reads a word. Spend on the above-the-fold hero / first-render experience. But: aesthetic-first does not mean aesthetic-only — the effect grants forgiveness for minor friction, not for broken flows.
**Hooks into our skills:** palette (first-impression quality), screens (above-the-fold composition)

### Pareto Principle (80/20)
**What it says:** Roughly 80% of effects come from 20% of causes. In UI: a small fraction of features drive most usage; a small set of users drive most revenue or content; a small slice of pages drive most traffic. Vilfredo Pareto (1896, land ownership).
**Source / anchor work:** Pareto (1896-1909); popularized by Juran in quality management.
**UI implication — what a mockup should DO with this:** Mock the 20% surface that gets 80% of use, in full fidelity, before the long tail. For a SaaS product: the daily-driver screen first. For e-commerce: the product page. Spend design budget proportional to usage. Don't sweat the admin settings dialog at the same fidelity as the home dashboard.
**Hooks into our skills:** screens, flows (prioritization of mockup effort)

### Parkinson's Law
**What it says:** "Work expands so as to fill the time available for its completion." C. Northcote Parkinson, 1955 Economist essay. Applies to user-facing time inputs and to designer scope.
**Source / anchor work:** Parkinson (1955), The Economist.
**UI implication — what a mockup should DO with this:** Default time/budget inputs to the constrained value, not the maximum. Booking widgets: default to 30 minutes, let users extend. Forms: prefer "quick checkout" over "full account creation." For ourselves: time-box mockup exploration — 4 options in 2 hours beats 12 options in 2 days.
**Hooks into our skills:** screens, flows (form defaults, time pickers, scope)

### Cognitive Load Theory (Sweller)
**What it says:** Working memory bandwidth is finite. Three load types: **intrinsic** (the task's inherent difficulty), **extraneous** (poor presentation), **germane** (effort spent building schemas / learning). Good UI eliminates extraneous load and routes spare bandwidth to germane.
**Source / anchor work:** Sweller (1988, 1994), Educational Psychology Review.
**UI implication — what a mockup should DO with this:** Audit every screen: which load type is each element adding? Decorative animation = extraneous. Inline help that builds the user's mental model = germane. Strip extraneous load before adding any new pattern. For complex domains (finance, medical): expect high intrinsic load — extraneous-load minimum is non-negotiable.
**Hooks into our skills:** screens, components (information density, decoration)

### Choice Overload / Iyengar Jam Study
**What it says:** Too many choices can reduce decision-making and satisfaction. Iyengar & Lepper (2000) "When Choice Is Demotivating": jam tasting booths with 24 jars attracted 60% of passersby but only 3% purchased; the 6-jar booth attracted 40% and 30% purchased — roughly 10x conversion. Note: meta-analyses (Scheibehenne et al. 2010) find the effect is moderated by preference clarity and decision difficulty — it's not universal.
**Source / anchor work:** Iyengar & Lepper (2000), JPSP.
**UI implication — what a mockup should DO with this:** Default to a curated handful (3-7) of choices with an "show all" escape. Recommend a default. For pricing tiers: 3 is the sweet spot, with the middle one marked "recommended." For product grids: filter/sort defaults matter more than total catalog size.
**Hooks into our skills:** screens (pricing tables, product lists, settings), flows (signup options)

### Gulf of Execution and Gulf of Evaluation (Norman)
**What it says:** Two gaps the user must cross. **Gulf of execution**: distance between what the user wants to do and what the system permits — closed by clear signifiers, mappings, and constraints. **Gulf of evaluation**: distance between what the system is doing and what the user can perceive/interpret — closed by feedback, visibility, and a clear conceptual model.
**Source / anchor work:** Norman, *The Design of Everyday Things* (1988, revised 2013).
**UI implication — what a mockup should DO with this:** For each action in your mockup, ask: (1) Can the user see what's possible? (close exec gulf) (2) Can the user see what just happened? (close eval gulf). Each interactive element needs an affordance (it looks actionable) and a result (it gave feedback). Mock the "after" state, not just the "before."
**Hooks into our skills:** components (interactive states), flows (feedback loops, action results)

### Seven Stages of Action (Norman)
**What it says:** Goal → Plan → Specify → Perform → Perceive → Interpret → Compare. Plan/Specify/Perform bridge the execution gulf; Perceive/Interpret/Compare bridge the evaluation gulf. Four design principles fall out: **visibility, conceptual model, mappings, feedback.**
**Source / anchor work:** Norman, *The Design of Everyday Things*.
**UI implication — what a mockup should DO with this:** For any non-trivial interaction, mock seven moments, not one: how the user forms the goal, sees the path, makes the choice, takes the action, sees the result, interprets it, and confirms it matched intent. Common miss: the "Perceive" step — silent success states leave the user uncertain.
**Hooks into our skills:** flows (full interaction arcs), screens (state coverage)

### Gestalt Principles (full set)
**What it says:** Perceptual grouping laws from early-20th-c. Berlin/Frankfurt psychology (Wertheimer, Köhler, Koffka). The set:
- **Proximity** — things close together are seen as grouped.
- **Similarity** — things that look alike are grouped.
- **Continuity** — the eye follows the smoothest path.
- **Closure** — the mind completes incomplete shapes.
- **Figure/Ground** — foreground vs. background separation.
- **Common Fate** — things moving together are grouped.
- **Prägnanz (good form)** — the simplest interpretation wins.
- **Focal Point** — a distinct element pulls attention.
**Source / anchor work:** Wertheimer (1923), Köhler, Koffka — Gestalt school.
**UI implication — what a mockup should DO with this:** Spacing is grouping — use proximity before borders/cards. Use similarity (same color/size/shape) to imply "same kind of thing." Use figure/ground in modal overlays (dim the rest). Common fate: items that animate together feel related. Audit a mockup by squinting — what groups visually should group semantically.
**Hooks into our skills:** screens, components, palette (spacing system, color groupings, motion)

### Bubble / Area Cursors (Fitts extension)
**What it says:** Fitts's law assumes a point cursor. Bubble cursors (Grossman & Balakrishnan, 2005) dynamically resize an invisible activation area around the cursor to the nearest target, effectively enlarging targets without enlarging their visuals. Area cursors trade precision for speed.
**Source / anchor work:** Grossman & Balakrishnan (CHI 2005).
**UI implication — what a mockup should DO with this:** Hit areas can exceed visible bounds. A 24px icon button should have ~44px tappable area. Click handlers extend beyond visible borders. Adjacent controls should not have overlapping hit zones. Sketch invisible hit-rects in your mockup, not just visible chrome.
**Hooks into our skills:** components (button/icon hit areas), screens (mobile touch targets)

### Mental Models vs System Image vs Designer Model
**What it says:** Norman's triad. The **designer model** is what the designer intends. The **system image** is what the UI actually communicates (every pixel, label, animation). The **user model** is what the user infers from the system image. The user never meets the designer — they only meet the image. Mismatches between designer model and user model are bugs in the system image.
**Source / anchor work:** Norman, *The Design of Everyday Things*.
**UI implication — what a mockup should DO with this:** Test mockups by asking someone to describe what each control does, before they touch it. Mismatches are signifier failures, not user failures. Documentation cannot fix a bad system image — it's a band-aid over a broken affordance.
**Hooks into our skills:** screens, components (signifier clarity)

### Affordances and Signifiers (Norman, Gibson)
**What it says:** **Gibson (1977)** coined "affordance" as the inherent action possibilities of an object in an environment, relative to the perceiver. **Norman** distinguished *real* affordances (a button can be pressed) from *perceived* affordances and later renamed the latter **signifiers** (visual cues that communicate the affordance — shadow under a button, underline under a link). The signifier is what the design controls.
**Source / anchor work:** Gibson (1977, 1979); Norman (1988, 2008 clarification).
**UI implication — what a mockup should DO with this:** Every interactive element needs a signifier — shadow, underline, hover state, cursor change. Flat design's biggest sin is signifier-stripping. If you must use a flat aesthetic, lean harder on color, weight, and motion to signal interactivity. A button that looks identical to text is a bug.
**Hooks into our skills:** components (interactive affordances), palette (interactive color contrast)

### Flow State (Csíkszentmihályi)
**What it says:** Optimal experience occurs when challenge and skill are both high and balanced, with clear goals, immediate feedback, and a sense of control. Outside the channel: high challenge + low skill = anxiety; low challenge + high skill = boredom; low both = apathy.
**Source / anchor work:** Csíkszentmihályi, *Flow* (1990).
**UI implication — what a mockup should DO with this:** For tools used in long sessions (editors, IDEs, dashboards): keep feedback immediate, goals visible, friction zero. Progressive disclosure as the user's skill grows — reveal power features over time. For novice surfaces: ramp the challenge gently. Onboarding should produce a quick small win.
**Hooks into our skills:** flows (onboarding, learning curves), screens (long-session tools)

### Three Levels of Design (Norman)
**What it says:** **Visceral** — the immediate gut-level perception (looks, feels). **Behavioral** — the in-use experience (usability, effectiveness). **Reflective** — the post-hoc story the user tells themselves (meaning, identity, brand). All three matter, but they pull in different directions.
**Source / anchor work:** Norman, *Emotional Design* (2004).
**UI implication — what a mockup should DO with this:** Mock all three layers. Visceral: first-impression palette and type. Behavioral: actually usable flows. Reflective: what the user says about your product at a dinner party. A product that's beautiful (visceral) but tedious (behavioral) loses; a product that's usable but soulless loses on the reflective level. Brand voice belongs in the mockup.
**Hooks into our skills:** palette (visceral), screens/components (behavioral), flows (reflective narrative arc)

### Ingrid Fetell Lee — 10 Aesthetics of Joy
**What it says:** From *Joyful* (2018), ten formal aesthetics that reliably evoke joy: **Energy** (vibrant color, light), **Abundance** (variety, lushness, multiplicity), **Freedom** (nature, open space, wildness), **Harmony** (balance, symmetry, flow), **Play** (circles, spheres, bubbly forms), **Surprise** (contrast, whimsy), **Transcendence** (elevation, lightness), **Magic** (invisible forms, illusion), **Celebration** (synchrony, bursting, sparkly), **Renewal** (blossoming, expansion, curves).
**Source / anchor work:** Fetell Lee, *Joyful: The Surprising Power of Ordinary Things to Create Extraordinary Happiness* (Little, Brown Spark, 2018).
**UI implication — what a mockup should DO with this:** For consumer/lifestyle products, pick 1-2 aesthetics deliberately as a palette/motion thesis. A productivity app might pick *harmony* + *renewal* (balanced grids, organic curves). A celebration product picks *energy* + *celebration* (vibrant color, burst motion). Don't pick all 10 — that's noise. Name the aesthetic in the design system.
**Hooks into our skills:** palette (color/form thesis), components (shape/motion vocabulary)

### Calm Technology (Weiser + Case)
**What it says:** Coined by Mark Weiser & John Seely Brown (Xerox PARC, "Designing Calm Technology," 1995). Amber Case (2015) formalized eight principles:
1. Technology should require the smallest possible amount of attention.
2. Technology should inform and create calm.
3. Technology should make use of the periphery.
4. Technology should amplify the best of technology and the best of humanity.
5. Technology can communicate, but doesn't need to speak.
6. Technology should work even when it fails.
7. The right amount of technology is the minimum needed to solve the problem.
**Source / anchor work:** Weiser & Brown (1995); Amber Case, *Calm Technology* (2015).
**UI implication — what a mockup should DO with this:** Notifications: peripheral by default, central only when actionable. Ambient state (subtle color, a corner glyph) beats modal popups. Sound: rarely. Default failure state: useful (cached, offline, degraded), not blank. Audit every notification, modal, badge, and toast — is it informing or interrupting?
**Hooks into our skills:** screens (notifications, ambient state), components (badges, toasts), flows (failure paths)

---

## Territory 2 — Information Design Pioneers and Grids

### Edward Tufte
**What it says:** Maximize the **data-ink ratio**: the proportion of ink devoted to non-redundant data display (= 1 - what could be erased without information loss). Strip **chartjunk** — non-informative decoration ("interior decoration of data"). Use **small multiples** (the same chart repeated across a variable) to enable comparison. Use **sparklines** — word-sized, in-line graphics — to put data in text. Use **layering and separation** (subtle gridlines, etc.). Watch for **lie factor** (size of effect shown / size of effect in data; should be ~1.0).
**Source / anchor work:** *The Visual Display of Quantitative Information* (1983), *Envisioning Information* (1990), *Visual Explanations* (1997), *Beautiful Evidence* (2006).
**UI implication — what a mockup should DO with this:** Dashboards: kill 3D, kill gradients on bars, kill heavy gridlines. Comparison views = small multiples by default, not toggled lines on one chart. Inline metrics next to text = sparklines. Audit any chart by erasing every pixel and asking "did information just disappear?"
**Hooks into our skills:** components (chart kit), screens (dashboards, reports), palette (chart color discipline)

### Jacques Bertin
**What it says:** *Semiology of Graphics* (1967) systematized the visual variables — the primitives from which all 2D information graphics are built. Bertin's original set is **7 retinal variables**: position, size, shape, value (lightness), color (hue), orientation, texture. The "8" framing often adds **motion** (or selection/granularity, depending on the author) — that's a post-Bertin extension. Each variable has different perceptual properties: position is most accurate for quantitative comparison; color hue is best for nominal categories.
**Source / anchor work:** Bertin, *Sémiologie graphique* (1967, English 1983).
**UI implication — what a mockup should DO with this:** When encoding data, pick the variable matched to the data type. Quantitative → position or size. Ordinal → value (lightness ramp). Nominal → color hue or shape. Don't double-encode by accident (color + position telling the same story is fine; color and shape telling *different* stories on the same point is unreadable).
**Hooks into our skills:** components (charts, status indicators), palette (categorical vs sequential vs diverging)

### Otto Neurath + Marie Reidemeister (Isotype)
**What it says:** International System of Typographic Picture Education. Quantitative information encoded as **repeated pictograms** (one figure = one unit), not scaled-up images (which distort area). Modular, language-agnostic, designed for mass literacy in 1920s-30s Vienna. Gerd Arntz designed the actual pictograms.
**Source / anchor work:** Neurath, *International Picture Language* (1936); *Modern Man in the Making* (1939).
**UI implication — what a mockup should DO with this:** For population/count visualizations, repeat unit-icons rather than scaling one icon. For internationalization, prefer pictograms with caption over wordmarks. Use a unified pictogram family — don't mix two icon sets (one outlined, one filled) inside one product.
**Hooks into our skills:** components (icons, infographic charts), screens (data visualization)

### Otl Aicher
**What it says:** Designed the Munich 1972 Olympics pictogram system: ~180 sport pictograms built on an orthogonal+diagonal square grid with a fixed bright color palette. Direct ancestor of DOT (1974) public-signage pictograms — the bathroom-door icons everyone knows. Designed the Rotis typeface (1988), an early bridge between serif, semi-serif, semi-sans, and sans within a single family.
**Source / anchor work:** Munich 1972 Olympic identity; *Typographie* (1988); Rotis.
**UI implication — what a mockup should DO with this:** A pictogram system is a *system*, not a collection. Define the construction grid, line weight, stroke termination, corner radius — apply uniformly. When commissioning or selecting icons, demand systematic construction; reject mixed-metaphor sets. Iconography is design-system tier-1, not an afterthought.
**Hooks into our skills:** components (icon system), palette (pictogram color rules)

### Massimo Vignelli (and Unimark)
**What it says:** Modernist discipline taken to its sharpest edge. Helvetica, Bodoni, Garamond, Century, Times, Futura, Optima — Vignelli famously argued a designer needs only ~6 typefaces. The 1972 NYC subway map (diagrammatic, geometric, not geographic) is a Vignelli/Unimark legacy. *The Vignelli Canon* (free PDF, 2010) codifies the discipline: grids, proportion, restraint, semantics.
**Source / anchor work:** Vignelli, *The Vignelli Canon* (2010, free); Unimark identity work; NYC subway map (1972).
**UI implication — what a mockup should DO with this:** Restrict the type system. Two type families is plenty; one family with weights is often better. Choose a grid and obey it. The product's identity is in the *system*, not in surface decoration. When mocking, ask: would Vignelli let you keep this gradient?
**Hooks into our skills:** palette (type discipline), screens (grid adherence)

### Jan Tschichold
**What it says:** Two ends of one arc. Early Tschichold — *Die neue Typographie* (1928) — argued for asymmetry, sans-serif, functional clarity, the rejection of decoration as a moral position. Later Tschichold (1947 onward) — Penguin Composition Rules and Penguin's classic paperback redesigns — returned to centered symmetry, serif type, and classical proportion when designing for sustained reading. The lesson is that "modernist" and "classical" each have a domain.
**Source / anchor work:** *Die neue Typographie* (1928); Penguin Composition Rules (1947); *The Form of the Book* (1991).
**UI implication — what a mockup should DO with this:** Match the typographic philosophy to the surface. Marketing pages and dashboards can be asymmetric, sans-serif, functional. Long-form reading surfaces (docs, articles, ebook readers) benefit from classical centered measure, serif type, generous leading. Don't apply the same rules to both.
**Hooks into our skills:** palette (type pairing by surface), screens (reading vs scanning surfaces)

### Josef Müller-Brockmann
**What it says:** *Grid Systems in Graphic Design* (1981) is the canonical text. Grids are not constraints; they are a logical framework for proportional relationships. A grid lends credibility and orderliness. Müller-Brockmann's own caveat: "The grid system is an aid, not a guarantee. It permits a number of possible uses and each designer can look for a solution appropriate to his personal style."
**Source / anchor work:** Müller-Brockmann, *Grid Systems in Graphic Design* (1981).
**UI implication — what a mockup should DO with this:** Pick a column system (4, 6, 8, 12 columns) and gutters before any pixel-pushing. Components snap to columns. White space is part of the grid, not leftover. Show the grid in early mocks; hide it in delivery. When something feels off, hide every element and check if the grid is consistent — usually it isn't.
**Hooks into our skills:** screens (layout grid), components (column alignment)

### Paul Rand
**What it says:** Mid-century American graphic design and corporate identity: IBM, ABC, UPS, Westinghouse, NeXT, Enron (yes). *Thoughts on Design* (1947): form and content are inseparable; a logo is a sign, not a sermon — it doesn't have to be literal, it has to be memorable and reproducible. Wit and play earn their keep when they serve clarity.
**Source / anchor work:** *Thoughts on Design* (1947); *A Designer's Art* (1985).
**UI implication — what a mockup should DO with this:** A brand mark should work at 16px (favicon) and 16ft (signage). Test logo and primary visual elements at extreme scales in the mockup. Identity isn't decoration — it appears in product chrome, loading states, empty states.
**Hooks into our skills:** palette (brand identity), components (logo, app icon, favicon)

### Saul Bass
**What it says:** Title sequences (Vertigo, Psycho, Anatomy of a Murder, Goodfellas) and identity (AT&T globe, Bell System, UA, Continental). Bass showed that motion is content, not garnish — a title sequence can set the entire emotional contract for what follows.
**Source / anchor work:** Title sequences for Hitchcock, Preminger, Scorsese; AT&T 1969 identity.
**UI implication — what a mockup should DO with this:** Loading sequences, splash screens, and onboarding intros are emotional contracts. The first 3 seconds of any new surface tell the user "this is the kind of product this is." Don't waste them on a spinner. Define an opening motion pattern — what your product *enters* with — as part of the design system.
**Hooks into our skills:** flows (onboarding intros), components (loading/splash, transitions)

### Khoi Vinh
**What it says:** *Ordering Disorder: Grid Principles for Web Design* (2010) translated print grid discipline to fluid web layouts. The grid is a backbone for responsive design; columns + baseline give scale-agnostic order. Vinh argues against "grids = boring" by showing breaking the grid is meaningful only when there is a grid to break.
**Source / anchor work:** Vinh, *Ordering Disorder* (2010); Subtraction.com.
**UI implication — what a mockup should DO with this:** Define a column grid (typically 12 col with 16-24px gutters) and a baseline grid (typically 4 or 8 px). Components are 4/8px multiples. Breaking the grid (a hero that bleeds, a pull-quote that escapes the column) is a deliberate move — choose it consciously, not by accident.
**Hooks into our skills:** screens (responsive grid), components (spacing token system)

### Ellen Lupton
**What it says:** *Thinking with Type* (2nd ed. 2010) is the most accessible typography primer in the field. Covers letter, text, grid — the three scales of type. Practical heuristics: tracking shrinks as size grows, line-height grows as measure grows, alignment is a choice (flush left preserves rhythm; justified requires hyphenation).
**Source / anchor work:** Lupton, *Thinking with Type* (2004, 2nd ed. 2010); *Graphic Design: The New Basics* (2008, 2015).
**UI implication — what a mockup should DO with this:** At display sizes (>30px), tighten letter-spacing (often -0.5% to -2%). At body sizes (14-18px), keep tracking near 0. At small sizes (<12px), open tracking slightly positive. Line-height: tighter for display (1.0-1.2), looser for body (1.4-1.6), loosest for long-form (1.5-1.8).
**Hooks into our skills:** palette/typography (tracking and leading tokens)

### Robert Bringhurst
**What it says:** *The Elements of Typographic Style* (1992, updated through editions). Canonical: the **45-75 character measure** is "widely regarded as a satisfactory length" for single-column setting (66 ideal); multiple-column pages take 40-50. Rhythm, proportion, and the historical depth of letterforms — Bringhurst treats typography as a craft with centuries of accumulated decisions.
**Source / anchor work:** Bringhurst, *The Elements of Typographic Style* (1992; 4th ed. 2012).
**UI implication — what a mockup should DO with this:** Cap reading-column width to ~65ch (CSS unit). Single-column body: 45-75ch. Sidebar/secondary columns: 30-45ch. Above 75ch, eye return to next line fails; below 40ch, rhythm fragments. Use the `ch` unit or em-based max-widths, not fixed pixel widths.
**Hooks into our skills:** screens (article/doc surfaces), components (content containers)

### Maria Popova / Typographic Web Tradition
**What it says:** *The Marginalian* (formerly Brain Pickings) and a generation of essayists (Frank Chimero, Mandy Brown, Jason Santa Maria, Ethan Marcotte) treated the long-form web as a typographic medium first. Generous measure, mature serif body type, intentional whitespace, careful pull-quotes — proof that the web could carry book-grade reading. Ethan Marcotte's "Responsive Web Design" (A List Apart, 2010) folded fluid type into the same lineage.
**Source / anchor work:** themarginalian.org; A List Apart archive; Frank Chimero, *The Shape of Design*.
**UI implication — what a mockup should DO with this:** Long-form surfaces deserve their own design system inside the design system. Larger body type (18-21px), serif option, generous leading (1.6-1.8), measured column. Pull-quotes are a typographic event, not a div with a left border.
**Hooks into our skills:** screens (blog/docs/long-form surfaces), palette/typography (reading-tier tokens)

### Mark Boulton
**What it says:** *A Practical Guide to Designing for the Web* (2009, free PDF) translated grid theory and ratio-based scales into web specifics. Boulton popularized using compound ratios (e.g., 1:1.618 paired with 1:1.5) for both type scale and layout column widths so the page composes.
**Source / anchor work:** Boulton, *A Practical Guide to Designing for the Web* (2009); markboulton.co.uk.
**UI implication — what a mockup should DO with this:** Derive both type scale and spacing scale from related ratios — they don't have to match, but they should rhyme. A page where headings and column widths share a proportional family feels composed without anyone naming why.
**Hooks into our skills:** palette/typography (scale ratios), screens (column proportions)

---

## Territory 3 — Typography Systems and Rhythm

### Modular Scale
**What it says:** A type scale derived from a base size multiplied by a fixed ratio. Ratios are often musical intervals: 1.125 (major second), 1.2 (minor third), 1.25 (major third), 1.333 (perfect fourth), 1.414 (augmented fourth), 1.5 (perfect fifth), 1.618 (golden ratio), 1.667 (major sixth). Tighter ratios (1.125-1.25) suit dense UI; wider ratios (1.5-1.618) suit editorial.
**Source / anchor work:** Robert Bringhurst (musical-interval analogy); Tim Brown's modularscale.com tool.
**UI implication — what a mockup should DO with this:** Pick one ratio. Generate 6-9 steps (xs, sm, base, lg, xl, 2xl, 3xl, ...). Apply consistently — never set a one-off "29px because it looks right." Different ratios for UI vs editorial inside one product is fine, but each surface picks one.
**Hooks into our skills:** palette/typography (type-scale tokens)

### Vertical Rhythm (Baseline Grid)
**What it says:** All vertical measurements (line-height, spacing above and below headings, image heights when possible) align to a baseline grid — typically a multiple of the body line-height (e.g., body at 16px/24px = 24px baseline, or a 4/8px subdivision). The result is that text and elements on adjacent columns visually align.
**Source / anchor work:** Print typography (Tschichold, Müller-Brockmann); Richard Rutter's *Web Typography* (2017).
**UI implication — what a mockup should DO with this:** Choose a baseline (4 or 8 px is common for product UI; 24px for editorial). Spacing tokens are baseline multiples. Heading line-heights round to baseline multiples. Most "this feels off" issues in tight mocks are baseline misalignments.
**Hooks into our skills:** palette/typography (spacing tokens), screens (vertical alignment)

### Optical Sizing vs Metric Sizing
**What it says:** A typeface designed at one size doesn't scale optically — letters at 8pt need thicker strokes and wider spacing than at 72pt; at 72pt they need finer strokes and tighter spacing. Optical-size fonts (or variable fonts with an `opsz` axis) compensate; static metric-only fonts don't. Display use of body fonts looks clunky; body use of display fonts looks thin and tight.
**Source / anchor work:** Historical metal type (each size cut separately); modern variable-font `opsz` axis (CSS `font-optical-sizing`).
**UI implication — what a mockup should DO with this:** For headings >32px, use a display optical variant (or a separate display face). For body <14px, use a text optical variant or a font cut for small sizes. If using a variable font: enable `font-optical-sizing: auto`. Don't ship one font cut at every size.
**Hooks into our skills:** palette/typography (font selection, variable font axes)

### Horizontal/Vertical Relationship (Measure × Leading)
**What it says:** Measure (line length) and leading (line-height) trade against each other. As measure grows, leading must grow to maintain the eye's ability to return to the next line. Tight leading on long lines is unreadable. Generous leading on short lines wastes vertical space.
**Source / anchor work:** Bringhurst; classical typography.
**UI implication — what a mockup should DO with this:** Rough heuristic: at 45-50ch measure → 1.4 line-height; at 60-65ch → 1.5; at 70-75ch → 1.6-1.7. Headings (short measure) → 1.1-1.25. UI labels (very short) → 1.0-1.2. Codify leading per typography role, not as one global value.
**Hooks into our skills:** palette/typography (per-role leading tokens)

### Better Web Type (the series)
**What it says:** Matej Latin's *Better Web Type* (book + free email course) compresses Bringhurst-grade typography rules into web-implementable specifics: measure, leading, scale, hierarchy, font pairing. Modern web-specific opinions about `rem`, fluid type, system stacks.
**Source / anchor work:** Latin, *Better Web Typography for a Better Web* (2017); betterwebtype.com.
**UI implication — what a mockup should DO with this:** Use `rem` for type sizing so user font preferences flow through. Fluid type with `clamp()` for responsive scaling. Match x-heights when pairing two faces. Avoid more than two faces per product.
**Hooks into our skills:** palette/typography (responsive type tokens)

### Flexible Typesetting (Tim Brown)
**What it says:** *Flexible Typesetting* (A Book Apart, 2018; free as of 2024). Web type isn't placed — it's *instructed*. The text body responds to context (viewport, density, font availability) using pressure, tempo, and focus as a "pattern language of typesetting pressures." Variable fonts and CSS comparison functions (`clamp`, `min`, `max`) make this possible.
**Source / anchor work:** Brown, *Flexible Typesetting* (2018, free 2024); modularscale.com.
**UI implication — what a mockup should DO with this:** Mock at three viewports (320, 768, 1440) and prove the type system holds. Fluid type with `clamp()` between viewport ranges. Variable font weight axis used semantically (subtle emphasis = +50 weight, not bold). Type should breathe with the viewport, not snap at breakpoints.
**Hooks into our skills:** palette/typography (fluid type, variable axes), screens (responsive type proof)

### Variable Fonts (for UI Scale)
**What it says:** A single font file carries continuous axes (weight, width, optical size, slant, custom) instead of static cuts. Weight isn't 400/700; it's 100-900 continuous. Lets a design system express subtle emphasis (520 vs 540), maintain optical sizing automatically, and ship fewer bytes than 6 static cuts.
**Source / anchor work:** OpenType 1.8 (2016); Inter (Rasmus Andersson), Recursive, Roboto Flex, Source Sans 3 VF.
**UI implication — what a mockup should DO with this:** Pick variable fonts when possible (Inter, Roboto Flex, Source Serif 4 VF). Map design tokens to axis values, not named weights. Use `opsz` axis for size-responsive optical compensation. Reserve italic/condensed as separate axes — don't fake italic.
**Hooks into our skills:** palette/typography (variable axes as tokens)

### Practical Typography (Matthew Butterick)
**What it says:** *Practical Typography* (online, free, ongoing). Butterick's "key rules" are explicit and contrarian-clear: bold or italic, not both; one space after period; curly quotes always; avoid underlining; point-size for body text 10-12pt (print) or 15-25px (web); line spacing 120-145% of point size; line length 45-90 characters. Strong opinions, charitably stated.
**Source / anchor work:** Butterick, *Practical Typography* (practicaltypography.com).
**UI implication — what a mockup should DO with this:** Audit the mockup against Butterick's checklist: curly quotes (`"` not `"`), real ellipsis (`…` not `...`), real em-dash (`—`), no underlines except links, no double space, no all-caps for paragraphs. These are cheap wins that signal craft.
**Hooks into our skills:** palette/typography (punctuation discipline), components (text fields with smart-quote handling)

### Typographic Color (Greyness of a Page)
**What it says:** A block of body text has a perceived overall greyness — its "color" as a typographer uses the word. Determined by typeface, size, weight, leading, tracking, measure. Two pages of the same content can read as light grey or dark grey; the wrong greyness for the surface fights the reader. Even, consistent typographic color across a page = quiet, readable. Uneven = restless.
**Source / anchor work:** Tschichold; Bringhurst, *Elements*.
**UI implication — what a mockup should DO with this:** Squint at a body of text in your mockup. Does it look uniformly grey? If patches are dark (too-tight leading, too-heavy weight) or light (too-loose leading, too-light weight), the typography breaks rhythm. Heading-to-body weight contrast should be intentional — most body text wants to read as a calm medium grey, not a busy mottled field.
**Hooks into our skills:** palette/typography (weight + leading harmony), screens (long-form readability)

---

## Sources (for verification trail)

- Doherty & Thadani, "The Economic Value of Rapid Response Time," IBM Systems Journal, Nov 1982 — [Laws of UX summary](https://lawsofux.com/doherty-threshold/).
- Miller (1956); Cowan (2001) correction — [Centigrade GmbH article](https://www.centigrade.de/en/blog/the-number-seven-is-not-magical-part-1/), [PMC review](https://pmc.ncbi.nlm.nih.gov/articles/PMC4486516/).
- Lindgaard et al. (2006), Behaviour & Information Technology 25:2 — [ResearchGate](https://www.researchgate.net/publication/220208334).
- Tufte canon — [Wikipedia overview](https://en.wikipedia.org/wiki/Edward_Tufte).
- Bertin, *Semiology of Graphics* — [Wikipedia: Visual variable](https://en.wikipedia.org/wiki/Visual_variable).
- Iyengar & Lepper (2000), JPSP — [PDF](https://faculty.washington.edu/jdb/345/345%20Articles/Iyengar%20&%20Lepper%20(2000).pdf).
- Norman, seven stages and gulfs — [Wikipedia](https://en.wikipedia.org/wiki/Seven_stages_of_action).
- Fetell Lee, *Joyful*, 10 aesthetics — [aestheticsofjoy.com](https://aestheticsofjoy.com/).
- Calm Technology principles — [Amber Case principles](https://www.caseorganic.com/post/principles-of-calm-technology), [Wikipedia](https://en.wikipedia.org/wiki/Calm_technology).
- Tesler's Law — [Larry Tesler's site](https://www.nomodes.com/larry-tesler-consulting/complexity-law).
- Fitts (1954) — [Wikipedia](https://en.wikipedia.org/wiki/Fitts's_law).
- Müller-Brockmann, *Grid Systems* — [Monoskop PDF](https://monoskop.org/images/a/a4/Mueller-Brockmann_Josef_Grid_Systems_in_Graphic_Design_Raster_Systeme_fuer_die_Visuele_Gestaltung_English_German_no_OCR.pdf).
- Bringhurst measure — [webtypography.net](http://webtypography.net/2.1.2).
- Brown, *Flexible Typesetting* — [flexibletypesetting.com](https://flexibletypesetting.com/).
- Aicher, Munich 1972 — [Wikipedia](https://en.wikipedia.org/wiki/Otl_Aicher).
