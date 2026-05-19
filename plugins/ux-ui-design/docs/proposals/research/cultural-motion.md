# UX/UI Design Lineages Beyond the Western Generic Poles

Research for the UI/UX design skill plugin. Four territories the existing pole list misses, with cultural / sensory / game / motion lineages that each carry a *specific* design logic — not a vibe, a logic. Each entry cites a real anchor and proposes concrete plugin hooks.

The existing poles to AVOID rephrasing: brutally minimal, editorial/magazine, retro-futuristic, organic/natural, maximalist chaos, luxury/refined, playful/toy-like, industrial/utilitarian, art-deco/geometric, cyberpunk/neon, earthy/handcrafted, data-dense/trading-terminal, quiet/monastic.

---

## Territory 1 — Cultural / regional design lineages

### Muji / Kenya Hara's "Emptiness" (空)
**Essence (1-2 sentences):** Not Western minimalism (subtraction toward zero) but *kuu* — a prior openness designed to be *completed* by the user. The product is a vessel, not a statement.
**Anchor reference (cite real artifacts):** Kenya Hara's art direction at Muji (Mujirushi Ryohin) since 2001; his book *White* (2009); the Naoto Fukasawa "Without Thought" workshop; the wall-mounted CD player.
**What it teaches a UI mock the existing pole list doesn't:** "Brutally minimal" subtracts ornament. *Emptiness* subtracts *intent* — the UI doesn't tell you what it's for, it makes a clearing for you to bring your own purpose. Generous whitespace as invitation, not as restraint. Earth-tone neutrals, never pure black/white.
**Concrete hooks:**
- Palette: unbleached paper, beige cardboard, light grey, off-black ink, never #000 / #FFF
- Components: unframed cards, hairline 1px dividers in warm grey, no shadows, no rounded-on-purpose corners (use either sharp 0px or generous 16px+, never "modern 8px")
- Screens (pole label): `emptiness` — receipt-paper inventory, journaling apps, second-brain capture
- Flows / motion: no transition motion; cuts. Stillness is the language.
- Sound / haptics: none. Silence is the affordance.
- Project fit: writing tools, notes apps, anything where the user's content should outweigh the chrome

