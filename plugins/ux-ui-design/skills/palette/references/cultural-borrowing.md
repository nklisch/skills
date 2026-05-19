# Cultural-borrowing guardrail

Some aesthetic poles in `aesthetic-poles.md` carry specific cultural contexts.
Designing in these lineages is legitimate, but the borrow should be *principled*,
not casual. This reference is the guardrail the `palette` skill surfaces when one of
these poles is picked.

## Why this matters

Pastiche dilutes meaning and signals to the source community that the borrower didn't
do the work. Two-thirds of the cultural-lineage poles in this skill carry community
weight — Chromolitho (Indian religious print tradition), Kente / Adinkra (Akan
heraldic system), Aboriginal dot-painting (sacred-secret iconography). Borrowing the
*specific iconography* without cultural authority can range from gauche to actively
harmful.

But borrowing the *underlying design principle* is what design always does. The
principle "pattern as a generative system" is borrowable from girih to web data viz.
The specific girih star pattern from Darb-i Imam is not borrowable without context.

## The two-layer model

Every cultural lineage has two layers:

1. **Principle** — the abstract design idea (generative tiling; named-symbol
   vocabulary; saturated-plane-after-plane composition).
2. **Iconography** — the specific marks, motifs, colors, and symbols that carry
   community-specific meaning.

The principle layer is borrowable across contexts. The iconography layer requires
either:
- **Cultural authority** — the project is built by/for/with the source community
- **Explicit substitution** — the principle is applied with neutral or project-original
  iconography

## Per-pole risk levels

### Low risk — principle is the main thing

These lineages are primarily about a design *system* (a rule for composition); the
iconography is incidental. Borrow freely.

- **Islamic girih** — borrow the 5-tile generative system; build your own
  project-specific tile shapes. Don't copy a specific historical mosque's pattern
  wholesale.
- **Mayan codex layout** — borrow the double-column paired reading order and
  red-banded section dividers. Don't copy specific glyphs from real codices.
- **Persian muraqqa framing** — borrow the nested-ornament-frame composition. Build
  the ornament with project-native motifs.
- **Brazilian Bulcão azulejo** — borrow the permutational tile-grammar. Pick
  project-original primitive shapes.
- **Marimekko** — Maija Isola's heirs explicitly licensed the *Unikko* poppy; borrow
  the *oversized hand-painted motif* idea but illustrate with project-native flora or
  abstract shapes. The Marimekko-style mock with literal Unikko poppies on a
  non-Marimekko product reads as cheap pastiche.

### Medium risk — iconography carries specific meaning

These lineages have iconography that carries explicit symbolic content. Borrow the
principle; do not copy the icons.

- **West African Kente / Adinkra** — Adinkra symbols are a vocabulary where each
  glyph names a value (sankofa = "return and fetch"; gye nyame = "supremacy of God").
  Borrow the *named-symbol vocabulary as status system* principle (e.g., status
  badges that carry meaning beyond their visual form). Do not copy specific Adinkra
  symbols unless the project has Akan cultural authority. If you need a symbol
  vocabulary, design one project-native.
- **Aboriginal Australian dot-painting** — the *concealment-as-design* principle
  (overlaying dots to obscure information from uninitiated viewers) is borrowable for
  permission-tier UIs. The specific iconography belongs to specific clans and is not
  borrowable. When implementing concealment, use neutral patterns (Voronoi cells, blur
  noise) — not dot-fields suggesting Aboriginal art.
- **Korean density (KakaoTalk lineage)** — the *paid-stickers-as-currency* and
  *home-as-portal* principles are widely transferable. Avoid using Kakao Friends
  characters directly; build your own mascot system if mascot-driven IP is the goal.

### High risk — iconography is religious or sacred

These lineages have iconography that carries religious or spiritually-protected
significance. Borrow the principle only; iconography requires explicit cultural
authority and consultation.

