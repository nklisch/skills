# LLM Prose Tells

A catalog of patterns that mark text as machine-written when they appear in
density. Used in `prose-refine` rounds 2 and 3, after structural problems
are settled.

A tell is not an error. A single em-dash is punctuation; five in one section
is a tell. Hunt clusters, not occurrences. Rewrite each find into the
document's own voice, not into your model family's voice. For
model-family-specific signatures beyond this generic catalog, see the
`model-voice/` directory alongside this file.

## Contents

1. Construction tics
2. Word tics
3. Structure tics
4. Domain suspects (developer documentation)
5. How to hunt

## 1. Construction tics

- "Not X, but Y" and "It's not just X — it's Y" as a recurring move.
- Declarative correction as emphasis: “X establishes A, not B” when B was
  never a plausible reading. Keep the contrast when it resolves real ambiguity.
- Rule-of-three everywhere: triadic lists in sentence after sentence.
- Em-dash density: em-dashes as the default connective, several per
  paragraph.
- Nominal chains: "the configuration of the initialization of the…".
- Uniform sentence length: every sentence lands between 15 and 25 words,
  no short punches, no long builds.
- Negative parallelism as a crutch: "never X, never Y, always Z".

## 2. Word tics

- Buzzwords: delve, leverage, landscape, tapestry, realm, navigate,
  journey, unlock, elevate, foster, empower, seamless, robust,
  cutting-edge.
- Hedging stacks: "it's important to note that", "it should be mentioned",
  "generally tends to".
- Throat-clearing openers: "in today's fast-paced world", "when it comes
  to".
- Summary-box endings: "in conclusion", "ultimately", "at the end of the
  day".
- Adjective stacking on nouns that need none: "powerful, flexible,
  intuitive platform".
- False precision of enthusiasm: "incredibly easy", "blazingly fast",
  without a measurement.
- Stock architecture metaphors imported into unrelated prose: seam, spine,
  load-bearing, bridge, north star, foundation, pillar. Keep established domain
  terms and user-requested analogies; flag repetition or metaphor that obscures
  the literal relationship.

## 3. Structure tics

- Over-signposting: every paragraph announces what it is about to say
  before saying it.
- Fake balance: "on one hand… on the other hand…" with no verdict.
- Bullet abdication: everything becomes a list; nothing is argued in prose.
- A conclusion that merely restates the introduction.
- Every section the same length and shape, regardless of what it carries.

## 4. Domain suspects (developer documentation)

- **Marketing drift**: hype adjectives, benefit claims without facts,
  "ecosystem", "community-driven", feature-list chest-beating in a README.
- **Academic drift**: passive constructions everywhere, "one may observe",
  hedged claims about the software's own documented behavior.
- **Blog drift in reference docs**: narrative arcs, rhetorical questions,
  cliffhanger section endings where a reader came to look something up.
- **Tutorial filler**: "Now that we've…", "Let's go ahead and…",
  play-by-play commentary between steps instead of steps.
- **Apology drift**: "unfortunately", "it should be noted that this is
  experimental", where a plain statement of the limitation suffices.

## 5. How to hunt

1. Read the draft once end to end, marking clusters. A cluster is three or
   more of the same tell in a section.
2. For each cluster, rewrite in the document's existing voice, moving
   along whichever dimension the surrounding text already favors: shorter,
   plainer, or more direct.
3. Log every change in the change log with its tell category. An
   unjustified change is a taste change; taste changes are out of scope in
   rounds 2 and 3.
4. Do not introduce your own family's tics while removing the draft's. If
   your rewrite replaces em-dashes with semicolons everywhere, you have
   moved the tell, not removed it.
