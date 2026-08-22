# Structure Patterns and the Reader Path

Structure here means the journey, not the heading tree. The journey is the
order in which the reader's knowledge changes. A heading outline is one
projection of that journey, sometimes faithful and sometimes a lie. Plan
the journey first; headings follow.

## Contents

1. The reader model
2. The reader path (the plan artifact)
3. Pattern catalog
4. Choosing with the user
5. What reviewers do with the path

## The reader model

Write against an explicit model of one reader at one moment in the
document. At any point, that reader has:

- **what they know** — granted by the brief's audience field, plus
  everything earlier beats established;
- **a question they're holding** — the thing they're reading forward to
  resolve.

The writer's curse of knowledge makes this model hard to hold in your
head. Once you know the system, you can no longer feel which order a
reader who doesn't know it needs. The reader path is the antidote. It
makes the reader's state an explicit artifact you can check a draft
against, instead of a guess you audit by feel.

Two structural sins follow directly from a missing reader model:

- **Answered-before-asked.** Detail arrives before the reader holds the
  question it answers. It reads as noise and gets skipped.
- **Used-before-defined.** A term or concept carries weight before the
  reader's model contains it. The reader either stalls or builds a wrong
  model and has to rebuild later.

## The reader path (the plan artifact)

The reader path is the plan the writer and user align on before or during
drafting. Write it as a scratch document or sidecar, wherever the workflow
wants it. Never leave it dangling. It travels with the draft through
review and refine, and it is stripped at publication exactly like the
brief (see `prose-draft`).

Four parts:

1. **Entry state** — what the reader knows and wants when they arrive, in
   one or two sentences. Where they came from (search, repo browse, a
   link from another doc) shapes the first screen.
2. **Beats** — the ordered sequence of reader-state changes. Write one
   line per beat, in the reader's questions:

   ```
   Beat 3 — reader asks: "why doesn't the cache just stay fresh?"
     answers:    why invalidation is explicit, not automatic
     assumes:    beats 1–2 (the decorator exists and is used once)
     sets up:    beat 4 (when invalidation actually fires)
     defines:    "invalidation", "entry pinning"
   ```

   A beat may span three headings, or share one heading with two other
   beats. That divergence from the heading tree is the point. The plan
   records the journey; the headings record the furniture.
3. **Define-before-use map** — every load-bearing term, where it's
   defined, and where it's first used. A definition must land at or before
   the first use in reading order. In a document collection, reading order
   crosses pages. Grounding a definition means more than naming it:
   - Define from real-world and business meaning first (what the thing
     represents, why it matters) before technical use, without
     over-explaining terms the audience can safely know.
   - When a provider uses its own vocabulary, map the provider term to
     the project's concept and to a generic real-world term before any
     field detail.
   - When relationships stay abstract, spend one short real-world
     scenario before any diagram, schema, or field list. Use only enough
     to establish the mental model.
   - Do not let one provider's model silently become the project's model.
     Where provider models shape the concepts, compare representative
     providers.
4. **Importance tiers** — what the reader must get on the first screen
   (tier 1), what the body carries (tier 2), and what only deep readers
   need (tier 3: appendices, internals, links out). The first screen earns
   its place: answer, audience fit, and next action.

The plan is a living contract. Drafting often teaches you that the
ordering is wrong. When it does, update the plan and say you did, so
review still judges the draft against accurate intent. During refine,
plan changes are alignment changes. They surface to the user; they never
happen silently.

## Pattern catalog

These are named starting points for the interview, not mandates. Compose,
mix, or invent outside this list. If you invent, still write the plan.

