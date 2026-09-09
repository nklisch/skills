# Writing Style

Adapt durable prose to its intended readers, domain, purpose, and venue. This
applies to docs, READMEs, item bodies, designs, foundations, release notes,
error messages, and comments. Code nearby does not imply a developer-docs
register, and software domains do not share one vocabulary or voice.

## Contents

- Choose language from context
- Keep meaning accessible
- Reader check

## Choose language from context

Use the user's direction and applicable project style guide first. Otherwise
infer the audience and purpose from the request and existing material. Ask only
when an unresolved audience or tone choice would materially change the result.
Do not introduce a style interview for every ordinary edit.

- Choose terminology, explanation depth, tone, rhythm, and examples for these
  readers. Legibility means they can understand and use the text, not that every
  reader in every field would find every word familiar.
- Preserve precise domain terms and meaningful distinctions. Game-engine
  developers may expect scenes, nodes, shaders, or frame budgets; web developers
  may expect routes and requests; creative writers may discuss viewpoint and
  narrative beats. Use the subject's vocabulary, not generic software substitutes.
- Distinguish audiences within a domain. Clinical guidance for clinicians can
  use established medical terminology; patient instructions need explanations
  suited to patients without losing clinical meaning.
- Match voice to purpose: a game devlog, a writing guide, an engine reference,
  and a medical procedure need not sound alike. Warmth, metaphor, specialist
  language, and creative voice are valid when they serve the reader.
- Use controlled language or a strict procedural style when an actual audience,
  task, or applicable standard calls for it, not because a document mentions code
  or safety. Preserve required terminology and exact operational instructions.

## Keep meaning accessible

Prefer clear relationships, concrete examples, and purposeful sentences. Use
active voice when the actor matters; passive voice can be appropriate when the
process or recipient matters more. Sentence length, contractions, punctuation,
spelling convention, and figurative language follow context rather than universal
bans or word-count caps. Remove empty hype and needless complexity, not voice.

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
document did not enumerate. A rule tied to a value covers only the cases it
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

## Reader check

Before finishing, read as the intended audience:

1. Does the vocabulary belong to their domain, with unfamiliar essential terms
   explained where needed and familiar ones left unencumbered?
2. Do the voice, examples, and level of detail fit their purpose and venue?
3. Can they follow the meaning or act correctly without hidden project context?
4. Did simplification lose precision, required language, or the author's voice?
5. Are facts, commands, identifiers, and quoted output still accurate?

Clarity is judged by reader understanding, not conformity to a single technical
English style.