### Korean Density (KakaoTalk / Naver)
**Essence (1-2 sentences):** Information-rich grids and tile-stacks where the home surface is a *portal* to dozens of services, with mascot characters (Kakao Friends) and paid sticker packs as first-class UI economy — not decoration but currency.
**Anchor reference (cite real artifacts):** KakaoTalk's "More" tab (four-column tile grid, Kakao Friends shop, emoticon store with paid premium packs); Naver's portal homepage with stacked vertical modules. KakaoTalk's signature yellow (#FAE100). Kakao Friends as merchandise pipeline that loops back into the UI.
**What it teaches a UI mock the existing pole list doesn't:** "Data-dense / trading-terminal" treats density as professional. Korean density treats it as *friendly* — packed tiles with rounded cartoon characters, paid stickers that are gifted as social currency. The home screen IS the app store.
**Concrete hooks:**
- Palette: single saturated brand color (Kakao yellow, Naver green #03C75A) on warm cream/white, mascot accent colors
- Components: 4-column tile grid of icon+label, sticker picker as primary message component, badge counts everywhere
- Screens (pole label): `kakao-density` — super-portal home, messaging surface with sticker shop inline
- Flows / motion: peppy bounce on tile press, sticker entrance animations
- Sound / haptics: subtle pop on sticker send
- Project fit: messaging apps, super-portal home screens, anything with mascot-driven IP

### Chinese Super-App (WeChat / Alipay)
**Essence (1-2 sentences):** The app is an OS. The home is a router with mini-program icons in a nine-rectangle grid, payments + chat + government services + retail all stitched into one shell. Density is shallow (one tap deep), not nested.
**Anchor reference (cite real artifacts):** WeChat (Weixin) "Discover" tab, mini-program ecosystem launched 2017; Alipay's Service Center nine-grid; Ant Design Mini. Both platforms support mini-programs as a runtime, not as web shortcuts.
**What it teaches a UI mock the existing pole list doesn't:** Treats the app as a *shell* rather than a *product*. Navigation isn't a hierarchy, it's a launcher. Borrows from OS design (Android home, iOS Springboard), not from Western app design.
**Concrete hooks:**
- Palette: WeChat green #07C160 or Alipay blue #1677FF on system white, no brand expansion — the brand recedes so mini-programs read
- Components: 9-grid launcher, QR scan as primary entry point, in-line payment confirmation cards
- Screens (pole label): `super-app-shell` — launcher home, QR scanner, mini-program runtime container
- Flows / motion: shallow lateral push, no deep stack
- Sound / haptics: subtle confirm on QR scan
- Project fit: B2B platforms with many tools, internal-tool aggregators, anything that's a runtime not a destination

### Islamic Girih / Generative Geometry
**Essence (1-2 sentences):** A small set of five polygon tiles (decagon, pentagon, hexagon, bow-tie, rhombus) with strapwork lines that, by the 15th century at Darb-i Imam (Isfahan, 1453), generated near-perfect quasi-crystalline patterns five centuries before Penrose. The system is *generative*, not pictorial.
**Anchor reference (cite real artifacts):** Lu & Steinhardt, "Decagonal and Quasi-Crystalline Tilings in Medieval Islamic Architecture," *Science* (Feb 2007); the Darb-i Imam shrine; the Topkapı Scroll. Five girih tiles with internal strapwork.
**What it teaches a UI mock the existing pole list doesn't:** "Art-deco/geometric" gives you *finished* geometry. Girih gives you a *generator* — a tile-set the user can recombine. Pattern as system, not as decoration. Aperiodic order: it never repeats but feels coherent.
**Concrete hooks:**
- Palette: lapis, turquoise, ochre, ivory; high-contrast jewel tones on ivory ground
- Components: tile-set background generator (5 SVG primitives the page composes algorithmically), star-and-polygon framing for cards, strapwork dividers
- Screens (pole label): `girih-generative` — splash/empty states, pattern-as-watermark, data viz with tiling
- Flows / motion: pattern grows tile-by-tile as content loads
- Sound / haptics: n/a
- Project fit: data viz tools, generative-art platforms, anything where "infinite without repeating" is the brand promise

### Indian Chromolithograph / Calendar Art (Ravi Varma lineage)
**Essence (1-2 sentences):** Raja Ravi Varma's late-19th-c. press industrialized full-color religious prints that became the visual substrate of Indian calendar art, Bollywood posters, and street-vendor packaging — saturated, hand-painted-looking, gold-edged, every inch worked.
**Anchor reference (cite real artifacts):** Raja Ravi Varma Press, Lonavala/Karla (1894–); chromolithographs of *Shakuntala*, *Mohini*, *Victory of Indrajit*; hand-painted Bollywood posters of the 70s–90s (e.g. *Sholay*); modern Sabyasachi packaging.
**What it teaches a UI mock the existing pole list doesn't:** "Maximalist chaos" is Western internet. Chromolitho is *every surface decorated to the rim with the same religious-poster grammar*: gold filigree borders, garlands as dividers, deity-style portraiture, marigold and peacock tones.
**Concrete hooks:**
- Palette: marigold orange #FF9933, peacock teal #008080, hot pink #E91E63, gold #D4AF37, deep maroon
- Components: ornate gilded card frames, garland dividers, halo-framed avatars, full-bleed pattern fills
- Screens (pole label): `chromolitho` — festival/event apps, wedding planners, ticketing for cultural events
- Flows / motion: slow fades, no kinetic flair; the stillness of a printed poster
- Sound / haptics: tabla on success, harmonium on transitions (subtle, opt-in)
- Project fit: anything diaspora-targeted, festival/event commerce, devotional apps

### Barragán / Mexican Modernism Color
**Essence (1-2 sentences):** Luis Barragán pulled fuchsia-from-bougainvillea, terracotta-from-tabachín-flowers, jacaranda-lilac, and cobalt-from-sky into massive single-color planes — colors *sourced from the landscape*, not from a swatch deck.
**Anchor reference (cite real artifacts):** Casa Gilardi (Mexico City, 1976) with its pink wall and yellow corridor; Cuadra San Cristóbal (Los Clubes, 1968) with the pink wall and fountain; Barragán's own house in Tacubaya.
**What it teaches a UI mock the existing pole list doesn't:** "Luxury/refined" is European cream + black. Barragán is *plane after plane of a single saturated color* — pink wall, cobalt wall, magenta wall, each color occupying the entire field. UI as flat planes of dyed plaster, not as decoration.
**Concrete hooks:**
- Palette: bougainvillea pink #E64A85, jacaranda lilac #9B7BBF, tabachín red #C73E1D, cobalt #003B7A, ochre #C9974A, plaster ivory
- Components: full-bleed color blocks as section dividers, single-color backgrounds for entire screens, hand-drawn typographic accents
- Screens (pole label): `barragan` — onboarding, marketing splash, single-purpose pages
- Flows / motion: cuts between solid color planes (no fade — hard cut, like turning a corner)
- Sound / haptics: n/a
- Project fit: brand sites, photo galleries, anything that wants to feel *built* not *rendered*

### Nordic / Marimekko (the print-driven Nordic, not flatpack)
**Essence (1-2 sentences):** Maija Isola's *Unikko* (1964) — Armi Ratia had banned florals; Isola painted them anyway, huge brush-stroked poppies in a hand-cut repeat. The Nordic of confident pattern and oversized motif, not the Nordic of bleached pine.
**Anchor reference (cite real artifacts):** Marimekko *Unikko* (Maija Isola, 1964), *Kaivo*, *Lokki*; Alvar Aalto's Savoy vase (1936); Iittala glass; Arabia ceramics. The 1968 Pirkka collection.
**What it teaches a UI mock the existing pole list doesn't:** What people call "Scandinavian minimalism" is IKEA flatpack. The real Nordic is *one enormous brush-painted motif at oversized scale*, in 3–5 confident colors, with whitespace as the canvas, not the goal.
**Concrete hooks:**
- Palette: cream base #FAF6EE, poppy red #D6342B, navy #1B2A4E, sun yellow #F1C40F, soft fuchsia, leaf green
- Components: oversized hand-painted hero motif (SVG-stroke-feel), big confident typography, generous left margin
- Screens (pole label): `marimekko` — marketing pages, empty states with a single huge bloom, hero banners
- Flows / motion: motif slow-rotates or gently sways, brush-stroke draw-on entrance
- Sound / haptics: minimal
- Project fit: lifestyle brands, editorial commerce, anything where a single big visual statement carries the page

### West African Kente + Adinkra (Akan visual logic)
**Essence (1-2 sentences):** Kente weaves heraldic horizontal-strip color/pattern combinations where each pattern *names a value* (sika futuro = "gold dust"); Adinkra stamps are a vocabulary of ~80+ glyphic symbols each carrying an Akan proverb. The textile *speaks*.
**Anchor reference (cite real artifacts):** Asante and Ewe kente cloth (Bonwire, Ghana); Adinkra stamps printed with calabash on cloth (Adanwomase); symbols like *gye nyame* (supremacy of God), *sankofa* (return and fetch it), *dwennimmen* (humility and strength).
**What it teaches a UI mock the existing pole list doesn't:** Pattern as *language* — every stripe and stamp is denotative, not decorative. A library of named symbols that carry meaning, not a swatch of generic shapes. Horizontal strip composition as a layout system.
**Concrete hooks:**
- Palette: gold #D4AF37, kente green #006B3F, deep red #B22222, royal blue #002366, on black or white ground
- Components: horizontal-strip page sections (each section is a "strip"), Adinkra-glyph badges as status markers (sankofa for "undo/restore", gye nyame for "verified/canonical")
- Screens (pole label): `kente-strip` — dashboards built as horizontal woven strips, status systems with glyph vocabulary
- Flows / motion: weave-in entrance (strips slide in horizontally, alternating directions)
- Sound / haptics: n/a
- Project fit: diaspora-targeted apps, heritage products, dashboards where status carries proverbial meaning. **Risk note: do not flatten — these symbols belong to specific Akan communities; project must have cultural authority to use them, not pastiche.**

### Aboriginal Australian Dot-Painting Visual Logic
**Essence (1-2 sentences):** Papunya Tula's dot-painting movement (1971–) emerged when artists adapted *sacred-secret* sand-painting traditions onto board with acrylic, deliberately *obscuring* underlying iconography with dot fields so uninitiated viewers couldn't read what wasn't theirs to see.
**Anchor reference (cite real artifacts):** Papunya Tula Artists collective (founded 1972, Northern Territory); Geoffrey Bardon's role as catalyst (1971); the original ochre/charcoal/pipe-clay palette restriction (red, yellow, black, white).
**What it teaches a UI mock the existing pole list doesn't:** **Concealment as design intent.** UI usually reveals. Dot-painting teaches *deliberate obscuration* — a layer that protects information from viewers who shouldn't access it, without lying about its presence. A literal model for permission tiers / partial reveals.
**Concrete hooks:**
- Palette: strict ochre red, yellow ochre, black, white, optionally desert orange — restrict severely
- Components: dot-field skeleton loaders, mask overlays for permission-restricted content (you can see the *shape* of the data, not the data)
- Screens (pole label): `concealment` — permission-tier UIs, redaction views, "members only" gates
- Flows / motion: dots resolve outward to reveal cleared content
- Sound / haptics: n/a
- Project fit: anything with multi-tier access (medical, legal, classified). **Risk note: do NOT use traditional iconography. The lesson is the *concealment principle*, not the visual borrowing.**

### Mayan Codex Layout (Dresden Codex)
**Essence (1-2 sentences):** The Dresden Codex divides each tall narrow page into horizontal *t'ols* (red-banded sections), each subdivided into frames with paired columns of glyph-blocks read top-to-bottom-then-left-to-right within paired columns, mixing calendric, pictorial, and prophetic information at densities Western book design never approached.
**Anchor reference (cite real artifacts):** Dresden Codex (39 double-sided sheets, 20cm × 10cm pages, ~13th c. copy of earlier original); reading order: pp. 1–24, 46–74, 25–45; black + red primary with Maya blue, yellow, green.
**What it teaches a UI mock the existing pole list doesn't:** **The double-column-paired reading order.** Most UI assumes left-to-right linear or top-to-bottom column. Maya double-columns read two-glyphs-across, top-to-bottom — a third reading topology. Plus: red-banded section dividers as *strong* visual chapter markers, not subtle whitespace gaps.
**Concrete hooks:**
- Palette: Maya blue #73C2FB, ochre yellow, vermilion red, charcoal black, plaster off-white
- Components: narrow tall content columns (~2:5 ratio), bold red horizontal bands between sections, paired-column reading layouts for dense reference content
- Screens (pole label): `codex` — reference docs, calendrical/almanac apps, dense vertical timelines
- Flows / motion: page-turn (book metaphor) not scroll
- Sound / haptics: n/a
- Project fit: ephemeris/almanac apps, manuscript-style readers, anything tall-narrow-densely-illustrated

### Persian Miniature Framing (Safavid muraqqa album)
**Essence (1-2 sentences):** Safavid manuscript painting nests the picture inside *layered ornamental margins* (gold-flecked paper, scrolling-floral borders, polychrome rules) — the frame is half the artwork. Inside, multiple viewpoints coexist on a flat picture-plane; perspective is *narrative*, not optical.
**Anchor reference (cite real artifacts):** Shahnameh of Shah Tahmasp (c. 1525–1535); Bihzad's late-15th-c. miniatures; the muraqqa (album) format with composite-margin pasted pages.
**What it teaches a UI mock the existing pole list doesn't:** **Frames as content.** The plugin's existing "editorial/magazine" pole treats frame as restraint. Safavid teaches *multi-layered ornamental framing* — gold scrolling outer border, polychrome inner rule, then the content. Plus multi-viewpoint flat composition (top-down floorplan, side-view person, oblique tree, all coexisting).
**Concrete hooks:**
- Palette: lapis blue, gold leaf, vermilion, malachite green, ivory paper
- Components: nested SVG ornament frames around hero content, axonometric+plan+elevation mixed in single diagrams
- Screens (pole label): `muraqqa` — hero detail pages, premium content cards, story-mode viewers
- Flows / motion: gentle ornament-trace entrance (gold filigree draws in around the frame)
- Sound / haptics: n/a
- Project fit: storytelling platforms, premium long-form reading, anything that wants the *artifact-ness* of a manuscript

### Soviet Constructivism (Rodchenko / Stepanova / Klutsis)
**Essence (1-2 sentences):** Photomontage + heavy slab and grotesque typefaces at multiple scales within one sentence + aggressive diagonal compositions + red/black/cream palette designed for cheap two-color printing — propaganda graphics that became the source code for Western "modern" graphic design.
**Anchor reference (cite real artifacts):** Rodchenko's *Lengiz: Books in All Branches of Knowledge* (1924); Stepanova's textile designs; Klutsis's photomontage posters; the journal *LEF*; El Lissitzky's *Beat the Whites with the Red Wedge* (1919).
**What it teaches a UI mock the existing pole list doesn't:** **Diagonal composition as a primary axis.** UI is overwhelmingly orthogonal. Constructivism rotates the entire grid 15–30° and runs typography along that axis. Also: multi-typeface multi-scale within a single headline, photomontage-as-image style.
**Concrete hooks:**
- Palette: vermilion red #C8102E, black, cream/off-white, optional yellow accent
- Components: rotated grid, slab+grotesque mixed in one headline, geometric photo-cutout collage as imagery
- Screens (pole label): `constructivist` — campaign landing pages, manifesto/about pages, agitprop-feeling marketing
- Flows / motion: hard wedges sliding diagonally in from edges
- Sound / haptics: n/a
- Project fit: politically charged brands, manifesto sites, anything where you want a *position* not a *product*

### Brazilian Modernism (Niemeyer + Bulcão azulejo)
**Essence (1-2 sentences):** Oscar Niemeyer's sculptural concrete + Athos Bulcão's permutational azulejo tile murals — the building's curves are the volume, but Bulcão's tiles are the *texture grammar*, with a small set of simple geometric tiles combined in non-repeating combinations across whole facades.
**Anchor reference (cite real artifacts):** Brasília's Igreja de Nossa Senhora de Fátima (Niemeyer + Bulcão, 1958) with its blue-and-white tiled exterior; the Brasília Palace Hotel; Bulcão's tile mural at the Aeroporto JK.
**What it teaches a UI mock the existing pole list doesn't:** **Permutational tile-grammar.** Same primitives as Islamic girih, but two-tone (blue/white) and non-religious, in service of sculptural modernist architecture. Tropical optimism: white space + curvy sculptural volumes + a single accent of tiled blue.
**Concrete hooks:**
- Palette: bright white, Bulcão blue #1F4FA8, accent of canary yellow, samba pink or jungle green
- Components: tiled-pattern hero backgrounds (2–4 primitive tiles, non-repeating combination), curved-section dividers (not straight lines)
- Screens (pole label): `bulcao` — tropical-modern landing pages, civic/government apps with optimism
- Flows / motion: parallax of curved white forms over tile-pattern background
- Sound / haptics: n/a
- Project fit: latin-american-targeted apps, civic-tech, anything that wants modernism with *warmth*

---

## Territory 2 — Sensory dimensions beyond the screen

### Earcons (Blattner/Sumikawa/Greenberg taxonomy)
**Essence (1-2 sentences):** Earcons are *synthesized non-speech audio messages* with a structured grammar — Blattner, Sumikawa & Greenberg (1989) defined four formations: one-element, compound, hierarchical (where pitch/timbre denote hierarchy depth), and transformational. Not just sound effects: a *vocabulary*.
**Anchor reference (cite real artifacts):** Sumikawa (1985), "Guidelines for the integration of audio cues into computer user interfaces"; Blattner, Sumikawa, Greenberg (1989) *Human-Computer Interaction*; Jim Reekes' Macintosh startup chime (Quadra 840AV onward); the Windows 95 startup sound (Brian Eno).
**What it teaches a UI mock the existing pole list doesn't:** Sound design as a *typed* vocabulary, not decoration. The plugin currently has nothing on audio. A "save" earcon should share timbre with "auto-save" and differ by pitch from "delete." A *family* of related sounds, not a collection of one-offs.
**Concrete hooks:**
- Sound: define 1–2 base motifs (3-note patterns), then transform by pitch shift / timbre / duration for related actions (save → autosave → save-as)
- Components: muted vs. emphatic variants for foreground/background
- Project fit: any app where audio confirmation matters (financial, medical), accessibility-first apps

### Apple Taptic Engine / Core Haptics Vocabulary
**Essence (1-2 sentences):** Apple's haptics are parameterized along *intensity* (force) and *sharpness* (synthetic vs. organic feel), composed into AHAP (Apple Haptic and Audio Pattern) files that pair haptic events with audio. The vibration has *vocabulary*.
**Anchor reference (cite real artifacts):** Core Haptics framework (iOS 13, WWDC 2019 sessions 520 & 223); Taptic Engine (iPhone 6s onward); AHAP file format; the iPhone notification distinction (text vs. urgent vs. email).
**What it teaches a UI mock the existing pole list doesn't:** Haptic as a *typed feedback channel* parallel to color. Same logic as earcons but tactile. Plus the principle that haptics + audio must be *co-designed* — the AHAP file pairs them deliberately.
**Concrete hooks:**
- Haptics: define intensity/sharpness pairs per interaction class (light-tick for hover-confirm, sharp-strong-pulse for error, soft-organic-rolling for swipe-to-refresh)
- Components: haptic preview chip in design-system docs (button hover shows a haptic descriptor)
- Project fit: mobile-first apps, accessibility, anything where the user holds the device

### Voice UI / Turn-Taking (the Cortana / Alexa lineage)
**Essence (1-2 sentences):** Voice exists in *time only* — there's no scrolling back. Turn-taking, endpointing (knowing when the user stopped speaking), and *error-recovery-as-primary-discipline* are the craft. The Cortana failure was treating voice as a screen with audio bolted on.
**Anchor reference (cite real artifacts):** Cathy Pearl's *Designing Voice User Interfaces* (O'Reilly, 2016); Alexa Skills Kit's interaction model; Google's *Conversation Design* guide; the well-documented Cortana shutdown (Microsoft, 2023).
**What it teaches a UI mock the existing pole list doesn't:** **Reprompts and confirmations as first-class design.** UI mocks rarely think about "what does the system say when the user goes silent?" or "what's the second-utterance recovery?" Voice forces both. Also: persona writing as a real design surface.
**Concrete hooks:**
- Flows: every conversational state declares: confirmation phrasing, reprompt phrasing, max-reprompt-then-handoff fallback
- Components: persona style guide (vocabulary range, sentence length, formality, voice gender/age) as a design token
- Sound: SSML-tagged response variants, not flat TTS
- Project fit: voice-first apps, hands-free interfaces, accessibility, kitchen/car/clinical-glove use cases

