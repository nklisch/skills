# Writing Style

Plain technical English for durable prose, adapted from ASD-STE100 Simplified
Technical English. Applies to docs, READMEs, item bodies, design sections,
foundation assertions, release summaries, changelogs, error messages, and
comments. Does not apply to code, identifiers, command syntax, or quoted
output. Not for marketing copy or essays — the style strips voice on purpose.

## Contents

1. [Modes](#modes)
2. [Rules](#rules)
3. [Self-lint](#self-lint)
4. [Limits](#limits)

## Modes

- **Flavored (default)** — general prose such as docs, item bodies, design
  sections, and release summaries. Apply the sentence, paragraph, and
  active-voice discipline. Relax the fixed dictionary so the text keeps enough
  range to read naturally.
- **Strict** — procedures, runbooks, safety text, and error messages. Apply
  every rule and both length caps.

## Rules

### Document integrity

- Keep human-facing documents and designs clean and self-contained. Describe
  the subject, decisions, and rationale, not the agent process that produced
  them.
- Apply review corrections to the final content without recording the
  correction cycle. Do not preserve agent work history, reviewer correction
  notes, prompt or transcript details, revision narration, or internal
  adjudication.
- Workbench items and other explicitly agent-facing documents may retain
  process prose when it adds material value for future implementation, review,
  or operation. Discourage it otherwise. Prefer the resolved decision,
  constraint, or risk over its history.

### Concept grounding

- Treat a document, or an ordered collection of documents, as a reader will
  encounter it. Do not rely on hidden project context or a later document to
  define a load-bearing term.
- Before technical detail, explain what each important data object, domain
  model, interface, or object group represents in the real world and why it
  matters to a user or the business. Work the definition into the prose when a
  glossary would feel forced.
- When an external provider has its own vocabulary, map the provider term to
  the project's concept and a generic real-world term. Explain the mapping at
  the object or system level before field-level mappings.
- When provider models materially shape the design, compare representative
  providers or standards through current-source research. Do not inherit one
  provider's ontology without making that choice explicit.
- When relationships remain abstract, use a short real-world scenario before
  diagrams, schemas, or field detail. Add only enough example to establish the
  mental model.
- Define only terms that carry meaning or may be unfamiliar to the intended
  audience. Assume ordinary knowledge and avoid turning the document into a
  dictionary.

### Failure-mode rationale

A prohibition or boundary assertion at foundation altitude names the failure it
prevents, in the same sentence or the next. Name the mechanism of harm, not the
value upheld: "do not X: violated, Y happens," not "do not X, because
correctness matters." A rule tied to a failure extrapolates to cases the
document did not enumerate; a rule tied to a value covers only the cases it
lists.

- Append the rationale. Do not double the passage's length.
- The failure names a visible victim: a user-visible behavior, a cost someone
  pays, a decision corrupted, or a recovery path lost. "It becomes messy" is
  not a failure mode.
- Apply to prohibitions ("do not", "never", "must not"), boundary and
  ownership assertions, and stated non-goals. Descriptive prose does not need
  one.
- Enforcement is review-time judgment. A mechanical check cannot distinguish a
  mechanism from a platitude.

### Words

- Use one name for one thing. Do not call the same item by two names.
- Use the short common word: start (not begin, commence, or initiate), use
  (not utilize or leverage), help (not facilitate), make sure (not ensure),
  before (not prior to), after (not subsequent to), about (not regarding),
  get (not obtain or acquire), show (not demonstrate), also (not additionally,
  furthermore, or moreover).
- Give each word one meaning.
- No marketing adjectives: seamless, robust, powerful, cutting-edge,
  effortless, world-class, next-generation, revolutionary.
- American spelling.

### Verbs

- Active voice. Write "the parser reads the file", not "the file is read by
  the parser".
- Use a verb for an action. Write "analyze the log", not "perform an analysis
  of the log".
- No stacked auxiliaries. Not "it is important to note that this may help to
  improve". Write "this improves X".
- No "-ing" main verb where a simple tense works.

### Sentences

- One instruction per sentence. Max 20 words for an instruction, 25 for a
  descriptive sentence.
- No contractions. Use articles: a, an, the, this, these.

### Punctuation

- No semicolons. Write two sentences.

### Structure

- One topic per paragraph, max six sentences.
- For steps, use a numbered vertical list. One action per item, imperative
  form.
- Put a condition before its command.

## Self-lint

Run before finishing the text:

1. Any sentence over 20 words? Split it.
2. Any semicolon? Replace it with a period.
3. Any contraction? Expand it.
4. Any passive voice with a known actor? Make it active.
5. Any "-ing" main verb, nominalization ("perform an analysis"), or phrasal
   verb ("spin up")? Replace it with a plain verb.
6. Same thing named two ways? Pick one name.

## Limits

The mechanical rules fix the form of slop. They cannot make a hollow paragraph
true. Choosing the right technical noun, and judging whether a sentence makes
good sense, stays human work.