| # | Pattern | One-line shape |
|---|---|---|
| 1 | Answer-first pyramid | conclusion up front, support grouped beneath, each level answering the question the one above raises |
| 2 | Situation → complication → resolution | shared context, then the tension, then the resolution |
| 3 | Progressive disclosure | overview layer → working layer → deep layer, complexity gated by reader need |
| 4 | Guided build | reader constructs one real thing; each step creates the need the next step fills |
| 5 | Problem → solution → proof | pain first, approach second, evidence last |
| 6 | Question chain (FAQ) | the reader's literal questions, in the order they arise |
| 7 | Catalogue | uniform entries built for retrieval, not narrative |
| 8 | Thesis → evidence → synthesis | a claim, its support, a restatement of the thesis at a higher level |
| 9 | Chronicle | time order, stakes anchored at both ends |
| 10 | Comparison matrix | options × criteria, verdict earned, not asserted |
| 11 | Spiral | the whole truth simply, then revisit each part deeper |

Details, fits, and failure modes:

1. **Answer-first pyramid** (the Minto pyramid and bottom-line-up-front
   lineage). Fits decision memos, executive summaries, README pitch
   blocks. Opening move: the answer in one sentence. Fails when the
   support groups don't map to distinct questions the answer provokes;
   then it's just bullet soup.
2. **Situation → complication → resolution.** Fits RFCs, incident
   writeups, problem-driven explanations. Opening move: a situation the
   reader already recognizes, so the complication lands as tension they
   feel. Fails when the situation is throat-clearing the reader doesn't
   need established.
3. **Progressive disclosure.** Fits onboarding docs, product docs,
   READMEs. Opening move: what the reader can achieve, in their terms.
   Fails when the "overview" layer smuggles in concepts from the deep
   layer.
4. **Guided build.** Fits tutorials and getting-started guides. Opening
   move: the end state, shown first, so every step has a destination.
   Fails when a step exists for the system's convenience ("now open the
   settings panel") rather than the reader's need.
5. **Problem → solution → proof.** Fits tool READMEs, approach-pitching
   articles, architecture decision records. Opening move: the pain,
   stated so the target reader nods. Fails when the problem is padded to
   make the solution look bigger.
6. **Question chain.** Fits troubleshooting guides, internal docs,
   FAQ-adjacent reference. Opening move: how the questions are ordered
   and why. Fails when questions are writer-shaped ("how does the
   dispatcher work?") instead of reader-shaped ("why is my job stuck?").
7. **Catalogue.** Fits API reference, glossaries, option tables. Opening
   move: a scope statement of what belongs here and what doesn't. Fails
   when it pretends to be narrative; the reader of a catalogue is
   navigating, not reading. The question chain degenerates to "where is
   X", which is fine.
8. **Thesis → evidence → synthesis.** Fits explanation articles, design
   rationale, postmortem analysis sections. Opening move: a hook plus the
   stated takeaway. Fails when evidence is ordered by discovery
   chronology instead of argumentative force.
9. **Chronicle.** Fits incident timelines, migration diaries. Opening
   move: stakes and endpoint in one line ("what happened, how bad, how it
   ended"), then time order. Fails without that anchor; pure chronology
   makes the reader read to the end to learn why they're reading.
10. **Comparison matrix.** Fits "which X should I use" docs and
    benchmarks. Opening move: the criteria and who they're for. Fails
    when the criteria are chosen to crown a pre-picked winner.
11. **Spiral.** Fits explaining systems with genuinely hard mental
    models. Opening move: a simple model of the whole that is true, just
    incomplete. Fails when the simple first pass states anything it must
    later unsay. Simplify by omitting, never by lying.

## Choosing with the user

Structure is chosen, never silently applied. During the prose-draft
interview, propose two or three patterns with the opening move each
implies, grounded in what the repo and the request reveal. Record the
chosen pattern in the brief. A document may combine patterns; a README
can run a pyramid pitch block, then a guided quickstart, then progressive
disclosure into links. The plan records the combination as its beat
sequence.

## What reviewers do with the path

`prose-review`'s structure lens traces the draft against the carried
plan. It verifies four things:

1. Every beat lands somewhere in the draft.
2. The question chain is intact — each beat answers a question the
   previous beats actually raised.
3. Definitions precede uses.
4. Content sits in the tier the plan assigned it.

When reviewing a draft with no carried plan, the reviewer derives the
draft's actual beats, judges that derived path on the same reader-model
terms, and says the path was derived.