### Chat-First (Conversational, not Voice)
**Essence (1-2 sentences):** The chat surface as primary UX — Slack, Discord, ChatGPT, WhatsApp Business — where the *thread is the application*. Different from voice: persistent, scrollable, supports rich blocks inline.
**Anchor reference (cite real artifacts):** Slack Block Kit; Telegram's bot inline-keyboard; Discord's slash-command UI; ChatGPT's system+user+assistant threading; WeChat Official Accounts.
**What it teaches a UI mock the existing pole list doesn't:** **The message as a layout primitive.** Cards, forms, choice-chips embedded *inside* a chat bubble. The thread scrolls; the inline blocks are stateful. Composition shifts from page-as-canvas to message-as-canvas.
**Concrete hooks:**
- Components: rich message blocks (cards-in-bubble), choice-chip rails, inline forms, ephemeral system messages
- Screens (pole label): `chat-canvas` — assistant UIs, support chat with rich cards, bot-driven workflows
- Flows / motion: typing indicator (3-dot bounce), streaming-token reveal, message-arrival slide-up
- Sound / haptics: sub-audible tick on incoming message
- Project fit: AI assistants, customer support, anything where the user's input shapes the next surface

### visionOS Spatial / Glass Material
**Essence (1-2 sentences):** Apple Vision Pro replaces z-index with *literal depth*; the "spatial window" is rendered in a Glass Material that adapts to the user's actual room lighting. Motion isn't polish — it's the feedback channel that *replaces* haptics (eyes are cursor, pinch is click).
**Anchor reference (cite real artifacts):** visionOS Human Interface Guidelines; WWDC23 *Design for spatial user interfaces*; Vision Pro launch (Feb 2024); the visionOS Glass Material specification.
**What it teaches a UI mock the existing pole list doesn't:** **Depth as layout primitive** (not as z-index implementation detail). Plus: motion as the *only* feedback when haptics aren't available — entrance/exit choreography becomes the language.
**Concrete hooks:**
- Palette: low-saturation; vibrancy adapts to environment; soft frosted-glass for chrome
- Components: floating windows with parallax and blur, deep tap-target minimums (60pt), eye-hover states
- Screens (pole label): `spatial` — XR apps, glanceable productivity, ambient dashboards
- Flows / motion: depth-traversal transitions (push *into* the scene, not push across), parallax on head motion
- Sound / haptics: subtle audio cue replaces haptic confirmation
- Project fit: any XR or spatial product, future-leaning prototypes

