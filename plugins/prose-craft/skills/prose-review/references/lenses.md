# Review Lenses

A lens is a reviewer persona holding one question and one checklist. Review
through one lens at a time. A reviewer holding several at once catches
fewer defects in each.

## Severities

- **material**: a reader would be misled, blocked, or lose trust. In
  `prose-refine`, material-class rewrites keep the loop going.
- **polish**: a worthwhile but nonblocking improvement — fixing it makes
  the document better; not fixing it misleads no one. Never blocks
  convergence.

Standard weight uses lenses 1–4 (audience, structure, clarity, accuracy).
Thorough weight uses all six.

## Contents

1. Audience: can the intended reader do the thing?
2. Structure: is this the right document, organized right?
3. Clarity: is every sentence doing its job?
4. Accuracy: is every claim true and current?
5. Voice: does it sound like the venue, and like a human?
6. Accessibility: could a tired non-native speaker follow it?

## 1. Audience

*Persona: the actual target reader, armed with only the knowledge the brief
grants them.*

- Hold the reader model explicitly: you know only what the brief grants
  plus what the draft itself establishes. Reread as that reader, not as
  yourself — the curse of knowledge hides exactly the gaps this lens exists
  to find.
- If the brief's confirmed audience looks wrong for the document that
  actually got written, that mismatch is itself a finding — do not judge
  against an audience the doc no longer serves.
- Does the draft assume knowledge the audience doesn't have (undisclosed
  prerequisites)?
- Is every piece of jargon defined on first use, or safe for this audience?
- Does each concept the workflow depends on first say what it represents
  in the reader's world and why it matters, before its details?
- When relationships stay abstract, does a short concrete scenario
  establish the mental model before diagrams or schemas?
- Can the reader find their next action within the first screen? (For
  documents an agent reads as context rather than on a screen, tier 1
  means: at the top of the file, before any detail.)
- Does the entry path work? Whatever leads a reader here, does the doc
  catch them?
- Are examples drawn from the reader's world, not the author's?

## 2. Structure

*Persona: a developmental editor holding the reader path.*

- Trace the draft against the carried reader path: every beat lands
  somewhere, each beat answers a question earlier beats actually raised,
  definitions precede uses, tier-1 payload sits on the first screen. No
  carried plan? Derive the draft's actual beats first and judge that
  derived path on the same terms — and say the path was derived.
- Is the document one Diátaxis mode, or does it mix modes (a tutorial that
  drifts into reference)?
- Does the opening state purpose and reader payoff before details?
- Answered-before-asked: does detail arrive before the reader holds the
  question it answers?
- Used-before-defined: does any essential term carry weight before the
  reader's model contains it?
- Are sections ordered by reader need, not by the system's internals?
- Can readers follow the document collection in its intended order without
  waiting for a later page to define an earlier essential concept?
- Do headings carry information (not "Overview", "Misc")?
- Is anything the brief promised missing? Anything present the brief
  excluded?
- Is it scannable? Lists where lists help, tables for parallel facts.

## 3. Clarity

*Persona: a line editor with the style contract in hand.*

- Active voice unless the actor is genuinely unknown or irrelevant.
- Sentences short on average; any sentence over ~30 words earns its length
  or splits.
- Concrete verbs over nominalizations ("decide", not "make a decision").
- One idea per paragraph; the paragraph's point is its first sentence.
- No hedging pile-ups, throat-clearing openings, or double negatives.
- Contrastive corrections such as “X, not Y” add a necessary distinction
  instead of repeating a rhetorical pattern.
- Terms consistent. Same thing, same name, every time.

## 4. Accuracy

*Persona: a skeptic who checks. The only lens that may leave the document.*

- Verify commands, file paths, flags, and code samples against the actual
  project. Would they run as printed?
- Are version numbers, dates, and "currently" claims still true?
- Are capability claims checkable against the code, or aspirations stated as
  facts?
- Do links point where the text says they point?
- Are numbers (counts, limits, benchmarks) sourced or honestly hedged?

## 5. Voice

*Persona: a tone editor.*

- Register matches the chosen style profile and its recorded deltas — not
  an assumed default. If the brief carries no style profile, flag that gap
  instead of judging against one.
- Model-family voice: does the prose read like one model family's default
  output? Check word choice against
  `../../prose-refine/references/model-voice/` signatures and
  `../../prose-refine/references/llm-tells.md`.
  Final prose should read as the document's own voice — not as any single
  model family.
- No marketing-speak or hype adjectives: "seamless", "powerful", "blazing",
  "simply", "just".
- Confidence without arrogance; limitations stated plainly, not buried.
- Person and tense consistent (second person imperative for instructions).
- Analogies and metaphors fit the subject. Flag stock words such as “seam,”
  “spine,” “load-bearing,” “bridge,” or “north star” when literal domain
  language would be clearer. Preserve metaphors the user requested or the
  domain genuinely uses.
- Humor, if any, never gates comprehension.

## 6. Accessibility

*Persona: a plain-language and inclusion reviewer.*

- Reading level appropriate; long words only where precision requires them.
- Idioms, culture-bound references, and wordplay don't carry essential
  meaning. The text survives translation.
- Inclusive language: avoid ableist terms and gendered defaults.
- Formatting aids meaning but never substitutes for it (nothing conveyed by
  color or emphasis alone).

Related: `prose-refine`'s `references/llm-tells.md` catalogs machine-prose
patterns for the rewrite rounds. Tell-hunting complements the voice lens
but is not a lens itself.

## Findings format

One finding per line:

```
[material|polish] lens-name — §section or "quoted anchor": issue → suggested fix
```

For a defect that spans several documents (a shared convention, a
repeated cross-reference error), file one finding anchored to the
convention and list the affected paths in it, rather than one finding per
document.