- **Indian Chromolitho / Calendar art** — the principle (every-inch-worked density;
  gold filigree borders; halo-framed portraiture) is borrowable. The deity iconography
  is religious imagery; treating it as decorative is offensive. If the project is
  Indian-diaspora-targeted and the team has the authority, deity imagery may be
  appropriate. Otherwise, use neutral portraiture or abstract halo motifs.
- **Buddhist / Hindu mandala** — not in the catalog deliberately. Mandalas appear in
  generic-design templates but carry specific spiritual significance.
- **Indigenous patterns** (broad category) — every Indigenous design tradition has
  community-specific protocols. Default to "no borrowing of specific motifs"; consult
  the relevant community when a real borrow is in scope.

## Substitution patterns

When the principle is the right call but iconography is off-limits, substitute:

| Lineage | Original iconography | Principled substitution |
|---|---|---|
| Girih | 10-pointed Islamic star with specific strapwork | Project-original 5-7-pointed polygon with simpler strapwork |
| Adinkra | Sankofa bird symbol | Project-original "undo/restore" status glyph with a documented meaning |
| Chromolitho | Lakshmi/Ganesh portraiture | Project-original mascot or abstract halo-framed product photo |
| Dot-painting | Concealment dots with specific clan iconography | Voronoi noise or perlin-blur mask |
| Bulcão | Specific blue-and-white tile motifs | Project-original 2-tile primitive set with same permutational logic |
| Marimekko | Unikko poppy | Project-original oversized hand-painted motif (any subject) |

The pattern: extract the *grammar* of the lineage (number of primitives, color
relationships, scale rules, composition logic) and apply it with project-native or
abstract content.

## When the project has cultural authority

"Cultural authority" here means: the project is built by, for, or with the source
community, AND the team has consulted with that community's design tradition (often
literally — talking to practitioners, hiring from the community, licensing where
appropriate).

When that's the case, the iconography layer is on the table. The skill should still
ask:

- "Who in the community has reviewed this design direction?"
- "Are you licensing or commissioning the iconography from a practitioner?"
- "If this is shipped without that consultation, what's the worst-case reading?"

If those answers feel solid, proceed with full iconography. If not, fall back to
principled substitution.

## How `palette` surfaces the guardrail

When the user picks one of the medium-or-high-risk poles in Phase 2:

```
Q: A note on cultural borrowing.

The "{pole-name}" lineage carries community-specific weight. Two options:

- Borrow the principle, substitute the iconography (recommended for projects without
  cultural authority) — we'll use the lineage's composition grammar but with
  project-original motifs.

- Borrow specifically, with consultation — appropriate only when the project is
  built by/for/with the source community and you've consulted practitioners. We'll
  proceed with specific iconography.

Skip this question only if you've explicitly chosen the lineage knowing its
implications.
```

The user's answer goes into the palette.html header comment, so the choice is
visible to anyone who picks the project up later.

## When this guardrail does NOT apply

- Low-risk poles (girih, codex, muraqqa, Bulcão, Marimekko) when used at the
  principle level only.
- Western lineages with specific historical anchors (Bauhaus, Constructivism, De Stijl,
  Memphis Milano, Olivetti, Swiss/ITS, Rams/Braun). These carry their own design
  contexts but aren't the same kind of cultural borrowing — they're design-movement
  borrowings within the design tradition itself. Use freely.
- Generic poles (minimalism, maximalism, editorial, luxury) — no community to credit.
- Internet-native aesthetics (Vaporwave, Hauntology, Y2K, Cassette Futurism) — these
  are post-cultural mashups; the iconography is itself a pastiche of multiple sources.
  Borrow freely, but be aware that some sub-genres (notably Vaporwave's use of Greek
  and Japanese visual elements) themselves involve cultural borrowing that the user
  might want to think about.

## The principle, restated

Borrow what *teaches*. Decline what *signals belonging* that the project doesn't
actually have.