### Tangible Bits (Ishii / MIT Tangible Media Group)
**Essence (1-2 sentences):** Hiroshi Ishii's 1997 CHI paper proposed bridging *bits and atoms* via three layers: interactive surfaces, graspable physical objects coupled to digital state, and ambient media (light, sound, airflow) for *peripheral* awareness. The vision is "Painted Bits" (GUI) being superseded by tangible computing.
**Anchor reference (cite real artifacts):** Ishii & Ullmer, *Tangible Bits* (CHI '97); the metaDESK; the ambientROOM; the Dangling String (Natalie Jeremijenko at Xerox PARC); Radical Atoms (2012 update).
**What it teaches a UI mock the existing pole list doesn't:** **Peripheral / ambient as a real channel.** Screens own foreground attention. Tangible Bits says background — gentle light shifts, airflow, ambient audio — is its own UI tier. Plus: *coincidence of input and output space* (manipulate where you display).
**Concrete hooks:**
- Components: peripheral indicator strip (one corner of the screen reserved for ambient pulse), state-as-light not state-as-text
- Screens (pole label): `ambient-bits` — monitoring dashboards where calm > attention, IoT control surfaces
- Flows / motion: slow drift, no demands
- Sound: light environmental tones for background state
- Project fit: smart-home, monitoring, anything where the app's job is to *not* interrupt

### Calm Technology (Weiser / Brown)
**Essence (1-2 sentences):** Weiser & Brown (1995) — *that which informs but doesn't demand our focus or attention.* Information shifts between periphery and center as needed. The best computer is "a quiet, invisible servant." Caseorganic's eight principles update this for modern IoT.
**Anchor reference (cite real artifacts):** Weiser & Brown, *Designing Calm Technology* (1995); Amber Case's *Calm Technology* (O'Reilly, 2015); the eight principles (e.g., "Technology should require the smallest possible amount of attention").
**What it teaches a UI mock the existing pole list doesn't:** **Notification taxonomy** beyond "send it / don't send it" — calm tech ranks signals by required attention (peripheral → glanceable → notification → interrupt) and defaults to the lowest tier that achieves the goal.
**Concrete hooks:**
- Components: 4-tier signal taxonomy in the design system (ambient, glance, notify, interrupt), with style/sound/haptic per tier
- Flows: every notification design includes a downgrade path ("can this be peripheral instead?")
- Project fit: IoT, wearables, calendaring, anything that risks notification overload

