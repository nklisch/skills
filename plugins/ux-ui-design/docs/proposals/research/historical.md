# UI/UX Design Lineages — Three Missing Territories

Catalog for the mockup-first plugin (palette / components / screens / flows / adopt).
Each entry deliberately fills a gap not already covered by the existing aesthetic poles
(brutally minimal, editorial, retro-futuristic, organic, maximalist, luxury, playful,
industrial, art-deco, cyberpunk, earthy, data-dense, quiet).

---

## Territory 1 — Historical design movements as lineages

### Bauhaus (Itten / Albers / Moholy-Nagy)
**Essence:** Form-follows-function art school (Weimar, 1919–1933) that fused craft and
mass production through a foundational course teaching color, material, and geometric
primitive (circle = yellow, square = red, triangle = blue per Kandinsky/Itten).
**Anchor works:** Itten's color-wheel teaching; Albers's *Interaction of Color*;
Moholy-Nagy's *Vision in Motion*; Herbert Bayer's universal typeface.
**Gap it fills:** "Editorial" already covers print, but Bauhaus is a *pedagogical*
lineage — primary geometric tokens mapped to primary hues, not magazine layouts.
**Concrete hooks:**
- Palette: red/yellow/blue/black/white only; no tints; gray as a 5-step neutral.
- Components: shape-as-affordance (circular = action, square = container, triangular = warning).
- Screens (pole): "Foundation Course" — every component justifies itself geometrically.
- Flows: linear pedagogical progression, each screen introducing one primitive.

### Swiss / International Typographic Style
**Essence:** 1950s Zurich/Basel school (Müller-Brockmann, Hofmann, Lohse, Ruder) built
on the mathematical grid, sans-serif (Akzidenz-Grotesk, then Helvetica), flush-left
ragged-right setting, asymmetric composition, and objective photography.
**Anchor works:** Müller-Brockmann's *Grid Systems in Graphic Design*; the Zurich
Tonhalle concert posters; Helvetica (Miedinger, 1957).
**Gap it fills:** "Editorial" hints at this but doesn't enforce the *grid as the work*.
Swiss is dogmatic about modular columns + baseline rhythm, which is a concrete UI rule.
**Concrete hooks:**
- Palette: black, white, one accent (often red); no decorative color.
- Components: every element snaps to an 8-12 column modular grid + 4px baseline.
- Screens (pole): "Concert Poster" — diagonal type, oversized numeral, single photo.
- Flows: poster-grid index navigation (one screen = one poster in the series).

### De Stijl (Mondrian, Rietveld, van Doesburg)
**Essence:** Dutch movement (1917–1931) reducing composition to horizontals, verticals,
and the three primaries plus black/white/gray. No diagonals (until van Doesburg's
"Elementarism" break with Mondrian).
**Anchor works:** Mondrian's *Composition with Red, Blue and Yellow*; Rietveld's
Schröder House and Red-Blue Chair; *De Stijl* journal.
**Gap it fills:** A literal grid-as-painting language — rectangular color blocks
becoming layout regions. Distinct from Swiss: De Stijl is composition without text.
**Concrete hooks:**
- Palette: pure RGB primaries + black on white; one block of each, never repeated.
- Components: "color block" as the only container; thick black rules between regions.
- Screens (pole): "Mondrian Dashboard" — KPI tiles as colored rectangles, never aligned to a regular grid.
- Flows: ortho-only transitions (slide left/right or up/down, never diagonal).

