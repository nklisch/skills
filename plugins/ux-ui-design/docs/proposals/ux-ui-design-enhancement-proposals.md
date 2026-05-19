# UX/UI Design Skills — Enhancement Proposals

Research synthesis from four parallel passes covering design lineages the current `ux-ui-design` plugin (palette / components / screens / flows / adopt / ux-ui-principles) doesn't yet touch. Source files in `./research/`:

- `./research/historical.md` — historical movements, cross-discipline, critical/refusal (38 entries)
- `./research/esoteric.md` — internet-native aesthetics, anti-design, 2024-2026 trends (28 entries)
- `./research/laws.md` — UX laws, info-design pioneers, typography systems (47 entries)
- `./research/cultural-motion.md` — cultural/regional, sensory-beyond-screen, game UI, motion (39 entries)

What follows distills ~150 raw lineages into an opinionated enhancement plan — what to fold in, where it lands, and what to deliberately leave out.

---

## What the plugin currently does well

Strong on visual aesthetic poles (13 of them), three flow topologies, four depth treatments, contrast checking, mode-aware adoption. Mockup-first discipline is real and the tier-ordering rule is sharp.

## Six things the plugin systematically misses

These cut across all four research passes:

1. **Motion is barely mentioned.** `flows` talks about transitions; nothing else has a motion vocabulary. No easing-curve language, no spring physics, no "designed pause" (*ma*), no Disney principles, no 60fps-as-constraint.
2. **Sensory dimensions beyond the screen don't exist.** No earcons, no haptic vocabulary, no voice-UI turn-taking, no screen-reader-first stance, no spatial/visionOS depth-as-layout.
3. **Formal theory is implicit.** Contrast ratios are mentioned; Hick, Fitts, Doherty, peak-end, Gestalt, Tesler, the gulfs of execution/evaluation are not. The agent currently designs by aesthetic poles alone.
4. **Cultural/regional lineages are absent.** The 13 existing poles are Western/generic. Korean density, Chinese super-app, Islamic girih, Barragán, Marimekko, Mayan codex layouts — all missing. (This is also a *risk surface* — borrowing needs guardrails.)
5. **Critical / refusal / speculative design has no foothold.** No Dunne & Raby, no Jenny Odell, no Calm Tech, no "refusal as a design move." Every existing pole *answers*; nothing *questions*.
6. **The 13-pole list is decorative, not generative.** Each pole produces one look. None of the existing poles teach a *system* (girih's tile-set, Eno's process composition, Alexander's pattern language, Bertin's visual variables).

---

## Recommendation A — Add a new skill: `motion`

A dedicated motion skill, sibling to `palette` and `components`. The strongest gap in the current plugin.

**Output artifacts** (mirror palette/components):

```
.mockups/design-system/
  motion.html        # showcase of every motion token in action
  motion.css         # easing curves, durations, spring definitions
  motion-tokens.md   # named-attitude vocabulary
```

**Token vocabulary** (synthesized from research):