### Wearable / Glanceable (Apple Watch)
**Essence (1-2 sentences):** Users check their watch 60–80×/day; each glance is 2–3 seconds; content >20 chars drops engagement >38%. The Watch is a *constrained-time, constrained-space* design problem with a complication grammar (Modular, Utilitarian, Circular, Graphic Corner/Bezel).
**Anchor reference (cite real artifacts):** watchOS HIG; Apple Watch complication API; the Modular/Infograph face families; David Smith's *Pedometer++* complications.
**What it teaches a UI mock the existing pole list doesn't:** **The glance budget.** 2–3 seconds means hierarchy is *brutal*: one number, one label, maybe one trend arrow. Plus: complications as a *named slot system* — each slot has a contract (one short value, one label).
**Concrete hooks:**
- Components: glance card (one-number-one-label), complication slot grammar, ring/dial primitives
- Screens (pole label): `glanceable` — wearable, lockscreen widgets, vehicle dashboards
- Flows / motion: instant; no transitions over ~200ms
- Project fit: fitness, vital monitoring, transit, anything checked dozens of times a day

### Screen-Reader-First / Semantic Tree as Source of Truth
**Essence (1-2 sentences):** Inverting the usual order: design the accessibility tree first, then derive the visual. The *named* DOM (proper roles, labels, landmarks) becomes the canonical UI, and the visual is a *projection* of the semantic tree, not the other way around.
**Anchor reference (cite real artifacts):** WAI-ARIA Authoring Practices; the WebAIM Million annual report; GitHub's accessibility-first refactors; Stripe's documented a11y workflow; VoiceOver/NVDA/TalkBack as canonical clients.
**What it teaches a UI mock the existing pole list doesn't:** **The mock should include a screen-reader transcript.** Currently no mock format includes "what would VoiceOver read?" as an artifact. Making the transcript a first-class deliverable forces semantic structure into the mockup phase.
**Concrete hooks:**
- Components: every component spec includes its ARIA role, name pattern, and live-region behavior
- Mock format: add an SR-transcript pane to each mock (collapsed by default)
- Flows: keyboard-only path documented alongside pointer path
- Project fit: anything serving the public sector, education, healthcare; *generally everything*

---

## Territory 3 — Game UI lineages

### Persona 5 — UI as Character
**Essence (1-2 sentences):** Masayoshi Sutoh's UI is *the* gold-standard of menu-as-character: ransom-note typography inspired by Sex Pistols album covers, halftone silhouettes mid-action, angular skewed shapes, all animating on every menu open — and yet remains scannable because Sutoh anchored the gaze with a central white sightline.
**Anchor reference (cite real artifacts):** Persona 5 (Atlus, 2016); Sutoh has done UI on Atlus titles since Shin Megami Tensei III (2003); the CyDesignation panel on its concept and development.
**What it teaches a UI mock the existing pole list doesn't:** **Functionality survives maximalism if you anchor the sightline.** "Maximalist chaos" usually sacrifices readability. Persona 5 doesn't — the trick is a single white line through every screen that the eye locks onto.
**Concrete hooks:**
- Palette: black + signal red #E50914 + white, with halftone gradients
- Components: skewed/angular cards (never axis-aligned), ransom-note headings (mixed-weight mixed-case), character-silhouette accents
- Screens (pole label): `persona-menu` — paid-tier toggle screens, game-like configurators, entertainment apps
- Flows / motion: every menu open is an animated sequence (cards flip in from offscreen with timing offsets, halftone slides in behind)
- Sound / haptics: chime on every menu transition, click-clack on selection
- Project fit: entertainment, music, gaming-adjacent, brands with a *character*

### Soulslike Minimalism (Dark Souls / Elden Ring)
**Essence (1-2 sentences):** Dark Souls' UI is *almost absent*: two thin bars (HP, stamina), one item slot, no map, no quest log. Every element that *is* present is loaded — the bonfire icon, the level-up "you died" — because the silence around them makes them weigh more.
**Anchor reference (cite real artifacts):** Dark Souls (FromSoftware, 2011); Elden Ring (2022); contrast with the dense Bethesda UI of the same era.
**What it teaches a UI mock the existing pole list doesn't:** **Restraint by removal, not by minimalist styling.** "Brutally minimal" minimizes chrome but keeps the affordances. Soulslike removes *affordances* — no map at all, no waypoint, no fast-travel-shown-on-mini-map. The user navigates by *memory and environment*.
**Concrete hooks:**
- Palette: near-black background, parchment-yellow text, dried-blood red for critical state
- Components: HP bar that hides when full, no breadcrumb, no progress bar (or only on hover)
- Screens (pole label): `soulslike` — focus modes, distraction-free writing, single-task tools
- Flows / motion: slow fade-in on text, no flourish; UI appears only when the player asks
- Sound / haptics: heavy single chime for important events, nothing else
- Project fit: writing tools, meditation apps, distraction-free task runners

### Diegetic UI (Dead Space)
**Essence (1-2 sentences):** Glen Schofield and Bret Robbins' Dead Space (2008) put the entire HUD inside the world: HP bar on the character's spine as a holographic glow, ammo projected from the gun, inventory as a holographic panel Isaac himself opens — and *the game doesn't pause when you do*.
**Anchor reference (cite real artifacts):** Dead Space (Visceral Games / EA, 2008); Schofield's GDC talks on its design; Dead Space 2's continued diegetic refinement; the 2023 remake.
**What it teaches a UI mock the existing pole list doesn't:** **UI as a property of the world, not the chrome.** Health is a glowing line on the suit. Inventory is a hologram the character actually projects. The "menu" lives *inside* the diegesis. Plus: no pause — the world keeps running while you "open the menu."
**Concrete hooks:**
- Components: status indicators integrated into product imagery (battery on the device illustration, not in a corner badge), inventory as a 3D scene
- Screens (pole label): `diegetic` — hardware companion apps, vehicle dashboards, AR overlays
- Flows / motion: world doesn't freeze for menus
- Sound / haptics: hologram-activation sound (warble + click)
- Project fit: hardware accessory apps, AR/XR, automotive

### EVE Online — Spreadsheet-as-UI
**Essence (1-2 sentences):** CCP Games' EVE Online ("spreadsheets in space") embraced the spreadsheet so completely that in 2022 it shipped an *official Microsoft Excel add-in* for in-game data. The Overview panel is literally a sortable filterable table — and the players asked for *more* of that, not less.
**Anchor reference (cite real artifacts):** EVE Online (CCP, 2003); the 2022 official Excel integration ("Information is Power" release); the Overview window; Jita 4-4 market interface.
**What it teaches a UI mock the existing pole list doesn't:** **For some users, the spreadsheet IS the dream.** "Data-dense / trading-terminal" is the existing pole — but EVE goes further: *the game's main interface is sortable tables, and shipping an Excel plugin was a feature, not an admission of defeat.*
**Concrete hooks:**
- Components: sortable / filterable / column-pickable tables as primary surface, "export to CSV" as a first-class action on every table
- Screens (pole label): `overview-table` — analytics tools, traders, ops dashboards where power-users want to *take the data with them*
- Flows / motion: instant sort; no animation on column reorder (latency is the enemy)
- Project fit: power-user analytics, B2B ops, anything with sophisticated users who'd rather Excel