### Russian Constructivism (Rodchenko, Lissitzky, Stepanova)
**Essence:** Post-revolution Soviet design (1917–1930s) — diagonal compositions,
photomontage, sans-serif at extreme scale, near-mono red+black+cream palette, geometric
shapes used as political force.
**Anchor works:** Rodchenko's Lengiz "Books!" poster; Lissitzky's *Beat the Whites with
the Red Wedge*; Stepanova's textile prints.
**Gap it fills:** Diagonal is forbidden in Swiss and De Stijl — Constructivism makes the
diagonal a *primary* axis. Existing list has nothing this confrontationally tilted.
**Concrete hooks:**
- Palette: red (#CC0000-ish), black, cream/off-white. Photo halftones in black.
- Components: rotated headlines (-15° to -45°), red wedge dividers, mounted photo blocks.
- Screens (pole): "Manifesto" — diagonal hero, oversized verb, photo halftone behind.
- Flows: sequential pages framed as "agitprop" — every screen a poster spread.

### Memphis Milano (Sottsass et al, 1981–1987)
**Essence:** Italian post-modern revolt against "good taste" — laminate as a hero
material, pattern-on-pattern, terrazzo/squiggle/grid prints, candy + saturated pastels,
asymmetric forms that mock function.
**Anchor works:** Sottsass's Carlton bookcase and Tahiti lamp; the Bacterio laminate
pattern (squiggles on black/white); Nathalie du Pasquier textiles.
**Gap it fills:** "Maximalist chaos" is generic; Memphis is *specifically* about cheap
materials carrying expensive patterns and 1980s shapes. Squiggle as primitive.
**Concrete hooks:**
- Palette: cyan, hot pink, mustard, mint, black squiggle on cream.
- Components: pattern-filled containers (Bacterio, terrazzo, checker, grid-dot); no flat fills.
- Screens (pole): "Laminate" — every panel a different pattern; cards on cards.
- Motion: cards "rattle" on hover; nothing rests still.

### Brutalist Web (Pascal Deville, brutalistwebsites.com, c. 2016)
**Essence:** Explicit movement (distinct from concrete brutalism) — raw default-browser
HTML, Times New Roman, blue underlined links, no CSS reset, "truth to markup."
Deville split it into three subtypes: purists, UX-minimalists, artists.
**Anchor works:** brutalistwebsites.com; Bloomberg Businessweek redesigns c. 2016;
craigslist as the patron saint.
**Gap it fills:** "Brutally minimal" in the existing list is *refined* restraint.
Brutalist web is *unrefined* — actively ugly, performance-first.
**Concrete hooks:**
- Palette: browser defaults (black on white, link blue #0000EE, visited #551A8B).
- Components: `<table>` for layout (purist), `<details>` for accordions, no border-radius anywhere.
- Screens (pole): "Truth to Markup" — H1 + paragraphs + lists + nothing else.
- Flows: full page reloads; no transitions; URLs are the navigation.

### Wabi-sabi
**Essence:** Japanese aesthetic of imperfection, asymmetry, weathering, incompleteness
(*fukinsei, kanso, kokō, shizen, yūgen, datsuzoku, seijaku*). Patina is content.
**Anchor works:** Kintsugi pottery (gold-mended ceramics); tea bowls of Chōjirō; Leonard
Koren's *Wabi-Sabi for Artists, Designers, Poets & Philosophers* (1994).
**Gap it fills:** "Earthy/handcrafted" gestures here; wabi-sabi is the *philosophy*
under it — asymmetry, asynchrony, and visible age as positive features.
**Concrete hooks:**
- Palette: unbleached paper, charcoal, oxidized copper, indigo; never pure white or black.
- Components: cards with one corner intentionally clipped; dividers as broken lines; type with optical (not metric) kerning.
- Screens (pole): "Kintsugi" — visible seams in the layout, gold rule where two regions meet.
- Motion: ease-out only; nothing snaps; everything settles.

### Ma — Japanese negative space as substance
**Essence:** *Ma* (間) is the *pregnant interval* — the silence between notes, the gap
between branches, the pause before speech. Not absence; presence of structured void.
**Anchor works:** Isozaki's 1978 *MA: Space-Time in Japan* exhibition; Noh theater
pacing; ikebana's empty quadrant.
**Gap it fills:** "Generous density" sets whitespace as breathing room; Ma makes the
*empty region itself* a component that carries meaning.
**Concrete hooks:**
- Palette: high-contrast bichrome; color appears only where Ma ends.
- Components: a content tile is always ≤ 30% of its container; the rest is intentional void.
- Screens (pole): "Interval" — one phrase per viewport, long scroll between.
- Motion: 600-900ms hold between transitions; the pause is the affordance.

### Dieter Rams / Braun design language
**Essence:** Rams's 40 years at Braun produced the 10 Principles (innovative, useful,
aesthetic, understandable, unobtrusive, honest, long-lasting, thorough, environmentally
responsible, as-little-design-as-possible). The aesthetic is white/light-gray/black,
green accent on power, fine sans, generous margins.
**Anchor works:** Braun T3 pocket radio (1958, the iPod's clear ancestor); Braun SK4
"Snow White's Coffin"; Vitsœ 606 shelving.
**Gap it fills:** "Industrial/utilitarian" is rough and functional; Rams is *refined*
industrial — minimalist with warmth, grid-aligned but not Swiss-cold.
**Concrete hooks:**
- Palette: warm white #F4F4F0, cool gray #D8D8D8, charcoal #333, signature green #00A65A on actions.
- Components: rotary-dial sliders; segmented controls with chamfered edges; labels in 11px caps.
- Screens (pole): "Honest Tool" — every control labeled; nothing decorative.
- Flows: settings-like — one panel per concept, no overlays.

### Olivetti / Pintori
**Essence:** Olivetti's graphic identity under art director Giovanni Pintori (1950–67)
abstracted typewriter internals into joyful geometric posters — overlapping shapes,
gridded numerals, bright Italian color, birds + eggs as portability metaphors.
**Anchor works:** Pintori's Lettera 22 poster (1953); the *Olivetti 82 Diaspron*
campaigns; Sottsass's *Valentine* typewriter (1969, pre-Memphis).
**Gap it fills:** Between Swiss rigor and Memphis chaos sits Olivetti — *playfully
disciplined* mid-century Italian design with mechanical-internals-as-decoration.
**Concrete hooks:**
- Palette: cream + black + one citrus (orange/lemon) + one cool (teal/cobalt).
- Components: numbered chips ("01", "02") at oversized scale; abstract icon = geometric assembly of dots/arcs.
- Screens (pole): "Machine Diagram" — exploded-view layouts; hero is an abstracted gear/key.
- Motion: hover reveals the "internals" of a component (tooltip as schematic).

### Constructivism's sibling — Russian/Soviet film poster tradition
*(skipped — too close to Constructivism above to warrant a separate hook)*

### Italian Radical / Archizoom / Superstudio (pre-Memphis, 1966–1973)
**Essence:** Florence-centered "anti-design" cooperative — Archizoom's *No-Stop City*,
Superstudio's *Continuous Monument* — proposed infinite gridded landscapes as critique
of consumerist architecture. Black-on-white isometric infinity.
**Anchor works:** Superstudio's *The Continuous Monument* (1969); Archizoom's *No-Stop
City* (1969).
**Gap it fills:** A *speculative-architectural* aesthetic — endless isometric grids as
critique, not as Tron retrofuturism. The grid extends to the horizon and means
"capitalism has nowhere left to go."
**Concrete hooks:**
- Palette: pure black on white; one human figure in red for scale.
- Components: isometric grid tiles that scroll forever; no header chrome.
- Screens (pole): "Continuous Monument" — single infinite-grid plane with content placed at scale-shifting checkpoints.
- Flows: zoom-based navigation (mousewheel = walk further into the grid).

---

## Territory 2 — Cross-discipline transfers

### Christopher Alexander — *A Pattern Language* + Quality Without a Name
**Source discipline:** Architecture / urban design (Berkeley, 1977 + *Timeless Way of
Building* 1979).
**Transferable principle:** Design as composition of named, contextual patterns
(253 of them in the book), each "a problem that occurs over and over again ... and the
core of the solution." The unnamed quality ("alive, whole, comfortable, free, exact,
egoless, eternal") emerges from pattern coherence.
**UI hook:** Mockup-first plugin can *publish a pattern language alongside the palette*
— a per-project named-pattern document ("Settings as Drawer," "Hub with Spokes,"
"Inline Empty State") that screens compose. Each generated screen mock cites the
patterns it uses. Acts as design-system glossary written in plain English.

### Tadao Ando — light, concrete, procession
**Source discipline:** Architecture (Pritzker 1995).
**Transferable principle:** Three materials only (concrete, glass, light); space
revealed through *procession* — you walk a turn, then a wall, then the room opens. The
Church of Light (Ibaraki, 1989) places a single cruciform aperture in a 38cm concrete wall.
**UI hook:**
- Palette: concrete gray ramp #E8E8E6 → #1A1A1A; one warm cast of light (#FFE9B8).
- Components: blank "wall" panels; navigation by *procession* (you don't see Z until you've passed Y).
- Screens (pole): "Aperture" — full-bleed dim screen with one bright cut-out region.
- Motion: long fade-in (1.2s) on entry; light "moves" across the page over the session.

### Sou Fujimoto — relational architecture, transparency
**Source discipline:** Architecture ("primitive future"; House N, Tokyo; Serpentine Pavilion 2013).
**Transferable principle:** Nested transparency — boxes inside boxes inside boxes, each
membrane visible. Blurs inside/outside, public/private. Architecture as *interface design*.
**UI hook:**
- Components: nested modal-within-modal-within-modal where each parent stays visible at
  reduced opacity; no full-screen takeovers.
- Screens (pole): "Nested Frame" — content panels at 3 zoom levels visible simultaneously.
- Flows: drill-in shows the path *as cumulative frames*, not a stack you lose context to.

### Luis Barragán — Mexican modernism (color, walls, water)
**Source discipline:** Architecture (Pritzker 1980; Casa Gilardi 1976).
**Transferable principle:** Serenity through saturated solid-color walls (fuchsia,
cobalt, ochre) against pure white, with reflective water surfaces and dramatic single
shafts of light. "Any work of architecture which does not express serenity is a mistake."
**Gap vs Memphis:** Memphis pattern, Barragán *solid blocks*. Vs De Stijl: Barragán
*saturated mid-tones*, not primaries.
**UI hook:**
- Palette: cal-pink #E8517E, cobalt #2447C8, ochre #E6B855, mezcal cream #F1ECE0; never more than 2 per screen.
- Components: full-bleed colored regions as nav landmarks; one "water" element per screen (a reflective gradient).
- Screens (pole): "Casa Gilardi" — single saturated wall behind a small content cluster.

### Brian Eno — generative music / Oblique Strategies
**Source discipline:** Music (*Ambient 1: Music for Airports*, 1978; Oblique Strategies
deck with Peter Schmidt, 1975).
**Transferable principle:** Compose *processes*, not artifacts. State a few rules; let
the system run. Constraints as creative liberation ("Honor thy error as a hidden intention").
**UI hook:** A static UI can encode a *generative palette* — per-session randomized
accent within a constrained range; per-load reshuffled hero composition from a fixed
grammar; "oblique" empty-state copy drawn from a card deck. The screen feels alive
without being animated. Pair with a *Strategies* component: dismissable prompt cards
that reframe the user's task.

### Walter Murch — Rule of Six (editing)
**Source discipline:** Film editing (*Apocalypse Now*, *The Conversation*, *In the Blink
of an Eye*).
**Transferable principle:** Rank every cut by Emotion (51%) → Story (23%) → Rhythm
(10%) → Eye Trace (7%) → 2D Planarity (5%) → 3D Continuity (4%). Sacrifice upward only.
**UI hook:** A *transition checklist* for screen-to-screen mocks — does this transition
preserve the user's emotional state, then their narrative thread, then their visual
focus point ("eye trace") between screens? Mockup output can annotate each transition
with its Murch rank. Particularly strong for flows.

### Roger Deakins — motivated light cinematography
**Source discipline:** Cinematography (*1917*, *Blade Runner 2049*, *No Country for Old Men*).
**Transferable principle:** Every light in frame must be *motivated by a source you can
see or infer*. A lantern lights the lantern-holder. No ambient fill from nowhere.
**UI hook:**
- Shadows and highlights on a screen must point to a coherent in-frame "source"
  (icon-lit-from-above, modal-lit-from-its-CTA). One source per screen, max two.
- Color temperature warms or cools per route — e.g., billing pages cooler, success
  pages warmer — and is *motivated* by an in-page element (a sun, a candle icon, a glowing badge).
- Screens (pole): "Single Source" — one luminous element; everything else falls into shadow.

### Ikebana — heaven-man-earth (shin / soe / hikae)
**Source discipline:** Japanese floral arrangement (Ikenobō tradition, 15th c.; Sogetsu modernization 1927).
**Transferable principle:** Asymmetric triangle of three elements at fixed angles
(shin ~15°, soe ~45°, hikae ~75°), with size ratio 1 : 2/3 : 1/2. Empty space (ma)
balances filled space.
**UI hook:** A *three-element rule* for any composition — one dominant, one supporting
at ~2/3 weight, one accent at ~1/2 weight, never collinear. Maps to hero + sub-hero +
accent CTA. Lays an exact angular discipline over the otherwise-vague "rule of thirds."
- Screens (pole): "Three-Branch" — exactly three elements per region, always asymmetric.

### Japanese garden — shakkei (borrowed scenery)
**Source discipline:** Garden design (Heian period onward; codified in the 17th c.
Chinese *Yuanye*).
**Transferable principle:** Compose the *background* (distant mountain, neighbor's
roofline) into the foreground composition through framing devices. Four layers:
foreground, middle ground, framing device, borrowed background.
**UI hook:**
- Screens "borrow" the OS chrome or browser background as composed scenery — a
  carefully chosen viewport-bleed gradient that *matches* the user's likely backdrop.
- A "framing device" component (a window cut-out, an arch) deliberately reveals
  content behind/under the current screen at the edges (the previous step, the next preview).
- Flows: each screen frames a glimpse of the *next* — no surprise transitions.

### Laban Movement Analysis — Effort / Time / Weight / Space
**Source discipline:** Dance notation (Rudolf von Laban, 1920s–50s).
**Transferable principle:** Movement decomposes into four factors with poles —
Time (quick/sustained), Weight (strong/light), Space (direct/indirect), Flow (bound/free).
Eight named "efforts" combine the first three: Float, Punch, Glide, Slash, Dab, Wring,
Flick, Press.
**UI hook:** A *motion taxonomy* for the plugin — every animation declares its Laban
effort. A "Dab" toast is quick + light + direct. A "Press" modal-confirm is sustained +
strong + direct. Replaces vague easings with named character. Plugin can emit a CSS
custom-property motion-scale per pole.

### Music — vertical rhythm + modular scale + counterpoint
**Source discipline:** Western music theory + Robert Bringhurst's *Elements of
Typographic Style*.
**Transferable principle:** Type sized in a geometric scale (e.g., 1.250 major third),
leading set as a *baseline grid* every element lands on. Counterpoint = two
independent visual "voices" (e.g., the marginalia column and the body column) moving
on the same baseline.
**UI hook:**
- Palette of type sizes is a *named scale* (minor second / major third / perfect fifth),
  picked per project mood. Vertical rhythm = strict 4px or 8px baseline.
- Components: a "counterpoint" two-column primitive where left and right voices share
  baselines but differ in size and weight (annotation alongside body).

### Tea ceremony / wabi-cha — preparation as content
**Source discipline:** Chanoyu (Sen no Rikyū, 16th c.).
**Transferable principle:** The *preparation* (folding the cloth, warming the bowl)
*is* the experience. The drinking is the punctuation. Slowness and visible craft are
the point.
**UI hook:**
- "Preparation screens" replace zero-state — the wait/setup for an action is rendered
  as a deliberate, attended choreography (a 4-step explicit sequence), not a spinner.
- Onboarding becomes ceremonial: each step has a fixed minimum dwell (no skip-to-end)
  and shows the tools being arranged.
- Distinct from "playful" — this is *slow*, not jubilant.

---

## Territory 3 — Critical / speculative / refusal

### Dunne & Raby — Critical Design / Speculative Design
**Essence:** RCA-based partners; *Hertzian Tales* (Anthony Dunne, 1999) introduced
"critical design" — design as critique rather than problem-solving; *Speculative
Everything* (2013) extended it into design fiction. "Instead of solving problems, they
posed them."
**Gap it fills:** Every existing pole *answers* the user — Dunne & Raby's lineage
*questions* the user. The screen as provocation, not solution.
**Concrete hooks:**
- Palette: clinical lab-white, single saturated provocation color (Soviet red, hazard yellow).
- Components: a screen has *one CTA that asks an uncomfortable counterfactual question*
  ("What would you not do if this app did not exist?").
- Screens (pole): "Provocation" — large rhetorical question, small footer of receipts.
- Flows: the *whole product* exists as a hypothetical; a persistent banner reads
  "This product is fictional. The data is real."

### Bruce Sterling — Design Fiction / Diegetic Prototypes
**Essence:** Sterling coined "design fiction" in *Shaping Things* (2005); refined as
"the deliberate use of diegetic prototypes to suspend disbelief about change."
(Julian Bleecker's 2009 essay formalized the practice.)
**Gap it fills:** A mockup can ship as a *diegetic prototype* — pretend it's real and
in-world, with no break-the-fourth-wall affordances ("This is a prototype" overlays).
**Concrete hooks:**
- Components: in-frame "evidence" components — a fake screenshot timestamp, a fake
  push-notification stack, a fake spec-sheet sidebar — that situate the UI in a world.
- Screens (pole): "From the Year 2031" — every screen comes with diegetic chrome
  (fake OS bar, fake handset frame) so the mockup carries its own context.
- Useful in adopt-mode for proposing futures, not just mirroring.

### Jenny Odell — *How to Do Nothing* / attention reclamation
**Essence:** Artist-essayist (Stanford lecturer); 2019 book argues for *refusal-in-place*
of the attention economy via bioregional embeddedness — pay attention to your *place*,
not your feed.
**Gap it fills:** Where Calm Tech *reduces* notifications, Odell *re-directs* attention
outward (toward the local, the slow, the non-monetized).
**Concrete hooks:**
- Palette: muted, season-shifted (the screen's neutrals literally drift through a
  yearly Pantone cycle tied to the user's bioregion).
- Components: "outside" widgets — local weather, native species in bloom right now,
  sunrise/sunset — embedded as ambient chrome, not as feed items.
- Screens (pole): "Bioregion" — the home screen *first* shows where you are physically,
  the product second.
- Flows: explicit "leave-the-app" exits at task end ("You're done. Go outside.").

### Tristan Harris / Center for Humane Technology — Time Well Spent
**Essence:** Ex-Google design ethicist; founded Center for Humane Technology (formerly
"Time Well Spent" movement) to surface attention-hijacking dark patterns and propose
their inversion.
**Gap it fills:** A concrete *dark-pattern inverse* checklist — variable rewards,
infinite scroll, social-reciprocity baits — and their humane counter-designs.
**Concrete hooks:**
- Components: end-of-feed sentinels (no infinite scroll); session-spend meter in the
  chrome; honest preview of what tapping a notification *contains*.
- Screens (pole): "Time Well Spent" — every action declares its time cost ("3 min read",
  "8 messages waiting") *before* engagement, never after.
- Flows: a friction-by-design step before any compulsive loop — to post, to refresh, to share.

### Calm Technology — Mark Weiser + Amber Case
**Essence:** Weiser & Brown's 1995 "Designing Calm Technology" (Xerox PARC, ubicomp).
Amber Case formalized 8 principles in 2014–15: tech requires the smallest possible
amount of attention; informs and creates calm; uses the periphery; amplifies the best
of tech and humanity; can communicate but doesn't need to speak; works even when it
fails; appropriate amount of technology; respects social norms.
**Gap it fills:** "Quiet/monastic" gestures here; Calm Tech is the *engineering*
discipline beneath it — peripheral notifications, ambient indicators, graceful failure.
**Concrete hooks:**
- Components: peripheral indicator bars (think Weiser's Dangling String); ambient
  glow that intensifies with network/queue state; toasts that don't steal focus.
- Screens (pole): "Periphery" — primary content centered with low-bandwidth ambient
  signals at the page edges.
- Failure mode is *visible degradation* not modal error — the indicator dims, doesn't shout.

### Slow Web / Slow Media
**Essence:** 2010s movement (Jack Cheng's "The Slow Web" 2012; Slow Media Manifesto
2010) advocating asynchronous, batched, durable web over real-time feeds — daily
digests, weekly summaries, no live counters.
**Gap it fills:** A *cadence* discipline rather than an aesthetic — when content
arrives matters more than how it looks.
**Concrete hooks:**
- Components: "next delivery at 9am tomorrow" indicators; batched inbox views; no
  live counters; no badges showing unseen counts.
- Screens (pole): "Digest" — content arrives in a single bound packet per cadence.
- Flows: linear, finite — read-to-end has an end; "you're caught up" is a real state.

### Design Justice — Sasha Costanza-Chock
**Essence:** *Design Justice* (MIT Press 2020) — community-led design that challenges
rather than reproduces the matrix of domination (white supremacy, heteropatriarchy,
ableism, capitalism, settler colonialism). Builds on Design Justice Network principles.
**Gap it fills:** Forces the mockup pipeline to ask *who is not in the room* before
selecting a "default" persona. A discipline, not an aesthetic.
**Concrete hooks:**
- Palette / components must declare their accessibility budget (contrast ratio, motion
  reduction, language coverage, screen-reader rehearsal) as a first-class artifact.
- Screens (pole): "Whose Default?" — every mock ships with at least one mirror mock
  for a non-default persona (low-bandwidth, screen-reader-only, RTL, non-Latin script).
- Adopt mode: the audit report names *who the existing UI excludes*, not just
  "inconsistencies." Mirrors → remediation items.

### Adbusters / Culture Jamming
**Essence:** *Adbusters* magazine (Vancouver, 1989–; Kalle Lasn, Bill Schmalz) — the
detournement of advertising aesthetics into their own critique. "Subvertisements" hijack
brand language to indict the brand.
**Gap it fills:** A *parody* register the existing list doesn't have — UI that uses the
gloss of "slick app" against itself.
**Concrete hooks:**
- Palette: gleaming brand-saturated colors with one wrong element (logo crossed out,
  testimonial in a body bag).
- Components: marketing-page primitives (testimonial card, pricing table, hero) with
  their copy inverted into critique.
- Screens (pole): "Subvertisement" — looks like a SaaS landing page; reads as a confession.

### Anti-attention / Friction-as-Feature
**Essence:** A diffuse design practice (Light Phone, Freewrite, Kindle's slowness)
adding *intentional friction* — speed bumps, cooldowns, single-purpose surfaces — to
reduce compulsive use.
**Gap it fills:** Inverts every speed-and-convenience default. Slowness is the feature.
**Concrete hooks:**
- Components: confirmation dialogs that require typing the action's name; cooldown
  timers between identical actions; "publish" delayed by N minutes with cancel window.
- Screens (pole): "Single Purpose" — a screen that can do exactly one thing and refuses to chain.
- Flows: dead-ends are intentional ("This app cannot do X. That is on purpose.").

### Refusal as a design move
**Essence:** A speculative move — *the product refuses to do what is expected of it*.
Write-only journals, one-button apps, apps without a feed, apps without search,
apps without notifications. Distinct from minimalism: a *deliberate absence* where
users expect presence.
**Gap it fills:** Generates a *missing-feature spec* alongside the feature spec — names
what the product *will refuse to add*, with reasons.
**Concrete hooks:**
- Components: an explicit "refusals" footer on the landing page listing what the product
  intentionally lacks.
- Screens (pole): "One Button" — entire surface collapses to a single primary action;
  every other interaction is read-only.
- Flows: the "back" affordance is sometimes intentionally absent; the user must finish.

---

## Suggested integration into the plugin

- **Palette skill:** new "lineage" inputs — Barragán, Olivetti, De Stijl, Bauhaus, Memphis, Rams. Each carries a tokens.css preset.
- **Components skill:** new primitives — *peripheral indicator* (Calm Tech), *refusal footer*, *diegetic chrome*, *three-branch composition* (Ikebana), *counterpoint two-column*, *aperture* (Ando).
- **Screens skill:** add poles named after the entries (e.g., "Manifesto", "Casa Gilardi", "Aperture", "Subvertisement", "One Button", "Provocation", "Continuous Monument").
- **Flows skill:** add motion taxonomy (Laban efforts), Murch transition-ranking annotations, slow-web cadence rules, procession (Ando) walkthroughs.
- **Adopt skill:** Design-Justice audit lens (who is excluded?); Pattern-Language glossary as output artifact; diegetic-prototype mode for proposing futures.