- **Named easing curves with attitude** (Material 3 / iOS / Carbon lineage): `--ease-emphasized`, `--ease-standard`, `--ease-productive`, `--ease-expressive`, `--ease-linear`. Each carries an attitude tag and a paired duration.
- **Duration scale**: `--dur-instant` (≤100ms, feels direct), `--dur-quick` (≤300ms, gated input must fit here per Doherty), `--dur-ambient` (>400ms, only for background motion that doesn't gate input).
- **Spring presets** (Bret Victor / Framer Motion lineage): `--spring-stiff`, `--spring-medium`, `--spring-wobbly` defined by stiffness/damping/mass, not duration. Preserves user gesture velocity.
- **Disney principles as motion tokens**: `squash-on-press`, `anticipation-flick`, `follow-through-settle`, `slow-in-slow-out`, plus the cinematic *secondary-action* pattern.
- **Pause as a token** (Ghibli *ma*): `--hold-beat` (250ms designed stillness slot) for use *between* segments of complex transitions. The pause is the affordance.
- **Stop-motion / hand-keyed channel** (Aardman / Laika): `--stepped-12fps` for elements that should feel hand-touched, not splined.
- **Smear/impact 1-frame variants** (Trigger / Imaishi): `--smear-1f`, `--impact-1f` for kinetic-personality products.

**Hard rules** the skill enforces:

- **Doherty coupling**: any animation that *blocks input* must complete in ≤300ms. Background/ambient motion can be longer. The mock spec declares whether each motion blocks input.
- **Pixar return-to-rest**: every motion declares a rest state. No infinite loops outside explicit indeterminate-progress contexts.
- **60fps performance constraint**: every motion declares "transforms+opacity only" — or notes the layout-thrash exception. Pages animating `width` / `top` get flagged.
- **Lottie/AHAP as artifact**: motion ships as files (JSON / AHAP), not as prose telling an engineer what to rebuild.

**Why this is its own skill not a `components` extension**: motion has its own token space, its own preview format (HTML video preview of each curve), its own refinement loop, and is a horizontal concern across every component, screen, and flow.

---

## Recommendation B — Expand `palette` with a Visual Variables tier

Bertin's *Semiology of Graphics* gives palette a discipline it currently lacks. The plugin treats color as personality; Bertin treats color as one of seven (or eight) information-encoding channels with specific rigor about which channel matches which data type.

**Add to `palette`:**

- A **categorical / sequential / diverging** distinction in the token vocabulary. Currently the plugin has one accent token; data work needs all three with WCAG-compliant ramps. (`token-vocabulary.md` reference file extension.)
- A **typographic color** check (Tschichold / Bringhurst): squint-test for greyness uniformity on body text blocks. Patches of dark/light text are baseline-rhythm bugs.
- A **lineage preset** mechanism — Barragán, Olivetti, De Stijl, Bauhaus, Marimekko, Rams, Memphis Milano, Hara/Muji `kuu` — each emits a starter `tokens.css` with the actual palette of the lineage. (See proposal D below for the full pole list.)
- **Cultural-borrowing guardrail**: when the user picks a lineage tied to a specific community (Adinkra, Aboriginal dot-painting, chromolitho), the skill surfaces a risk note: *borrow the principle (concealment, named-symbol vocabulary, generative tiling) — not the iconography — unless the project has cultural authority.*

---

## Recommendation C — Add UX laws as a `principles` reference

The plugin currently has zero formal-theory layer. Add a `references/ux-laws.md` to `ux-ui-principles` (auto-loaded with the principles skill) covering the operative subset:

**The non-optional 12** (every screen/flow design should consult):

1. **Hick** — choice count vs decision time, with chunking correction
2. **Fitts** — target size + distance + screen edges; ≥44×44px iOS / 48dp Material
3. **Miller corrected to Cowan** — working memory is ~4±1, not 7±2 (inoculation against pop-UX)
4. **Jakob** — conform on chrome, innovate on substance
5. **Tesler / Conservation of Complexity** — name where the complexity went
6. **Doherty** — sub-400ms feedback, 25-30% productivity gain at sub-400ms vs 2s
7. **Peak-End** — invest pixels in the peak and the closing moment
8. **Zeigarnik** — show open loops; reward closing them; don't manufacture phantoms
9. **Aesthetic-Usability + Lindgaard 50ms** — first-render visual quality is high-leverage
10. **Norman's gulfs of execution / evaluation** — every interaction needs an affordance and a result; mock the *after* state
11. **Affordances vs signifiers** — flat design's biggest sin is signifier-stripping
12. **Calm Technology's 8 principles** (Weiser / Case) — notifications: peripheral by default; failure: useful, not blank

**The Gestalt set** as a squint-test checklist: proximity, similarity, continuity, closure, figure/ground, common fate, prägnanz, focal point.

**The pop-UX inoculations** the reference explicitly corrects:

- Miller is misquoted as a UI rule; Cowan's 4±1 is the real number; design to chunking, not to "7±2."
- Bertin's "8 visual variables" is post-Bertin; original is 7.
- Choice overload is moderated, not universal (Scheibehenne 2010 meta).
- Aesthetic-usability grants forgiveness for *minor* friction, not for broken flows.

These get loaded with `ux-ui-principles` so every design pass has access.

---

## Recommendation D — Expand the aesthetic-pole list in `palette` and `screens`

The current 13 poles get extended by ~24 lineages. Each new pole gets:

- A one-line evocative rationale (the existing skills already use this shape)
- A starter palette (hex values)
- A starter type stack
- A concrete component-shape signature
- A best-fit-projects note (so the agent doesn't pick "Casa Gilardi" for a fintech KYC form)
- Cultural-risk note where applicable

### New poles to add (37 total — 13 existing + 24 new)

**Period-specific retro** (4 new, distinct from generic "retro-futuristic"):

- **Frutiger Aero** — wet, alive, hopeful future; aqua + glass + bubbles. Wellness, eco-tech, kids/family.
- **Y2K Chromecore** — anxious pre-millennial chrome, liquid metal, lime + orange. Music drops, fashion, irony-nostalgia.
- **Cassette Futurism** — Nostromo consoles, amber CRT, beige plastic, wood. Self-hosted infra, sysadmin, log products.
- **Atompunk** — 1950s Tomorrowland, boomerangs, kidney shapes, mustard + turquoise. Diners, Fallout-style game UI, vintage-modern.

**Internet-native aesthetic-movement** (6 new, no overlap with existing):

- **Vaporwave / Mallsoft / Signalwave** — three sub-poles for music labels, ironic SaaS, gallery shows. Mall-melancholy vs frozen-VHS vs dead-mall photography.
- **Hauntology / Ghost Box** — lost-futures of post-war modernism, library-music typography. Reading/archive products, longform.
- **Liminal Spaces / Dreamcore** — uncanny empty-lobby photography, fluorescent + teal carpet. Dream journals, sleep apps, narrative fiction, ARGs.
- **Solarpunk** — utopian green-tech, art-nouveau revival, vines on infrastructure. Climate/cooperative/community-energy.
- **Glitchcore / Datamosh** — visible digital corruption, chromatic aberration, pixel-sort. Music releases, NFT galleries, experimental music.
- **Webcore / Old Web Revival** — sincere GeoCities, marquee, visitor counters. Personal blogs, indie zines, anti-corporate.

**Constraint aesthetics** (2 new):

- **PICO-8 / GameBoy DMG Pixel** — strict fixed palettes (16 colors, or 4-shade-green). Limit is the point. Indie games, gamified products, retro tools.
- **Risograph** — 2-4 spot inks, deliberate misregistration, halftone. Indie publishers, music labels, small-batch product brands.

**Refusal / craft** (3 new):

- **True Brutalist Web** — motherfuckingwebsite.com, sourcehut, system-default Times Roman. Hacker tools, infosec manifestos, solo-dev ops dashboards. *Distinct from existing "brutally minimal" — that's refined; this is uncurated.*
- **Read-Only / One-Button** — refusal-as-design; one screen, one input. Single-purpose tools, joke utilities, statement pieces.
- **Anti-AI Handmade / Scribble Core** — visible human hand, scanned ink, rotated paper, scribbled annotations. The 2026 antidote to AI-slop. Craft brands, longform editorial, galleries.

**Historical-movement poles** (5 new, distinct from existing "editorial" / "art-deco"):

- **Bauhaus** — primary geometric tokens mapped to primary hues. Shape-as-affordance.
- **Russian Constructivism** — diagonal as primary axis. Manifesto pages, agitprop marketing, brands wanting *a position*.
- **De Stijl** — primary RGB + ortho-only color blocks. KPI tile dashboards.
- **Memphis Milano (the actual one)** — squiggles, terrazzo, pattern-on-pattern. Fashion, gen-Z, festivals.
- **Swiss / International Typographic Style** — strict 12-col grid + Akzidenz/Helvetica. Cultural institutions, transit/wayfinding, architecture practices.

**Cultural lineages** (4 new, each with cultural-risk note):

- **Barragán / Mexican Modernism** — saturated single-color planes (bougainvillea pink, cobalt). Brand sites, photo galleries, anything that wants to feel *built*.
- **Muji / Hara *Kuu*** — emptiness as invitation, never pure black/white. Writing tools, notes apps, content-first products.
- **Marimekko (real Nordic, not flatpack)** — one enormous brush-painted motif. Lifestyle, editorial commerce, hero banners.
- **Girih / Generative Geometry** — 5 polygon tiles algorithmically composing aperiodic patterns. Data viz, generative-art platforms.

### New axis: "Aesthetic of Joy" thesis

From Ingrid Fetell Lee — pick 1-2 from {Energy, Abundance, Freedom, Harmony, Play, Surprise, Transcendence, Magic, Celebration, Renewal} as the palette's emotional thesis. Lands as a question in `palette` Phase 2 alongside the existing aesthetic-poles question.

---

## Recommendation E — Add a `flows` topology: hub-and-spoke variant + Map-as-Canvas

The current three topologies (sequential, hub-and-spoke, hybrid) miss two real shapes:

- **Map-as-Canvas** (Death Stranding lineage) — the canvas IS the UI; every other element is a popover over the map; planning the route is the dominant interaction. Logistics, fieldwork, real-estate, urban planning. New `flows` topology.
- **Chat-as-Canvas** (Slack Block Kit / Discord / ChatGPT lineage) — the thread is the application; cards/forms/choice-chips embedded *inside* a chat bubble. AI assistants, support chat, bot workflows. New `flows` topology.

Both have distinct chrome and review patterns that don't fit any of the three existing topologies.

---

## Recommendation F — Add critical / speculative tooling to `adopt` and `screens`

Currently `adopt` audits accessibility, design-system fragmentation, and component duplication. Three additions:

- **"Whose Default?" mirror-mock** (Design Justice / Costanza-Chock): every screen mock ships with at least one mirror mock for a non-default persona — low-bandwidth, screen-reader-only, RTL, non-Latin script. The audit names *who the UI excludes*, not just "inconsistencies."
- **Refusals footer** (refusal-as-design / Light Phone lineage): products declare what they *intentionally lack*, with reasons. New optional artifact: `.mockups/refusals.md`.
- **Diegetic prototype mode** (Sterling design-fiction): a `screens` mode where the mock comes with fake-OS chrome, fake-timestamp, fake-handset frame, so it situates itself in a world rather than floating in white space. Useful for "what if this product existed in 2031" provocations.

---

## Recommendation G — Sensory-beyond-screen extensions (post-MVP)

These are real gaps but probably best as a *separate* skill (`sensory` or `multimodal`) once `motion` lands and matures. Listed here so they don't get lost:

- **Earcons** — Blattner/Sumikawa typed-audio vocabulary; not sound-effects-as-decoration.
- **Apple Core Haptics / AHAP** — intensity × sharpness × audio-paired; haptics as a typed feedback channel.
- **Voice UI / turn-taking** — reprompts, endpointing, persona writing as first-class.
- **Screen-reader-first** — semantic tree as canonical UI; SR transcript as a mock artifact.
- **visionOS spatial / Glass Material** — depth as layout primitive, not z-index implementation.
- **Wearable / glanceable** — 2-3 second glance budget, complication slot grammar.
- **Calm-tech 4-tier signal taxonomy** — ambient → glance → notify → interrupt; every notification spec includes a downgrade path.

These deserve their own skill because they each carry their own preview format and review loop.

---

## Recommendation H — Add cross-discipline transfer references

A small reference file under `ux-ui-principles/references/cross-discipline.md` (auto-loaded). Not a generator — a *vocabulary* the design agent can pull from when generating poles. Twelve transfers worth the page:

1. **Christopher Alexander pattern language** — publish a per-project named-pattern doc alongside palette. Each screen mock cites which patterns it uses.
2. **Tadao Ando procession** — navigation by sequence reveal; you don't see Z until you've passed Y. Pairs with the existing `flows` sequential topology, sharpens it.
3. **Sou Fujimoto nested transparency** — nested modals where each parent stays visible. No full-screen takeovers.
4. **Brian Eno generative composition** — per-session randomized accent within constrained range; "Oblique Strategies" prompt component for empty-state copy.
5. **Walter Murch Rule of Six** — transition-quality checklist for `flows`: emotion (51%) > story (23%) > rhythm (10%) > eye-trace (7%) > planarity (5%) > continuity (4%).
6. **Roger Deakins motivated light** — every screen has one luminous element; other lights motivated by visible source.
7. **Ikebana three-element rule** — exactly three elements per region (1 : 2/3 : 1/2 ratio), never collinear. Sharpens the otherwise-vague "rule of thirds."
8. **Japanese garden shakkei** — flows where each screen frames a glimpse of the next.
9. **Tea ceremony / wabi-cha** — preparation screens replace zero-state; setup as choreography, not a spinner.
10. **Laban Movement Analysis** — motion taxonomy (Float / Punch / Glide / Slash / Dab / Wring / Flick / Press) feeds the named-easing layer in proposed `motion`.
11. **Music: vertical rhythm + modular scale + counterpoint** — type sized in geometric scale (1.125 / 1.25 / 1.5); strict baseline grid; counterpoint two-column primitive (annotation column alongside body, sharing baseline).
12. **Tufte / Bertin / Vignelli / Müller-Brockmann** — the information-design canon as the grounding for charts, grids, and identity work.

---

## What to deliberately leave out

Things that came up in research but don't earn their keep:

- **Steampunk / clockpunk** — too close to existing earthy-handcrafted + industrial; thin signal.
- **Faux-utopia / vaporwave sub-sub-genres** — folded into vaporwave / mallsoft / signalwave (3 is enough).
- **Material You / dynamic color** — that's palette *tooling*, not a pole.
- **Anemoia / generic-period nostalgia** — too vague; the named retro poles (Frutiger Aero, Y2K, Cassette Futurism, Atompunk) are sharper.
- **Cottagecore + Dark Academia** — borderline; both are real, but the "luxury/refined" and "earthy/handcrafted" poles cover enough of them. Could add if user wants them.
- **Hyperpop / PC Music** — strong identity but very narrow project-fit; could add as an optional pole, low priority.
- **Claymorphism / aurora gradients** — these are *trend palettes* that belong in component-depth choices, not as new top-level poles.

---

## Suggested order of implementation

If acting on this incrementally:

1. **Aesthetic-pole expansion** — fastest win, adds depth to `palette` and `screens` immediately. (Recommendation D.)
2. **UX laws as `principles` reference** — small surface, big leverage; sharpens every design pass. (Recommendation C.)
3. **`motion` as a new skill** — fills the single biggest gap; sibling to `palette` and `components`. (Recommendation A.)
4. **`palette` visual-variables tier** — extends what already exists. (Recommendation B.)
5. **New `flows` topologies (map / chat as canvas)** — additive, contained. (Recommendation E.)
6. **`adopt` critical-mode extensions** — additive, contained. (Recommendation F.)
7. **Cross-discipline reference under `principles`** — auto-loaded vocabulary; small file. (Recommendation H.)
8. **`sensory` / multimodal as future second skill** — defer. (Recommendation G.)

---

## Open questions for the user

Things research surfaced that benefit from the user's call rather than the agent's:

- **Cultural-borrowing guardrail level**: how strict? A warning at lineage selection? A required acknowledgment? Lock specific lineages behind a "cultural authority" attestation in CLAUDE.md?
- **Pop-UX inoculations**: include them in the laws reference as research shows (Miller-Cowan correction, Bertin-7-not-8, etc.), or stay quiet and let the agent absorb the conventional wisdom?
- **Motion skill scope**: full new skill, or extension of `components`? Recommendation A argues for full new skill; user might prefer the smaller path.
- **`sensory` skill timing**: hold for later, or seed now (even as a stub) so it's on the map?