### Roguelike ASCII (NetHack / Caves of Qud)
**Essence (1-2 sentences):** NetHack and Caves of Qud render entire worlds in monospaced characters — a `@` is you, `d` is a dog, `&` is a demon. Information density per glyph is brutal: color + character + position together encode entity, faction, state, intent. Caves of Qud overlays this with retrofuturistic prose, marrying ASCII with literary depth.
**Anchor reference (cite real artifacts):** NetHack (1987–present); Caves of Qud (Freehold Games, 2015–present); Cogmind; Brogue (with the "ASCII can be beautiful" thesis); roguelikeradio.com on tilesets vs. ASCII.
**What it teaches a UI mock the existing pole list doesn't:** **A character is a *type* not a *picture*.** "Data-dense" uses tables of values. ASCII roguelikes use a *legend* — the same vocabulary scales from one entity to ten thousand. Plus: color-as-attribute (red `d` is hostile dog, blue `d` is tame).
**Concrete hooks:**
- Palette: terminal 16-color (or full xterm-256), bold = attribute modifier
- Components: legend panel always visible, monospace grid as canvas, hover-for-detail
- Screens (pole label): `roguelike` — sysadmin tools, process monitors, debuggers, anything where the screen is a *world*
- Flows / motion: discrete steps; turn-based feel even when async
- Sound: terminal bell on event
- Project fit: dev tools, ops dashboards, retro-cool tooling

### Stardew Valley / Cozy Pixel
**Essence (1-2 sentences):** ConcernedApe's solo-built UI is warm-pixel: 16-bit-feeling sprites, hand-drawn dialog portraits, soft amber/cream palette, slow non-punishing pacing. Every UI element feels *touched*.
**Anchor reference (cite real artifacts):** Stardew Valley (Eric Barone / ConcernedApe, 2016); compare to Hollow Knight (Team Cherry, 2017) and Celeste (Maddy Thorson / EXOK, 2018) for the broader "soulful indie" lineage.
**What it teaches a UI mock the existing pole list doesn't:** **Warmth as a design quality.** The existing "playful/toy-like" pole leans synthetic-plastic. Cozy-pixel is warm-paper, hand-pixeled, soft-amber. Friendliness without flatness.
**Concrete hooks:**
- Palette: cream #F4E4BC, soft amber #D4A574, leaf green #8FBC8F, sky blue #87CEEB
- Components: pixel-art icons, dialog portrait + text box, inventory grid with chunky 32px cells
- Screens (pole label): `cozy-pixel` — habit trackers, gardening apps, kid-friendly tools, sleep apps
- Flows / motion: gentle bounce, no harsh transitions, page-turn metaphor
- Sound: ukulele/pizzicato chimes, footsteps on grass
- Project fit: wellness, journaling, family-shared apps, anything soft-and-slow

### Hollow Knight / Celeste — Soulful Pixel Restraint
**Essence (1-2 sentences):** Hollow Knight's UI is parchment-on-black with single-pixel hairline ornament; Celeste's is glyph-only with chromatic-aberration accents. Both prove pixel art doesn't have to be cozy — it can be *austere and reverent*.
**Anchor reference (cite real artifacts):** Hollow Knight (Team Cherry, 2017); Celeste (EXOK, 2018); Hyper Light Drifter (Heart Machine, 2016) as a parallel.
**What it teaches a UI mock the existing pole list doesn't:** **Pixel art for melancholy, not cuteness.** Negative space, single-pixel detail, no dialog portraits, glyph-based menus. The soulful indie variant of pixel that the cozy-pixel pole doesn't cover.
**Concrete hooks:**
- Palette: near-black background, parchment cream, single accent (Hollow Knight pale ghost-white, Celeste hot pink/red)
- Components: glyph-only icons, single-pixel hairline ornament, no chrome
- Screens (pole label): `melancholy-pixel` — narrative games, mood-trackers, contemplative reading
- Flows / motion: slow fades, never bounces
- Sound: piano single notes, no melodies
- Project fit: poetry apps, meditation, narrative-driven products

### Tutorial-by-Environment (Half-Life 2 / Portal)
**Essence (1-2 sentences):** Valve never shows you "Press E to interact" as a popup — they put a single solvable puzzle in your path that *requires* the mechanic, design the lighting/composition to guide your gaze, and reveal the affordance through use. Portal numbers its chambers so the player always knows where they are in the curriculum.
**Anchor reference (cite real artifacts):** Half-Life 2 (Valve, 2004) — the gravity gun rooms in Ravenholm; Portal (Valve, 2007) — the numbered test chambers; Valve's *Designing Half-Life 2's Levels* GDC content.
**What it teaches a UI mock the existing pole list doesn't:** **Onboarding as level design, not as modal popups.** UI usually onboards with tooltip-tour overlays. Half-Life 2 onboards by *shaping the environment* so the next move is obvious without any chrome at all.
**Concrete hooks:**
- Components: progressive disclosure via *content* not tooltips (the empty state itself teaches), curriculum chapter numbers always visible
- Flows: first-run designs the first 3 user actions as a forced curriculum (like Portal's chambers 00–01–02)
- Project fit: anything with a learning curve — design tools, IDEs, instruments

### Loading-Screen-as-Content (Bayonetta / EDF / Bloodborne)
**Essence (1-2 sentences):** PlatinumGames' Bayonetta (2009) turned the loading screen into a combo-practice playground with a real-time move-count and full move list — *making the wait time useful*. EDF puts war-tips on loaders; Bloodborne uses them for hint lore.
**Anchor reference (cite real artifacts):** Bayonetta (PlatinumGames / Sega, 2009) — patent: US7976372B2 (Namco's "auxiliary game during loading"); EDF series tips; Bloodborne loading hints.
**What it teaches a UI mock the existing pole list doesn't:** **Wait time as a feature surface.** Skeleton screens minimize *perceived* wait. Bayonetta does the opposite — extends wait *deliberately* by giving you something useful. Inverts the Doherty-threshold instinct: long load + useful content > short load + dead time.
**Concrete hooks:**
- Components: interactive loading state (mini-tutorial, tip-of-the-day, optional quick-action), not just a spinner
- Flows: long async operations get a real surface, not a modal
- Project fit: data-heavy enterprise tools, AI generation apps with multi-second waits

### Death Stranding — Map-as-Hero
**Essence (1-2 sentences):** Kojima Productions' Death Stranding makes the *terrain map* the primary surface — players spend more time planning routes than fighting. Death Stranding 2 (2025) rebuilt this as a voxel-rendered 3D map with the navigation as the gameplay.
**Anchor reference (cite real artifacts):** Death Stranding (Kojima Productions, 2019); Death Stranding 2 (2025); the GDC 2025 session "Making of Voxel 3D UI Map"; the Decima engine.
**What it teaches a UI mock the existing pole list doesn't:** **Map as primary UI, not as accessory.** Most apps treat maps as a tab. Death Stranding teaches *map-as-canvas* — every other UI element is a popover over the map, and *planning the route* is the dominant interaction.
**Concrete hooks:**
- Components: full-canvas map, popover panels, planning-mode toolbar with route segments
- Screens (pole label): `map-canvas` — logistics, delivery, hiking/exploration, real-estate, field-service
- Flows / motion: planning is a deliberate mode-switch, not a side-panel
- Sound: subtle terrain audio
- Project fit: logistics, fieldwork, urban planning, anything where geography IS the data

### AAA HUD (the everything-visible problem)
**Essence (1-2 sentences):** Modern AAA games — *Destiny 2*, *The Division*, *Far Cry* — must show health, shields, ammo, mini-map, compass, objective marker, ability cooldowns, enemy radar, kill-feed, and reticle simultaneously without overwhelming. The solution is *spatial partition*: each corner owns one concern, with fade-in-on-change.
**Anchor reference (cite real artifacts):** Destiny 2 (Bungie); The Division 2 (Ubisoft Massive); Far Cry 6; the Game UI Database has 200+ AAA HUD examples; GDC talk "Designing the HUD of Destiny."
**What it teaches a UI mock the existing pole list doesn't:** **Spatial budgeting under maximum density.** "Data-dense / trading-terminal" assumes the user is studying the screen. AAA HUD assumes the user is *not* — peripheral vision must read it. Each corner gets one channel; nothing competes for the same retina region.
**Concrete hooks:**
- Components: corner-budgeted HUD (4 corners + center reticle), each element on its own fade-on-change timer
- Screens (pole label): `aaa-hud` — pilot/driver dashboards, broadcast overlays, control rooms
- Flows / motion: persistent elements fade to 30% then snap to 100% on change
- Project fit: live ops, broadcast, vehicle UI, anything peripheral-vision-driven

---

## Territory 4 — Motion / animation lineages

### Disney's 12 Principles → UI
**Essence (1-2 sentences):** Frank Thomas and Ollie Johnston's *Illusion of Life* (1981) codified 12 principles — squash & stretch, anticipation, staging, straight-ahead vs. pose-to-pose, follow-through, slow-in/slow-out, arcs, secondary action, timing, exaggeration, solid drawing, appeal. Every one maps to a UI motion pattern.
**Anchor reference (cite real artifacts):** Thomas & Johnston, *The Illusion of Life: Disney Animation* (1981); the 1937 Snow White production studies; subsequent IxDF and Material Design recapitulations.
**What it teaches a UI mock the existing pole list doesn't:** **A motion vocabulary, not a duration spec.** The plugin currently doesn't address motion at all. Disney gives 12 named patterns the design system can refer to as *first-class motion tokens* (e.g., "this transition uses anticipation+follow-through").
**Concrete hooks:**
- Tokens: 12 named motion patterns as design tokens; every component spec declares which principles its motion uses
- Components: squash-on-press buttons, anticipation-flick on modal-open, follow-through on swipe-dismiss
- Project fit: any motion-heavy product; especially toy/playful/educational

### Pixar Brevity / Return-to-Rest
**Essence (1-2 sentences):** Pixar's UI sensibility in shorts and credits — short loops, motion that *returns to rest*, never an infinite scroll-loop. Movement is a sentence with a period, not an ellipsis.
**Anchor reference (cite real artifacts):** Pixar shorts *Geri's Game* (1997), *For the Birds* (2000); the studio's signature ident animation; Pixar's Khan Academy "Pixar in a Box" series on animation timing.
**What it teaches a UI mock the existing pole list doesn't:** **Loops should resolve.** Most loading spinners spin forever. Pixar teaches: motion *arrives* at rest, then waits. The pause IS the design.
**Concrete hooks:**
- Tokens: every motion must declare a rest state; infinite-loop motion is banned outside of a few explicit places (true indeterminate progress)
- Components: skeleton with breathe + pause (not breathe-forever), success-checkmark with a settle-frame
- Project fit: any product where calm matters; the opposite of game-HUD pulsing

### Studio Ghibli — Ma (間)
**Essence (1-2 sentences):** Miyazaki's *ma* — the active stillness between actions — is the breath that makes the action mean something. Demonstrated to Roger Ebert with a hand-clap: "the time in between my clapping is ma."
**Anchor reference (cite real artifacts):** Miyazaki/Ebert exchange (Spirited Away press, 2002); the train scene in *Spirited Away* (2001); the bench scene in *My Neighbor Totoro* (1988); the wind-watching in *The Wind Rises* (2013).
**What it teaches a UI mock the existing pole list doesn't:** **Designed pauses between transitions.** "Sub-400ms" obsesses over speed. Ma teaches the *250ms held breath* — after the modal animates in, hold it dead-still for a beat *before* the user can interact. The pause focuses attention.
**Concrete hooks:**
- Tokens: `hold` token (a deliberate non-animated stillness slot) inserted between segments of complex transitions
- Flows: every multi-step transition includes an explicit pause beat
- Project fit: contemplative apps, premium feel, anything where the user benefits from being *slowed down*

### Studio Trigger / Imaishi — Smear Frames & Impact Frames
**Essence (1-2 sentences):** Hiroyuki Imaishi (ex-Gainax, founded Trigger in 2011 with Ōtsuka) — *Gurren Lagann*, *Kill la Kill*, *Promare* — built his style on Yoshinari-style smear frames (1-frame deformed in-betweens) and impact frames (1–2 high-contrast freeze frames marking a hit). Energy via *deliberate ugliness for 1/24th of a second*.
**Anchor reference (cite real artifacts):** Imaishi's *RE: Cutie Honey* (2004) "wiggly noodle" sequence; *Gurren Lagann* (2007); *Kill la Kill* (2013); *Promare* (2019); Yoshinari's Evangelion cuts as ancestor.
**What it teaches a UI mock the existing pole list doesn't:** **Single-frame distortion is more energetic than smooth motion.** Material Design's "emphasized" curve is still continuous. Trigger-style says: *one frame of deformation* (a 1-frame stretch, then snap to final) reads as more powerful than 200ms of smoothed easing.
**Concrete hooks:**
- Tokens: `smear-1f` and `impact-1f` motion variants (a single-frame intermediate state with extreme deformation)
- Components: button press with 1-frame stretch then immediate settle, success with 1-frame all-white flash
- Project fit: gamified, youth-targeted, anything that wants *kinetic personality*

### Aardman / Laika — Hand-Touched Stop-Motion Texture
**Essence (1-2 sentences):** Aardman's Wallace & Gromit (clay) and Laika's Coraline / Kubo (3D-printed replacement-animation faces) keep deliberate human imperfection in the frame — fingerprints in clay, the slight wobble of a stop-motion arc. The texture says "made," not "rendered."
**Anchor reference (cite real artifacts):** Aardman *Wallace & Gromit: The Wrong Trousers* (1993); *Chicken Run* (2000); Laika *Coraline* (2009), *Kubo and the Two Strings* (2016); the 3D-printed-face replacement-animation pipeline.
**What it teaches a UI mock the existing pole list doesn't:** **Imperfection-as-signal.** "Earthy/handcrafted" suggests texture. Stop-motion teaches *time-imperfection*: a hand-keyed motion with one or two off-beat frames reads as more alive than a 60fps spline. Wobble is a feature.
**Concrete hooks:**
- Motion: ~12fps stepped (not 60fps eased) interpolation for select elements (a "hand-keyed" channel)
- Components: hand-drawn SVG with subtle stroke jitter, illustrations with visible fingerprints/grain
- Project fit: artisan/craft brands, family-targeted, anything anti-tech-sleek

### Saul Bass → Kyle Cooper — Kinetic Typography Lineage
**Essence (1-2 sentences):** Saul Bass (Vertigo, North by Northwest, Anatomy of a Murder) treated film titles as choreographed graphic design. Fincher commissioned Cooper for Se7en (1995); Cooper hand-etched type onto scratchboard, manipulated during transfer to smear and jitter. The Se7en sequence is "arguably the most imitated main title ever made."
**Anchor reference (cite real artifacts):** Saul Bass title sequences for Hitchcock (Vertigo, 1958; Psycho, 1960) and Preminger; Kyle Cooper at R/Greenberg, then Imaginary Forces; Se7en (1995); the NYT Magazine citation.
**What it teaches a UI mock the existing pole list doesn't:** **Text moves with the choreographic precision of a dancer.** Most UI animates type with fades or slides. Bass/Cooper lineage stages type as the *subject* — type is the actor, not the label.
**Concrete hooks:**
- Components: title-card section dividers where the typography performs the transition
- Motion: hand-jitter overlay on certain headings (sub-pixel translate noise), letter-by-letter reveal with offset timing
- Project fit: editorial, opening sequences for premium products, marketing splashes

### Spring Physics (Bret Victor, iOS spring curves, Framer)
**Essence (1-2 sentences):** Real springs — defined by stiffness, damping, mass, initial velocity — produce motion that feels alive because the system's parameters match physics, not because we hand-tuned 4 cubic-bezier coefficients. Bret Victor's *Inventing on Principle* (2012) and Apple's UIViewPropertyAnimator made spring-by-default a thing.
**Anchor reference (cite real artifacts):** Bret Victor, *Inventing on Principle* (CUSEC 2012); iOS UIView spring animations; React Spring / Framer Motion's spring API; Material 3 "spring-based emphasized" motion (2023).
**What it teaches a UI mock the existing pole list doesn't:** **Velocity carries.** Cubic-bezier curves restart velocity at zero on every interaction. Springs *preserve velocity from the user's gesture* — if the user flicks fast, the spring overshoots. The system responds to *how* the user moved, not just *whether*.
**Concrete hooks:**
- Tokens: spring presets (stiff/medium/wobbly) defined by stiffness+damping+mass, not by duration
- Components: drag-with-momentum sheets, flick-dismissed modals that respect throw velocity
- Project fit: mobile-first, gesture-heavy, anything where touch interaction must feel physical

### Easing-Curve Languages (Material 3 / iOS / Carbon)
**Essence (1-2 sentences):** Material 3 ships *emphasized*, *standard*, *legacy*, and *linear* curves with paired duration tokens; iOS has spring-default; IBM Carbon has *productive* vs. *expressive*. Each maps a design *attitude* (efficient vs. expressive) to a measurable curve.
**Anchor reference (cite real artifacts):** Material 3 motion spec at m3.material.io/styles/motion; iOS HIG motion section; Carbon Design System motion docs.
**What it teaches a UI mock the existing pole list doesn't:** **Curve as named attitude, not as numeric value.** Mocks should reference curves by their semantic name ("emphasized" / "productive"), not by `cubic-bezier(0.2, 0, 0, 1.2)`. The token is the language.
**Concrete hooks:**
- Tokens: 3–5 named curves with paired durations (short/medium/long), each tied to an *attitude*
- Components: every animated transition declares which named curve, never inline coefficients
- Project fit: any design system; this is foundational

### 60fps as a Design Constraint
**Essence (1-2 sentences):** 16.6ms per frame budget forces a different design instinct: any UI feature that can't be rendered in <16ms loses to one that can. Browsers' *will-change* and *transform/opacity*-only animation isn't a polish — it's the *only* way to stay in the frame budget.
**Anchor reference (cite real artifacts):** Paul Lewis et al. at Google Developers on the *RAIL model*; the *Performance Inspector* in browser devtools; Apple's ProMotion 120Hz which makes the budget 8.3ms.
**What it teaches a UI mock the existing pole list doesn't:** **Motion choices are performance choices.** Mocks should declare which CSS properties they animate — and pages that animate `width` or `top` should be flagged in review.
**Concrete hooks:**
- Mock spec: every animation declares "transforms+opacity only" or notes the layout-thrash exception
- Tokens: a `perf-cheap-only` enforcement on default motion presets
- Project fit: every product; this is a *constraint*, not a flavor

### Doherty + Motion — The 400ms Coupling
**Essence (1-2 sentences):** Doherty (IBM, 1982): >400ms response loses user flow. Coupled with motion: a 300ms transition that defers user action until completion exceeds the threshold even if the network was instant. The animation can be the slow thing.
**Anchor reference (cite real artifacts):** Doherty & Thadani, *The Economic Value of Rapid Response Time* (IBM, 1982); Laws of UX entry on Doherty; Material Design's <300ms guidance on most transitions.
**What it teaches a UI mock the existing pole list doesn't:** **Motion duration is a budget against the threshold, not a separate concern.** Most mock specs treat "transition duration" as aesthetics. Coupled with Doherty: every animation that gates input must fit *within* the 400ms total budget.
**Concrete hooks:**
- Rule: any animation that blocks user input must complete in ≤300ms; only background/ambient motion can be longer
- Mock spec: motion declares whether it blocks input
- Project fit: every product; this is a *governing rule*

### Lottie / After Effects Pipeline
**Essence (1-2 sentences):** Airbnb's 2016 Lottie (Salih Abdul-Karim + Brandon Withrow, internal hackathon) made the After Effects JSON file the deliverable — designers ship AE animations as `.json` and engineers render them natively at pixel-parity. The motion-design pipeline became real.
**Anchor reference (cite real artifacts):** Lottie (Airbnb open source, 2017); Bodymovin (AE plugin by Hernan Torrisi); Airbnb Tech Blog "Introducing Lottie" (2017); LottieFiles community.
**What it teaches a UI mock the existing pole list doesn't:** **Animation is a file format, not a re-implementation.** The mock workflow should treat motion as an artifact (a Lottie JSON, an AHAP for haptics) that ships, not as a description of what an engineer should rebuild.
**Concrete hooks:**
- Pipeline: each mock with motion includes a Lottie/JSON artifact (or a hand-coded substitute) — never just prose
- Components: a "motion-artifact" slot in the design system docs
- Project fit: motion-heavy products; especially mobile

---

## Cross-territory notes

- **Risk on cultural lineages:** Adinkra, dot-painting, and chromolitho carry sacred / community-specific weight. Plugin must include explicit guidance: borrow the *principle* (concealment, generative tiling, named-symbol vocabulary), not the specific iconography, unless the project has cultural authority.
- **The plugin is missing all of Territory 2 (sensory) and most of Territory 4 (motion).** The most leveraged additions are probably: motion tokens (Disney 12 + named easing + spring), haptic vocabulary, screen-reader-first, and ma/calm-tech for the "what's the breath between" question.
- **Game lineages port best when the corresponding *constraint* exists in the product.** Soulslike for distraction-free, Persona 5 for entertainment-with-character, EVE for power-user tooling, diegetic for hardware companions, AAA HUD for live ops.

Sources cited inline above. Key references: m3.material.io, lottie.airbnb.tech, developer.apple.com (Core Haptics & visionOS), tangible.media.mit.edu, Lu & Steinhardt 2007 in *Science*, Game UI Database, GDC Vault, Thomas & Johnston (1981).
